import { version as CLI_VERSION } from "../package.json";

const BOLD = "\x1b[1m";
const YELLOW = "\x1b[38;2;224;196;0m";
const RESET = "\x1b[0m";

const SECTION = /^[A-Z][A-Z0-9 &'/-]*$/;

export const TAGLINE =
  "Split expenses, settle balances, and manage groups on BananaSplit from your terminal.";

// Five-row block glyphs, one string per row, for the letters of "BANANASPLIT".
const GLYPHS: Record<string, string[]> = {
  B: ["████ ", "█   █", "████ ", "█   █", "████ "],
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
  S: [" ████", "█    ", " ███ ", "    █", "████ "],
  P: ["████ ", "█   █", "████ ", "█    ", "█    "],
  L: ["█    ", "█    ", "█    ", "█    ", "█████"],
  I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
};

// Ripe on top, browning at the bottom — the banner reads as a gradient.
const SHADES = [
  "\x1b[38;2;255;226;92m",
  "\x1b[38;2;255;211;40m",
  "\x1b[38;2;250;192;12m",
  "\x1b[38;2;226;166;10m",
  "\x1b[38;2;196;140;12m",
];

const WORD = "BANANASPLIT";
const BANNER_WIDTH = WORD.length * 6 - 1;

export function supportsColor(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(process.stdout.isTTY) && !env.NO_COLOR;
}

// A terminal that does not report a width (0 or undefined, as under `script`)
// is treated as wide enough rather than silently losing the wordmark.
export function fitsBanner(columns = process.stdout.columns) {
  return !columns || columns >= BANNER_WIDTH;
}

/** The wordmark, one gradient-shaded line per glyph row. */
export function banner() {
  return SHADES.map((shade, row) =>
    [
      shade,
      WORD.split("")
        .map((letter) => GLYPHS[letter]![row])
        .join(" ")
        .trimEnd(),
      RESET,
    ].join(""),
  ).join("\n");
}

/**
 * The header above the root help: the wordmark when the terminal can show it,
 * and the version and tagline either way.
 */
export function helpHeader(color = supportsColor(), wide = fitsBanner()) {
  const title = `${YELLOW}v${CLI_VERSION}${RESET} — ${TAGLINE}`;
  if (!color) return `v${CLI_VERSION} — ${TAGLINE}`;
  return wide ? `\n${banner()}\n\n${title}` : title;
}

/** Paints the uppercase section titles of a help text banana yellow. */
export function colorizeHelp(text: string, color = supportsColor()) {
  if (!color) return text;
  return text
    .split("\n")
    .map((line) => (SECTION.test(line) ? `${BOLD}${YELLOW}${line}${RESET}` : line))
    .join("\n");
}
