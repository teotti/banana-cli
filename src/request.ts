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
        "user-agent": "bananasplit-cli",
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

export async function request(
  command: RequestCommand,
  runtime: AuthRuntime,
  env: Environment,
) {
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
