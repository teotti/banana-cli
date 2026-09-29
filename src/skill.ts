import { rm, rmdir, stat } from "node:fs/promises";
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
  usage: ["banana skill install [flags]", "banana skill uninstall [flags]"],
  commands: [
    ["install", "Write the skill into an agent's skills directory"],
    ["uninstall", "Remove the skill from an agent's skills directory"],
  ],
  examples: ["banana skill install", "banana skill uninstall --agent cursor"],
  learnMore: ["banana skill install --help", "banana skill uninstall --help"],
});

const UNINSTALL_HELP = helpText({
  summary: "Remove the banana skill from the agents that have it.",
  usage: ["banana skill uninstall [flags]"],
  options: [
    ["--agent NAME", `Uninstall for one agent; repeat for several (${AGENT_NAMES})`],
    ["--all", "Uninstall for every agent above, found or not"],
    ["--dir PATH", "Uninstall from a skills directory of your own"],
    ["--force", "Remove a skill that has been edited since it was installed"],
    ["--list", "Show the agents and where each one's skill goes"],
  ],
  notes: [
    "With no flags it removes the skill from every agent that has one, so one\ncommand undoes one `banana skill install`.",
    "A skill edited since it was installed is left alone unless --force, since\nthose edits exist nowhere else.",
    "An agent drops it on its next session, not the running one.",
  ],
  examples: [
    "banana skill uninstall",
    "banana skill uninstall --agent cursor",
    "banana skill uninstall --force",
  ],
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
  // One note is one paragraph; a sentence that wraps carries its own newline,
  // or the layout puts a blank line through the middle of it.
  notes: [
    "With no flags it installs for every agent whose home directory exists,\nso one command covers the agents you actually run.",
    "The skill lands at <skills>/banana/SKILL.md, and an agent picks it up on\nits next session, not the running one.",
    "`--print` is for anything else: an agent that keeps skills elsewhere, or\nin version control.",
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
  action: "install" | "uninstall";
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
  const isCommand = name === "install" || name === "uninstall";
  if (name === undefined || (wantsHelp(args) && !isCommand)) {
    return { kind: "help", text: ROOT_HELP };
  }
  if (!isCommand) {
    throw usageFailure(`Unknown command: skill ${name}`, ROOT_HELP);
  }
  const action = name;
  const HELP = action === "install" ? INSTALL_HELP : UNINSTALL_HELP;
  if (wantsHelp(rest)) return { kind: "help", text: HELP };
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
    HELP,
  );
  requirePositionals(positionals, 0, HELP);
  const dir = values.dir as string | undefined;
  const agents = values.agent as string[] | undefined;
  const all = values.all === true;

  if (dir !== undefined && dir.length === 0) {
    throw usageFailure("--dir needs a path", HELP);
  }
  if (dir !== undefined && (agents !== undefined || all)) {
    throw usageFailure(
      "--dir names a directory itself, so it cannot be combined with --agent or --all",
      HELP,
    );
  }
  if (agents !== undefined && all) {
    throw usageFailure("Choose only one of --agent or --all", HELP);
  }
  for (const agent of agents ?? []) {
    if (!AGENTS.some((known) => known.name === agent)) {
      throw usageFailure(
        `Unknown agent: ${agent}. Known agents are ${AGENT_NAMES}; --dir installs anywhere else.`,
        HELP,
      );
    }
  }

  if (action === "uninstall" && values.print === true) {
    throw usageFailure("--print writes the skill; it does not remove one", HELP);
  }

  return {
    kind: "skill",
    action,
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
  remove: (path: string) => Promise<void>;
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
    remove: async (path) => {
      await rm(path);
      // `install` created the `banana/` directory, so take it back when it is
      // empty. A directory the user put something else in stays.
      await rmdir(dirname(path)).catch(() => {});
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

type Outcome =
  | "installed"
  | "replaced"
  | "current"
  | "skipped"
  | "removed"
  | "absent";

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
  removed: "removed",
  absent: "not installed",
};

/**
 * An edited skill is the one copy of those edits, so `uninstall` leaves it
 * where `install` would: untouched, and named, until --force says otherwise.
 */
async function uninstallOne(
  path: string,
  force: boolean,
  runtime: SkillRuntime,
): Promise<Outcome> {
  const existing = await runtime.read(path);
  if (existing === undefined) return "absent";
  if (existing !== SKILL_TEXT && !force) return "skipped";
  try {
    await runtime.remove(path);
  } catch (error) {
    throw new CliFailure(
      "config",
      `Could not remove the skill at ${path}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return "removed";
}

function report(
  rows: Array<{ label: string; outcome: Outcome; path: string }>,
  runtime: SkillRuntime,
  action: "install" | "uninstall" = "install",
) {
  const removing = action === "uninstall";
  const width = Math.max(...rows.map((row) => row.label.length));
  const label = (outcome: Outcome) =>
    outcome === "skipped" && removing
      ? "edited — --force removes it"
      : OUTCOMES[outcome];
  const lines = rows.map(
    (row) =>
      `${INDENT}${row.label.padEnd(width)}  ${label(row.outcome)}\n` +
      `${INDENT}${" ".repeat(width)}  ${note(short(row.path, runtime.home), runtime.color)}`,
  );
  const changed = rows.some((row) =>
    removing
      ? row.outcome === "removed"
      : row.outcome === "installed" || row.outcome === "replaced",
  );
  const skipped = rows.some((row) => row.outcome === "skipped");
  const headline = removing
    ? changed
      ? "Removed the banana skill."
      : skipped
        ? "The banana skill was left alone, having been edited."
        : "The banana skill is not installed."
    : changed
      ? "Installed the banana skill."
      : skipped
        ? "The banana skill is already installed, and an edited copy was left alone."
        : "The banana skill is already installed.";
  return [
    headline,
    ...lines,
    ...(changed
      ? [
          note(
            removing
              ? "Agents drop it on their next session."
              : "Agents pick it up on their next session.",
            runtime.color,
          ),
        ]
      : []),
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
  command: Pick<
    SkillCommand,
    "agents" | "all" | "dir" | "force" | "list"
  > & { action?: SkillCommand["action"] },
  overrides: Partial<SkillRuntime> = {},
): Promise<string> {
  const runtime = { ...defaultRuntime(), ...overrides };
  if (command.list) return listAgents(runtime);
  if (command.action === "uninstall") return uninstallSkill(command, runtime);

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

/**
 * The mirror of `installSkill`. With no flags it works from where a skill
 * actually is rather than which agents are installed: the point is to undo an
 * install, including for an agent since removed from the machine.
 */
async function uninstallSkill(
  command: Pick<SkillCommand, "agents" | "all" | "dir" | "force">,
  runtime: SkillRuntime,
): Promise<string> {
  if (command.dir !== undefined) {
    const path = skillPath(expand(command.dir, runtime.home));
    const outcome = await uninstallOne(path, command.force, runtime);
    if (outcome === "skipped") {
      throw new CliFailure(
        "config",
        `The banana skill at ${path} has been edited. Re-run with --force to remove it.`,
      );
    }
    return report([{ label: "Skill", outcome, path }], runtime, "uninstall");
  }

  const targets = await agentTargets(runtime);
  const present = await Promise.all(
    targets.map(async (target) => (await runtime.read(target.path)) !== undefined),
  );
  const chosen = command.agents
    ? targets.filter((target) => command.agents?.includes(target.name))
    : command.all
      ? targets
      : targets.filter((_, index) => present[index]);

  if (chosen.length === 0) {
    throw new CliFailure(
      "config",
      `No banana skill found for ${AGENT_NAMES}. Use --agent to name one anyway, or --dir for a skills directory of your own.`,
    );
  }

  const rows = [];
  for (const target of chosen) {
    rows.push({
      label: target.label,
      outcome: await uninstallOne(target.path, command.force, runtime),
      path: target.path,
    });
  }
  if (rows.every((row) => row.outcome === "skipped")) {
    throw new CliFailure(
      "config",
      `The banana skill at ${rows
        .map((row) => row.path)
        .join(", ")} has been edited. Re-run with --force to remove it.`,
    );
  }
  return report(rows, runtime, "uninstall");
}
