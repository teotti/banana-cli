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

export function parseOptions(args: string[], options: OptionConfig = {}) {
  try {
    return parseArgs({ args, options, allowPositionals: true, strict: true });
  } catch (error) {
    throw new CliFailure(
      "usage",
      error instanceof Error ? error.message : String(error),
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
  if (positionals.length !== count) throw new CliFailure("usage", usage);
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
    throw new CliFailure("usage", `${name} is required\n${usage}`);
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
    throw new CliFailure(
      "usage",
      "--date must use YYYY-MM-DD or DD-MM-YYYY",
    );
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
    throw new CliFailure(
      "usage",
      `Pass one JSON object or use options, not both\n${usage}`,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(positionals[0]);
  } catch {
    throw new CliFailure("usage", `JSON body must be a valid object\n${usage}`);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CliFailure("usage", `JSON body must be a valid object\n${usage}`);
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

export function cleanUserSummary(value: unknown) {
  const user = asRecord(value);
  return { id: user.id ?? null, name: user.name ?? null };
}

export function currencyCode(value: unknown) {
  return asRecord(value).code ?? null;
}

export function display(value: unknown) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

export function namedEntity(value: unknown) {
  const entity = asRecord(value);
  return `${display(entity.name)}${entity.id ? ` · ${String(entity.id)}` : ""}`;
}

export function humanAmount(amount: unknown, currency: unknown) {
  return `${display(amount)}${currency ? ` ${String(currency)}` : ""}`;
}

export function yesNo(value: unknown) {
  return value === true ? "yes" : "no";
}

export function formatCard(index: number, title: unknown, fields: string[]) {
  return [
    `${index + 1}. ${display(title)}`,
    ...fields.map((field) => `   ${field}`),
  ].join("\n");
}

export function encodedDetailId(value: unknown) {
  if (typeof value !== "string" || !value) {
    throw new CliFailure("api", "Details are unavailable for this item");
  }
  return encodeURIComponent(value);
}
