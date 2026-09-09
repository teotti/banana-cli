import { describe, expect, it } from "bun:test";
import { version } from "../package.json";
import { BLUE, BOLD, YELLOW } from "../src/colors";
import {
  banner,
  colorizeHelp,
  errorText,
  fitsBanner,
  helpHeader,
  helpText,
  TAGLINE,
} from "../src/help";

describe("help header", () => {
  it("draws the wordmark on a wide colour terminal", () => {
    const rendered = helpHeader(true, true);
    const lines = banner().split("\n");

    expect(lines).toHaveLength(5);
    expect(lines.every((line) => line.includes("\x1b[38;2;"))).toBe(true);
    expect(rendered).toStartWith(`\n${lines[0]!}`);
    expect(rendered).toContain(`v${version}`);
    expect(rendered).toContain(TAGLINE);
  });

  it("keeps the wordmark when the terminal does not report a width", () => {
    expect(helpHeader(true, fitsBanner(0))).toContain("█");
    expect(helpHeader(true, fitsBanner(undefined))).toContain("█");
    expect(fitsBanner(40)).toBe(false);
  });

  it("drops the wordmark when the terminal is narrow or colourless", () => {
    expect(helpHeader(true, false)).not.toContain("█");
    expect(helpHeader(false, true)).toBe(`v${version} — ${TAGLINE}`);
  });
});

describe("colorizeHelp", () => {
  it("paints section titles and leaves the rest alone", () => {
    const rendered = colorizeHelp("USAGE\n  banana me", true);

    expect(rendered).toContain(`${BOLD}${YELLOW}USAGE\x1b[0m`);
    expect(rendered).toContain("\n  banana me");
    expect(colorizeHelp("USAGE", false)).toBe("USAGE");
  });

  it("paints the example lines and stops at the next section", () => {
    const rendered = colorizeHelp(
      "EXAMPLES\n  banana me\n\nLEARN MORE\n  banana me --help",
      true,
    );

    expect(rendered).toContain(`${BLUE}  banana me\x1b[0m`);
    expect(rendered).toEndWith("\n  banana me --help");
  });
});

describe("helpText", () => {
  const page = helpText({
    summary: "Show the signed-in user.",
    usage: ["banana me [--json]"],
    commands: [["me", "Show the user"]],
    sections: [
      { title: "OUTPUT", rows: [["--json", "Print curated JSON"]] },
    ],
    options: [["--a-very-long-flag-name-here", "Wrapped description"]],
    notes: ["A note."],
    examples: ["banana me"],
    learnMore: ["banana me --help"],
  });

  it("lays the sections out in order, blank line between each", () => {
    expect(page.split("\n\n").map((block) => block.split("\n")[0])).toEqual([
      "Show the signed-in user.",
      "USAGE",
      "COMMANDS",
      "OUTPUT",
      "OPTIONS",
      "A note.",
      "EXAMPLES",
      "LEARN MORE",
    ]);
  });

  it("shares one column width across the tables of a page", () => {
    expect(page).toContain("  me      Show the user");
    expect(page).toContain("  --json  Print curated JSON");
  });

  it("drops the description of an over-wide name to the next line", () => {
    expect(page).toContain(
      "  --a-very-long-flag-name-here\n          Wrapped description",
    );
  });
});

describe("errorText", () => {
  it("prints the reason, then the help of the command that failed", () => {
    expect(errorText("Unknown command: nope", "USAGE\n  banana me")).toBe(
      "Error: Unknown command: nope\n\nUSAGE\n  banana me",
    );
    expect(errorText("Could not start updater")).toBe(
      "Error: Could not start updater",
    );
  });
});
