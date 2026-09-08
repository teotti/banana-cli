import { dirname, win32 } from "node:path";
import { CliFailure, type Environment, type Fetch } from "./types";

const PACKAGE = "@bananasplitapp/cli";
const RELEASE_BASE =
  "https://github.com/teotti/banana-cli/releases/latest/download/";

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
  return "Banana is up to date.";
}

function powerShellQuote(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

export async function updateCli(
  overrides: Partial<UpdateRuntime> = {},
): Promise<string> {
  const runtime = { ...defaultRuntime(), ...overrides };

  if (!runtime.isStandalone) {
    return waitForUpdate(
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
          stdout: "inherit",
          stderr: "inherit",
        },
      ),
    );
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
          stdout: "inherit",
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
    return "Banana update started; it will finish after this command exits.";
  }

  return waitForUpdate(
    runtime.spawn(["sh"], {
      env: {
        ...runtime.env,
        BANANA_INSTALL_DIR: dirname(runtime.execPath),
      },
      stdin: new Blob([script]),
      stdout: "inherit",
      stderr: "inherit",
    }),
  );
}
