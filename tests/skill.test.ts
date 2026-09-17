import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import {
  agentTargets,
  installSkill,
  parseSkill,
  skillsDirectory,
  AGENTS,
  SKILL_TEXT,
  type SkillRuntime,
} from "../src/skill";
import { harness, lookup } from "./helpers";

const CLAUDE = "/home/user/.claude/skills/banana/SKILL.md";
const CURSOR = "/home/user/.cursor/skills/banana/SKILL.md";

const COMMAND = { all: false, force: false, list: false };

/**
 * An in-memory machine: `homes` are the agent directories that exist on it,
 * `files` the skills already installed. No test touches a real one.
 */
function machine(
  options: {
    files?: Record<string, string>;
    homes?: string[];
    overrides?: Partial<SkillRuntime>;
  } = {},
) {
  const written: Record<string, string> = { ...options.files };
  const homes = new Set(options.homes ?? []);
  const runtime: SkillRuntime = {
    color: false,
    env: {},
    exists: async (path) => homes.has(path),
    home: "/home/user",
    read: async (path) => written[path],
    write: async (path, contents) => {
      written[path] = contents;
    },
    ...options.overrides,
  };
  return { runtime, written };
}

describe("banana skill install", () => {
  it("installs for every agent whose home is on this machine", async () => {
    const test = machine({ homes: ["/home/user/.claude", "/home/user/.cursor"] });

    const message = await installSkill(COMMAND, test.runtime);

    expect(message).toBe(
      [
        "Installed the banana skill.",
        "  Claude Code  installed",
        "               ~/.claude/skills/banana/SKILL.md",
        "  Cursor       installed",
        "               ~/.cursor/skills/banana/SKILL.md",
        "Agents pick it up on their next session.",
      ].join("\n"),
    );
    expect(test.written[CLAUDE]).toBe(SKILL_TEXT);
    expect(test.written[CURSOR]).toBe(SKILL_TEXT);
  });

  it("leaves agents this machine does not run alone", async () => {
    const test = machine({ homes: ["/home/user/.codex"] });

    await installSkill(COMMAND, test.runtime);

    expect(Object.keys(test.written)).toEqual([
      "/home/user/.codex/skills/banana/SKILL.md",
    ]);
  });

  it("installs for a named agent that is not there yet", async () => {
    const test = machine({ homes: ["/home/user/.claude"] });

    await installSkill({ ...COMMAND, agents: ["cursor"] }, test.runtime);

    expect(Object.keys(test.written)).toEqual([CURSOR]);
  });

  it("--all covers every agent, found or not", async () => {
    const test = machine();

    await installSkill({ ...COMMAND, all: true }, test.runtime);

    expect(Object.keys(test.written).length).toBe(AGENTS.length);
  });

  it("says so rather than installing where nothing reads it", async () => {
    const test = machine();

    expect(installSkill(COMMAND, test.runtime)).rejects.toThrow(
      /No agent directory found for claude, codex, cursor, gemini, opencode/,
    );
    expect(test.written).toEqual({});
  });

  it("reports what was already up to date next to what it wrote", async () => {
    const test = machine({
      files: { [CLAUDE]: SKILL_TEXT },
      homes: ["/home/user/.claude", "/home/user/.cursor"],
    });

    expect(await installSkill(COMMAND, test.runtime)).toBe(
      [
        "Installed the banana skill.",
        "  Claude Code  up to date",
        "               ~/.claude/skills/banana/SKILL.md",
        "  Cursor       installed",
        "               ~/.cursor/skills/banana/SKILL.md",
        "Agents pick it up on their next session.",
      ].join("\n"),
    );
  });

  it("keeps quiet about a next session when it wrote nothing", async () => {
    const test = machine({
      files: { [CLAUDE]: SKILL_TEXT },
      homes: ["/home/user/.claude"],
    });

    expect(await installSkill(COMMAND, test.runtime)).toBe(
      [
        "The banana skill is already installed.",
        "  Claude Code  up to date",
        "               ~/.claude/skills/banana/SKILL.md",
      ].join("\n"),
    );
  });

  it("says so when it wrote nothing because a copy was edited", async () => {
    const test = machine({
      files: { [CLAUDE]: "hand-edited", [CURSOR]: SKILL_TEXT },
      homes: ["/home/user/.claude", "/home/user/.cursor"],
    });

    expect(await installSkill(COMMAND, test.runtime)).toBe(
      [
        "The banana skill is already installed, and an edited copy was left alone.",
        "  Claude Code  edited — --force replaces it",
        "               ~/.claude/skills/banana/SKILL.md",
        "  Cursor       up to date",
        "               ~/.cursor/skills/banana/SKILL.md",
      ].join("\n"),
    );
  });

  it("skips an edited skill without holding up the other agents", async () => {
    const test = machine({
      files: { [CLAUDE]: "hand-edited" },
      homes: ["/home/user/.claude", "/home/user/.cursor"],
    });

    expect(await installSkill(COMMAND, test.runtime)).toBe(
      [
        "Installed the banana skill.",
        "  Claude Code  edited — --force replaces it",
        "               ~/.claude/skills/banana/SKILL.md",
        "  Cursor       installed",
        "               ~/.cursor/skills/banana/SKILL.md",
        "Agents pick it up on their next session.",
      ].join("\n"),
    );
    expect(test.written[CLAUDE]).toBe("hand-edited");
    expect(test.written[CURSOR]).toBe(SKILL_TEXT);
  });

  it("fails when every agent's skill was edited", async () => {
    const test = machine({
      files: { [CLAUDE]: "hand-edited" },
      homes: ["/home/user/.claude"],
    });

    expect(installSkill(COMMAND, test.runtime)).rejects.toThrow(
      `A different banana skill is already at ${CLAUDE}. Re-run with --force to replace it.`,
    );
  });

  it("--force replaces an edited skill", async () => {
    const test = machine({
      files: { [CLAUDE]: "hand-edited" },
      homes: ["/home/user/.claude"],
    });

    expect(await installSkill({ ...COMMAND, force: true }, test.runtime)).toBe(
      [
        "Installed the banana skill.",
        "  Claude Code  replaced",
        "               ~/.claude/skills/banana/SKILL.md",
        "Agents pick it up on their next session.",
      ].join("\n"),
    );
    expect(test.written[CLAUDE]).toBe(SKILL_TEXT);
  });

  it("installs the skill the repo ships, frontmatter and all", async () => {
    const shipped = await Bun.file(
      new URL("../skills/banana/SKILL.md", import.meta.url),
    ).text();

    expect(SKILL_TEXT).toBe(shipped);
    expect(SKILL_TEXT.startsWith("---\nname: banana\n")).toBe(true);
  });

  describe("--dir", () => {
    it("installs into a directory of your own", async () => {
      const test = machine();

      expect(
        await installSkill({ ...COMMAND, dir: "~/elsewhere" }, test.runtime),
      ).toBe(
        [
          "Installed the banana skill.",
          "  Skill  installed",
          "         ~/elsewhere/banana/SKILL.md",
          "Agents pick it up on their next session.",
        ].join("\n"),
      );
      expect(test.written["/home/user/elsewhere/banana/SKILL.md"]).toBe(
        SKILL_TEXT,
      );
    });

    it("reports a directory it cannot write to as a config failure", async () => {
      const test = machine({
        overrides: {
          write: async () => {
            throw new Error("EACCES: permission denied");
          },
        },
      });

      expect(
        installSkill({ ...COMMAND, dir: "/etc/skills" }, test.runtime),
      ).rejects.toThrow(
        "Could not write the skill to /etc/skills/banana: EACCES: permission denied",
      );
    });
  });

  describe("--list", () => {
    it("shows where each agent's skill goes, and which are here", async () => {
      const test = machine({ homes: ["/home/user/.codex"] });

      const message = await installSkill({ ...COMMAND, list: true }, test.runtime);

      expect(message).toContain("Codex        found");
      expect(message).toContain("Claude Code  not found");
      expect(message).toContain("~/.config/opencode/skills/banana/SKILL.md");
      expect(test.written).toEqual({});
    });
  });

  describe("where a skill goes", () => {
    const runtime = machine().runtime;
    const agent = (name: string) =>
      AGENTS.find((known) => known.name === name) ?? AGENTS[0];

    it("follows each agent's own home directory", async () => {
      const targets = await agentTargets(runtime);

      expect(targets.map((target) => target.path)).toEqual([
        CLAUDE,
        "/home/user/.codex/skills/banana/SKILL.md",
        CURSOR,
        "/home/user/.gemini/skills/banana/SKILL.md",
        "/home/user/.config/opencode/skills/banana/SKILL.md",
      ]);
    });

    it("follows CLAUDE_CONFIG_DIR when Claude Code has moved", () => {
      expect(
        skillsDirectory(agent("claude"), {
          ...runtime,
          env: { CLAUDE_CONFIG_DIR: "~/.config/claude" },
        }),
      ).toBe("/home/user/.config/claude/skills");
    });

    it("follows CODEX_HOME the same way", () => {
      expect(
        skillsDirectory(agent("codex"), {
          ...runtime,
          env: { CODEX_HOME: "/opt/codex" },
        }),
      ).toBe("/opt/codex/skills");
    });

    it("follows XDG_CONFIG_HOME for opencode", () => {
      expect(
        skillsDirectory(agent("opencode"), {
          ...runtime,
          env: { XDG_CONFIG_HOME: "/home/user/.xdg" },
        }),
      ).toBe("/home/user/.xdg/opencode/skills");
    });
  });

  describe("parsing", () => {
    it("takes repeated --agent flags", () => {
      expect(parseSkill(["install", "--agent", "claude", "--agent", "cursor"]))
        .toMatchObject({ agents: ["claude", "cursor"], all: false });
    });

    it("defaults every flag off", () => {
      expect(parseSkill(["install"])).toEqual({
        kind: "skill",
        agents: undefined,
        all: false,
        dir: undefined,
        force: false,
        list: false,
        print: false,
      });
    });

    it("names the agents it knows when given one it does not", () => {
      expect(() => parseSkill(["install", "--agent", "emacs"])).toThrow(
        "Unknown agent: emacs. Known agents are claude, codex, cursor, gemini, opencode; --dir installs anywhere else.",
      );
    });

    it("rejects --dir together with --agent", () => {
      expect(() =>
        parseSkill(["install", "--dir", "/tmp/s", "--agent", "claude"]),
      ).toThrow("--dir names a directory itself");
    });

    it("rejects --agent together with --all", () => {
      expect(() =>
        parseSkill(["install", "--agent", "claude", "--all"]),
      ).toThrow("Choose only one of --agent or --all");
    });

    it("answers a bare `banana skill` with help", () => {
      expect(parseSkill([]).kind).toBe("help");
    });

    it("rejects an unknown subcommand with its help", () => {
      expect(() => parseSkill(["uninstall"])).toThrow(
        "Unknown command: skill uninstall",
      );
    });

    it("rejects a stray argument", () => {
      expect(() => parseSkill(["install", "somewhere"])).toThrow(
        "Unexpected argument: somewhere",
      );
    });

    it("rejects an empty --dir", () => {
      expect(() => parseSkill(["install", "--dir", ""])).toThrow(
        "--dir needs a path",
      );
    });
  });

  describe("through the CLI", () => {
    it("prints the installer's message and makes no request", async () => {
      const test = harness();
      const calls: unknown[] = [];

      const code = await runCli(["skill", "install", "--agent", "cursor"], {
        ...test.runtime,
        installSkill: async (command) => {
          calls.push(command);
          return "Installed the banana skill.";
        },
      });

      expect(code).toBe(0);
      expect(calls).toEqual([
        {
          kind: "skill",
          agents: ["cursor"],
          all: false,
          dir: undefined,
          force: false,
          list: false,
          print: false,
        },
      ]);
      expect(test.stdout.join("\n")).toBe("Installed the banana skill.");
      expect(test.calls).toEqual([]);
    });

    it("--print writes the skill itself, installing nothing", async () => {
      const test = harness();
      let installs = 0;

      const code = await runCli(["skill", "install", "--print"], {
        ...test.runtime,
        installSkill: async () => {
          installs += 1;
          return "";
        },
      });

      expect(code).toBe(0);
      expect(installs).toBe(0);
      expect(test.stdout.join("\n")).toBe(SKILL_TEXT);
    });

    it("has no JSON shape to offer", async () => {
      const test = harness();

      const code = await runCli(["skill", "install", "--json"], test.runtime);

      expect(code).toBe(2);
      expect(test.stderr.join("\n")).toContain(
        '"--json is not supported for banana skill"',
      );
    });

    it("is listed in the root help", async () => {
      const test = harness();

      await runCli(["--help"], test.runtime);

      expect(test.stdout.join("\n")).toContain("skill install");
    });
  });
});

/**
 * The skill is documentation an agent follows instead of reading `--help`, so
 * a stale one is worse than none. These tests read the shipped skill and hold
 * it against the CLI itself: every command it shows has to parse, and every
 * flag it names has to exist.
 */
describe("the skill stays in step with the CLI", () => {
  /** `banana …` as the skill shows it: in a fenced block, or inline in prose. */
  function commands(text: string) {
    const fenced = [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)]
      .map((match) => match[1] ?? "")
      .join("\n")
      .replaceAll("\\\n", " ");
    const inline = [...text.matchAll(/`([^`\n]+)`/g)].map((match) => match[1] ?? "");
    return [...fenced.split("\n"), ...inline]
      .map((line) => line.trim().split(" > ")[0]?.trim() ?? "")
      .filter((line) => line.startsWith("banana "))
      // `get\|members` in the command table is alternation, not a command line.
      .filter((line) => !line.includes("|"))
      .map(argv)
      // `[list]` marks an optional word, so the command without it is the one
      // to check.
      .map((parts) => parts.filter((part) => !part.startsWith("[")))
      // `banana <command> --help` stands for all of them, and names none.
      .filter((parts) => !(parts[1] ?? "").startsWith("<"))
      .filter((parts) => !NOT_RUN.has(parts[1] ?? ""));
  }

  /** Interactive or self-replacing commands, which carry no flags worth checking. */
  const NOT_RUN = new Set(["login", "logout", "update"]);

  /** Splits a command line, keeping quoted names such as "Lisbon trip" whole. */
  function argv(line: string) {
    return [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
      (match) => match[1] ?? match[2] ?? match[3] ?? "",
    );
  }

  it("shows commands that all still parse", async () => {
    const shown = commands(SKILL_TEXT);
    expect(shown.length).toBeGreaterThan(10);

    for (const parts of shown) {
      // A bare mention such as `banana expenses add` names a command without
      // its required flags, so ask that command for its help instead: a
      // renamed command still answers 2.
      const args = parts.slice(1);
      const line = parts.join(" ");
      if (!args.some((part) => part.startsWith("-"))) args.push("--help");

      const test = harness((url, init) => lookup(url, init) ?? Response.json({}));
      const code = await runCli(args, {
        ...test.runtime,
        installSkill: async () => "",
      });

      // 2 is a usage error: the skill is showing a command the CLI no longer
      // takes. Anything else is this fake account answering.
      expect([line, code]).not.toEqual([line, 2]);
    }
  });

  it("names only flags the CLI still has", async () => {
    const pages: string[] = [];
    for (const command of HELP_PAGES) {
      const test = harness();
      await runCli([...command, "--help"], test.runtime);
      pages.push(test.stdout.join("\n"));
    }
    const help = pages.join("\n");

    const named = new Set(
      [...SKILL_TEXT.matchAll(/(?<![\w-])--[a-z][a-z-]*/g)].map(
        (match) => match[0],
      ),
    );
    const missing = [...named].filter((flag) => !help.includes(flag));

    expect(missing).toEqual([]);
  });

  const HELP_PAGES = [
    [],
    ["balance"],
    ["expenses", "list"],
    ["expenses", "add"],
    ["expenses", "get"],
    ["expenses", "edit"],
    ["payments", "add"],
    ["payments", "get"],
    ["groups", "list"],
    ["groups", "create"],
    ["groups", "get"],
    ["groups", "members"],
    ["groups", "activities"],
    ["friends", "list"],
    ["currencies", "list"],
    ["me"],
    ["skill", "install"],
  ];
});
