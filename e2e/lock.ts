import { closeSync, constants, ftruncateSync, openSync, writeSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { dlopen, FFIType } from "bun:ffi";
import { ConfigError } from "./config";
import { e2ePaths } from "./paths";

export type RunLock = {
  pid: number;
  accountId: string;
  origin: string;
};

const LOCK_EX = 2;
const LOCK_NB = 4;
const LOCK_UN = 8;

export type LockHooks = {
  /**
   * Runs after this process holds the kernel lock and has seen that the
   * previous owner is gone, before its own pid is published.
   */
  afterStaleObserved?: () => Promise<void>;
};

export function processAlive(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

export function accountLockPath(dataDir: string, accountId: string, origin: string) {
  const name = createHash("sha256")
    .update(`${accountId}\n${origin}`)
    .digest("hex")
    .slice(0, 24);
  return `${e2ePaths(dataDir).root}/lock-${name}.json`;
}

let flockSyscall: ((fd: number, operation: number) => number) | undefined;

function flock(fd: number, operation: number) {
  if (!flockSyscall) {
    const library =
      process.platform === "darwin" ? "/usr/lib/libSystem.B.dylib" : "libc.so.6";
    const libc = dlopen(library, {
      flock: {
        args: [FFIType.i32, FFIType.i32],
        returns: FFIType.i32,
      },
    });
    const syscall = libc.symbols.flock;
    flockSyscall = (file, op) => syscall(file, op);
  }
  return flockSyscall(fd, operation);
}

function lockExclusive(fd: number) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (flock(fd, LOCK_EX | LOCK_NB) === 0) return true;
  }
  return false;
}

async function readLock(file: string): Promise<RunLock | undefined> {
  try {
    const text = await readFile(file, "utf8");
    if (!text.trim()) return undefined;
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const record = parsed as Partial<RunLock>;
    if (typeof record.pid !== "number") return undefined;
    return {
      pid: record.pid,
      accountId: typeof record.accountId === "string" ? record.accountId : "",
      origin: typeof record.origin === "string" ? record.origin : "",
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function publish(fd: number, payload: RunLock) {
  const body = Buffer.from(JSON.stringify(payload));
  writeSync(fd, body, 0, body.length, 0);
  ftruncateSync(fd, body.length);
}

/**
 * One writer for this staging account. The kernel holds the lock until this
 * process releases it or exits, so a dead owner does not have to be renamed
 * out of the way.
 */
export async function acquireAccountLock(
  input: {
    dataDir: string;
    accountId: string;
    origin: string;
  },
  hooks?: LockHooks,
): Promise<() => Promise<void>> {
  const file = accountLockPath(input.dataDir, input.accountId, input.origin);
  const payload: RunLock = {
    pid: process.pid,
    accountId: input.accountId,
    origin: input.origin,
  };
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const fd = openSync(file, constants.O_RDWR | constants.O_CREAT, 0o600);
  if (!lockExclusive(fd)) {
    closeSync(fd);
    const current = await readLock(file);
    const who = current && processAlive(current.pid) ? ` (pid ${current.pid})` : "";
    throw new ConfigError(
      `Another end-to-end run is active for this account${who}. ` +
        "Wait for it to finish, or stop it and retry. Its fixtures were left in place.",
    );
  }
  try {
    const current = await readLock(file);
    if (!current || !processAlive(current.pid)) await hooks?.afterStaleObserved?.();
    publish(fd, payload);
  } catch (error) {
    flock(fd, LOCK_UN);
    closeSync(fd);
    throw error;
  }
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    flock(fd, LOCK_UN);
    closeSync(fd);
  };
}
