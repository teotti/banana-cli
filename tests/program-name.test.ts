import { describe, expect, it } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/index";
import { invokedName, renameCommand } from "../src/shared";
import { defaultUninstallRuntime } from "../src/uninstall";
import { harness } from "./helpers";

describe("the name the CLI was run as", () => {
  it("is bananasplit only when started by that name", () => {
    expect(invokedName("bananasplit", {})).toBe("bananasplit");
    expect(invokedName("/opt/homebrew/bin/bananasplit", {})).toBe("bananasplit");
    expect(invokedName("./bananasplit", {})).toBe("bananasplit");
    expect(invokedName("banana", {})).toBe("banana");
    expect(invokedName("/home/user/.local/bin/banana", {})).toBe("banana");
    expect(invokedName("bun", {})).toBe("banana");
  });

  it("reads the Windows shim's word for it", () => {
    expect(invokedName("C:\\bin\\banana.exe", {})).toBe("banana");
    expect(
      invokedName("C:\\bin\\banana.exe", { BANANA_INVOKED_AS: "bananasplit" }),
    ).toBe("bananasplit");
  });
});

describe("renaming the CLI's own text", () => {
  it("renames commands in usage lines, backticks and 'for' phrases", () => {
    expect(
      renameCommand(
        [
          "USAGE",
          "  banana <command> [--json | --raw]",
          "banana version 0.5.0",
          "Run `banana login` first.",
          "--raw is not supported for banana doctor",
        ].join("\n"),
        "bananasplit",
      ),
    ).toBe(
      [
        "USAGE",
        "  bananasplit <command> [--json | --raw]",
        "bananasplit version 0.5.0",
        "Run `bananasplit login` first.",
        "--raw is not supported for bananasplit doctor",
      ].join("\n"),
    );
  });

  it("keeps the skill's name, which is banana under either command", () => {
    expect(
      renameCommand(
        "Install the banana agent skill.\n" +
          "  banana skill install --print > .agent/skills/banana/SKILL.md",
        "bananasplit",
      ),
    ).toBe(
      "Install the banana agent skill.\n" +
        "  bananasplit skill install --print > .agent/skills/banana/SKILL.md",
    );
  });

  it("changes nothing under the banana name", () => {
    expect(renameCommand("  banana expenses list", "banana")).toBe(
      "  banana expenses list",
    );
  });
});

describe("runCli under the bananasplit name", () => {
  it("prints help with bananasplit commands", async () => {
    const { runtime, stdout } = harness();
    expect(
      await runCli(["expenses", "--help"], { ...runtime, programName: "bananasplit" }),
    ).toBe(0);
    expect(stdout[0]).toContain("bananasplit expenses list");
    expect(stdout[0]).not.toMatch(/^\s*banana /m);
  });

  it("names itself in the version and in its errors", async () => {
    const { runtime, stdout, stderr } = harness();
    const named = { ...runtime, programName: "bananasplit" };

    expect(await runCli(["version"], named)).toBe(0);
    expect(stdout[0]).toMatch(/^bananasplit version /);

    expect(await runCli(["doctor", "--raw"], named)).toBe(2);
    expect(stderr.join("\n")).toContain("not supported for bananasplit doctor");
  });

  it("leaves API data alone", async () => {
    const { runtime, stdout } = harness(
      Response.json({
        items: [{
          id: "expense-1",
          title: "banana bread",
          amount: "3.000000000000000000",
          currency: { code: "EUR" },
          paidByUser: { id: "user-1", name: "Leonardo" },
          date: "2026-09-01T00:00:00.000Z",
        }],
        hasMore: false,
        nextCursor: null,
      }),
    );
    expect(
      await runCli(["expenses", "list"], { ...runtime, programName: "bananasplit" }),
    ).toBe(0);
    expect(stdout.join("\n")).toContain("banana bread");
    expect(stdout.join("\n")).not.toContain("bananasplit bread");
  });
});

describe("the Windows shim check", () => {
  it("still recognizes the shim v0.5.0 installed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "banana-shim-"));
    await writeFile(join(dir, "old.cmd"), '@"%~dp0banana.exe" %*\r\n');
    expect(
      await defaultUninstallRuntime().isAlias(join(dir, "old.cmd"), "banana.exe"),
    ).toBe(true);
  });
});
