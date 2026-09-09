/**
 * One palette for the whole CLI.
 *
 * A terminal does not tell us whether it is light or dark — Ghostty and
 * Terminal.app set no COLORFGBG, and querying the background over OSC 11 means
 * a raw-mode round trip on every command — so every colour here has to read on
 * both. That rules out the bright yellow this palette started with: it is
 * lovely on black and washes out to nothing on a light background.
 *
 * The blue, red and green carry the information, and clear 3:1 against white
 * and against near-black. The yellow is the brand accent — always bold, never
 * the only thing saying what a line is — so it is allowed to sit lower on light
 * (2.8:1) to stay recognisably banana rather than olive. `tests/colors.test.ts`
 * holds those floors.
 */
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const RESET = "\x1b[0m";

/** Section titles, the wordmark, the browser's selection marker. */
export const YELLOW = "\x1b[38;2;190;148;0m";
/** Column headings, ids, example commands. */
export const BLUE = "\x1b[38;2;45;111;196m";
/** The `Error:` label. */
export const RED = "\x1b[38;2;208;72;72m";
/** Counts in the browser chrome. */
export const GREEN = "\x1b[38;2;42;122;62m";

/** The wordmark's gradient: ripe on top, browning at the bottom. */
export const SHADES = [
  "\x1b[38;2;206;160;20m",
  "\x1b[38;2;196;152;18m",
  "\x1b[38;2;186;144;16m",
  "\x1b[38;2;176;134;14m",
  "\x1b[38;2;166;124;12m",
];
