import { randomUUID } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "bun:test";
import {
  keychainStorage,
  credentialsPath,
  defaultSecureStorage,
  fileStorage,
} from "../src/secrets";

const roots: string[] = [];

function scratch() {
  const root = join(tmpdir(), `banana-secrets-${randomUUID()}`);
  roots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

const KEY = { name: "https://api.example.test", service: "banana" };

describe("file credential storage", () => {
  it("round-trips a credential", async () => {
    const path = join(scratch(), "credentials.json");
    const store = fileStorage(path);

    expect(await store.get(KEY)).toBeNull();
    await store.set({ ...KEY, value: "stored-value" });
    expect(await store.get(KEY)).toBe("stored-value");
    expect(await store.delete(KEY)).toBe(true);
    expect(await store.delete(KEY)).toBe(false);
    expect(await store.get(KEY)).toBeNull();
  });

  it("keeps the file private to the user", async () => {
    const path = join(scratch(), "credentials.json");
    await fileStorage(path).set({ ...KEY, value: "stored-value" });

    expect((await stat(path)).mode & 0o777).toBe(0o600);
  });

  it("keeps entries for other origins", async () => {
    const path = join(scratch(), "credentials.json");
    const store = fileStorage(path);
    const other = { name: "https://other.example.test", service: "banana" };

    await store.set({ ...KEY, value: "first" });
    await store.set({ ...other, value: "second" });
    await store.delete(KEY);

    expect(await store.get(other)).toBe("second");
  });

  it("removes the file once the last credential is gone", async () => {
    const path = join(scratch(), "credentials.json");
    const store = fileStorage(path);

    await store.set({ ...KEY, value: "stored-value" });
    await store.delete(KEY);

    expect(await Bun.file(path).exists()).toBe(false);
  });

  it("reports an unreadable file instead of discarding it", async () => {
    const root = scratch();
    const path = join(root, "credentials.json");
    await mkdir(root, { recursive: true });
    await writeFile(path, "not json");

    expect(fileStorage(path).get(KEY)).rejects.toThrow("not valid JSON");
  });
});

describe("credential storage selection", () => {
  it("puts the fallback file under XDG_DATA_HOME", () => {
    expect(credentialsPath({ XDG_DATA_HOME: "/data", HOME: "/home/user" })).toBe(
      "/data/banana/credentials.json",
    );
  });

  it("falls back to ~/.local/share", () => {
    expect(credentialsPath({ HOME: "/home/user" })).toBe(
      "/home/user/.local/share/banana/credentials.json",
    );
  });

  it("uses the file store off macOS", async () => {
    const root = scratch();
    const store = defaultSecureStorage({ HOME: root }, "linux");

    await store.set({ ...KEY, value: "stored-value" });

    expect(await store.get(KEY)).toBe("stored-value");
    expect(
      await Bun.file(join(root, ".local/share/banana/credentials.json")).exists(),
    ).toBe(true);
  });

  it("lets BANANASPLIT_NO_KEYCHAIN opt out of the keychain on macOS", async () => {
    const root = scratch();
    const store = defaultSecureStorage(
      { BANANASPLIT_NO_KEYCHAIN: "1", HOME: root },
      "darwin",
    );

    await store.set({ ...KEY, value: "stored-value" });

    expect(
      await Bun.file(join(root, ".local/share/banana/credentials.json")).exists(),
    ).toBe(true);
  });
});

describe("macOS keychain storage", () => {
  function runner(result: Partial<{ code: number; stderr: string; stdout: string }> = {}) {
    const calls: Array<{ args: string[]; stdin?: string }> = [];
    const run = async (args: string[], stdin?: string) => {
      calls.push({ args, stdin });
      return { code: 0, stderr: "", stdout: "", ...result };
    };
    return { calls, run };
  }

  it("passes the value over stdin, never in the arguments", async () => {
    const { calls, run } = runner();
    const secret = "s3cret-refresh-token";

    await keychainStorage(run).set({ ...KEY, value: secret });

    expect(calls[0].args).toEqual(["-i"]);
    expect(calls[0].args.join(" ")).not.toContain(secret);
    expect(calls[0].stdin).toContain("add-generic-password -U");
  });

  it("never uses the prompt form, which truncates at 128 bytes", async () => {
    const { calls, run } = runner();
    const value = JSON.stringify({ accessToken: "a".repeat(600) });

    await keychainStorage(run).set({ ...KEY, value });

    // A bare trailing `-w` would make security prompt and silently truncate.
    expect(calls[0].stdin!.trimEnd()).not.toMatch(/-w$/);
    expect(calls[0].stdin).toMatch(/-w '/);
  });

  it("round-trips values that macOS would otherwise hex-encode", async () => {
    const value = "café 🍌 \"quoted\" 'single' \\back\\ $VAR";
    const write = runner();
    await keychainStorage(write.run).set({ ...KEY, value });
    const encoded = /-w '([^']*)'/.exec(write.calls[0].stdin!)![1];

    const read = runner({ stdout: `${encoded}\n` });
    expect(await keychainStorage(read.run).get(KEY)).toBe(value);
  });

  it("reports a missing item as null and a missing delete as false", async () => {
    expect(await keychainStorage(runner({ code: 44 }).run).get(KEY)).toBeNull();
    expect(await keychainStorage(runner({ code: 44 }).run).delete(KEY)).toBe(false);
  });

  it("refuses a credential too large for security -i", async () => {
    const { run } = runner();
    const value = "x".repeat(4096);

    expect(keychainStorage(run).set({ ...KEY, value })).rejects.toThrow("too large");
  });

  it("surfaces a keychain error instead of storing nothing quietly", async () => {
    const { run } = runner({ code: 1, stderr: "keychain is locked" });

    expect(keychainStorage(run).set({ ...KEY, value: "v" })).rejects.toThrow(
      "keychain is locked",
    );
  });
});
