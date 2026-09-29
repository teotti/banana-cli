import { dirname, win32 } from "node:path";
import { version as CLI_VERSION } from "../package.json";
import { BOLD, RESET, YELLOW } from "./colors";
import { supportsColor } from "./help";
import { note } from "./render";
import { CliFailure, type Environment, type Fetch } from "./types";

const PACKAGE = "@bananasplitapp/cli";
const RELEASE_BASE =
  "https://github.com/teotti/banana-cli/releases/latest/download/";
const LATEST_RELEASE = "https://github.com/teotti/banana-cli/releases/latest";
const INDENT = "  ";
const TAG =
  /\/releases\/tag\/v((?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))$/;

type UpdateProcess = {
  exited: Promise<number>;
  unref: () => void;
};

type UpdateSpawn = (
  command: string[],
  options: {
    detached?: boolean;
    env?: Environment;
    stdin?: Blob | "ignore" | "inherit";
    stdout?: "ignore" | "inherit";
    stderr?: "ignore" | "inherit";
  },
) => UpdateProcess;

export type UpdateRuntime = {
  color: boolean;
  env: Environment;
  execPath: string;
  fetch: Fetch;
  isStandalone: boolean;
  pid: number;
  platform: string;
  spawn: UpdateSpawn;
};

function defaultRuntime(): UpdateRuntime {
  return {
    color: supportsColor(),
    env: process.env,
    execPath: process.execPath,
    fetch: globalThis.fetch,
    isStandalone: Bun.isStandaloneExecutable,
    pid: process.pid,
    platform: process.platform,
    spawn: (command, options) => Bun.spawn(command, options),
  };
}

async function installer(url: string, fetch: Fetch) {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new CliFailure("network", "Could not download the Banana updater.");
  }
  if (!response.ok) {
    throw new CliFailure(
      "network",
      `Could not download the Banana updater (${response.status}).`,
    );
  }
  return response.text();
}

async function waitForUpdate(process: UpdateProcess) {
  if ((await process.exited) !== 0) {
    throw new CliFailure("network", "Banana update failed.");
  }
}

/**
 * The version the installer just laid down. `/releases/latest` redirects to
 * the tagged release, so the `Location` header names it without downloading a
 * page — and the npm package is published from the same tag, so this is also
 * the version `bun update` fetched. A lookup that fails leaves the version out
 * of the message rather than failing an update that already succeeded.
 */
async function latestVersion(fetch: Fetch) {
  let response: Response;
  try {
    response = await fetch(LATEST_RELEASE, { redirect: "manual" });
  } catch {
    return undefined;
  }
  const target = response.headers.get("location") ?? response.url;
  return TAG.exec(target)?.[1];
}

/** The version just installed, in the brand accent. */
function accent(version: string, color: boolean) {
  return color ? `${BOLD}${YELLOW}v${version}${RESET}` : `v${version}`;
}

/**
 * The sentence, then the versions indented under it: the new one in the banana
 * accent, the one it replaced dimmed behind the arrow. The installer's own
 * output is silenced so this is the whole of what `banana update` says.
 */
function updated(installed: string | undefined, color: boolean) {
  if (installed === undefined) return "Banana is now up to date.";
  if (installed === CLI_VERSION) {
    return `Banana is already up to date.\n${INDENT}${accent(installed, color)}`;
  }
  return [
    "Banana is now up to date.",
    `${INDENT}${note(`v${CLI_VERSION} →`, color)} ${accent(installed, color)}`,
  ].join("\n");
}

/** Windows swaps the binary after this process exits, so nothing is installed yet. */
function pending(installed: string | undefined, color: boolean) {
  const version =
    installed === undefined ? "Banana" : `Banana ${accent(installed, color)}`;
  return `${version} will finish updating after this command exits.`;
}

function powerShellQuote(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

export async function updateCli(
  overrides: Partial<UpdateRuntime> = {},
): Promise<string> {
  const runtime = { ...defaultRuntime(), ...overrides };

  if (!runtime.isStandalone) {
    await waitForUpdate(
      runtime.spawn(
        [
          runtime.execPath,
          "update",
          "--global",
          "--latest",
          PACKAGE,
        ],
        {
          env: runtime.env,
          stdout: "ignore",
          stderr: "inherit",
        },
      ),
    );
    return updated(await latestVersion(runtime.fetch), runtime.color);
  }

  if (
    runtime.platform !== "darwin" &&
    runtime.platform !== "linux" &&
    runtime.platform !== "win32"
  ) {
    throw new CliFailure(
      "config",
      `Updates are not supported on ${runtime.platform}.`,
    );
  }

  const script = await installer(
    `${RELEASE_BASE}${runtime.platform === "win32" ? "install.ps1" : "install.sh"}`,
    runtime.fetch,
  );
  if (runtime.platform === "win32") {
    const installDir = win32.dirname(runtime.execPath);
    const stagingDir = win32.join(
      installDir,
      `.banana-update-${runtime.pid}`,
    );
    await waitForUpdate(
      runtime.spawn(
        ["powershell.exe", "-NoProfile", "-Command", "-"],
        {
          env: {
            ...runtime.env,
            BANANA_INSTALL_DIR: stagingDir,
            BANANA_SKIP_PATH_UPDATE: "1",
          },
          stdin: new Blob([script]),
          stdout: "ignore",
          stderr: "inherit",
        },
      ),
    );

    const child = runtime.spawn(
      [
        "powershell.exe",
        "-NoProfile",
        "-Command",
        [
          "$ErrorActionPreference = 'Stop'",
          `Wait-Process -Id ${runtime.pid} -ErrorAction SilentlyContinue`,
          `Move-Item -LiteralPath ${powerShellQuote(
            win32.join(stagingDir, "banana.exe"),
          )} -Destination ${powerShellQuote(runtime.execPath)} -Force`,
          `Remove-Item -LiteralPath ${powerShellQuote(
            stagingDir,
          )} -Recurse -Force`,
        ].join("\n"),
      ],
      {
        detached: true,
        env: runtime.env,
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
      },
    );
    child.unref();
    return pending(await latestVersion(runtime.fetch), runtime.color);
  }

  await waitForUpdate(
    runtime.spawn(["sh"], {
      env: {
        ...runtime.env,
        BANANA_INSTALL_DIR: dirname(runtime.execPath),
      },
      stdin: new Blob([script]),
      stdout: "ignore",
      stderr: "inherit",
    }),
  );
  return updated(await latestVersion(runtime.fetch), runtime.color);
}
