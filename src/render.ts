import { supportsColor } from "./help";
import { display } from "./shared";

const BOLD = "\x1b[1m";
// Dark enough to stay legible on a light terminal, which a bright blue is not.
const BLUE = "\x1b[38;2;45;111;196m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const GUTTER = "  ";
const ELLIPSIS = "…";

export type Column = {
  label: string;
  /** Numbers read better flush right, under a right-aligned heading. */
  align?: "right";
  /** Longer values are truncated to this many characters. */
  max?: number;
  /** Ids are painted blue, the way the column headings are. */
  id?: boolean;
};

export type Field = [label: string, value: string, id?: boolean];

function cell(value: unknown, max?: number) {
  const text = display(value);
  return max !== undefined && text.length > max
    ? `${text.slice(0, max - 1)}${ELLIPSIS}`
    : text;
}

function pad(text: string, width: number, align?: "right") {
  return align === "right" ? text.padStart(width) : text.padEnd(width);
}

function paint(text: string, code: string, color: boolean) {
  return color ? `${code}${text}${RESET}` : text;
}

/**
 * A listing: one heading row, then one row per item, every column padded to
 * its widest value. The last column is never padded, so a wide value at the
 * end of a row costs nothing to the rows above it.
 */
export function table(
  columns: Column[],
  rows: unknown[][],
  color = supportsColor(),
) {
  const cells = rows.map((row) =>
    columns.map((column, index) => cell(row[index], column.max)),
  );
  const widths = columns.map((column, index) =>
    cells.reduce(
      (width, row) => Math.max(width, row[index]!.length),
      column.label.length,
    ),
  );
  const line = (values: string[], code?: string) =>
    values
      .map((value, index) => {
        const last = index === columns.length - 1;
        const padded =
          last && columns[index]!.align !== "right"
            ? value
            : pad(value, widths[index]!, columns[index]!.align);
        const tone = code ?? (columns[index]!.id ? BLUE : undefined);
        return tone ? paint(padded, tone, color) : padded;
      })
      .join(GUTTER)
      .trimEnd();

  return [
    line(
      columns.map((column) => column.label),
      `${BOLD}${BLUE}`,
    ),
    ...cells.map((row) => line(row)),
  ].join("\n");
}

/**
 * A detail block: `Label: value`, with the values lined up in one column.
 */
export function fields(rows: Field[], color = supportsColor()) {
  const width = rows.reduce((max, [label]) => Math.max(max, label.length), 0);
  return rows
    .map(([label, value, id]) =>
      [
        paint(`${label}:`.padEnd(width + 1), DIM, color),
        id ? paint(value, BLUE, color) : value,
      ].join(" "),
    )
    .join("\n");
}

/** The title above a block of fields or a table. */
export function heading(text: string, color = supportsColor()) {
  return paint(text, BOLD, color);
}

/** A footnote: pagination hints, empty-listing notices. */
export function note(text: string, color = supportsColor()) {
  return paint(text, DIM, color);
}

/** Blocks of output, one blank line between them. */
export function section(...blocks: (string | undefined)[]) {
  return blocks.filter((block): block is string => Boolean(block)).join("\n\n");
}
