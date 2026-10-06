import { asArray, asRecord, numeric } from "../src/shared";
import { close } from "./money";

export type PageRow = Record<string, unknown>;

function rowsOf(body: unknown) {
  return (Array.isArray(body) ? body : asArray(asRecord(body).items)).map(asRecord);
}

function orderedValue(row: PageRow, field: string) {
  if (field === "date") return String(row.date ?? "");
  const value = numeric(row[field]);
  if (value === null) {
    throw new Error(`${field} was not a number on ${String(row.id ?? row.userId)}`);
  }
  return value;
}

function compare(left: number | string, right: number | string) {
  if (typeof left === "number" && typeof right === "number") {
    if (close(left, right)) return 0;
    return left < right ? -1 : 1;
  }
  return String(left).localeCompare(String(right));
}

/** Every page of one query, in the order the cursor returned them. */
export async function walkPages(options: {
  label: string;
  fetch: (cursor?: string) => Promise<unknown>;
  idOf?: (row: PageRow) => string | null;
  expected?: string[];
  /** Fail when every expected row arrived on the first page. */
  paginate?: boolean;
  order?: { field: string; direction: "asc" | "desc" | "monotonic" };
}): Promise<{ rows: PageRow[]; ids: Set<string>; pages: number }> {
  const idOf = options.idOf ?? ((row) => (typeof row.id === "string" ? row.id : null));
  const ids = new Set<string>();
  const rows: PageRow[] = [];
  let cursor: string | undefined;
  let pages = 0;
  for (; pages < 100; pages++) {
    const body = asRecord(await options.fetch(cursor));
    const page = rowsOf(body);
    if (page.length === 0 && body.hasMore === true) {
      throw new Error(`${options.label} returned an empty page with hasMore`);
    }
    for (const row of page) {
      const id = idOf(row);
      if (!id) throw new Error(`${options.label} returned a row without an id`);
      if (ids.has(id)) throw new Error(`${options.label} repeated ${id}`);
      ids.add(id);
      rows.push(row);
    }
    if (body.hasMore !== true) {
      cursor = undefined;
      break;
    }
    if (typeof body.nextCursor !== "string" || body.nextCursor.length === 0) {
      throw new Error(`${options.label} set hasMore without a cursor`);
    }
    if (body.nextCursor === cursor) {
      throw new Error(`${options.label} cursor did not advance`);
    }
    cursor = body.nextCursor;
  }
  if (cursor) throw new Error(`${options.label} did not finish`);
  if (options.paginate && pages + 1 < 2) {
    throw new Error(`${options.label} did not paginate`);
  }
  if (options.order) {
    let required: -1 | 1 | undefined =
      options.order.direction === "asc"
        ? 1
        : options.order.direction === "desc"
          ? -1
          : undefined;
    let previous: number | string | undefined;
    for (const row of rows) {
      const value = orderedValue(row, options.order.field);
      if (previous !== undefined) {
        const delta = compare(value, previous);
        const sign: -1 | 1 | 0 = delta < 0 ? -1 : delta > 0 ? 1 : 0;
        if (sign !== 0) {
          if (required === undefined) required = sign;
          else if (sign !== required) {
            throw new Error(
              `${options.label} is not ordered by ${options.order.field}`,
            );
          }
        }
      }
      previous = value;
    }
  }
  for (const id of options.expected ?? []) {
    if (!ids.has(id)) throw new Error(`${options.label} never returned ${id}`);
  }
  return { rows, ids, pages: pages + 1 };
}
