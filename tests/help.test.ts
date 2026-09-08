import { describe, expect, it } from "bun:test";
import { version } from "../package.json";
import {
  banner,
  colorizeHelp,
  fitsBanner,
  helpHeader,
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

    expect(rendered).toContain("\x1b[1m\x1b[38;2;224;196;0mUSAGE\x1b[0m");
    expect(rendered).toContain("\n  banana me");
    expect(colorizeHelp("USAGE", false)).toBe("USAGE");
  });
});
