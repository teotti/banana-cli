import { version as CLI_VERSION } from "../package.json";
import { BLUE, BOLD, RED, RESET, SHADES, YELLOW } from "./colors";

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

/**
 * Paints the uppercase section titles of a help text banana yellow, and the
 * runnable lines under EXAMPLES blue so they stand out from the prose.
 */
export function colorizeHelp(text: string, color = supportsColor()) {
  if (!color) return text;
  let inExamples = false;
  return text
    .split("\n")
    .map((line) => {
      if (SECTION.test(line)) {
        inExamples = line === "EXAMPLES";
        return `${BOLD}${YELLOW}${line}${RESET}`;
      }
      if (inExamples && line.trim() !== "") return `${BLUE}${line}${RESET}`;
      return line;
    })
    .join("\n");
}

/** A two-column row: a name (command, flag, variable) and what it does. */
export type HelpRow = [name: string, description: string];
export type HelpSection = { title: string; rows: HelpRow[] };

export type HelpPage = {
  /** One line, above USAGE, saying what the command does. */
  summary?: string;
  usage: string[];
  commands?: HelpRow[];
  options?: HelpRow[];
  /** Extra titled two-column blocks, for pages that group their commands. */
  sections?: HelpSection[];
  /** Free paragraphs printed after the tables; a paragraph may span lines. */
  notes?: string[];
  examples?: string[];
  learnMore?: string[];
};

// Wide enough for the flags we have; a longer name drops its description to
// the next line rather than pushing every other column out.
const MAX_NAME_WIDTH = 26;
const GUTTER = 2;

// An over-wide name wraps instead of widening the column for every other row.
function nameWidth(rows: HelpRow[]) {
  const longest = rows.reduce(
    (width, [name]) =>
      name.length > MAX_NAME_WIDTH ? width : Math.max(width, name.length),
    0,
  );
  return longest + GUTTER;
}

function renderRows(rows: HelpRow[], width: number) {
  return rows.flatMap(([name, description]) => {
    if (description === "") return [`  ${name}`];
    if (name.length > width - GUTTER) {
      return [`  ${name}`, `  ${" ".repeat(width)}${description}`];
    }
    return [`  ${name.padEnd(width)}${description}`];
  });
}

function block(title: string, lines: string[]) {
  return [title, ...lines].join("\n");
}

/**
 * Renders a help page in the house layout: summary, USAGE, tables, EXAMPLES.
 * Every table on the page shares one column width so the descriptions line up
 * across sections.
 */
export function helpText(page: HelpPage) {
  const tables = [
    ...(page.commands ? [{ title: "COMMANDS", rows: page.commands }] : []),
    ...(page.sections ?? []),
    ...(page.options ? [{ title: "OPTIONS", rows: page.options }] : []),
  ];
  const width = nameWidth(tables.flatMap((table) => table.rows));
  const blocks = [
    ...(page.summary === undefined ? [] : [page.summary]),
    block("USAGE", page.usage.map((line) => `  ${line}`)),
    ...tables.map((table) => block(table.title, renderRows(table.rows, width))),
    ...(page.notes ?? []),
    ...(page.examples
      ? [block("EXAMPLES", page.examples.map((line) => `  ${line}`))]
      : []),
    ...(page.learnMore
      ? [block("LEARN MORE", page.learnMore.map((line) => `  ${line}`))]
      : []),
  ];
  return blocks.join("\n\n");
}

/** An error line, with the offending command's help below it when there is one. */
export function errorText(message: string, help?: string) {
  const label = supportsColor() ? `${BOLD}${RED}Error:${RESET}` : "Error:";
  return help === undefined
    ? `${label} ${message}`
    : `${label} ${message}\n\n${colorizeHelp(help)}`;
}
