import { parseArgs } from "node:util";
import { version as CLI_VERSION } from "../package.json";
import { CliFailure, type Environment, type OptionConfig } from "./types";

export const DEFAULT_LIST_LIMIT = 5;

// The generic `CI` variable is the one most providers set, but not all of them,
// so the well-known names are checked too.
const CI_VARIABLES = [
  "BUILDKITE",
  "CIRCLECI",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "JENKINS_URL",
  "TEAMCITY_VERSION",
  "TF_BUILD",
];

function isSet(value: string | undefined) {
  if (value === undefined) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "false";
}

export function isCI(env: Environment) {
  return isSet(env.CI) || CI_VARIABLES.some((name) => isSet(env[name]));
}

// Every request already carries a user-agent, so this is where the API learns
// what kind of run it is talking to without the CLI reporting anything itself.
export function userAgent(env: Environment) {
  const context = isCI(env)
    ? "ci"
    : process.stdout.isTTY === true
      ? "tty"
      : "pipe";
  return `bananasplit-cli/${CLI_VERSION} (${process.platform} ${process.arch}; bun ${Bun.version}; ${context})`;
}

/** A usage error: a one-line reason, with the command's help printed under it. */
export function usageFailure(message: string, usage?: string) {
  const failure = new CliFailure("usage", message);
  failure.help = usage;
  return failure;
}

export function parseOptions(
  args: string[],
  options: OptionConfig = {},
  usage?: string,
) {
  try {
    return parseArgs({ args, options, allowPositionals: true, strict: true });
  } catch (error) {
    throw usageFailure(
      error instanceof Error ? error.message : String(error),
      usage,
    );
  }
}

export function wantsHelp(args: string[]) {
  return args.includes("--help") || args.includes("-h");
}

export function requirePositionals(
  positionals: string[],
  count: number,
  usage: string,
) {
  if (positionals.length === count) return;
  throw usageFailure(
    positionals.length > count
      ? `Unexpected argument: ${positionals[count]}`
      : `Expected ${count} argument${count === 1 ? "" : "s"}, got ${positionals.length}`,
    usage,
  );
}

export function positiveInteger(value: unknown, name: string) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new CliFailure("usage", `${name} must be a positive integer`);
  }
  return parsed.toString();
}

export function requiredString(value: unknown, name: string, usage: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw usageFailure(`${name} is required`, usage);
  }
  return value;
}

export function isoDate(value: unknown, usage: string) {
  const input = requiredString(value, "--date", usage);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(input);
  const normalized = ymd
    ? input
    : dmy
      ? `${dmy[3]}-${dmy[2]}-${dmy[1]}`
      : "";
  const date = new Date(`${normalized}T00:00:00.000Z`);

  if (
    !normalized ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw usageFailure("--date must use YYYY-MM-DD or DD-MM-YYYY", usage);
  }
  return date.toISOString();
}

export function repeatedStrings(value: unknown) {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string",
  );
}

export function parseJsonBody(
  positionals: string[],
  values: Record<string, unknown>,
  usage: string,
) {
  if (positionals.length === 0) return undefined;
  if (positionals.length !== 1 || Object.keys(values).length !== 0) {
    throw usageFailure("Pass one JSON object or use options, not both", usage);
  }

  let body: unknown;
  try {
    body = JSON.parse(positionals[0]);
  } catch {
    throw usageFailure("JSON body must be a valid object", usage);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw usageFailure("JSON body must be a valid object", usage);
  }
  return body;
}

export function enumValue<const Values extends readonly string[]>(
  value: unknown,
  name: string,
  values: Values,
): Values[number] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !values.includes(value)) {
    throw new CliFailure("usage", `${name} must be one of: ${values.join(", ")}`);
  }
  return value;
}

export function appendQuery(
  query: URLSearchParams,
  name: string,
  value: string | boolean | undefined,
) {
  if (value !== undefined) query.set(name, String(value));
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

/**
 * Client-side narrowing for `/currencies`, the one list endpoint that takes no
 * query parameters at all.
 * Works on both list shapes: a bare array, and `{items, hasMore, nextCursor}`.
 */
export function matchItems(
  search: string,
  labels: (item: Record<string, unknown>) => unknown[],
) {
  const wanted = search.trim().toLowerCase();
  const keep = (value: unknown) =>
    labels(asRecord(value)).some(
      (label) =>
        typeof label === "string" && label.toLowerCase().includes(wanted),
    );
  return (body: unknown) => {
    if (Array.isArray(body)) return body.filter(keep);
    const response = asRecord(body);
    return { ...response, items: asArray(response.items).filter(keep) };
  };
}

export function numeric(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

/**
 * A reference to another row, flattened: `{paidById, paidBy}` rather than a
 * nested `{paidBy: {id, name}}`. The id keys match the field names the write
 * endpoints take, so a `--json` read feeds straight back into a write.
 */
export function userRef(idKey: string, nameKey: string, value: unknown) {
  const user = asRecord(value);
  return { [idKey]: user.id ?? null, [nameKey]: user.name ?? null };
}

export function currencyCode(value: unknown) {
  return asRecord(value).code ?? null;
}

export function display(value: unknown) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

/**
 * Amounts arrive as 18-decimal strings and come back out of arithmetic as
 * floats, so both `"8.100000000000000000"` and `2397.5199999999995` have to
 * read as money. Two decimals is the floor, not the ceiling: a stored
 * `95.185` prints in full rather than rounding to a number nobody stored.
 * Rounding to eight decimals first is what turns `2397.5199999999995` back
 * into `2397.52` instead of printing the float artifact.
 */
export function humanNumber(value: unknown) {
  const parsed = numeric(value);
  if (parsed === null) return display(value);
  const rounded = Number(parsed.toFixed(8));
  const significant = rounded
    .toFixed(8)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
  if (rounded !== 0 && Math.abs(rounded) < 0.01) return significant;
  const decimals = significant.split(".")[1]?.length ?? 0;
  return rounded.toFixed(Math.max(2, decimals));
}

export function humanAmount(amount: unknown, currency: unknown) {
  if (numeric(amount) === null) return display(amount);
  return `${humanNumber(amount)}${currency ? ` ${String(currency)}` : ""}`;
}

/** The day of an API timestamp; the time of day is never the point here. */
export function humanDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : display(value);
}

export function yesNo(value: unknown) {
  return value === true ? "yes" : "no";
}

export function encodedDetailId(value: unknown) {
  if (typeof value !== "string" || !value) {
    throw new CliFailure("api", "Details are unavailable for this item");
  }
  return encodeURIComponent(value);
}
