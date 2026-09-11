import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import SKILL from "../skills/banana/SKILL.md" with { type: "text" };
import { helpText, supportsColor } from "./help";
import { note } from "./render";
import { parseOptions, requirePositionals, usageFailure, wantsHelp } from "./shared";
import { CliFailure, type Environment } from "./types";

const INDENT = "  ";

export const SKILL_TEXT = SKILL;

const ROOT_HELP = helpText({
  summary: "Install the banana agent skill, so an agent can drive this CLI.",
  usage: ["banana skill install [flags]"],
  commands: [["install", "Write the skill into an agent's skills directory"]],
  examples: ["banana skill install", "banana skill install --print"],
  learnMore: ["banana skill install --help"],
});

const INSTALL_HELP = helpText({
  summary: "Write the banana skill into an agent's skills directory.",
  usage: ["banana skill install [flags]"],
  options: [
    ["--dir PATH", "Skills directory (default: ~/.claude/skills)"],
    ["--force", "Replace a skill that is already there and differs"],
    ["--print", "Write the skill to stdout instead of installing it"],
  ],
  notes: [
    "The skill lands at <dir>/banana/SKILL.md. `--print` is for agents whose",
    "skills live somewhere else, or in version control: redirect it yourself.",
    "An agent picks the skill up on its next session, not the running one.",
  ],
  examples: [
    "banana skill install",
    "banana skill install --dir ~/.config/agent/skills",
    "banana skill install --print > SKILL.md",
  ],
});

export type SkillCommand = {
  kind: "skill";
  dir?: string;
  force: boolean;
  print: boolean;
};

export function parseSkill(args: string[]): SkillCommand | { kind: "help"; text: string } {
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
      dir: { type: "string" },
      force: { type: "boolean" },
      print: { type: "boolean" },
    },
    INSTALL_HELP,
  );
  requirePositionals(positionals, 0, INSTALL_HELP);
  const dir = values.dir as string | undefined;
  if (dir !== undefined && dir.length === 0) {
    throw usageFailure("--dir needs a path", INSTALL_HELP);
  }
  return {
    kind: "skill",
    dir,
    force: values.force === true,
    print: values.print === true,
  };
}

export type SkillRuntime = {
  color: boolean;
  env: Environment;
  home: string;
  read: (path: string) => Promise<string | undefined>;
  write: (path: string, contents: string) => Promise<void>;
};

function defaultRuntime(): SkillRuntime {
  return {
    color: supportsColor(),
    env: process.env,
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

/**
 * Where a skill goes: the flag, else the agent's configured home
 * (`CLAUDE_CONFIG_DIR`), else `~/.claude/skills`.
 */
export function skillsDirectory(dir: string | undefined, runtime: SkillRuntime) {
  if (dir !== undefined) return expand(dir, runtime.home);
  const configured = runtime.env.CLAUDE_CONFIG_DIR;
  if (configured) return join(expand(configured, runtime.home), "skills");
  return join(runtime.home, ".claude", "skills");
}

export async function installSkill(
  command: Pick<SkillCommand, "dir" | "force">,
  overrides: Partial<SkillRuntime> = {},
): Promise<string> {
  const runtime = { ...defaultRuntime(), ...overrides };
  const path = join(skillsDirectory(command.dir, runtime), "banana", "SKILL.md");
  const existing = await runtime.read(path);

  if (existing === SKILL_TEXT) {
    return [
      "The banana skill is already installed.",
      `${INDENT}${note(path, runtime.color)}`,
    ].join("\n");
  }
  if (existing !== undefined && !command.force) {
    throw new CliFailure(
      "config",
      `A different banana skill is already at ${path}. Re-run with --force to replace it.`,
    );
  }

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

  return [
    existing === undefined
      ? "Installed the banana skill."
      : "Replaced the banana skill.",
    `${INDENT}${note(path, runtime.color)}`,
    note("Agents pick it up on their next session.", runtime.color),
  ].join("\n");
}
