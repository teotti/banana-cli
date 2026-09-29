import { describe, expect, it } from "bun:test";
import { version as CLI_VERSION } from "../package.json";
import { updateCli, type UpdateRuntime } from "../src/update";

const LATEST = "https://github.com/teotti/banana-cli/releases/latest";

/** What GitHub answers for `/releases/latest`: a redirect to the tag. */
function redirect(version: string) {
  return new Response(null, {
    status: 302,
    headers: { location: `${LATEST.replace("/latest", "")}/tag/v${version}` },
  });
}

function updater(overrides: Partial<UpdateRuntime> = {}) {
  const calls: Parameters<UpdateRuntime["spawn"]>[] = [];
  let unrefs = 0;
  const runtime: UpdateRuntime = {
    color: false,
    env: { PATH: "/bin" },
    execPath: "/opt/banana/bin/banana",
    fetch: async (input) =>
      String(input) === LATEST
        ? redirect("9.9.9")
        : new Response("installer body"),
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

    expect(await updateCli(test.runtime)).toBe(
      `Banana is now up to date.\n  v${CLI_VERSION} → v9.9.9`,
    );
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
          stdout: "ignore",
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
        return String(input) === LATEST
          ? redirect("9.9.9")
          : new Response("#!/bin/sh\necho updated");
      },
    });

    expect(await updateCli(test.runtime)).toBe(
      `Banana is now up to date.\n  v${CLI_VERSION} → v9.9.9`,
    );
    expect(urls).toEqual([
      "https://github.com/teotti/banana-cli/releases/latest/download/install.sh",
      LATEST,
    ]);
    expect(test.calls[0]?.[0]).toEqual(["sh"]);
    expect(test.calls[0]?.[1]).toMatchObject({
      env: { PATH: "/bin", BANANA_INSTALL_DIR: "/opt/banana/bin" },
      stdout: "ignore",
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
      "Banana v9.9.9 will finish updating after this command exits.",
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
      stdout: "ignore",
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

  it("names the installed version in the banana accent when colour is on", async () => {
    const test = updater({ color: true });

    expect(await updateCli(test.runtime)).toBe(
      `Banana is now up to date.\n  \x1b[2mv${CLI_VERSION} →\x1b[0m` +
        " \x1b[1m\x1b[38;2;190;148;0mv9.9.9\x1b[0m",
    );
  });

  it("says so when the installed version is the one already running", async () => {
    const test = updater({
      fetch: async (input) =>
        String(input) === LATEST
          ? redirect(CLI_VERSION)
          : new Response("installer body"),
    });

    expect(await updateCli(test.runtime)).toBe(
      `Banana is already up to date.\n  v${CLI_VERSION}`,
    );
  });

  it("still reports success when the version lookup fails", async () => {
    const test = updater({
      fetch: async (input) => {
        if (String(input) === LATEST) throw new Error("offline");
        return new Response("installer body");
      },
    });

    expect(await updateCli(test.runtime)).toBe("Banana is now up to date.");
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
