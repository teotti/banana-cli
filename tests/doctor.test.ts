import { describe, expect, it } from "bun:test";
import {
  collectChecks,
  formatChecks,
  overall,
  type DoctorRuntime,
} from "../src/doctor";
import { runCli } from "../src/index";
import { SKILL_TEXT } from "../src/skill";
import { CliFailure } from "../src/types";
import { harness } from "./helpers";

const BINARY = "/home/user/.local/bin/banana";
const CLAUDE = "/home/user/.claude/skills/banana/SKILL.md";

function machine(overrides: Partial<DoctorRuntime> = {}): DoctorRuntime {
  return {
    color: false,
    env: {},
    execPath: BINARY,
    isStandalone: true,
    which: async () => BINARY,
    whoami: async () => "Ana",
    readSkill: async () => undefined,
    skillTargets: async () => [{ label: "Claude Code", path: CLAUDE }],
    ...overrides,
  };
}

/** The one check a case is about, by name. */
function check(checks: Awaited<ReturnType<typeof collectChecks>>, name: string) {
  const found = checks.find((item) => item.name === name);
  if (!found) throw new Error(`no ${name} check in ${checks.map((c) => c.name)}`);
  return found;
}

describe("banana doctor", () => {
  it("passes everything on a machine in good order", async () => {
    const checks = await collectChecks(
      machine({ readSkill: async () => SKILL_TEXT }),
    );

    expect(overall(checks)).toBe("ok");
    expect(check(checks, "Login").detail).toBe("signed in as Ana");
    expect(check(checks, "Skill").detail).toBe("current for Claude Code");
  });

  describe("which banana the shell runs", () => {
    it("warns when this binary is not on PATH at all", async () => {
      const checks = await collectChecks(machine({ which: async () => undefined }));

      expect(check(checks, "PATH")).toMatchObject({ status: "warn" });
      expect(check(checks, "PATH").detail).toContain("is not on PATH");
    });

    it("warns when PATH finds a different copy than the one running", async () => {
      const checks = await collectChecks(
        machine({ which: async () => "/usr/local/bin/banana" }),
      );

      expect(check(checks, "PATH")).toMatchObject({ status: "warn" });
      expect(check(checks, "PATH").detail).toContain("/usr/local/bin/banana");
      expect(check(checks, "PATH").detail).toContain(BINARY);
    });

    it("has no PATH to check for a package install", async () => {
      const checks = await collectChecks(machine({ isStandalone: false }));

      expect(check(checks, "Install").status).toBe("ok");
      expect(checks.some((item) => item.name === "PATH")).toBe(false);
    });
  });

  describe("the login", () => {
    it("warns, rather than failing, when nobody is signed in", async () => {
      const checks = await collectChecks(
        machine({ whoami: async () => undefined }),
      );

      expect(check(checks, "Login")).toMatchObject({
        status: "warn",
        fix: "banana login",
      });
    });

    it("treats a credential problem as something you can fix", async () => {
      const checks = await collectChecks(
        machine({
          whoami: async () => {
            throw new CliFailure("config", "Not logged in. Run banana login.");
          },
        }),
      );

      expect(check(checks, "Login")).toMatchObject({ status: "warn" });
    });

    it("fails on an unreachable API, which is not yours to fix", async () => {
      const checks = await collectChecks(
        machine({
          whoami: async () => {
            throw new CliFailure("network", "Could not reach the API.");
          },
        }),
      );

      expect(check(checks, "Login")).toMatchObject({
        status: "fail",
        detail: "Could not reach the API.",
      });
      expect(check(checks, "Login").fix).toBeUndefined();
      expect(overall(checks)).toBe("fail");
    });
  });

  describe("the skill", () => {
    it("catches a skill left behind by an upgrade", async () => {
      const checks = await collectChecks(
        machine({ readSkill: async () => "an older skill" }),
      );

      expect(check(checks, "Skill")).toMatchObject({
        status: "warn",
        fix: "banana skill install --force",
      });
      expect(check(checks, "Skill").detail).toContain("out of date");
    });

    it("says so when no agent has one", async () => {
      const checks = await collectChecks(machine());

      expect(check(checks, "Skill")).toMatchObject({
        status: "warn",
        fix: "banana skill install",
      });
    });
  });

  it("names an API that came from the environment, not the default", async () => {
    const checks = await collectChecks(
      machine({ env: { BANANASPLIT_API_URL: "https://staging.example.com" } }),
    );

    expect(check(checks, "API").detail).toContain("not the default");
  });

  describe("reading the report", () => {
    it("leads with the worst of the checks", () => {
      expect(
        formatChecks([{ name: "A", status: "ok", detail: "fine" }], false),
      ).toStartWith("Everything checks out.");
      expect(
        formatChecks([{ name: "A", status: "warn", detail: "hm" }], false),
      ).toStartWith("Mostly fine,");
      expect(
        formatChecks([{ name: "A", status: "fail", detail: "no" }], false),
      ).toStartWith("Something is broken.");
    });

    it("puts the thing to run under the check it belongs to", () => {
      const text = formatChecks(
        [{ name: "Login", status: "warn", detail: "not signed in", fix: "banana login" }],
        false,
      );

      expect(text).toContain("→ banana login");
    });
  });

  describe("through the CLI", () => {
    it("exits 0 with warnings and 1 with a failure", async () => {
      const ok = harness();
      expect(
        await runCli(["doctor"], {
          ...ok.runtime,
          doctor: async () => ({
            checks: [{ name: "Login", status: "warn", detail: "not signed in" }],
            failed: false,
          }),
        }),
      ).toBe(0);

      const bad = harness();
      expect(
        await runCli(["doctor"], {
          ...bad.runtime,
          doctor: async () => ({
            checks: [{ name: "Login", status: "fail", detail: "unreachable" }],
            failed: true,
          }),
        }),
      ).toBe(1);
    });

    it("has a JSON shape, unlike the other command-only commands", async () => {
      const test = harness();

      const code = await runCli(["doctor", "--json"], {
        ...test.runtime,
        doctor: async () => ({
          checks: [{ name: "Login", status: "warn", detail: "not signed in" }],
          failed: false,
        }),
      });

      expect(code).toBe(0);
      expect(JSON.parse(test.stdout.join(""))).toEqual({
        checks: [{ name: "Login", status: "warn", detail: "not signed in" }],
        status: "warn",
        ok: true,
      });
    });

    it("has no --raw shape, having no API response to show", async () => {
      const test = harness();

      expect(await runCli(["doctor", "--raw"], test.runtime)).toBe(2);
      expect(test.stderr.join("\n")).toContain(
        "--raw is not supported for banana doctor",
      );
    });

    it("rejects a stray argument", async () => {
      const test = harness();

      expect(await runCli(["doctor", "everything"], test.runtime)).toBe(2);
      expect(test.stderr.join("\n")).toContain("Unexpected argument: everything");
    });
  });
});
