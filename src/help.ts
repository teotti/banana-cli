const BOLD = "\x1b[1m";
const YELLOW = "\x1b[38;2;224;196;0m";
const RESET = "\x1b[0m";

const SECTION = /^[A-Z][A-Z0-9 &'/-]*$/;

export function supportsColor(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(process.stdout.isTTY) && !env.NO_COLOR;
}

/** Paints the uppercase section titles of a help text banana yellow. */
export function colorizeHelp(text: string, color = supportsColor()) {
  if (!color) return text;
  return text
    .split("\n")
    .map((line) => (SECTION.test(line) ? `${BOLD}${YELLOW}${line}${RESET}` : line))
    .join("\n");
}
