import { join } from "node:path";
import { REQUEST_PACE_MS } from "../src/request";
import type { Environment } from "../src/types";
import type { Target } from "./config";
import { requestPacePath } from "./paths";

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

/** A scenario command was refused because the run is already stopping. */
export class CommandsCancelled extends Error {
  constructor() {
    super("Interrupted.");
    this.name = "CommandsCancelled";
  }
}

type Child = {
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  exited: Promise<number>;
  kill(signal?: NodeJS.Signals): void;
};

export type CommandRunner = {
  run(
    args: string[],
    target: Target,
    extra?: Environment,
  ): Promise<CommandResult>;
  stopped(): boolean;
};

export function repoRoot() {
  return join(import.meta.dir, "..");
}

export function commandArgv(args: string[], binary?: string) {
  if (binary) return [binary, ...args];
  return [process.execPath, join(repoRoot(), "src/index.ts"), ...args];
}

export function childEnv(target: Target, extra: Environment = {}) {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...process.env, ...extra })) {
    if (typeof value === "string") env[key] = value;
  }
  env.BANANASPLIT_API_URL = extra.BANANASPLIT_API_URL ?? target.apiUrl;
  // A developer shell often has BANANASPLIT_AUTH_URL set for loopback. The
  // suite uses only its own auth base, or the API origin's default.
  delete env.BANANASPLIT_AUTH_URL;
  const authUrl = extra.BANANASPLIT_AUTH_URL ?? target.authUrl;
  if (authUrl) env.BANANASPLIT_AUTH_URL = authUrl;
  env.BANANASPLIT_NO_KEYCHAIN = "1";
  env.BANANASPLIT_REQUEST_GAP_MS =
    extra.BANANASPLIT_REQUEST_GAP_MS ?? String(REQUEST_PACE_MS);
  env.BANANASPLIT_REQUEST_PACE_FILE =
    extra.BANANASPLIT_REQUEST_PACE_FILE ?? requestPacePath(target.dataDir);
  env.XDG_DATA_HOME = extra.XDG_DATA_HOME ?? target.dataDir;
  env.NO_COLOR = "1";
  delete env.FORCE_COLOR;
  return env;
}

function spawnCommand(args: string[], target: Target, extra: Environment = {}) {
  return Bun.spawn(commandArgv(args, target.binary), {
    cwd: repoRoot(),
    env: childEnv(target, extra),
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
}

async function collect(child: Child): Promise<CommandResult> {
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { exitCode, stdout, stderr };
}

/** Inserts are not sent again: a 429 can mean the row was already saved. */
const INSERTS = new Set(["add", "create"]);

let commandLogging = false;

/** Print each command on stderr. The suite turns this on; unit tests leave it off. */
export function enableCommandLog() {
  commandLogging = true;
}

export function logLine(message: string) {
  if (commandLogging) console.log(message);
}

function formatArgs(args: string[]) {
  return args
    .map((arg) => (/[\s"]/.test(arg) ? JSON.stringify(arg) : arg))
    .join(" ");
}

/** How long to wait after a 429. Creates look the row up before they are sent again. */
export function rateLimitDelay(result: CommandResult): number | undefined {
  if (result.exitCode === 0) return undefined;
  const text = result.stderr.trim() || result.stdout.trim();
  try {
    const parsed: unknown = JSON.parse(text);
    const error =
      parsed && typeof parsed === "object" && "error" in parsed
        ? (parsed as { error?: unknown }).error
        : undefined;
    if (!error || typeof error !== "object") return undefined;
    const record = error as { status?: unknown; body?: unknown };
    if (record.status !== 429) return undefined;
    return retryAfterSeconds(record.body);
  } catch {
    return text.includes("Too many requests") ? 30 : undefined;
  }
}

export function retryAfterSeconds(body: unknown) {
  if (body && typeof body === "object" && "retryAfterSeconds" in body) {
    const seconds = Number((body as { retryAfterSeconds: unknown }).retryAfterSeconds);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(Math.ceil(seconds) + 1, 120);
    }
  }
  return 30;
}

function retriesRateLimit(args: string[]) {
  return !args.some((arg) => INSERTS.has(arg));
}

async function runOnce(args: string[], target: Target, extra: Environment) {
  logLine(`$ banana ${formatArgs(args)}`);
  const result = await collect(spawnCommand(args, target, extra));
  const delay = retriesRateLimit(args) ? rateLimitDelay(result) : undefined;
  if (delay === undefined && result.exitCode !== 0) {
    const line = (result.stderr.trim() || result.stdout.trim()).split("\n")[0];
    if (line) logLine(line);
  }
  return { result, delay };
}

export async function runCommand(
  args: string[],
  target: Target,
  extra: Environment = {},
): Promise<CommandResult> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const { result, delay } = await runOnce(args, target, extra);
    if (delay === undefined || attempt === 7) return result;
    logLine(`rate limited, waiting ${delay}s`);
    await Bun.sleep(delay * 1000);
  }
  throw new Error("rate limit retry ended without a result");
}

export const directRunner: CommandRunner = {
  run: runCommand,
  stopped: () => false,
};

/**
 * Scenario commands. `cancel` kills anything still running and makes later
 * `run` calls fail, so cleanup can start after the in-flight process exits.
 */
export function createCommandGate(): CommandRunner & {
  cancel(): Promise<void>;
} {
  let stopped = false;
  let opening = 0;
  const inflight = new Set<Child>();

  async function run(args: string[], target: Target, extra: Environment = {}) {
    if (stopped) throw new CommandsCancelled();
    for (let attempt = 0; attempt < 8; attempt++) {
      if (stopped) throw new CommandsCancelled();
      opening += 1;
      let child: Child | undefined;
      let delay: number | undefined;
      try {
        logLine(`$ banana ${formatArgs(args)}`);
        child = spawnCommand(args, target, extra);
        inflight.add(child);
        if (stopped) child.kill("SIGTERM");
        const result = await collect(child);
        if (stopped) throw new CommandsCancelled();
        delay = retriesRateLimit(args) ? rateLimitDelay(result) : undefined;
        if (delay === undefined || attempt === 7) {
          if (delay === undefined && result.exitCode !== 0) {
            const line = (result.stderr.trim() || result.stdout.trim()).split("\n")[0];
            if (line) logLine(line);
          }
          return result;
        }
      } finally {
        opening -= 1;
        if (child) inflight.delete(child);
      }
      logLine(`rate limited, waiting ${delay}s`);
      await Bun.sleep(delay * 1000);
    }
    throw new CommandsCancelled();
  }

  async function cancel() {
    stopped = true;
    let forced = false;
    for (;;) {
      for (const child of inflight) child.kill(forced ? "SIGKILL" : "SIGTERM");
      if (opening === 0 && inflight.size === 0) return;
      forced = true;
      const pending = [...inflight];
      await Promise.race([
        Promise.all(pending.map((child) => child.exited)),
        Bun.sleep(20),
      ]);
    }
  }

  return { run, cancel, stopped: () => stopped };
}

/** Browser login needs the real terminal. */
export async function runCommandInherited(
  args: string[],
  target: Target,
): Promise<number> {
  const child = Bun.spawn(commandArgv(args, target.binary), {
    cwd: repoRoot(),
    env: childEnv(target),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return child.exited;
}
