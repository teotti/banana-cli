import { describe, expect, it } from "bun:test";
import { updateCli, type UpdateRuntime } from "../src/update";

function updater(overrides: Partial<UpdateRuntime> = {}) {
  const calls: Parameters<UpdateRuntime["spawn"]>[] = [];
  let unrefs = 0;
  const runtime: UpdateRuntime = {
    env: { PATH: "/bin" },
    execPath: "/opt/banana/bin/banana",
    fetch: async () => new Response("installer body"),
    isStandalone: true,
    pid: 42,
    platform: "linux",
    spawn: (command, options) => {
      calls.push([command, options]);
      return {
        exited: Promise.resolve(0),
        unref: () => {
          unrefs += 1;
        },
      };
    },
    ...overrides,
  };
  return { calls, runtime, unrefs: () => unrefs };
}

describe("CLI updater", () => {
  it("updates Bun package installs with the current Bun executable", async () => {
    const test = updater({
      execPath: "/home/user/.bun/bin/bun",
      isStandalone: false,
    });

    expect(await updateCli(test.runtime)).toBe("Banana is up to date.");
    expect(test.calls).toEqual([
      [
        [
          "/home/user/.bun/bin/bun",
          "update",
          "--global",
          "--latest",
          "@bananasplitapp/cli",
        ],
        {
          env: { PATH: "/bin" },
          stdout: "inherit",
          stderr: "inherit",
        },
      ],
    ]);
  });

  it("runs the verified POSIX installer against the current binary directory", async () => {
    const urls: string[] = [];
    const test = updater({
      fetch: async (input) => {
        urls.push(String(input));
        return new Response("#!/bin/sh\necho updated");
      },
    });

    expect(await updateCli(test.runtime)).toBe("Banana is up to date.");
    expect(urls).toEqual([
      "https://github.com/teotti/banana-cli/releases/latest/download/install.sh",
    ]);
    expect(test.calls[0]?.[0]).toEqual(["sh"]);
    expect(test.calls[0]?.[1]).toMatchObject({
      env: { PATH: "/bin", BANANA_INSTALL_DIR: "/opt/banana/bin" },
      stdout: "inherit",
      stderr: "inherit",
    });
    expect(await (test.calls[0]?.[1].stdin as Blob).text()).toBe(
      "#!/bin/sh\necho updated",
    );
  });

  it("hands Windows replacement to a detached PowerShell process", async () => {
    const test = updater({
      execPath: "C:\\Tools\\Banana\\banana.exe",
      platform: "win32",
    });

    expect(await updateCli(test.runtime)).toBe(
      "Banana update started; it will finish after this command exits.",
    );
    expect(test.calls[0]?.[0]).toEqual([
      "powershell.exe",
      "-NoProfile",
      "-Command",
      "-",
    ]);
    expect(test.calls[0]?.[1]).toMatchObject({
      env: {
        PATH: "/bin",
        BANANA_INSTALL_DIR: "C:\\Tools\\Banana\\.banana-update-42",
        BANANA_SKIP_PATH_UPDATE: "1",
      },
      stdout: "inherit",
      stderr: "inherit",
    });
    expect(await (test.calls[0]?.[1].stdin as Blob).text()).toBe(
      "installer body",
    );
    expect(test.calls[1]?.[0].slice(0, 3)).toEqual([
      "powershell.exe",
      "-NoProfile",
      "-Command",
    ]);
    expect(test.calls[1]?.[0][3]).toContain(
      "Wait-Process -Id 42 -ErrorAction SilentlyContinue",
    );
    expect(test.calls[1]?.[0][3]).toContain(
      "Move-Item -LiteralPath 'C:\\Tools\\Banana\\.banana-update-42\\banana.exe'",
    );
    expect(test.calls[1]?.[1]).toMatchObject({
      detached: true,
      env: { PATH: "/bin" },
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
    });
    expect(test.unrefs()).toBe(1);
  });

  it("reports download and installer failures", async () => {
    const download = updater({
      fetch: async () => new Response(null, { status: 503 }),
    });
    await expect(updateCli(download.runtime)).rejects.toThrow(
      "Could not download the Banana updater (503).",
    );
    expect(download.calls).toEqual([]);

    const install = updater({
      spawn: () => ({
        exited: Promise.resolve(1),
        unref: () => {},
      }),
    });
    await expect(updateCli(install.runtime)).rejects.toThrow(
      "Banana update failed.",
    );
  });
});
