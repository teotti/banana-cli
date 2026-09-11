import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import {
  installSkill,
  parseSkill,
  skillsDirectory,
  SKILL_TEXT,
  type SkillRuntime,
} from "../src/skill";
import { harness } from "./helpers";

/** An in-memory skills directory, so a test never writes to the real one. */
function installer(files: Record<string, string> = {}, overrides: Partial<SkillRuntime> = {}) {
  const written: Record<string, string> = { ...files };
  const runtime: SkillRuntime = {
    color: false,
    env: {},
    home: "/home/user",
    read: async (path) => written[path],
    write: async (path, contents) => {
      written[path] = contents;
    },
    ...overrides,
  };
  return { runtime, written };
}

describe("banana skill install", () => {
  it("writes the skill under the agent's skills directory", async () => {
    const test = installer();

    const message = await installSkill({ force: false }, test.runtime);

    expect(message).toBe(
      [
        "Installed the banana skill.",
        "  /home/user/.claude/skills/banana/SKILL.md",
        "Agents pick it up on their next session.",
      ].join("\n"),
    );
    expect(test.written["/home/user/.claude/skills/banana/SKILL.md"]).toBe(
      SKILL_TEXT,
    );
  });

  it("installs the skill the repo ships, frontmatter and all", async () => {
    const shipped = await Bun.file(
      new URL("../skills/banana/SKILL.md", import.meta.url),
    ).text();

    expect(SKILL_TEXT).toBe(shipped);
    expect(SKILL_TEXT.startsWith("---\nname: banana\n")).toBe(true);
  });

  it("says nothing changed when the installed skill is current", async () => {
    const path = "/home/user/.claude/skills/banana/SKILL.md";
    const test = installer({ [path]: SKILL_TEXT });

    expect(await installSkill({ force: false }, test.runtime)).toBe(
      `The banana skill is already installed.\n  ${path}`,
    );
  });

  it("refuses to replace a skill that differs, until --force", async () => {
    const path = "/home/user/.claude/skills/banana/SKILL.md";
    const test = installer({ [path]: "hand-edited" });

    await expect(installSkill({ force: false }, test.runtime)).rejects.toThrow(
      `A different banana skill is already at ${path}. Re-run with --force to replace it.`,
    );
    expect(test.written[path]).toBe("hand-edited");

    expect(await installSkill({ force: true }, test.runtime)).toBe(
      [
        "Replaced the banana skill.",
        `  ${path}`,
        "Agents pick it up on their next session.",
      ].join("\n"),
    );
    expect(test.written[path]).toBe(SKILL_TEXT);
  });

  it("reports a directory it cannot write to as a config failure", async () => {
    const test = installer(
      {},
      {
        write: async () => {
          throw new Error("EACCES: permission denied");
        },
      },
    );

    await expect(installSkill({ force: false }, test.runtime)).rejects.toThrow(
      "Could not write the skill to /home/user/.claude/skills/banana: EACCES: permission denied",
    );
  });

  describe("where it goes", () => {
    const runtime = installer().runtime;

    it("defaults to the Claude skills directory", () => {
      expect(skillsDirectory(undefined, runtime)).toBe(
        "/home/user/.claude/skills",
      );
    });

    it("follows CLAUDE_CONFIG_DIR when the agent has moved", () => {
      expect(
        skillsDirectory(undefined, {
          ...runtime,
          env: { CLAUDE_CONFIG_DIR: "~/.config/claude" },
        }),
      ).toBe("/home/user/.config/claude/skills");
    });

    it("expands a ~ the shell did not", () => {
      expect(skillsDirectory("~/skills", runtime)).toBe("/home/user/skills");
    });
  });

  describe("parsing", () => {
    it("takes --dir, --force and --print", () => {
      expect(parseSkill(["install", "--dir", "/tmp/s", "--force", "--print"]))
        .toEqual({ kind: "skill", dir: "/tmp/s", force: true, print: true });
    });

    it("defaults the flags off", () => {
      expect(parseSkill(["install"])).toEqual({
        kind: "skill",
        dir: undefined,
        force: false,
        print: false,
      });
    });

    it("answers a bare `banana skill` with help", () => {
      const parsed = parseSkill([]);
      expect(parsed.kind).toBe("help");
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

      const code = await runCli(["skill", "install", "--force"], {
        ...test.runtime,
        installSkill: async (command) => {
          calls.push(command);
          return "Installed the banana skill.";
        },
      });

      expect(code).toBe(0);
      expect(calls).toEqual([
        { kind: "skill", dir: undefined, force: true, print: false },
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
