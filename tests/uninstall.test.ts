import { describe, expect, it } from "bun:test";
import { mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/index";
import {
  defaultUninstallRuntime,
  uninstallCli,
  WINDOWS_SHIM,
  type UninstallRuntime,
} from "../src/uninstall";
import { harness } from "./helpers";

const BINARY = "/home/user/.local/bin/banana";
const ALIAS = "/home/user/.local/bin/bananasplit";

/**
 * A machine that never loses a file: `removed` records what was deleted and
 * `spawned` what was handed to another process, so a test asserts on the
 * uninstall without one happening.
 */
function machine(overrides: Partial<UninstallRuntime> = {}) {
  const removed: string[] = [];
  const spawned: string[][] = [];
  let loggedOut = 0;
  const runtime: UninstallRuntime = {
    color: false,
    confirm: async () => true,
    env: { HOME: "/home/user" },
    execPath: BINARY,
    isStandalone: true,
    isAlias: async () => true,
    logout: async () => {
      loggedOut += 1;
      return "Logged out.";
    },
    pid: 4242,
    platform: "linux",
    remove: async (path) => {
      removed.push(path);
    },
    skills: async () => [],
    spawn: (command) => {
      spawned.push(command);
      return { exited: Promise.resolve(0), unref: () => {} };
    },
    ...overrides,
  };
  return { removed, runtime, spawned, loggedOut: () => loggedOut };
}

describe("banana uninstall", () => {
  it("removes the binary and the login once confirmed", async () => {
    const test = machine();

    const message = await uninstallCli({ yes: false }, test.runtime);

    expect(test.removed).toEqual([BINARY, ALIAS]);
    expect(test.loggedOut()).toBe(1);
    expect(message).toBe(
      "Removed ~/.local/bin/banana and ~/.local/bin/bananasplit.\nLogged out.",
    );
  });

  it("leaves everything alone when the question is answered no", async () => {
    const test = machine({ confirm: async () => false });

    expect(await uninstallCli({ yes: false }, test.runtime)).toBe(
      "Left banana where it is.",
    );
    expect(test.removed).toEqual([]);
    expect(test.loggedOut()).toBe(0);
  });

  it("shows what it would remove before asking", async () => {
    let asked = "";
    const test = machine({
      confirm: async (question) => {
        asked = question;
        return false;
      },
    });

    await uninstallCli({ yes: false }, test.runtime);

    expect(asked).toContain("This will remove:");
    expect(asked).toContain("~/.local/bin/banana");
    expect(asked).toContain("your stored login, revoked and then deleted");
    expect(asked).toEndWith("Continue? [y/N] ");
  });

  it("refuses to delete anything it could not ask about", async () => {
    const test = machine({ confirm: undefined });

    expect(uninstallCli({ yes: false }, test.runtime)).rejects.toThrow(
      /Re-run with --yes to uninstall without being asked/,
    );
    expect(test.removed).toEqual([]);
  });

  it("--yes is the answer, with no terminal needed", async () => {
    const test = machine({ confirm: undefined });

    await uninstallCli({ yes: true }, test.runtime);

    expect(test.removed).toEqual([BINARY, ALIAS]);
  });

  it("leaves a bananasplit the installer did not make", async () => {
    const checked: string[][] = [];
    const test = machine({
      isAlias: async (path, binary) => {
        checked.push([path, binary]);
        return false;
      },
    });

    const message = await uninstallCli({ yes: true }, test.runtime);

    expect(checked).toEqual([[ALIAS, BINARY]]);
    expect(test.removed).toEqual([BINARY]);
    expect(message).toBe("Removed ~/.local/bin/banana.\nLogged out.");
  });

  it("leaves a bananasplit.cmd that is not the installer's shim", async () => {
    const test = machine({
      platform: "win32",
      execPath: "C:\\bin\\banana.exe",
      isAlias: async () => false,
    });

    await uninstallCli({ yes: true }, test.runtime);

    expect(test.spawned[0]?.join(" ")).not.toContain("bananasplit");
  });

  it("names the skill and the Path entry without touching them", async () => {
    const test = machine({
      platform: "win32",
      execPath: "C:\\\\Users\\\\u\\\\AppData\\\\Local\\\\BananaSplit\\\\bin\\\\banana.exe",
      skills: async () => ["/home/user/.claude/skills/banana/SKILL.md"],
    });

    const message = await uninstallCli({ yes: true }, test.runtime);

    expect(message).toContain("banana skill uninstall removes it");
    expect(message).toContain("on your Path");
    expect(test.removed).toEqual([]);
  });

  it("hands a running .exe to a process that outlives it", async () => {
    const test = machine({ platform: "win32", execPath: "C:\\\\bin\\\\banana.exe" });

    const message = await uninstallCli({ yes: true }, test.runtime);

    expect(test.spawned[0]?.[0]).toBe("powershell.exe");
    expect(test.spawned[0]?.join(" ")).toContain("Wait-Process -Id 4242");
    expect(test.spawned[0]?.join(" ")).toContain("C:\\bin\\bananasplit.cmd");
    expect(test.removed).toEqual([]);
    expect(message).toContain("will finish uninstalling after this command exits");
  });

  it("uninstalls a package install through its package manager", async () => {
    const test = machine({ isStandalone: false, execPath: "/home/user/.bun/bin/bun" });

    const message = await uninstallCli({ yes: true }, test.runtime);

    expect(test.spawned).toEqual([
      ["/home/user/.bun/bin/bun", "remove", "--global", "@bananasplitapp/cli"],
    ]);
    expect(test.removed).toEqual([]);
    expect(message).toContain("Removed the @bananasplitapp/cli package.");
  });

  it("reports a package manager that failed, rather than claiming success", async () => {
    const test = machine({
      isStandalone: false,
      spawn: () => ({ exited: Promise.resolve(1), unref: () => {} }),
    });

    expect(uninstallCli({ yes: true }, test.runtime)).rejects.toThrow(
      "Could not remove the @bananasplitapp/cli package.",
    );
  });

  it("reports a binary it could not delete", async () => {
    const test = machine({
      remove: async () => {
        throw new Error("EACCES: permission denied");
      },
    });

    expect(uninstallCli({ yes: true }, test.runtime)).rejects.toThrow(
      `Could not remove ${BINARY}: EACCES: permission denied`,
    );
  });

  it("revokes the login before removing the CLI that could revoke it", async () => {
    const order: string[] = [];
    const test = machine({
      logout: async () => {
        order.push("logout");
        return "Logged out.";
      },
      remove: async () => {
        order.push("remove");
      },
    });

    await uninstallCli({ yes: true }, test.runtime);

    expect(order).toEqual(["logout", "remove", "remove"]);
  });

  it("stops before deleting anything if the login cannot be revoked", async () => {
    const test = machine({
      logout: async () => {
        throw new Error("Logout could not be confirmed.");
      },
    });

    expect(uninstallCli({ yes: true }, test.runtime)).rejects.toThrow(
      "Logout could not be confirmed.",
    );
    expect(test.removed).toEqual([]);
  });

  describe("through the CLI", () => {
    it("prints the uninstaller's message and makes no request", async () => {
      const test = harness();
      const calls: unknown[] = [];

      const code = await runCli(["uninstall", "--yes"], {
        ...test.runtime,
        uninstall: async (command) => {
          calls.push(command);
          return "Removed ~/.local/bin/banana.";
        },
      });

      expect(code).toBe(0);
      expect(calls).toEqual([{ kind: "uninstall", yes: true }]);
      expect(test.stdout.join("\n")).toBe("Removed ~/.local/bin/banana.");
      expect(test.calls).toEqual([]);
    });

    it("has no JSON shape to offer", async () => {
      const test = harness();

      expect(await runCli(["uninstall", "--json"], test.runtime)).toBe(2);
      expect(test.stderr.join("\n")).toContain(
        '"--json is not supported for banana uninstall"',
      );
    });

    it("rejects an argument that is not --yes", async () => {
      const test = harness();

      expect(await runCli(["uninstall", "everything"], test.runtime)).toBe(2);
      expect(test.stderr.join("\n")).toContain("Unexpected argument: everything");
    });
  });
});

describe("the bananasplit alias check", () => {
  const { isAlias } = defaultUninstallRuntime();

  it("knows the installer's symlink from a file that only shares its name", async () => {
    const dir = await mkdtemp(join(tmpdir(), "banana-alias-"));
    const binary = join(dir, "banana");
    await writeFile(binary, "binary");
    await symlink("banana", join(dir, "bananasplit"));
    await writeFile(join(dir, "other"), "binary");

    expect(await isAlias(join(dir, "bananasplit"), binary)).toBe(true);
    expect(await isAlias(join(dir, "other"), binary)).toBe(false);
    expect(await isAlias(join(dir, "missing"), binary)).toBe(false);
  });

  it("knows the installer's shim from another .cmd", async () => {
    const dir = await mkdtemp(join(tmpdir(), "banana-alias-"));
    await writeFile(join(dir, "shim.cmd"), `${WINDOWS_SHIM}\r\n`);
    await writeFile(join(dir, "other.cmd"), "@echo off\r\n");

    expect(await isAlias(join(dir, "shim.cmd"), "banana.exe")).toBe(true);
    expect(await isAlias(join(dir, "other.cmd"), "banana.exe")).toBe(false);
  });
});
