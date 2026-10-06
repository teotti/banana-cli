import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  clearAfterUnauthorized,
  DEFAULT_API_URL,
  getAccessCredential,
  readApiUrl,
  refreshAfterUnauthorized,
  REQUEST_TIMEOUT_MS,
  type AccessCredential,
  type AuthRuntime,
} from "./auth";
import { userAgent } from "./shared";
import {
  CliFailure,
  type Environment,
  type RequestCommand,
} from "./types";

export { DEFAULT_API_URL, REQUEST_TIMEOUT_MS };

function responseMessage(response: Response, body: unknown) {
  if (typeof body === "string" && body) return body;
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return `${response.status} ${response.statusText || "Request failed"}`;
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

const SENSITIVE_KEY = /^(?:access_?token|refresh_?token|device_?code|authorization)$/i;

function redact(value: unknown, tokens: string[], key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") {
    return tokens.reduce(
      (text, token) => (token ? text.replaceAll(token, "[redacted]") : text),
      value,
    );
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, tokens));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, tokens, entryKey),
      ]),
    );
  }
  return value;
}

async function send(
  command: RequestCommand,
  runtime: AuthRuntime,
  env: Environment,
  credential: AccessCredential,
) {
  const url = new URL(
    command.path.replace(/^\//, ""),
    readApiUrl(env.BANANASPLIT_API_URL),
  );
  command.query?.forEach((value, key) => url.searchParams.set(key, value));

  try {
    return await runtime.fetch(url, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${credential.token}`,
        ...(command.body === undefined
          ? {}
          : { "content-type": "application/json" }),
        "user-agent": userAgent(env),
      },
      ...(command.method === undefined ? {} : { method: command.method }),
      ...(command.body === undefined
        ? {}
        : { body: JSON.stringify(command.body) }),
      signal: AbortSignal.timeout(runtime.timeoutMs),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    const message =
      error instanceof Error
        ? String(redact(error.message, [credential.token]))
        : "Network request failed";
    throw new CliFailure(
      "network",
      timedOut ? `Request timed out after ${runtime.timeoutMs}ms` : message,
    );
  }
}

let nextRequestAt = 0;

/**
 * Staging allows 30 requests a minute. The suite stays under that, and the
 * gap is shared by every `banana` process in the run.
 */
export const REQUEST_PACE_MS = 2_500;

/** E2E sets this so staging is not asked in a burst. Unset for normal use. */
export function requestGapMs(env: Environment) {
  const raw = env.BANANASPLIT_REQUEST_GAP_MS?.trim();
  if (!raw) return 0;
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(ms, 10_000);
}

/** The next request may leave at `nextAt`. `previous` is the last reservation. */
export function paceStamp(previous: number, now: number, gap: number) {
  const at = Math.max(now, previous);
  return { waitMs: at - now, nextAt: at + gap };
}

async function reservePace(file: string, gap: number) {
  mkdirSync(dirname(file), { recursive: true });
  const lock = `${file}.lock`;
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      mkdirSync(lock);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        if (Date.now() - statSync(lock).mtimeMs > 15_000) {
          rmSync(lock, { recursive: true, force: true });
        }
      } catch {
        // Another process removed the stale lock first.
      }
      if (Date.now() > deadline) {
        throw new Error("Timed out waiting for the request pace lock.");
      }
      await Bun.sleep(20);
    }
  }
  try {
    let previous = 0;
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
      if (parsed && typeof parsed === "object" && "nextAt" in parsed) {
        const nextAt = Number((parsed as { nextAt: unknown }).nextAt);
        if (Number.isFinite(nextAt)) previous = nextAt;
      }
    } catch {
      // The first request in a run creates the file.
    }
    const reserved = paceStamp(previous, Date.now(), gap);
    writeFileSync(file, JSON.stringify({ nextAt: reserved.nextAt }));
    return reserved.waitMs;
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

async function paceRequest(env: Environment) {
  const gap = requestGapMs(env);
  if (gap === 0) return;
  const file = env.BANANASPLIT_REQUEST_PACE_FILE?.trim();
  if (file) {
    const wait = await reservePace(file, gap);
    if (wait > 0) await Bun.sleep(wait);
    return;
  }
  const now = Date.now();
  const wait = nextRequestAt - now;
  nextRequestAt = Math.max(now, nextRequestAt) + gap;
  if (wait > 0) await Bun.sleep(wait);
}

export async function request(
  command: RequestCommand,
  runtime: AuthRuntime,
  env: Environment,
) {
  await paceRequest(env);
  let credential = await getAccessCredential(runtime, env);
  let response = await send(command, runtime, env, credential);
  if (response.status === 401) {
    credential = await refreshAfterUnauthorized(runtime, credential);
    response = await send(command, runtime, env, credential);
    if (response.status === 401) {
      try {
        await clearAfterUnauthorized(runtime, credential);
      } catch {
        // The actionable result is still to authenticate again.
      }
      throw new CliFailure("config", "Login expired. Run banana login again.");
    }
  }

  const body = redact(await readResponseBody(response), [credential.token]);
  if (!response.ok) {
    if (
      response.status === 403 &&
      body &&
      typeof body === "object" &&
      "code" in body &&
      body.code === "INSUFFICIENT_SCOPE"
    ) {
      throw new CliFailure(
        "config",
        "Login is missing required API permissions. Run banana login.",
      );
    }
    throw new CliFailure(
      "api",
      responseMessage(response, body),
      response.status,
      body,
    );
  }
  return body;
}
