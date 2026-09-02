import {
  CliFailure,
  type Environment,
  type RequestCommand,
  type CliRuntime,
} from "./types";

export const DEFAULT_API_URL = "https://api.bananasplit.net";
export const REQUEST_TIMEOUT_MS = 15_000;

function readApiUrl(raw: string | undefined) {
  let url: URL;
  try {
    url = new URL(raw || DEFAULT_API_URL);
  } catch {
    throw new CliFailure("config", "BANANASPLIT_API_URL must be a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CliFailure(
      "config",
      "BANANASPLIT_API_URL must use http or https",
    );
  }
  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

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

export async function request(
  command: RequestCommand,
  runtime: Required<Pick<CliRuntime, "fetch" | "timeoutMs">>,
  env: Environment,
) {
  const token = env.BANANASPLIT_TOKEN;
  if (!token) throw new CliFailure("config", "BANANASPLIT_TOKEN is required");

  const url = new URL(
    command.path.replace(/^\//, ""),
    readApiUrl(env.BANANASPLIT_API_URL),
  );
  command.query?.forEach((value, key) => url.searchParams.set(key, value));

  let response: Response;
  try {
    response = await runtime.fetch(url, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
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
    throw new CliFailure(
      "network",
      timedOut
        ? `Request timed out after ${runtime.timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : "Network request failed",
    );
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new CliFailure(
      "api",
      responseMessage(response, body),
      response.status,
      body,
    );
  }
  return body;
}
