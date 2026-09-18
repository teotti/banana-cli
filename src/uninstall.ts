import { rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, win32 } from "node:path";
import { supportsColor } from "./help";
import { note } from "./render";
import { agentTargets, type SkillRuntime } from "./skill";
import { CliFailure, type Environment } from "./types";

const PACKAGE = "@bananasplitapp/cli";
const INDENT = "  ";

type UninstallProcess = {
  exited: Promise<number>;
  unref: () => void;
};

type UninstallSpawn = (
  command: string[],
  options: {
    detached?: boolean;
    env?: Environment;
    stdin?: "ignore" | "inherit";
    stdout?: "ignore" | "inherit";
    stderr?: "ignore" | "inherit";
  },
) => UninstallProcess;

export type UninstallRuntime = {
  color: boolean;
  /** Asks the question on a TTY; absent on a pipe, where --yes is the only yes. */
  confirm?: (question: string) => Promise<boolean>;
  env: Environment;
  execPath: string;
  /** Revokes and deletes the stored credential, returning what it did. */
  logout: () => Promise<string | undefined>;
  isStandalone: boolean;
  pid: number;
  platform: string;
  remove: (path: string) => Promise<void>;
  /** Where an installed skill was found, to name rather than remove. */
  skills: () => Promise<string[]>;
  spawn: UninstallSpawn;
};

export function defaultUninstallRuntime(): Omit<UninstallRuntime, "logout"> {
  return {
    color: supportsColor(),
    confirm: process.stdin.isTTY ? ask : undefined,
    env: process.env,
    execPath: process.execPath,
    isStandalone: Bun.isStandaloneExecutable,
    pid: process.pid,
    platform: process.platform,
    remove: async (path) => {
      await rm(path, { force: true });
    },
    skills: async () => {
      const runtime = skillRuntime();
      const targets = await agentTargets(runtime);
      const found = await Promise.all(
        targets.map(async (target) =>
          (await Bun.file(target.path).exists()) ? target.path : undefined,
        ),
      );
      return found.filter((path): path is string => path !== undefined);
    },
    spawn: (command, options) => Bun.spawn(command, options),
  };
}

/** The skill installer's own runtime, for reading where skills landed. */
function skillRuntime(): SkillRuntime {
  return {
    color: false,
    env: process.env,
    exists: async (path) => {
      try {
        return (await stat(path)).isDirectory();
      } catch {
        return false;
      }
    },
    home: homedir(),
    read: async (path) => {
      const file = Bun.file(path);
      return (await file.exists()) ? file.text() : undefined;
    },
    remove: async () => {},
    write: async () => {},
  };
}

async function ask(question: string) {
  process.stdout.write(question);
  for await (const line of console) {
    return /^y(es)?$/i.test(line.trim());
  }
  return false;
}

function short(path: string, env: Environment) {
  const home = env.HOME ?? env.USERPROFILE;
  return home && path.startsWith(`${home}/`)
    ? `~${path.slice(home.length)}`
    : path;
}

/**
 * What the command is about to do, before it does any of it. A package install
 * is uninstalled by its package manager; only a standalone binary is a file to
 * delete, and on Windows it cannot delete itself while it is running.
 */
function plan(runtime: UninstallRuntime) {
  return runtime.isStandalone
    ? { kind: "binary" as const, target: runtime.execPath }
    : { kind: "package" as const, target: PACKAGE };
}

export async function uninstallCli(
  command: { yes: boolean },
  overrides: Partial<UninstallRuntime> & Pick<UninstallRuntime, "logout">,
): Promise<string> {
  const runtime = {
    ...defaultUninstallRuntime(),
    ...overrides,
  } as UninstallRuntime;
  const step = plan(runtime);
  const skills = await runtime.skills();

  const removing = [
    step.kind === "binary"
      ? short(step.target, runtime.env)
      : `the ${PACKAGE} package`,
    "your stored login, revoked and then deleted",
  ];
  const keeping = [
    ...(skills.length
      ? [
          `the banana skill in ${skills
            .map((path) => short(dirname(dirname(path)), runtime.env))
            .join(", ")} — banana skill uninstall removes it`,
        ]
      : []),
    ...(runtime.platform === "win32"
      ? [`${short(win32.dirname(runtime.execPath), runtime.env)} on your Path`]
      : []),
  ];

  const preview = [
    "This will remove:",
    ...removing.map((line) => `${INDENT}${line}`),
    ...(keeping.length
      ? [
          "",
          note("Leaving alone:", runtime.color),
          ...keeping.map((line) => `${INDENT}${note(line, runtime.color)}`),
        ]
      : []),
  ].join("\n");

  if (!command.yes) {
    // Nothing is deleted by a command that could not ask. A pipe, a CI job or
    // an agent gets the plan and the flag that means it.
    if (!runtime.confirm) {
      throw new CliFailure(
        "usage",
        `${preview}\n\nRe-run with --yes to uninstall without being asked.`,
      );
    }
    if (!(await runtime.confirm(`${preview}\n\nContinue? [y/N] `))) {
      return "Left banana where it is.";
    }
  }

  // The login goes first: revoking needs the network and can fail, and it is
  // better to keep a working CLI than to strand a live credential with no
  // command left to revoke it.
  const loggedOut = await runtime.logout();

  const done: string[] = [];
  if (step.kind === "package") {
    const child = runtime.spawn(
      [runtime.execPath, "remove", "--global", PACKAGE],
      { env: runtime.env, stdout: "ignore", stderr: "inherit" },
    );
    if ((await child.exited) !== 0) {
      throw new CliFailure("config", `Could not remove the ${PACKAGE} package.`);
    }
    done.push(`Removed the ${PACKAGE} package.`);
  } else if (runtime.platform === "win32") {
    // A running .exe cannot delete itself, so hand the job to a process that
    // outlives this one — the same wait-then-act shape `upgrade` uses.
    const child = runtime.spawn(
      [
        "powershell.exe",
        "-NoProfile",
        "-Command",
        [
          `Wait-Process -Id ${runtime.pid} -ErrorAction SilentlyContinue`,
          `Remove-Item -LiteralPath '${runtime.execPath.replaceAll("'", "''")}' -Force`,
        ].join("\n"),
      ],
      { detached: true, env: runtime.env, stdin: "ignore", stdout: "ignore", stderr: "ignore" },
    );
    child.unref();
    done.push("Banana will finish uninstalling after this command exits.");
  } else {
    try {
      await runtime.remove(step.target);
    } catch (error) {
      throw new CliFailure(
        "config",
        `Could not remove ${step.target}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    done.push(`Removed ${short(step.target, runtime.env)}.`);
  }

  return [
    ...done,
    ...(loggedOut ? [loggedOut] : []),
    ...(keeping.length
      ? [note(`Left alone: ${keeping.join("; ")}`, runtime.color)]
      : []),
  ].join("\n");
}
