import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { CliFailure, type Environment, type SecureStorage } from "./types";

// The macOS keychain grants access per code signature. Calling the keychain
// from this process would put our own signature in the item's ACL, and
// `banana update` replaces the binary, so the signature changes and every
// later read prompts the user. `/usr/bin/security` is Apple-signed and never
// changes, so going through it keeps the ACL stable across updates.
const SECURITY = "/usr/bin/security";
const NOT_FOUND = 44;
// `security -i` refuses commands longer than this.
const MAX_COMMAND = 4096;
// macOS returns hex instead of text for values that are not plain ASCII, so
// everything is stored base64-encoded behind a marker and decoded on the way
// back out.
const ENCODED_PREFIX = "banana-base64:";

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function encode(value: string) {
  return ENCODED_PREFIX + Buffer.from(value, "utf8").toString("base64");
}

function decode(value: string) {
  if (!value.startsWith(ENCODED_PREFIX)) return value;
  return Buffer.from(value.slice(ENCODED_PREFIX.length), "base64").toString(
    "utf8",
  );
}

type SecretKey = { name: string; service: string };

async function security(args: string[], stdin?: string) {
  const child = Bun.spawn([SECURITY, ...args], {
    stdin: stdin === undefined ? "ignore" : new Blob([stdin]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { code, stderr, stdout };
}

function keychainFailure(action: string, stderr: string): never {
  throw new CliFailure(
    "config",
    `Could not ${action} credentials in the macOS keychain: ${stderr.trim()}`,
  );
}

export type SecurityRunner = (
  args: string[],
  stdin?: string,
) => Promise<{ code: number; stderr: string; stdout: string }>;

export function keychainStorage(run: SecurityRunner = security): SecureStorage {
  return {
    async get({ service, name }: SecretKey) {
      const { code, stderr, stdout } = await run([
        "find-generic-password",
        "-s",
        service,
        "-a",
        name,
        "-w",
      ]);
      if (code === NOT_FOUND) return null;
      if (code !== 0) keychainFailure("read", stderr);
      return decode(stdout.trim());
    },
    async set({ service, name, value }: SecretKey & { value: string }) {
      // `security -i` reads a command from stdin, so the value travels as a
      // `-w` argument without ever reaching this process's argv, where `ps`
      // would expose it. Prompting for the value instead (`-w` with no
      // argument) is not an option: that path silently truncates at 128
      // bytes, which is shorter than a stored credential.
      const command =
        "add-generic-password -U" +
        ` -s ${shellQuote(service)}` +
        ` -a ${shellQuote(name)}` +
        ` -w ${shellQuote(encode(value))}\n`;
      if (command.length > MAX_COMMAND) {
        throw new CliFailure(
          "config",
          "Credential is too large for the macOS keychain.",
        );
      }
      const { code, stderr } = await run(["-i"], command);
      if (code !== 0 || stderr.trim()) keychainFailure("save", stderr);
    },
    async delete({ service, name }: SecretKey) {
      const { code, stderr } = await run([
        "delete-generic-password",
        "-s",
        service,
        "-a",
        name,
      ]);
      if (code === NOT_FOUND) return false;
      if (code !== 0) keychainFailure("delete", stderr);
      return true;
    },
  };
}

function entryKey({ service, name }: SecretKey) {
  return `${service}\0${name}`;
}

export function credentialsPath(env: Environment) {
  const base = env.XDG_DATA_HOME || join(env.HOME || homedir(), ".local", "share");
  return join(base, "banana", "credentials.json");
}

export function fileStorage(path: string): SecureStorage {
  async function read(): Promise<Record<string, string>> {
    let raw: string;
    try {
      raw = await readFile(path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw new CliFailure("config", `Could not read ${path}.`);
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("not an object");
      }
      return parsed as Record<string, string>;
    } catch {
      throw new CliFailure(
        "config",
        `${path} is not valid JSON. Delete it and run banana login.`,
      );
    }
  }

  async function write(entries: Record<string, string>) {
    await mkdir(dirname(path), { mode: 0o700, recursive: true });
    if (Object.keys(entries).length === 0) {
      await rm(path, { force: true });
      return;
    }
    // Write then rename so a crash cannot leave a truncated credential file.
    const temporary = `${path}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(entries), { mode: 0o600 });
    await chmod(temporary, 0o600);
    await rename(temporary, path);
  }

  return {
    async get(key: SecretKey) {
      return (await read())[entryKey(key)] ?? null;
    },
    async set({ value, ...key }: SecretKey & { value: string }) {
      const entries = await read();
      entries[entryKey(key)] = value;
      await write(entries);
    },
    async delete(key: SecretKey) {
      const entries = await read();
      if (!(entryKey(key) in entries)) return false;
      delete entries[entryKey(key)];
      await write(entries);
      return true;
    },
  };
}

export function defaultSecureStorage(
  env: Environment,
  platform: string = process.platform,
): SecureStorage {
  if (platform === "darwin" && !env.BANANASPLIT_NO_KEYCHAIN) {
    return keychainStorage();
  }
  return fileStorage(credentialsPath(env));
}
