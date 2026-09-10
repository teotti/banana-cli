import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { defaultSecureStorage } from "./secrets";
import { userAgent } from "./shared";
import {
  CliFailure,
  type CliRuntime,
  type Environment,
  type Fetch,
  type OutputWriter,
  type SecureStorage,
  type Sleep,
} from "./types";

export const DEFAULT_API_URL = "https://api.bananasplit.net";
export const REQUEST_TIMEOUT_MS = 15_000;
export const OAUTH_CLIENT_ID = "bananasplit-cli";
export const OAUTH_SCOPES = "api:read api:write offline_access";
const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";
const SECRET_SERVICE = "banana";
const ACCESS_TOKEN_MARGIN_MS = 30_000;
const LOCK_WAIT_MS = 65_000;
const LOCK_STALE_MS = 60_000;
const LOCK_POLL_MS = 100;
const NEVER_ABORTED = new AbortController().signal;

export type AuthRuntime = {
  env: Environment;
  fetch: Fetch;
  now: () => number;
  openUrl: (url: string) => Promise<void>;
  secrets: SecureStorage;
  sleep: Sleep;
  timeoutMs: number;
};

export type StoredCredential = {
  accessToken: string;
  accessTokenExpiresAt: number;
  authBaseUrl: string;
  refreshToken: string;
  scope: string;
};

export type AccessCredential = {
  origin: string;
  stored: StoredCredential;
  token: string;
};

class OAuthNetworkError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLoopback(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

function readHttpUrl(raw: string, name: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CliFailure("config", `${name} must be a valid URL`);
  }
  if (
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && isLoopback(url.hostname))) ||
    url.username ||
    url.password
  ) {
    throw new CliFailure(
      "config",
      `${name} must use HTTPS, except for loopback development`,
    );
  }
  url.search = "";
  url.hash = "";
  return url;
}

function readVerificationUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && isLoopback(url.hostname))) ||
    url.username ||
    url.password
  ) {
    return null;
  }
  return url.toString();
}

export function readApiUrl(raw: string | undefined) {
  const url = readHttpUrl(raw || DEFAULT_API_URL, "BANANASPLIT_API_URL");
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

export function readAuthBaseUrl(env: Environment, apiUrl = readApiUrl(env.BANANASPLIT_API_URL)) {
  const raw = env.BANANASPLIT_AUTH_URL;
  const url = readHttpUrl(raw || `${apiUrl.origin}/api`, "BANANASPLIT_AUTH_URL");
  url.pathname = url.pathname.replace(/\/+$/, "");
  if (url.pathname !== "/api") {
    throw new CliFailure(
      "config",
      "BANANASPLIT_AUTH_URL must be the complete auth base ending in /api",
    );
  }
  url.pathname += "/";
  return url;
}

function defaultSleep(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(done, milliseconds);
    function done() {
      signal.removeEventListener("abort", aborted);
      resolve();
    }
    function aborted() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal.addEventListener("abort", aborted, { once: true });
  });
}

async function defaultOpenUrl(url: string) {
  const command =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["rundll32", "url.dll,FileProtocolHandler", url]
        : ["xdg-open", url];
  const child = Bun.spawn(command, { stderr: "ignore", stdout: "ignore" });
  if ((await child.exited) !== 0) throw new Error("Browser did not open");
}

export function createAuthRuntime(runtime: CliRuntime): AuthRuntime {
  return {
    env: runtime.env ?? process.env,
    fetch: runtime.fetch ?? globalThis.fetch,
    now: runtime.now ?? Date.now,
    openUrl: runtime.openUrl ?? defaultOpenUrl,
    secrets:
      runtime.secrets ?? defaultSecureStorage(runtime.env ?? process.env),
    sleep: runtime.sleep ?? defaultSleep,
    timeoutMs: runtime.timeoutMs ?? REQUEST_TIMEOUT_MS,
  };
}

function secretKey(origin: string) {
  return { name: origin, service: SECRET_SERVICE };
}

function hasExactScopes(scope: string) {
  const values = scope.trim().split(/\s+/).filter(Boolean);
  const expected = OAUTH_SCOPES.split(" ");
  return (
    values.length === expected.length &&
    new Set(values).size === expected.length &&
    expected.every((value) => values.includes(value))
  );
}

function parseStoredCredential(raw: string): StoredCredential {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new CliFailure(
      "config",
      "Stored credentials are invalid. Run banana login.",
    );
  }
  if (
    !isRecord(value) ||
    typeof value.accessToken !== "string" ||
    !value.accessToken ||
    typeof value.refreshToken !== "string" ||
    !value.refreshToken ||
    typeof value.accessTokenExpiresAt !== "number" ||
    !Number.isFinite(value.accessTokenExpiresAt) ||
    typeof value.scope !== "string" ||
    !hasExactScopes(value.scope) ||
    typeof value.authBaseUrl !== "string"
  ) {
    throw new CliFailure(
      "config",
      "Stored credentials are invalid. Run banana login.",
    );
  }
  const authBaseUrl = readHttpUrl(value.authBaseUrl, "Stored auth base");
  authBaseUrl.pathname = authBaseUrl.pathname.replace(/\/+$/, "");
  if (authBaseUrl.pathname !== "/api") {
    throw new CliFailure(
      "config",
      "Stored credentials are invalid. Run banana login.",
    );
  }
  authBaseUrl.pathname += "/";
  return { ...value, authBaseUrl: authBaseUrl.toString() } as StoredCredential;
}

async function readRawCredential(runtime: AuthRuntime, origin: string) {
  try {
    return await runtime.secrets.get(secretKey(origin));
  } catch {
    throw new CliFailure(
      "config",
      "Secure credential storage is unavailable on this system.",
    );
  }
}

async function readCredential(runtime: AuthRuntime, origin: string) {
  const raw = await readRawCredential(runtime, origin);
  return raw === null ? null : parseStoredCredential(raw);
}

async function writeCredential(
  runtime: AuthRuntime,
  origin: string,
  credential: StoredCredential,
) {
  try {
    await runtime.secrets.set({
      ...secretKey(origin),
      value: JSON.stringify(credential),
    });
  } catch {
    throw new CliFailure("config", "Could not save credentials securely.");
  }
}

async function deleteCredential(runtime: AuthRuntime, origin: string) {
  try {
    await runtime.secrets.delete(secretKey(origin));
  } catch {
    throw new CliFailure("config", "Could not delete secure credentials.");
  }
}

function lockPath(origin: string) {
  const user = typeof process.getuid === "function" ? process.getuid() : "user";
  return join(
    tmpdir(),
    `bananasplit-cli-${user}`,
    createHash("sha256").update(origin).digest("hex"),
  );
}

async function withCredentialLock<T>(
  runtime: AuthRuntime,
  origin: string,
  operation: () => Promise<T>,
  signal: AbortSignal = NEVER_ABORTED,
) {
  const path = lockPath(origin);
  const owner = randomUUID();
  const marker = JSON.stringify({ createdAt: Date.now(), owner });
  const deadline = Date.now() + LOCK_WAIT_MS;
  await mkdir(dirname(path), { mode: 0o700, recursive: true });

  while (true) {
    if (signal.aborted) throw new CliFailure("cancelled", "Login cancelled.");
    try {
      await mkdir(path, { mode: 0o700 });
      try {
        await writeFile(join(path, "owner"), marker, { mode: 0o600 });
      } catch {
        await rm(path, { force: true, recursive: true });
        throw new CliFailure("config", "Could not lock secure credentials.");
      }
      break;
    } catch (error) {
      if (!isRecord(error) || error.code !== "EEXIST") {
        throw new CliFailure("config", "Could not lock secure credentials.");
      }
      try {
        let createdAt = (await stat(path)).mtimeMs;
        try {
          const lock = JSON.parse(await readFile(join(path, "owner"), "utf8"));
          if (isRecord(lock) && typeof lock.createdAt === "number") {
            createdAt = lock.createdAt;
          }
        } catch {
          // Fall back to the directory timestamp for an incomplete lock.
        }
        if (Date.now() - createdAt > LOCK_STALE_MS) {
          // ponytail: a bounded temp lock is enough for one local credential;
          // replace it with an OS advisory lock if refreshes can exceed a minute.
          await rm(path, { force: true, recursive: true });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() >= deadline) {
        throw new CliFailure(
          "config",
          "Timed out waiting for secure credentials.",
        );
      }
      await runtime.sleep(LOCK_POLL_MS, signal);
    }
  }

  try {
    return await operation();
  } finally {
    try {
      if ((await readFile(join(path, "owner"), "utf8")) === marker) {
        await rm(path, { force: true, recursive: true });
      }
    } catch {
      // A recovered stale lock is already gone.
    }
  }
}

async function postForm(
  runtime: AuthRuntime,
  url: URL,
  values: Record<string, string>,
  signal?: AbortSignal,
) {
  const timeout = AbortSignal.timeout(runtime.timeoutMs);
  const requestSignal = signal
    ? AbortSignal.any([signal, timeout])
    : timeout;
  try {
    return await runtime.fetch(url, {
      body: new URLSearchParams(values),
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": userAgent(runtime.env),
      },
      method: "POST",
      redirect: "error",
      signal: requestSignal,
    });
  } catch {
    if (signal?.aborted) {
      throw new CliFailure("cancelled", "Login cancelled.");
    }
    throw new OAuthNetworkError("Authentication request failed");
  }
}

async function readJson(response: Response) {
  try {
    const value = await response.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function oauthError(body: Record<string, unknown> | null) {
  return body && typeof body.error === "string" ? body.error : null;
}

function authEndpoint(authBaseUrl: string | URL, path: string) {
  return new URL(path, authBaseUrl);
}

function parseTokenResponse(
  body: Record<string, unknown> | null,
  authBaseUrl: string,
  receivedAt: number,
): StoredCredential {
  if (
    !body ||
    typeof body.access_token !== "string" ||
    !body.access_token ||
    typeof body.refresh_token !== "string" ||
    !body.refresh_token ||
    body.token_type !== "Bearer" ||
    typeof body.expires_in !== "number" ||
    !Number.isFinite(body.expires_in) ||
    body.expires_in <= 0 ||
    typeof body.scope !== "string" ||
    !hasExactScopes(body.scope)
  ) {
    throw new CliFailure(
      "config",
      "Authentication server returned an invalid response.",
    );
  }
  return {
    accessToken: body.access_token,
    accessTokenExpiresAt: receivedAt + body.expires_in * 1000,
    authBaseUrl,
    refreshToken: body.refresh_token,
    scope: OAUTH_SCOPES,
  };
}

function parseVerificationUrl(value: unknown) {
  if (typeof value !== "string") return null;
  return readVerificationUrl(value);
}

function parseDeviceResponse(body: Record<string, unknown> | null) {
  const verificationUri = parseVerificationUrl(body?.verification_uri);
  const verificationUriComplete = parseVerificationUrl(
    body?.verification_uri_complete,
  );
  if (
    !body ||
    typeof body.device_code !== "string" ||
    !body.device_code ||
    typeof body.user_code !== "string" ||
    !body.user_code ||
    !verificationUri ||
    !verificationUriComplete ||
    typeof body.expires_in !== "number" ||
    !Number.isFinite(body.expires_in) ||
    body.expires_in <= 0 ||
    typeof body.interval !== "number" ||
    !Number.isFinite(body.interval) ||
    body.interval <= 0
  ) {
    throw new CliFailure(
      "config",
      "Authentication server returned an invalid response.",
    );
  }
  return {
    deviceCode: body.device_code,
    expiresIn: body.expires_in,
    interval: body.interval,
    userCode: body.user_code,
    verificationUri,
    verificationUriComplete,
  };
}

function retryAfterMs(response: Response, now: number) {
  const raw = response.headers.get("retry-after")?.trim();
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(raw);
  return Number.isFinite(date) && date > now ? date - now : null;
}

async function revoke(
  runtime: AuthRuntime,
  credential: Pick<StoredCredential, "authBaseUrl" | "refreshToken">,
) {
  let response: Response;
  try {
    response = await postForm(
      runtime,
      authEndpoint(credential.authBaseUrl, "oauth2/revoke"),
      {
        client_id: OAUTH_CLIENT_ID,
        token: credential.refreshToken,
        token_type_hint: "refresh_token",
      },
    );
  } catch {
    return false;
  }
  if (response.ok) return true;
  const code = oauthError(await readJson(response));
  return code === "invalid_grant" || code === "invalid_token";
}

async function exchangeRefresh(
  runtime: AuthRuntime,
  origin: string,
  credential: StoredCredential,
) {
  let response: Response;
  try {
    response = await postForm(
      runtime,
      authEndpoint(credential.authBaseUrl, "oauth2/token"),
      {
        client_id: OAUTH_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: credential.refreshToken,
      },
    );
  } catch {
    throw new CliFailure("network", "Could not refresh login.");
  }
  const body = await readJson(response);
  if (!response.ok) {
    if (oauthError(body) === "invalid_grant") {
      await deleteCredential(runtime, origin);
      throw new CliFailure("config", "Login expired. Run banana login again.");
    }
    throw new CliFailure("config", "Could not refresh login. Run banana login.");
  }

  let next: StoredCredential;
  try {
    next = parseTokenResponse(body, credential.authBaseUrl, runtime.now());
  } catch (error) {
    if (body && typeof body.refresh_token === "string" && body.refresh_token) {
      await revoke(runtime, {
        authBaseUrl: credential.authBaseUrl,
        refreshToken: body.refresh_token,
      });
    }
    await deleteCredential(runtime, origin);
    throw error;
  }
  try {
    await writeCredential(runtime, origin, next);
  } catch {
    await revoke(runtime, next);
    try {
      await deleteCredential(runtime, origin);
    } catch {
      // The original storage failure remains the useful error.
    }
    throw new CliFailure(
      "config",
      "Could not save refreshed credentials securely. Run banana login.",
    );
  }
  return next;
}

async function rotateCredential(
  runtime: AuthRuntime,
  origin: string,
  previous: StoredCredential,
  force: boolean,
) {
  return withCredentialLock(runtime, origin, async () => {
    const current = await readCredential(runtime, origin);
    if (!current) {
      throw new CliFailure("config", "Not logged in. Run banana login.");
    }
    const changed = current.refreshToken !== previous.refreshToken;
    if (
      current.accessTokenExpiresAt - runtime.now() > ACCESS_TOKEN_MARGIN_MS &&
      (!force || changed)
    ) {
      return current;
    }
    return exchangeRefresh(runtime, origin, current);
  });
}

export async function getAccessCredential(
  runtime: AuthRuntime,
  env: Environment,
) {
  const origin = readApiUrl(env.BANANASPLIT_API_URL).origin;
  const stored = await readCredential(runtime, origin);
  if (!stored) {
    throw new CliFailure("config", "Not logged in. Run banana login.");
  }
  const current =
    stored.accessTokenExpiresAt - runtime.now() > ACCESS_TOKEN_MARGIN_MS
      ? stored
      : await rotateCredential(runtime, origin, stored, false);
  return { origin, stored: current, token: current.accessToken };
}

export async function refreshAfterUnauthorized(
  runtime: AuthRuntime,
  credential: AccessCredential,
) {
  const stored = await rotateCredential(
    runtime,
    credential.origin,
    credential.stored,
    true,
  );
  return { origin: credential.origin, stored, token: stored.accessToken };
}

export async function clearAfterUnauthorized(
  runtime: AuthRuntime,
  credential: AccessCredential,
) {
  await withCredentialLock(runtime, credential.origin, async () => {
    const current = await readCredential(runtime, credential.origin);
    if (!current || current.accessToken !== credential.token) return;
    await revoke(runtime, current);
    await deleteCredential(runtime, credential.origin);
  });
}

async function pollForCredential(
  runtime: AuthRuntime,
  authBaseUrl: URL,
  device: ReturnType<typeof parseDeviceResponse>,
  signal: AbortSignal,
) {
  const deadline = runtime.now() + device.expiresIn * 1000;
  let interval = device.interval * 1000;
  let wait = interval;

  while (runtime.now() < deadline) {
    await runtime.sleep(Math.min(wait, deadline - runtime.now()), signal);
    if (signal.aborted) throw new CliFailure("cancelled", "Login cancelled.");
    if (runtime.now() >= deadline) {
      throw new CliFailure("network", "Login timed out. Run banana login again.");
    }
    wait = interval;

    let response: Response;
    try {
      response = await postForm(
        runtime,
        authEndpoint(authBaseUrl, "oauth2/token"),
        {
          client_id: OAUTH_CLIENT_ID,
          device_code: device.deviceCode,
          grant_type: DEVICE_GRANT,
        },
        signal,
      );
    } catch (error) {
      if (error instanceof CliFailure) throw error;
      continue;
    }

    if (response.status >= 500) continue;
    if (response.status === 429) {
      wait = Math.max(interval, retryAfterMs(response, runtime.now()) ?? 0);
      continue;
    }

    const body = await readJson(response);
    if (response.ok) {
      try {
        return parseTokenResponse(body, authBaseUrl.toString(), runtime.now());
      } catch (error) {
        if (body && typeof body.refresh_token === "string" && body.refresh_token) {
          await revoke(runtime, {
            authBaseUrl: authBaseUrl.toString(),
            refreshToken: body.refresh_token,
          });
        }
        throw error;
      }
    }
    switch (oauthError(body)) {
      case "authorization_pending":
        continue;
      case "slow_down":
        interval += 5_000;
        wait = interval;
        continue;
      case "temporarily_unavailable":
        continue;
      case "access_denied":
        throw new CliFailure("config", "Login denied.");
      case "expired_token":
        throw new CliFailure("config", "Login expired. Run banana login again.");
      case "invalid_client":
      case "invalid_grant":
      case "invalid_scope":
      case "invalid_target":
      case "unauthorized_client":
        throw new CliFailure(
          "config",
          "Login could not be completed. Run banana login again.",
        );
      default:
        throw new CliFailure(
          "config",
          "Authentication server returned an invalid response.",
        );
    }
  }
  throw new CliFailure("network", "Login timed out. Run banana login again.");
}

export async function login(
  runtime: AuthRuntime,
  env: Environment,
  stdout: OutputWriter,
  stderr: OutputWriter,
) {
  const apiUrl = readApiUrl(env.BANANASPLIT_API_URL);
  const origin = apiUrl.origin;
  const authBaseUrl = readAuthBaseUrl(env, apiUrl);
  await readRawCredential(runtime, origin);

  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once("SIGINT", cancel);
  try {
    let response: Response;
    try {
      response = await postForm(
        runtime,
        authEndpoint(authBaseUrl, "device/code"),
        {
          client_id: OAUTH_CLIENT_ID,
          resource: origin,
          scope: OAUTH_SCOPES,
        },
        controller.signal,
      );
    } catch (error) {
      if (error instanceof CliFailure) throw error;
      throw new CliFailure("network", "Could not start login.");
    }
    const body = await readJson(response);
    if (!response.ok) {
      throw new CliFailure("config", "Could not start login.");
    }
    const device = parseDeviceResponse(body);
    stdout(`Code: ${device.userCode}`);
    stdout(`Verify at: ${device.verificationUri}`);
    stdout("Confirm that the browser shows the same code before approving.");
    try {
      await runtime.openUrl(device.verificationUriComplete);
    } catch {
      // The printed URL and code are the headless fallback.
    }

    const credential = await pollForCredential(
      runtime,
      authBaseUrl,
      device,
      controller.signal,
    );
    let previous: StoredCredential | null = null;
    try {
      previous = await withCredentialLock(
        runtime,
        origin,
        async () => {
          const raw = await readRawCredential(runtime, origin);
          let current: StoredCredential | null = null;
          if (raw !== null) {
            try {
              current = parseStoredCredential(raw);
            } catch {
              // A successful login repairs an unreadable previous record.
            }
          }
          await writeCredential(runtime, origin, credential);
          return current;
        },
        controller.signal,
      );
    } catch (error) {
      await revoke(runtime, credential);
      if (controller.signal.aborted) {
        throw new CliFailure("cancelled", "Login cancelled.");
      }
      throw error;
    }

    if (
      previous &&
      previous.refreshToken !== credential.refreshToken &&
      !(await revoke(runtime, previous))
    ) {
      stderr("Warning: Previous login could not be revoked.");
    }
    stdout("Logged in.");
  } catch (error) {
    if (
      controller.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw new CliFailure("cancelled", "Login cancelled.");
    }
    throw error;
  } finally {
    process.off("SIGINT", cancel);
  }
}

export async function logout(
  runtime: AuthRuntime,
  env: Environment,
  stdout: OutputWriter,
) {
  const origin = readApiUrl(env.BANANASPLIT_API_URL).origin;
  const loggedOut = await withCredentialLock(runtime, origin, async () => {
    const credential = await readCredential(runtime, origin);
    if (!credential) return false;
    if (!(await revoke(runtime, credential))) {
      throw new CliFailure(
        "network",
        "Logout could not be confirmed. Try banana logout again.",
      );
    }
    await deleteCredential(runtime, origin);
    return true;
  });
  stdout(
    loggedOut
      ? "Logged out."
      : "Already logged out.",
  );
}
