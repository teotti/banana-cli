import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { version as CLI_VERSION } from "../package.json";
import { readApiUrl } from "./auth";
import { GREEN, RED, RESET, YELLOW } from "./colors";
import { supportsColor } from "./help";
import { note } from "./render";
import { agentTargets, SKILL_TEXT, type SkillRuntime } from "./skill";
import { CliFailure, type Environment } from "./types";

const INDENT = "  ";

/** `ok` needs nothing, `warn` is usable with a caveat, `fail` is broken. */
export type Status = "ok" | "warn" | "fail";

export type Check = {
  name: string;
  status: Status;
  detail: string;
  /** What to run about it, when there is something to run. */
  fix?: string;
};

export type DoctorRuntime = {
  color: boolean;
  env: Environment;
  execPath: string;
  isStandalone: boolean;
  /** Resolves a command on PATH the way the shell would, or undefined. */
  which: (command: string) => Promise<string | undefined>;
  /** The signed-in user's name, or undefined when not signed in. */
  whoami: () => Promise<string | undefined>;
  /** Reads an installed skill, for comparing against the bundled one. */
  readSkill: (path: string) => Promise<string | undefined>;
  skillTargets: () => Promise<Array<{ label: string; path: string }>>;
};

export function defaultDoctorRuntime(): Omit<DoctorRuntime, "whoami"> {
  return {
    color: supportsColor(),
    env: process.env,
    execPath: process.execPath,
    isStandalone: Bun.isStandaloneExecutable,
    which: async (command) => Bun.which(command) ?? undefined,
    readSkill: async (path) => {
      const file = Bun.file(path);
      return (await file.exists()) ? file.text() : undefined;
    },
    skillTargets: async () => {
      const runtime: SkillRuntime = {
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
        read: async () => undefined,
        remove: async () => {},
        write: async () => {},
      };
      return (await agentTargets(runtime)).map(({ label, path }) => ({
        label,
        path,
      }));
    },
  };
}

/**
 * Which `banana` the shell runs. An install that landed somewhere not on PATH,
 * or behind an older copy, is the failure the installer warns about and the
 * one a user is least able to see: every command they type is the other one.
 */
async function checkPath(runtime: DoctorRuntime): Promise<Check> {
  if (!runtime.isStandalone) {
    return {
      name: "Install",
      status: "ok",
      detail: "run through a package manager, not a standalone binary",
    };
  }
  const found = await runtime.which("banana");
  if (found === undefined) {
    return {
      name: "PATH",
      status: "warn",
      detail: `${runtime.execPath} is not on PATH, so \`banana\` runs nothing`,
      fix: "add its directory to PATH in your shell profile",
    };
  }
  if (found !== runtime.execPath) {
    return {
      name: "PATH",
      status: "warn",
      detail: `\`banana\` runs ${found}, not this ${runtime.execPath}`,
      fix: "remove the other copy, or put this one earlier on PATH",
    };
  }
  return { name: "PATH", status: "ok", detail: found };
}

/**
 * Asking who you are exercises the credential store, the token and the network
 * at once, so the failure has to say which of them gave way: a missing login is
 * a warning you fix by logging in, while an unreachable API is not your doing.
 */
async function checkLogin(runtime: DoctorRuntime): Promise<Check> {
  try {
    const who = await runtime.whoami();
    return who === undefined
      ? {
          name: "Login",
          status: "warn",
          detail: "not signed in",
          fix: "banana login",
        }
      : { name: "Login", status: "ok", detail: `signed in as ${who}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const kind = error instanceof CliFailure ? error.type : "network";
    return kind === "config"
      ? { name: "Login", status: "warn", detail: message, fix: "banana login" }
      : { name: "Login", status: "fail", detail: message };
  }
}

/**
 * The skill is embedded in the binary, so an upgrade leaves every installed
 * copy behind. Nothing else would tell you: a stale skill still loads, and
 * still describes the CLI you no longer have.
 */
async function checkSkill(runtime: DoctorRuntime): Promise<Check> {
  const targets = await runtime.skillTargets();
  const installed: string[] = [];
  const stale: string[] = [];
  for (const target of targets) {
    const contents = await runtime.readSkill(target.path);
    if (contents === undefined) continue;
    (contents === SKILL_TEXT ? installed : stale).push(target.label);
  }
  if (stale.length) {
    return {
      name: "Skill",
      status: "warn",
      detail: `out of date for ${stale.join(", ")}${
        installed.length ? `, current for ${installed.join(", ")}` : ""
      }`,
      fix: "banana skill install --force",
    };
  }
  if (installed.length === 0) {
    return {
      name: "Skill",
      status: "warn",
      detail: "not installed for any agent on this machine",
      fix: "banana skill install",
    };
  }
  return {
    name: "Skill",
    status: "ok",
    detail: `current for ${installed.join(", ")}`,
  };
}

export async function collectChecks(runtime: DoctorRuntime): Promise<Check[]> {
  const apiUrl = readApiUrl(runtime.env.BANANASPLIT_API_URL);
  return [
    {
      name: "Version",
      status: "ok",
      detail: `${CLI_VERSION}${
        runtime.isStandalone ? " (standalone binary)" : " (package install)"
      }`,
    },
    await checkPath(runtime),
    {
      name: "API",
      status: "ok",
      detail:
        runtime.env.BANANASPLIT_API_URL
          ? `${apiUrl.origin} (set by BANANASPLIT_API_URL, not the default)`
          : apiUrl.origin,
    },
    await checkLogin(runtime),
    await checkSkill(runtime),
  ];
}

/** The worst of the checks, which is what the run as a whole amounts to. */
export function overall(checks: Check[]): Status {
  if (checks.some((check) => check.status === "fail")) return "fail";
  return checks.some((check) => check.status === "warn") ? "warn" : "ok";
}

const MARK: Record<Status, string> = { ok: "ok", warn: "warn", fail: "fail" };
const COLOR: Record<Status, string> = { ok: GREEN, warn: YELLOW, fail: RED };

function paint(status: Status, color: boolean) {
  return color ? `${COLOR[status]}${MARK[status]}${RESET}` : MARK[status];
}

export function formatChecks(checks: Check[], color: boolean) {
  const width = Math.max(...checks.map((check) => check.name.length));
  const mark = Math.max(...checks.map((check) => MARK[check.status].length));
  const lines = checks.map((check) => {
    const head =
      `${INDENT}${check.name.padEnd(width)}  ` +
      `${paint(check.status, color).padEnd(
        mark + (color ? COLOR[check.status].length + RESET.length : 0),
      )}  ${check.detail}`;
    return check.fix === undefined
      ? head
      : `${head}\n${INDENT}${" ".repeat(width + mark + 4)}${note(
          `→ ${check.fix}`,
          color,
        )}`;
  });
  const worst = overall(checks);
  return [
    worst === "ok"
      ? "Everything checks out."
      : worst === "warn"
        ? "Mostly fine, with something worth a look."
        : "Something is broken.",
    ...lines,
  ].join("\n");
}

export async function runDoctor(
  overrides: Partial<DoctorRuntime> & Pick<DoctorRuntime, "whoami">,
): Promise<{ checks: Check[]; failed: boolean }> {
  const runtime = {
    ...defaultDoctorRuntime(),
    ...overrides,
  } as DoctorRuntime;
  const checks = await collectChecks(runtime);
  return { checks, failed: overall(checks) === "fail" };
}
