import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import SKILL from "../skills/banana/SKILL.md" with { type: "text" };
import { helpText, supportsColor } from "./help";
import { note } from "./render";
import { parseOptions, requirePositionals, usageFailure, wantsHelp } from "./shared";
import { CliFailure, type Environment } from "./types";

const INDENT = "  ";

export const SKILL_TEXT = SKILL;

/**
 * Every agent here reads the same `<skills>/<name>/SKILL.md` layout, so one
 * file serves all of them and only the directory changes. `env` is the
 * variable that agent uses to move its home; the fallback is `~/<home>`.
 */
export const AGENTS = [
  { name: "claude", label: "Claude Code", home: ".claude", env: "CLAUDE_CONFIG_DIR" },
  { name: "codex", label: "Codex", home: ".codex", env: "CODEX_HOME" },
  { name: "cursor", label: "Cursor", home: ".cursor" },
  { name: "gemini", label: "Gemini CLI", home: ".gemini" },
  { name: "opencode", label: "opencode", home: ".config/opencode" },
] as const satisfies ReadonlyArray<{
  name: string;
  label: string;
  home: string;
  env?: string;
}>;

export type Agent = (typeof AGENTS)[number];

const AGENT_NAMES = AGENTS.map((agent) => agent.name).join(", ");

const ROOT_HELP = helpText({
  summary: "Install the banana agent skill, so an agent can drive this CLI.",
  usage: ["banana skill install [flags]"],
  commands: [["install", "Write the skill into an agent's skills directory"]],
  examples: ["banana skill install", "banana skill install --agent cursor"],
  learnMore: ["banana skill install --help"],
});

const INSTALL_HELP = helpText({
  summary: "Write the banana skill into the skills directory of every agent you use.",
  usage: ["banana skill install [flags]"],
  options: [
    ["--agent NAME", `Install for one agent; repeat for several (${AGENT_NAMES})`],
    ["--all", "Install for every agent above, found or not"],
    ["--dir PATH", "Install into a skills directory of your own"],
    ["--force", "Replace a skill that is already there and differs"],
    ["--list", "Show the agents and where each one's skill goes"],
    ["--print", "Write the skill to stdout instead of installing it"],
  ],
  notes: [
    "With no flags it installs for every agent whose home directory exists,",
    "so one command covers the agents you actually run.",
    "The skill lands at <skills>/banana/SKILL.md, and an agent picks it up on",
    "its next session, not the running one.",
    "`--print` is for anything else: an agent that keeps skills elsewhere, or",
    "in version control.",
  ],
  examples: [
    "banana skill install",
    "banana skill install --agent claude --agent cursor",
    "banana skill install --dir ~/.config/agent/skills",
    "banana skill install --print > .agent/skills/banana/SKILL.md",
  ],
});

export type SkillCommand = {
  kind: "skill";
  agents?: string[];
  all: boolean;
  dir?: string;
  force: boolean;
  list: boolean;
  print: boolean;
};

export function parseSkill(
  args: string[],
): SkillCommand | { kind: "help"; text: string } {
  const [name, ...rest] = args;
  if (name === undefined || (wantsHelp(args) && name !== "install")) {
    return { kind: "help", text: ROOT_HELP };
  }
  if (name !== "install") {
    throw usageFailure(`Unknown command: skill ${name}`, ROOT_HELP);
  }
  if (wantsHelp(rest)) return { kind: "help", text: INSTALL_HELP };
  const { values, positionals } = parseOptions(
    rest,
    {
      agent: { type: "string", multiple: true },
      all: { type: "boolean" },
      dir: { type: "string" },
      force: { type: "boolean" },
      list: { type: "boolean" },
      print: { type: "boolean" },
    },
    INSTALL_HELP,
  );
  requirePositionals(positionals, 0, INSTALL_HELP);
  const dir = values.dir as string | undefined;
  const agents = values.agent as string[] | undefined;
  const all = values.all === true;

  if (dir !== undefined && dir.length === 0) {
    throw usageFailure("--dir needs a path", INSTALL_HELP);
  }
  if (dir !== undefined && (agents !== undefined || all)) {
    throw usageFailure(
      "--dir names a directory itself, so it cannot be combined with --agent or --all",
      INSTALL_HELP,
    );
  }
  if (agents !== undefined && all) {
    throw usageFailure("Choose only one of --agent or --all", INSTALL_HELP);
  }
  for (const agent of agents ?? []) {
    if (!AGENTS.some((known) => known.name === agent)) {
      throw usageFailure(
        `Unknown agent: ${agent}. Known agents are ${AGENT_NAMES}; --dir installs anywhere else.`,
        INSTALL_HELP,
      );
    }
  }

  return {
    kind: "skill",
    agents,
    all,
    dir,
    force: values.force === true,
    list: values.list === true,
    print: values.print === true,
  };
}

export type SkillRuntime = {
  color: boolean;
  env: Environment;
  exists: (path: string) => Promise<boolean>;
  home: string;
  read: (path: string) => Promise<string | undefined>;
  write: (path: string, contents: string) => Promise<void>;
};

function defaultRuntime(): SkillRuntime {
  return {
    color: supportsColor(),
    env: process.env,
    // A home is a directory, which Bun.file().exists() answers false for.
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
    write: async (path, contents) => {
      await Bun.write(path, contents, { createPath: true });
    },
  };
}

/** `~` is the shell's, not ours, so a quoted path still lands in the home directory. */
function expand(path: string, home: string) {
  if (path === "~") return home;
  if (path.startsWith("~/")) return join(home, path.slice(2));
  return resolve(path);
}

/** The reverse, for output: a path under home reads better as `~/…`. */
function short(path: string, home: string) {
  return path === home || path.startsWith(`${home}/`)
    ? `~${path.slice(home.length)}`
    : path;
}

/** Where one agent keeps its home directory, after its own variable has its say. */
export function agentHome(agent: Agent, runtime: SkillRuntime) {
  const configured = "env" in agent ? runtime.env[agent.env] : undefined;
  if (configured) return expand(configured, runtime.home);
  if (agent.name === "opencode" && runtime.env.XDG_CONFIG_HOME) {
    return join(expand(runtime.env.XDG_CONFIG_HOME, runtime.home), "opencode");
  }
  return join(runtime.home, ...agent.home.split("/"));
}

export function skillsDirectory(agent: Agent, runtime: SkillRuntime) {
  return join(agentHome(agent, runtime), "skills");
}

function skillPath(directory: string) {
  return join(directory, "banana", "SKILL.md");
}

export type AgentTarget = {
  label: string;
  name: string;
  found: boolean;
  path: string;
};

/** Every known agent, with whether its home directory is actually on this machine. */
export async function agentTargets(runtime: SkillRuntime): Promise<AgentTarget[]> {
  return Promise.all(
    AGENTS.map(async (agent) => ({
      label: agent.label,
      name: agent.name,
      found: await runtime.exists(agentHome(agent, runtime)),
      path: skillPath(skillsDirectory(agent, runtime)),
    })),
  );
}

type Outcome = "installed" | "replaced" | "current" | "skipped";

async function installOne(
  path: string,
  force: boolean,
  runtime: SkillRuntime,
): Promise<Outcome> {
  const existing = await runtime.read(path);
  if (existing === SKILL_TEXT) return "current";
  if (existing !== undefined && !force) return "skipped";
  try {
    await runtime.write(path, SKILL_TEXT);
  } catch (error) {
    throw new CliFailure(
      "config",
      `Could not write the skill to ${dirname(path)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return existing === undefined ? "installed" : "replaced";
}

const OUTCOMES: Record<Outcome, string> = {
  installed: "installed",
  replaced: "replaced",
  current: "up to date",
  skipped: "edited — --force replaces it",
};

function report(
  rows: Array<{ label: string; outcome: Outcome; path: string }>,
  runtime: SkillRuntime,
) {
  const width = Math.max(...rows.map((row) => row.label.length));
  const lines = rows.map(
    (row) =>
      `${INDENT}${row.label.padEnd(width)}  ${OUTCOMES[row.outcome]}\n` +
      `${INDENT}${" ".repeat(width)}  ${note(short(row.path, runtime.home), runtime.color)}`,
  );
  const wrote = rows.some(
    (row) => row.outcome === "installed" || row.outcome === "replaced",
  );
  const skipped = rows.some((row) => row.outcome === "skipped");
  return [
    wrote
      ? "Installed the banana skill."
      : skipped
        ? "The banana skill is already installed, and an edited copy was left alone."
        : "The banana skill is already installed.",
    ...lines,
    ...(wrote ? [note("Agents pick it up on their next session.", runtime.color)] : []),
  ].join("\n");
}

/** `--list`: what this machine looks like, before anything is written. */
export async function listAgents(runtime: SkillRuntime) {
  const targets = await agentTargets(runtime);
  const width = Math.max(...targets.map((target) => target.label.length));
  return [
    "Agents this CLI installs its skill for:",
    ...targets.map(
      (target) =>
        `${INDENT}${target.label.padEnd(width)}  ${
          target.found ? "found" : note("not found", runtime.color)
        }\n${INDENT}${" ".repeat(width)}  ${note(short(target.path, runtime.home), runtime.color)}`,
    ),
    note("--agent installs for one of these; --dir installs anywhere else.", runtime.color),
  ].join("\n");
}

export async function installSkill(
  command: Pick<SkillCommand, "agents" | "all" | "dir" | "force" | "list">,
  overrides: Partial<SkillRuntime> = {},
): Promise<string> {
  const runtime = { ...defaultRuntime(), ...overrides };
  if (command.list) return listAgents(runtime);

  if (command.dir !== undefined) {
    const path = skillPath(expand(command.dir, runtime.home));
    const outcome = await installOne(path, command.force, runtime);
    if (outcome === "skipped") {
      throw new CliFailure(
        "config",
        `A different banana skill is already at ${path}. Re-run with --force to replace it.`,
      );
    }
    return report([{ label: "Skill", outcome, path }], runtime);
  }

  const targets = await agentTargets(runtime);
  const chosen = command.agents
    ? targets.filter((target) => command.agents?.includes(target.name))
    : command.all
      ? targets
      : targets.filter((target) => target.found);

  // Nothing found means no agent we know keeps a home here, which --dir and
  // --print exist for; installing into a directory nothing reads would only
  // look like success.
  if (chosen.length === 0) {
    throw new CliFailure(
      "config",
      `No agent directory found for ${AGENT_NAMES}. Use --agent to install for one anyway, --dir for a skills directory of your own, or --print to write the skill yourself.`,
    );
  }

  const rows = [];
  for (const target of chosen) {
    rows.push({
      label: target.label,
      outcome: await installOne(target.path, command.force, runtime),
      path: target.path,
    });
  }
  if (rows.every((row) => row.outcome === "skipped")) {
    throw new CliFailure(
      "config",
      `A different banana skill is already at ${rows
        .map((row) => row.path)
        .join(", ")}. Re-run with --force to replace it.`,
    );
  }
  return report(rows, runtime);
}
