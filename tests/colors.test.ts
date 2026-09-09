import { describe, expect, it } from "bun:test";
import { BLUE, GREEN, RED, SHADES, YELLOW } from "../src/colors";

/** WCAG relative luminance of an `\x1b[38;2;R;G;Bm` sequence. */
function luminance(color: string) {
  const [red, green, blue] = color
    .replace(/^\x1b\[38;2;|m$/g, "")
    .split(";")
    .map((value) => {
      const channel = Number(value) / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrast(color: string, background: number) {
  const [lighter, darker] = [luminance(color), background].sort(
    (a, b) => b - a,
  );
  return (lighter! + 0.05) / (darker! + 0.05);
}

const WHITE = 1;
const NEAR_BLACK = luminance("\x1b[38;2;30;30;30m");

describe("palette", () => {
  // A terminal does not say whether it is light or dark, so nothing in the
  // palette may depend on one of them. This is the test that would have caught
  // the original bright yellow, which scored 1.6 on white.
  it("keeps the colours that carry information at 3:1 on both", () => {
    for (const color of [BLUE, RED, GREEN]) {
      expect(contrast(color, WHITE)).toBeGreaterThanOrEqual(3);
      expect(contrast(color, NEAR_BLACK)).toBeGreaterThanOrEqual(3);
    }
  });

  // The yellow is the brand accent and always bold, so it trades a little
  // contrast on light to stay banana rather than olive.
  it("keeps the brand yellow readable on both", () => {
    expect(contrast(YELLOW, WHITE)).toBeGreaterThanOrEqual(2.8);
    expect(contrast(YELLOW, NEAR_BLACK)).toBeGreaterThanOrEqual(3);
  });

  it("keeps the wordmark's gradient visible either way", () => {
    for (const shade of SHADES) {
      expect(contrast(shade, WHITE)).toBeGreaterThanOrEqual(2.3);
      expect(contrast(shade, NEAR_BLACK)).toBeGreaterThanOrEqual(2.3);
    }
  });
});
