#!/usr/bin/env bun

import { spawn, spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";
import { parseArgs } from "node:util";

const DEFAULT_API_URL = "https://api.bananasplit.net";
const DEFAULT_LIST_LIMIT = 5;
const PAGER_PROMPT = "↑/↓ navigate · q quit";
const REQUEST_TIMEOUT_MS = 15_000;

const ROOT_HELP = `Usage: banana [--json | --raw] <command>

Commands:
  me                         Show the authenticated user
  balance                    Show the aggregate balance
  balance users              Show balances by user
  balances                   Show balances by user
  friends [list]             List friends
  groups [list]              List groups
  groups create              Create a group
  groups get <group-id>      Show a group
  groups members <group-id>  List group members
  groups activities <group-id>
                             List group activities
  expenses add               Add an expense
  payments add               Add a payment

Output:
  --json                     Print curated operational JSON
  --raw                      Print the complete API response as JSON

Environment:
  BANANASPLIT_TOKEN          Required bearer session token
  BANANASPLIT_API_URL        API base URL (default: ${DEFAULT_API_URL})`;

const ME_HELP = "Usage: banana me";
const BALANCE_HELP = `Usage: banana balance [users]`;
const FRIENDS_HELP = `Usage: banana friends <command>

Commands:
  list [--limit N] [--cursor CURSOR] [--sort balance|lastActivity]
       [--filter all|guests]`;
const FRIENDS_LIST_HELP = `Usage: banana friends list [options]

Options:
  --limit N                     (default: ${DEFAULT_LIST_LIMIT})
  --cursor CURSOR
  --sort balance|lastActivity
  --filter all|guests`;
const GROUPS_HELP = `Usage: banana groups <command>

Commands:
  list [--limit N] [--cursor CURSOR] [--archived] [--sort balance|lastActivity]
  create JSON
  create --name TEXT --currency-id ID [--description TEXT]
         [--type vacation|roommates|couple|travel|party|other]
         [--member USER_ID]...
  get <group-id>
  members <group-id>
  activities <group-id> [--search QUERY] [--limit N] [--page N]
             [--type all|expenses|payments|recurring_expenses]
             [--sort date|amount] [--direction asc|desc]`;

const GROUPS_LIST_HELP = `Usage: banana groups list [options]

Options:
  --limit N                     (default: ${DEFAULT_LIST_LIMIT})
  --cursor CURSOR
  --archived
  --sort balance|lastActivity`;

const GROUPS_GET_HELP = "Usage: banana groups get <group-id>";
const GROUPS_MEMBERS_HELP = "Usage: banana groups members <group-id>";
const GROUPS_CREATE_HELP = `Usage: banana groups create JSON
   or: banana groups create --name TEXT --currency-id ID [options]

Options:
  --description TEXT
  --type vacation|roommates|couple|travel|party|other
  --member USER_ID              Repeat to add multiple members`;
const GROUPS_ACTIVITIES_HELP = `Usage: banana groups activities <group-id> [options]

Options:
  --search QUERY
  --limit N
  --page N
  --type all|expenses|payments|recurring_expenses
  --sort date|amount
  --direction asc|desc`;
const EXPENSES_HELP = `Usage: banana expenses add JSON
   or: banana expenses add --title TEXT --amount AMOUNT
                           --currency-id ID --paid-by-id ID --date DATE
                           [--group-id ID] [--description TEXT]
                           [--split-type equal|custom|percentage|shares]
                           [--split USER_ID=AMOUNT]...`;
const PAYMENTS_HELP = `Usage: banana payments add JSON
   or: banana payments add --amount AMOUNT --currency-id ID
                           --from-user-id ID --to-user-id ID --date DATE
                           [--group-id ID] [--description TEXT]`;

type ErrorType = "api" | "config" | "network" | "usage";
type Environment = Record<string, string | undefined>;
type OutputWriter = (value: string) => void;
type OutputMode = "human" | "json" | "raw";
type Pager = (value: string) => Promise<boolean>;
type Presentation =
  | "user"
  | "balance"
  | "balance-users"
  | "friend-list"
  | "group-list"
  | "group"
  | "members"
  | "activities"
  | "expense-created"
  | "payment-created"
  | "group-created";
type BrowserPresentation =
  | "balance-users"
  | "friend-list"
  | "group-list"
  | "members"
  | "activities";
type BrowserDetailLoader = (
  item: Record<string, unknown>,
) => Promise<string>;
type Browser = (
  presentation: BrowserPresentation,
  body: unknown,
  loadDetail: BrowserDetailLoader,
) => Promise<boolean>;
type BrowserDetailState =
  | { status: "loading"; title: string }
  | { status: "loaded"; title: string; value: string }
  | { status: "error"; title: string; message: string };
type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface CliRuntime {
  browser?: Browser;
  env?: Environment;
  fetch?: Fetch;
  pager?: Pager;
  stderr?: OutputWriter;
  stdout?: OutputWriter;
  timeoutMs?: number;
}

type RequestCommand = {
  kind: "request";
  path: string;
  presentation: Presentation;
  query?: URLSearchParams;
  method?: "POST";
  body?: unknown;
};

type HelpCommand = {
  kind: "help";
  text: string;
};

type ParsedCommand = HelpCommand | RequestCommand;

class CliFailure extends Error {
  constructor(
    readonly type: ErrorType,
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

type OptionConfig = Record<
  string,
  { type: "boolean" | "string"; short?: string; multiple?: boolean }
>;

function parseOptions(args: string[], options: OptionConfig = {}) {
  try {
    return parseArgs({ args, options, allowPositionals: true, strict: true });
  } catch (error) {
    throw new CliFailure(
      "usage",
      error instanceof Error ? error.message : String(error),
    );
  }
}

function wantsHelp(args: string[]) {
  return args.includes("--help") || args.includes("-h");
}

function parseOutputFlags(args: string[]) {
  const commandArgs = args.filter((arg) => arg !== "--json" && arg !== "--raw");
  const json = args.includes("--json");
  const raw = args.includes("--raw");

  if (json && raw) {
    throw new CliFailure("usage", "Choose only one of --json or --raw");
  }

  return {
    args: commandArgs,
    mode: (raw ? "raw" : json ? "json" : "human") as OutputMode,
  };
}

function hasInteractivePager() {
  if (process.env.CI || spawnSync("less", ["--version"]).status !== 0) {
    return false;
  }

  try {
    const terminal = openSync("/dev/tty", "r+");
    closeSync(terminal);
    return true;
  } catch {
    return false;
  }
}

async function pageWithLess(value: string) {
  let terminal: number;
  try {
    terminal = openSync("/dev/tty", "r+");
  } catch {
    return false;
  }

  try {
    const pager = spawn("less", ["-X", "-Q", `-Ps${PAGER_PROMPT}`], {
      stdio: ["pipe", terminal, terminal],
    });
    const exited = new Promise<boolean>((resolve) => {
      pager.once("error", () => resolve(false));
      pager.once("close", (code) => resolve(code === 0));
    });
    if (!pager.stdin) {
      pager.kill();
      return false;
    }
    pager.stdin.end(`${value}\n`);
    return await exited;
  } finally {
    closeSync(terminal);
  }
}

function isListPresentation(presentation: Presentation) {
  return (
    presentation === "balance-users" ||
    presentation === "friend-list" ||
    presentation === "group-list" ||
    presentation === "members" ||
    presentation === "activities"
  );
}

function isBrowserPresentation(
  presentation: Presentation,
): presentation is BrowserPresentation {
  return (
    presentation === "balance-users" ||
    presentation === "friend-list" ||
    presentation === "group-list" ||
    presentation === "members" ||
    presentation === "activities"
  );
}

function requirePositionals(
  positionals: string[],
  count: number,
  usage: string,
) {
  if (positionals.length !== count) {
    throw new CliFailure("usage", usage);
  }
}

function positiveInteger(value: unknown, name: string) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new CliFailure("usage", `${name} must be a positive integer`);
  }
  return parsed.toString();
}

function requiredString(value: unknown, name: string, usage: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new CliFailure("usage", `${name} is required\n${usage}`);
  }
  return value;
}

function repeatedStrings(value: unknown) {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string",
  );
}

function parseJsonBody(
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

function parseSplits(value: unknown) {
  return repeatedStrings(value).map((split) => {
    const separator = split.indexOf("=");
    if (separator < 1 || separator === split.length - 1) {
      throw new CliFailure(
        "usage",
        `--split must use USER_ID=AMOUNT\n${EXPENSES_HELP}`,
      );
    }
    return {
      userId: split.slice(0, separator),
      amount: split.slice(separator + 1),
    };
  });
}

function enumValue<const Values extends readonly string[]>(
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

function appendQuery(
  query: URLSearchParams,
  name: string,
  value: string | boolean | undefined,
) {
  if (value !== undefined) query.set(name, String(value));
}

function parseFriendsList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: FRIENDS_LIST_HELP };
  const { positionals, values } = parseOptions(args, {
    cursor: { type: "string" },
    filter: { type: "string" },
    limit: { type: "string" },
    sort: { type: "string" },
  });
  requirePositionals(positionals, 0, FRIENDS_LIST_HELP);

  const query = new URLSearchParams();
  appendQuery(
    query,
    "l",
    positiveInteger(values.limit, "--limit") ?? String(DEFAULT_LIST_LIMIT),
  );
  appendQuery(query, "cursor", values.cursor as string | undefined);
  appendQuery(
    query,
    "sort",
    enumValue(values.sort, "--sort", ["balance", "lastActivity"] as const),
  );
  appendQuery(
    query,
    "filter",
    enumValue(values.filter, "--filter", ["all", "guests"] as const),
  );

  return {
    kind: "request",
    path: "/friends",
    presentation: "friend-list",
    query,
  };
}

function parseFriends(args: string[]): ParsedCommand {
  if (args.length === 0) return parseFriendsList(args);
  if (args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: FRIENDS_HELP };
  }
  const [command, ...rest] = args;
  if (command === "list") return parseFriendsList(rest);
  throw new CliFailure("usage", FRIENDS_HELP);
}

function parseGroupsList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: GROUPS_LIST_HELP };
  const { positionals, values } = parseOptions(args, {
    archived: { type: "boolean" },
    cursor: { type: "string" },
    limit: { type: "string" },
    sort: { type: "string" },
  });
  requirePositionals(positionals, 0, GROUPS_LIST_HELP);

  const query = new URLSearchParams();
  appendQuery(
    query,
    "l",
    positiveInteger(values.limit, "--limit") ?? String(DEFAULT_LIST_LIMIT),
  );
  appendQuery(query, "cursor", values.cursor as string | undefined);
  appendQuery(query, "archived", values.archived as boolean | undefined);
  appendQuery(
    query,
    "sort",
    enumValue(values.sort, "--sort", ["balance", "lastActivity"] as const),
  );

  return {
    kind: "request",
    path: "/groups",
    presentation: "group-list",
    query,
  };
}

function parseGroupsCreate(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: GROUPS_CREATE_HELP };
  const { positionals, values } = parseOptions(args, {
    "currency-id": { type: "string" },
    description: { type: "string" },
    member: { type: "string", multiple: true },
    name: { type: "string" },
    type: { type: "string" },
  });
  const jsonBody = parseJsonBody(positionals, values, GROUPS_CREATE_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/groups",
      presentation: "group-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, GROUPS_CREATE_HELP);

  const description = values.description as string | undefined;
  const groupMembers = repeatedStrings(values.member);
  const type = enumValue(values.type, "--type", [
    "vacation",
    "roommates",
    "couple",
    "travel",
    "party",
    "other",
  ] as const);

  return {
    kind: "request",
    method: "POST",
    path: "/groups",
    presentation: "group-created",
    body: {
      name: requiredString(values.name, "--name", GROUPS_CREATE_HELP),
      currencyId: requiredString(
        values["currency-id"],
        "--currency-id",
        GROUPS_CREATE_HELP,
      ),
      ...(description === undefined ? {} : { description }),
      ...(type === undefined ? {} : { type }),
      ...(groupMembers.length === 0 ? {} : { groupMembers }),
    },
  };
}

function parseGroupsActivities(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: GROUPS_ACTIVITIES_HELP };
  const { positionals, values } = parseOptions(args, {
    direction: { type: "string" },
    limit: { type: "string" },
    page: { type: "string" },
    search: { type: "string" },
    sort: { type: "string" },
    type: { type: "string" },
  });
  requirePositionals(positionals, 1, GROUPS_ACTIVITIES_HELP);

  const query = new URLSearchParams();
  appendQuery(query, "l", positiveInteger(values.limit, "--limit"));
  appendQuery(query, "p", positiveInteger(values.page, "--page"));
  appendQuery(
    query,
    "type",
    enumValue(values.type, "--type", [
      "all",
      "expenses",
      "payments",
      "recurring_expenses",
    ] as const),
  );
  appendQuery(
    query,
    "sort",
    enumValue(values.sort, "--sort", ["date", "amount"] as const),
  );
  appendQuery(
    query,
    "direction",
    enumValue(values.direction, "--direction", ["asc", "desc"] as const),
  );

  const groupId = encodeURIComponent(positionals[0]);
  const search = values.search as string | undefined;
  if (search !== undefined) query.set("q", search);

  return {
    kind: "request",
    path: `/groups/${groupId}/activities${search === undefined ? "" : "/search"}`,
    presentation: "activities",
    query,
  };
}

function parseGroups(args: string[]): ParsedCommand {
  if (args.length === 0) return parseGroupsList(args);
  if (args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: GROUPS_HELP };
  }

  const [command, ...rest] = args;
  if (command === "list") return parseGroupsList(rest);
  if (command === "create") return parseGroupsCreate(rest);
  if (command === "activities") return parseGroupsActivities(rest);

  if (command === "get" || command === "members") {
    const help = command === "get" ? GROUPS_GET_HELP : GROUPS_MEMBERS_HELP;
    if (wantsHelp(rest)) return { kind: "help", text: help };
    const { positionals } = parseOptions(rest);
    requirePositionals(positionals, 1, help);
    return {
      kind: "request",
      path: `/groups/${encodeURIComponent(positionals[0])}${
        command === "members" ? "/members" : ""
      }`,
      presentation: command === "members" ? "members" : "group",
    };
  }

  throw new CliFailure("usage", GROUPS_HELP);
}

function parseExpenses(args: string[]): ParsedCommand {
  if (
    args.length === 0 ||
    args[0] === "--help" ||
    args[0] === "-h"
  ) {
    return { kind: "help", text: EXPENSES_HELP };
  }
  const [command, ...rest] = args;
  if (command !== "add") throw new CliFailure("usage", EXPENSES_HELP);
  if (wantsHelp(rest)) return { kind: "help", text: EXPENSES_HELP };

  const { positionals, values } = parseOptions(rest, {
    amount: { type: "string" },
    "currency-id": { type: "string" },
    date: { type: "string" },
    description: { type: "string" },
    "group-id": { type: "string" },
    "paid-by-id": { type: "string" },
    split: { type: "string", multiple: true },
    "split-type": { type: "string" },
    title: { type: "string" },
  });
  const jsonBody = parseJsonBody(positionals, values, EXPENSES_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/expenses",
      presentation: "expense-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, EXPENSES_HELP);

  const groupId = values["group-id"] as string | undefined;
  const description = values.description as string | undefined;
  const splits = parseSplits(values.split);
  const splitType = enumValue(values["split-type"], "--split-type", [
    "equal",
    "custom",
    "percentage",
    "shares",
  ] as const);
  if (splits.length === 0 && groupId === undefined) {
    throw new CliFailure(
      "usage",
      `At least one --split is required unless --group-id is provided\n${EXPENSES_HELP}`,
    );
  }
  if (splits.length === 0 && splitType !== undefined) {
    throw new CliFailure(
      "usage",
      `At least one --split is required with --split-type\n${EXPENSES_HELP}`,
    );
  }

  return {
    kind: "request",
    method: "POST",
    path: "/expenses",
    presentation: "expense-created",
    body: {
      title: requiredString(values.title, "--title", EXPENSES_HELP),
      amount: requiredString(values.amount, "--amount", EXPENSES_HELP),
      currencyId: requiredString(
        values["currency-id"],
        "--currency-id",
        EXPENSES_HELP,
      ),
      paidById: requiredString(
        values["paid-by-id"],
        "--paid-by-id",
        EXPENSES_HELP,
      ),
      date: requiredString(values.date, "--date", EXPENSES_HELP),
      splits,
      ...(groupId === undefined ? {} : { groupId }),
      ...(description === undefined ? {} : { description }),
      ...(splitType === undefined ? {} : { splitType }),
    },
  };
}

function parsePayments(args: string[]): ParsedCommand {
  if (
    args.length === 0 ||
    args[0] === "--help" ||
    args[0] === "-h"
  ) {
    return { kind: "help", text: PAYMENTS_HELP };
  }
  const [command, ...rest] = args;
  if (command !== "add") throw new CliFailure("usage", PAYMENTS_HELP);
  if (wantsHelp(rest)) return { kind: "help", text: PAYMENTS_HELP };

  const { positionals, values } = parseOptions(rest, {
    amount: { type: "string" },
    "currency-id": { type: "string" },
    date: { type: "string" },
    description: { type: "string" },
    "from-user-id": { type: "string" },
    "group-id": { type: "string" },
    "to-user-id": { type: "string" },
  });
  const jsonBody = parseJsonBody(positionals, values, PAYMENTS_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/payments",
      presentation: "payment-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, PAYMENTS_HELP);

  const groupId = values["group-id"] as string | undefined;
  const description = values.description as string | undefined;
  return {
    kind: "request",
    method: "POST",
    path: "/payments",
    presentation: "payment-created",
    body: {
      amount: requiredString(values.amount, "--amount", PAYMENTS_HELP),
      currencyId: requiredString(
        values["currency-id"],
        "--currency-id",
        PAYMENTS_HELP,
      ),
      fromUserId: requiredString(
        values["from-user-id"],
        "--from-user-id",
        PAYMENTS_HELP,
      ),
      toUserId: requiredString(
        values["to-user-id"],
        "--to-user-id",
        PAYMENTS_HELP,
      ),
      date: requiredString(values.date, "--date", PAYMENTS_HELP),
      ...(groupId === undefined ? {} : { groupId }),
      ...(description === undefined ? {} : { description }),
    },
  };
}

function parseCommand(args: string[]): ParsedCommand {
  if (
    args.length === 0 ||
    args[0] === "--help" ||
    args[0] === "-h" ||
    args[0] === "help"
  ) {
    return { kind: "help", text: ROOT_HELP };
  }

  if (args[0] === "balances") args = ["balance", "users", ...args.slice(1)];

  const [command, ...rest] = args;
  if (command === "me") {
    if (wantsHelp(rest)) return { kind: "help", text: ME_HELP };
    requirePositionals(rest, 0, ME_HELP);
    return {
      kind: "request",
      path: "/current-user",
      presentation: "user",
    };
  }

  if (command === "balance") {
    if (wantsHelp(rest)) return { kind: "help", text: BALANCE_HELP };
    if (rest.length === 0) {
      return {
        kind: "request",
        path: "/balance",
        presentation: "balance",
      };
    }
    if (rest.length === 1 && rest[0] === "users") {
      return {
        kind: "request",
        path: "/balance/users",
        presentation: "balance-users",
      };
    }
    throw new CliFailure("usage", BALANCE_HELP);
  }

  if (command === "friends") return parseFriends(rest);
  if (command === "groups") return parseGroups(rest);
  if (command === "expenses") return parseExpenses(rest);
  if (command === "payments") return parsePayments(rest);
  throw new CliFailure("usage", ROOT_HELP);
}

function readApiUrl(raw: string | undefined) {
  let url: URL;
  try {
    url = new URL(raw || DEFAULT_API_URL);
  } catch {
    throw new CliFailure("config", "BANANASPLIT_API_URL must be a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CliFailure(
      "config",
      "BANANASPLIT_API_URL must use http or https",
    );
  }

  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

function responseMessage(response: Response, body: unknown) {
  if (typeof body === "string" && body) return body;
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return `${response.status} ${response.statusText || "Request failed"}`;
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function request(
  command: RequestCommand,
  runtime: Required<Pick<CliRuntime, "fetch" | "timeoutMs">>,
  env: Environment,
) {
  const token = env.BANANASPLIT_TOKEN;
  if (!token) {
    throw new CliFailure("config", "BANANASPLIT_TOKEN is required");
  }

  const baseUrl = readApiUrl(env.BANANASPLIT_API_URL);
  const url = new URL(command.path.replace(/^\//, ""), baseUrl);
  command.query?.forEach((value, key) => url.searchParams.set(key, value));

  let response: Response;
  try {
    response = await runtime.fetch(url, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        ...(command.body === undefined
          ? {}
          : { "content-type": "application/json" }),
        "user-agent": "bananasplit-cli",
      },
      ...(command.method === undefined ? {} : { method: command.method }),
      ...(command.body === undefined
        ? {}
        : { body: JSON.stringify(command.body) }),
      signal: AbortSignal.timeout(runtime.timeoutMs),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    throw new CliFailure(
      "network",
      timedOut
        ? `Request timed out after ${runtime.timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : "Network request failed",
    );
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new CliFailure(
      "api",
      responseMessage(response, body),
      response.status,
      body,
    );
  }
  return body;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function numeric(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function cleanUserSummary(value: unknown) {
  const user = asRecord(value);
  return {
    id: user.id ?? null,
    name: user.name ?? null,
  };
}

function currencyCode(value: unknown) {
  return asRecord(value).code ?? null;
}

function cleanGroupList(body: unknown) {
  const response = asRecord(body);
  const items = asArray(response.items).map((value) => {
    const group = asRecord(value);
    const members = asArray(group.groupMembers)
      .map((member) => asRecord(member).name)
      .filter((name): name is string => typeof name === "string");

    return {
      id: group.id ?? null,
      name: group.name ?? null,
      description: group.description ?? null,
      type: group.type ?? null,
      currency: currencyCode(group.currency),
      balance: numeric(group.balance),
      memberCount: members.length,
      members,
      mostRecentActivity: group.mostRecentActivity ?? null,
    };
  });

  return {
    items,
    hasMore: response.hasMore === true,
    nextCursor: response.nextCursor ?? null,
  };
}

function cleanFriendList(body: unknown) {
  const response = asRecord(body);
  return {
    items: asArray(response.items).map((value) => {
      const friendship = asRecord(value);
      const user = asRecord(friendship.user);
      return {
        id: friendship.id ?? null,
        user: cleanUserSummary(user),
        balance: numeric(friendship.balance),
        currency: currencyCode(friendship.currency),
        isGuest: user.isGuest === true,
        isGold: user.isGold === true,
        mostRecentActivity: friendship.mostRecentActivity ?? null,
      };
    }),
    hasMore: response.hasMore === true,
    nextCursor: response.nextCursor ?? null,
  };
}

function cleanGroup(body: unknown) {
  const group = asRecord(body);
  return {
    id: group.id ?? null,
    name: group.name ?? null,
    description: group.description ?? null,
    type: group.type ?? null,
    currency: currencyCode(group.currency),
    balance: numeric(group.balance),
    totalOwed: numeric(group.totalOwed),
    totalOwing: numeric(group.totalOwing),
    memberCount: numeric(group.memberCount),
    defaultSplitType: group.defaultSplitType ?? null,
    useOptimalSettlement: group.useOptimalSettlement === true,
    memberBalanceVisibility: group.memberBalanceVisibility ?? null,
  };
}

function cleanMembers(body: unknown) {
  return asArray(body).map((value) => {
    const member = asRecord(value);
    return {
      id: member.id ?? null,
      userId: member.userId ?? null,
      name: member.name ?? null,
      role: member.role ?? null,
      isGuest: member.isGuest === true,
      isGold: member.isGold === true,
      defaultSplitPercentage: numeric(member.defaultSplitPercentage),
      joinedAt: member.joinedAt ?? null,
    };
  });
}

function cleanActivities(body: unknown) {
  return asArray(body).map((value) => {
    const activity = asRecord(value);
    if (activity.entity === "payment") {
      return {
        entity: "payment",
        id: activity.id ?? null,
        description: activity.description ?? null,
        amount: numeric(activity.amount),
        currency: currencyCode(activity.currency),
        date: activity.date ?? null,
        from: cleanUserSummary(activity.fromUser),
        to: cleanUserSummary(activity.toUser),
        isSettlement: activity.isSettlement === true,
      };
    }

    return {
      entity: "expense",
      id: activity.id ?? null,
      title: activity.title ?? null,
      amount: numeric(activity.amount),
      currency: currencyCode(activity.currency),
      date: activity.date ?? null,
      paidBy: cleanUserSummary(activity.paidByUser),
      category: asRecord(activity.category).name ?? null,
      splitType: activity.splitType ?? null,
      isRecurring: activity.recurringExpenseRuleId != null,
    };
  });
}

function cleanCreatedExpense(body: unknown) {
  const expense = asRecord(body);
  return {
    id: expense.id ?? null,
    title: expense.title ?? null,
    description: expense.description ?? null,
    amount: numeric(expense.amount),
    currencyId: expense.currencyId ?? null,
    paidById: expense.paidById ?? null,
    groupId: expense.groupId ?? null,
    date: expense.date ?? null,
    timezone: expense.timezone ?? null,
    splitType: expense.splitType ?? null,
    splits: asArray(expense.shares).map((value) => {
      const share = asRecord(value);
      return {
        userId: share.userId ?? null,
        amount: numeric(share.amount),
      };
    }),
  };
}

function cleanCreatedPaymentItem(value: unknown) {
  const payment = asRecord(value);
  return {
    id: payment.id ?? null,
    description: payment.description ?? null,
    amount: numeric(payment.amount),
    currencyId: payment.currencyId ?? null,
    fromUserId: payment.fromUserId ?? null,
    toUserId: payment.toUserId ?? null,
    groupId: payment.groupId ?? null,
    date: payment.date ?? null,
    timezone: payment.timezone ?? null,
    isSettlement: payment.isSettlement === true,
    usedOptimalSettlement: payment.usedOptimalSettlement === true,
  };
}

function cleanCreatedPayment(body: unknown) {
  return Array.isArray(body)
    ? body.map(cleanCreatedPaymentItem)
    : cleanCreatedPaymentItem(body);
}

function cleanCreatedGroup(body: unknown) {
  const group = asRecord(body);
  return {
    id: group.id ?? null,
    name: group.name ?? null,
    description: group.description ?? null,
    type: group.type ?? null,
    currencyId: group.currencyId ?? null,
    creatorId: group.creatorId ?? null,
    defaultSplitType: group.defaultSplitType ?? null,
    memberBalanceVisibility: group.memberBalanceVisibility ?? null,
  };
}

function cleanMemberDetail(body: unknown) {
  const member = asRecord(body);
  const user = asRecord(member.user);
  return {
    id: member.id ?? null,
    userId: member.userId ?? user.id ?? null,
    name: user.name ?? member.name ?? null,
    username: user.displayUsername ?? user.username ?? null,
    email: user.email ?? null,
    bio: user.bio ?? null,
    role: member.role ?? null,
    isGuest: member.isGuest === true,
    isGold: member.isGold === true,
    defaultSplitPercentage: numeric(member.defaultSplitPercentage),
    joinedAt: member.joinedAt ?? null,
  };
}

function cleanExpenseDetail(body: unknown) {
  const expense = asRecord(body);
  const recurrence = asRecord(expense.recurrence);
  return {
    id: expense.id ?? null,
    title: expense.title ?? null,
    description: expense.description ?? null,
    amount: numeric(expense.amount),
    currency: currencyCode(expense.currency),
    date: expense.date ?? null,
    timezone: expense.timezone ?? null,
    paidBy: cleanUserSummary(expense.paidByUser),
    creator: cleanUserSummary(expense.creator),
    group: cleanUserSummary(expense.group),
    category: asRecord(expense.category).name ?? null,
    splitType: expense.splitType ?? null,
    isRecurring:
      expense.recurringExpenseRuleId != null || expense.recurrence != null,
    recurrence:
      expense.recurrence == null
        ? null
        : {
            frequency: recurrence.frequency ?? null,
            interval: numeric(recurrence.interval),
          },
    splits: asArray(expense.shares).map((value) => {
      const share = asRecord(value);
      return {
        user: cleanUserSummary(share.user),
        userId: share.userId ?? null,
        amount: numeric(share.amount),
      };
    }),
  };
}

function cleanPaymentDetail(body: unknown) {
  const payment = asRecord(body);
  return {
    id: payment.id ?? null,
    description: payment.description ?? null,
    amount: numeric(payment.amount),
    currency: currencyCode(payment.currency),
    date: payment.date ?? null,
    timezone: payment.timezone ?? null,
    from: cleanUserSummary(payment.fromUser),
    to: cleanUserSummary(payment.toUser),
    creator: cleanUserSummary(payment.creator),
    group: cleanUserSummary(payment.group),
    isSettlement: payment.isSettlement === true,
    usedOptimalSettlement: payment.usedOptimalSettlement === true,
  };
}

function cleanBalanceDetail(
  body: unknown,
  item: Record<string, unknown>,
) {
  const response = asRecord(body);
  return {
    user: cleanUserSummary(item.user),
    balance: numeric(response.balance) ?? numeric(item.balance),
    totalOwed: numeric(item.totalOwed),
    totalOwing: numeric(item.totalOwing),
    currency: currencyCode(response.currency),
    breakdown: asArray(response.balanceByGroup).map((value) => {
      const entry = asRecord(value);
      const group = asRecord(entry.group);
      return {
        groupId: group.id ?? null,
        groupName: entry.group == null ? "Direct" : group.name ?? null,
        balance: numeric(entry.balance),
      };
    }),
  };
}

function cleanResponse(presentation: Presentation, body: unknown): unknown {
  const response = asRecord(body);
  switch (presentation) {
    case "user":
      return {
        id: response.id ?? null,
        name: response.name ?? null,
        email: response.email ?? null,
        username: response.username ?? null,
        isGuest: response.isGuest === true,
        currencyId: response.currencyId ?? null,
      };
    case "balance":
      return {
        balance: numeric(response.balance),
        totalOwed: numeric(response.totalOwed),
        totalOwing: numeric(response.totalOwing),
      };
    case "balance-users":
      return asArray(body).map((value) => {
        const entry = asRecord(value);
        return {
          user: cleanUserSummary(entry.user),
          balance: numeric(entry.balance),
          totalOwed: numeric(entry.totalOwed),
          totalOwing: numeric(entry.totalOwing),
        };
      });
    case "friend-list":
      return cleanFriendList(body);
    case "group-list":
      return cleanGroupList(body);
    case "group":
      return cleanGroup(body);
    case "members":
      return cleanMembers(body);
    case "activities":
      return cleanActivities(body);
    case "expense-created":
      return cleanCreatedExpense(body);
    case "payment-created":
      return cleanCreatedPayment(body);
    case "group-created":
      return cleanCreatedGroup(body);
  }
}

function display(value: unknown) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

function namedEntity(value: unknown) {
  const entity = asRecord(value);
  return `${display(entity.name)}${entity.id ? ` · ${String(entity.id)}` : ""}`;
}

function humanAmount(amount: unknown, currency: unknown) {
  return `${display(amount)}${currency ? ` ${String(currency)}` : ""}`;
}

function yesNo(value: unknown) {
  return value === true ? "yes" : "no";
}

function formatCard(index: number, title: unknown, fields: string[]) {
  return [
    `${index + 1}. ${display(title)}`,
    ...fields.map((field) => `   ${field}`),
  ].join("\n");
}

const ANSI = {
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  reset: "\x1b[0m",
};

function browserItems(presentation: BrowserPresentation, body: unknown) {
  return asArray(
    presentation === "group-list" || presentation === "friend-list"
      ? asRecord(body).items
      : body,
  ).map(asRecord);
}

function filterBrowserItems(
  presentation: BrowserPresentation,
  body: unknown,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  return browserItems(presentation, body).filter((item) =>
    JSON.stringify(item).toLowerCase().includes(normalizedQuery),
  );
}

function browserItemTitle(
  presentation: BrowserPresentation,
  item: Record<string, unknown>,
) {
  if (presentation === "balance-users") {
    return display(asRecord(item.user).name);
  }
  if (presentation === "friend-list") {
    return display(asRecord(item.user).name);
  }
  if (presentation === "group-list" || presentation === "members") {
    return display(item.name);
  }
  return item.entity === "payment"
    ? `Payment: ${display(item.description)}`
    : `Expense: ${display(item.title)}`;
}

function formatBrowserDetail(
  presentation: BrowserPresentation,
  item: Record<string, unknown>,
  body: unknown,
) {
  if (presentation === "balance-users") {
    const detail = asRecord(cleanBalanceDetail(body, item));
    const breakdown = asArray(detail.breakdown);
    return [
      `Balance: ${humanAmount(detail.balance, detail.currency)}`,
      `Owed: ${humanAmount(detail.totalOwed, detail.currency)}`,
      `Owing: ${humanAmount(detail.totalOwing, detail.currency)}`,
      `User ID: ${display(asRecord(detail.user).id)}`,
      "",
      "Balance breakdown",
      ...(breakdown.length
        ? breakdown.map((value) => {
            const entry = asRecord(value);
            return `${display(entry.groupName)}: ${humanAmount(entry.balance, detail.currency)}${
              entry.groupId ? ` · ${String(entry.groupId)}` : ""
            }`;
          })
        : ["—"]),
    ].join("\n");
  }

  if (presentation === "friend-list") {
    const friendship = asRecord(body);
    const user = asRecord(friendship.user);
    return [
      `Name: ${display(user.name)}`,
      `Balance: ${humanAmount(item.balance, item.currency)}`,
      `Guest: ${yesNo(user.isGuest)}`,
      `Gold: ${yesNo(user.isGold)}`,
      `Status: ${display(friendship.status)}`,
      `Accepted: ${display(friendship.acceptedAt)}`,
      `Last activity: ${display(item.mostRecentActivity)}`,
      `User ID: ${display(user.id)}`,
      `Friendship ID: ${display(friendship.id ?? item.id)}`,
    ].join("\n");
  }

  if (presentation === "group-list") {
    return formatHuman(
      "group",
      cleanGroup({ ...asRecord(body), memberCount: item.memberCount }),
    );
  }

  if (presentation === "members") {
    const member = asRecord(cleanMemberDetail(body));
    return [
      `Name: ${display(member.name)}`,
      `Username: ${display(member.username)}`,
      `Email: ${display(member.email)}`,
      `Bio: ${display(member.bio)}`,
      `Role: ${display(member.role)}`,
      `Guest: ${yesNo(member.isGuest)}`,
      `Gold: ${yesNo(member.isGold)}`,
      `Default split: ${display(member.defaultSplitPercentage)}`,
      `Joined: ${display(member.joinedAt)}`,
      `Member ID: ${display(member.id)}`,
      `User ID: ${display(member.userId)}`,
    ].join("\n");
  }

  if (item.entity === "payment") {
    const payment = asRecord(cleanPaymentDetail(body));
    return [
      `Description: ${display(payment.description)}`,
      `Amount: ${humanAmount(payment.amount, payment.currency)}`,
      `From: ${namedEntity(payment.from)}`,
      `To: ${namedEntity(payment.to)}`,
      `Settlement: ${yesNo(payment.isSettlement)}`,
      `Optimal settlement: ${yesNo(payment.usedOptimalSettlement)}`,
      `Date: ${display(payment.date)}`,
      `Timezone: ${display(payment.timezone)}`,
      `Group: ${namedEntity(payment.group)}`,
      `Created by: ${namedEntity(payment.creator)}`,
      `ID: ${display(payment.id)}`,
    ].join("\n");
  }

  const expense = asRecord(cleanExpenseDetail(body));
  const recurrence = asRecord(expense.recurrence);
  const splits = asArray(expense.splits);
  return [
    `Description: ${display(expense.description)}`,
    `Amount: ${humanAmount(expense.amount, expense.currency)}`,
    `Paid by: ${namedEntity(expense.paidBy)}`,
    `Category: ${display(expense.category)}`,
    `Split: ${display(expense.splitType)}`,
    `Recurring: ${yesNo(expense.isRecurring)}`,
    ...(expense.recurrence == null
      ? []
      : [
          `Recurrence frequency: ${display(recurrence.frequency)}`,
          `Recurrence interval: ${display(recurrence.interval)}`,
        ]),
    `Date: ${display(expense.date)}`,
    `Timezone: ${display(expense.timezone)}`,
    `Group: ${namedEntity(expense.group)}`,
    `Created by: ${namedEntity(expense.creator)}`,
    `ID: ${display(expense.id)}`,
    "",
    "Splits",
    ...(splits.length
      ? splits.map((value) => {
          const split = asRecord(value);
          const user = asRecord(split.user);
          return `${display(user.name ?? split.userId)}: ${humanAmount(split.amount, expense.currency)}${
            split.userId ? ` · ${String(split.userId)}` : ""
          }`;
        })
      : ["—"]),
  ].join("\n");
}

export function renderCollectionBrowser(
  presentation: BrowserPresentation,
  body: unknown,
  query = "",
  selectedIndex = 0,
  detail?: BrowserDetailState,
) {
  if (detail) {
    return [
      `${ANSI.bold}${ANSI.cyan}BANANA${ANSI.reset}`,
      "",
      `◆ ${ANSI.bold}${detail.title}${ANSI.reset}`,
      `  ${ANSI.dim}esc back · q quit${ANSI.reset}`,
      "",
      detail.status === "loading"
        ? `${ANSI.dim}Loading details…${ANSI.reset}`
        : detail.status === "error"
          ? `Unable to load details: ${detail.message}`
          : detail.value,
    ].join("\n");
  }

  const response = asRecord(body);
  const normalizedQuery = query.trim().toLowerCase();
  const allItems = browserItems(presentation, body);
  const items = filterBrowserItems(presentation, body, query);
  const activeIndex = Math.min(selectedIndex, Math.max(items.length - 1, 0));
  const label = {
    "balance-users": "user balances",
    "friend-list": "friends",
    "group-list": "groups",
    members: "group members",
    activities: "group activities",
  }[presentation];
  const count = `${ANSI.green}${items.length}${
    normalizedQuery ? `/${allItems.length}` : ""
  }${ANSI.reset}`;
  const lines = [
    `${ANSI.bold}${ANSI.cyan}BANANA${ANSI.reset}`,
    "",
    `┌─ ${ANSI.cyan} ${label} ${ANSI.reset}`,
    "│",
    `◇ Found ${count} ${label}`,
    "│",
    `◆ ${ANSI.bold}Browse ${label}${ANSI.reset}`,
    `  Search: ${query}${ANSI.cyan}█${ANSI.reset}`,
    `  ${ANSI.dim}↑↓ move · type search · enter details · esc clear · q quit${ANSI.reset}`,
    "",
    ...(items.length
      ? items.map((item, index) =>
          `${index === activeIndex ? `${ANSI.cyan}› ●${ANSI.reset}` : "  ○"} ${browserItemTitle(presentation, item)}`,
        )
      : [`  ${ANSI.dim}No matching ${label}.${ANSI.reset}`]),
  ];

  if (
    (presentation === "group-list" || presentation === "friend-list") &&
    response.hasMore
  ) {
    lines.push(
      "",
      `${ANSI.dim}More ${presentation === "group-list" ? "groups" : "friends"} are available from the API.${ANSI.reset}`,
    );
  }

  return lines.join("\n");
}

export function renderGroupBrowser(
  body: unknown,
  query = "",
  selectedIndex = 0,
) {
  return renderCollectionBrowser("group-list", body, query, selectedIndex);
}

function hasInteractiveBrowser() {
  return Boolean(
    !process.env.CI &&
      process.stdin.isTTY &&
      process.stdout.isTTY &&
      typeof process.stdin.setRawMode === "function",
  );
}

function encodedDetailId(value: unknown) {
  if (typeof value !== "string" || !value) {
    throw new CliFailure("api", "Details are unavailable for this item");
  }
  return encodeURIComponent(value);
}

async function loadBrowserDetail(
  command: RequestCommand,
  item: Record<string, unknown>,
  runtime: Required<Pick<CliRuntime, "fetch" | "timeoutMs">>,
  env: Environment,
) {
  const presentation = command.presentation as BrowserPresentation;
  let path: string;

  if (presentation === "balance-users") {
    path = `/users/${encodedDetailId(asRecord(item.user).id)}/balances`;
  } else if (presentation === "friend-list") {
    path = `/friends/${encodedDetailId(item.id)}`;
  } else if (presentation === "group-list") {
    path = `/groups/${encodedDetailId(item.id)}`;
  } else if (presentation === "members") {
    path = `${command.path}/${encodedDetailId(item.id)}`;
  } else {
    const collection = item.entity === "payment" ? "payments" : "expenses";
    path = `/${collection}/${encodedDetailId(item.id)}`;
  }

  const body = await request(
    { kind: "request", path, presentation: command.presentation },
    runtime,
    env,
  );
  return formatBrowserDetail(presentation, item, body);
}

async function browseCollection(
  presentation: BrowserPresentation,
  body: unknown,
  loadDetail: BrowserDetailLoader,
) {
  if (!hasInteractiveBrowser()) return false;

  const input = process.stdin;
  const output = process.stdout;
  const wasRaw = input.isRaw;
  let query = "";
  let selectedIndex = 0;
  let detail: BrowserDetailState | undefined;
  let detailGeneration = 0;
  let finished = false;

  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  output.write("\x1b[?1049h\x1b[?25l");

  return await new Promise<boolean>((resolve) => {
    const draw = () => {
      if (finished) return;
      output.write(
        `\x1b[H\x1b[2J${renderCollectionBrowser(presentation, body, query, selectedIndex, detail)}`,
      );
    };
    const finish = () => {
      finished = true;
      detailGeneration++;
      input.off("keypress", onKeypress);
      process.off("SIGWINCH", draw);
      input.setRawMode(wasRaw);
      input.pause();
      output.write("\x1b[?25h\x1b[?1049l");
      resolve(true);
    };
    const openDetail = async (item: Record<string, unknown>) => {
      const generation = ++detailGeneration;
      const title = browserItemTitle(presentation, item);
      detail = { status: "loading", title };
      draw();
      try {
        const value = await loadDetail(item);
        if (finished || generation !== detailGeneration) return;
        detail = { status: "loaded", title, value };
      } catch (error) {
        if (finished || generation !== detailGeneration) return;
        detail = {
          status: "error",
          title,
          message: error instanceof CliFailure ? error.message : "Unexpected error",
        };
      }
      draw();
    };
    const onKeypress = (
      text: string,
      key: { ctrl?: boolean; meta?: boolean; name?: string },
    ) => {
      const itemCount = filterBrowserItems(presentation, body, query).length;

      if ((key.ctrl && key.name === "c") || key.name === "q") {
        finish();
        return;
      }
      if (detail) {
        if (key.name === "escape") {
          detailGeneration++;
          detail = undefined;
          draw();
        }
        return;
      }
      if (key.name === "escape") {
        query = "";
        selectedIndex = 0;
      } else if (key.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
      } else if (key.name === "down") {
        selectedIndex = Math.min(Math.max(itemCount - 1, 0), selectedIndex + 1);
      } else if (key.name === "backspace" || key.name === "delete") {
        query = query.slice(0, -1);
        selectedIndex = 0;
      } else if (key.name === "return" || key.name === "enter") {
        const items = filterBrowserItems(presentation, body, query);
        const selected = items[Math.min(selectedIndex, items.length - 1)];
        if (selected) void openDetail(selected);
        return;
      } else if (text && !key.ctrl && !key.meta && text >= " " && text !== "\x7f") {
        query += text;
        selectedIndex = 0;
      }
      draw();
    };

    input.on("keypress", onKeypress);
    process.on("SIGWINCH", draw);
    draw();
  });
}

function formatHuman(presentation: Presentation, body: unknown) {
  const response = asRecord(body);
  switch (presentation) {
    case "user":
      return [
        `Name: ${display(response.name)}`,
        `Email: ${display(response.email)}`,
        `Username: ${display(response.username)}`,
        `Guest: ${yesNo(response.isGuest)}`,
        `Currency ID: ${display(response.currencyId)}`,
        `ID: ${display(response.id)}`,
      ].join("\n");
    case "balance":
      return [
        `Balance: ${display(response.balance)}`,
        `Owed: ${display(response.totalOwed)}`,
        `Owing: ${display(response.totalOwing)}`,
      ].join("\n");
    case "balance-users": {
      const items = asArray(body);
      if (!items.length) return "No user balances.";
      return [
        "User balances",
        ...items.map((value, index) => {
          const entry = asRecord(value);
          const user = asRecord(entry.user);
          return formatCard(index, user.name, [
            `User ID: ${display(user.id)}`,
            `Balance: ${display(entry.balance)}`,
            `Owed: ${display(entry.totalOwed)}`,
            `Owing: ${display(entry.totalOwing)}`,
          ]);
        }),
      ].join("\n\n");
    }
    case "friend-list": {
      const items = asArray(response.items);
      const lines = items.length
        ? [
            "Friends",
            ...items.map((value, index) => {
              const friendship = asRecord(value);
              const user = asRecord(friendship.user);
              return formatCard(index, user.name, [
                `Friendship ID: ${display(friendship.id)}`,
                `User ID: ${display(user.id)}`,
                `Balance: ${humanAmount(friendship.balance, friendship.currency)}`,
                `Guest: ${yesNo(friendship.isGuest)}`,
                `Gold: ${yesNo(friendship.isGold)}`,
                `Last activity: ${display(friendship.mostRecentActivity)}`,
              ]);
            }),
          ]
        : ["No friends."];
      lines.push(
        response.hasMore && response.nextCursor
          ? [
              "More friends available.",
              `Next page: banana friends list --cursor ${JSON.stringify(response.nextCursor)}`,
            ].join("\n")
          : "End of friends.",
      );
      return lines.join("\n\n");
    }
    case "group-list": {
      const items = asArray(response.items);
      const lines = items.length
        ? [
            "Groups",
            ...items.map((value, index) => {
              const group = asRecord(value);
              return formatCard(index, group.name, [
                `ID: ${display(group.id)}`,
                `Type: ${display(group.type)}`,
                `Description: ${display(group.description)}`,
                `Balance: ${humanAmount(group.balance, group.currency)}`,
                `Members: ${display(group.memberCount)}`,
                `Last activity: ${display(group.mostRecentActivity)}`,
              ]);
            }),
          ]
        : ["No groups."];
      lines.push(
        response.hasMore && response.nextCursor
          ? [
              "More groups available.",
              `Next page: banana groups list --cursor ${JSON.stringify(response.nextCursor)}`,
            ].join("\n")
          : "End of groups.",
      );
      return lines.join("\n\n");
    }
    case "group":
      return [
        `Name: ${display(response.name)}`,
        `Description: ${display(response.description)}`,
        `Type: ${display(response.type)}`,
        `Currency: ${display(response.currency)}`,
        `Balance: ${humanAmount(response.balance, response.currency)}`,
        `Owed: ${humanAmount(response.totalOwed, response.currency)}`,
        `Owing: ${humanAmount(response.totalOwing, response.currency)}`,
        `Members: ${display(response.memberCount)}`,
        `Default split: ${display(response.defaultSplitType)}`,
        `Optimal settlement: ${yesNo(response.useOptimalSettlement)}`,
        `Balance visibility: ${display(response.memberBalanceVisibility)}`,
        `ID: ${display(response.id)}`,
      ].join("\n");
    case "members": {
      const items = asArray(body);
      if (!items.length) return "No group members.";
      return [
        "Group members",
        ...items.map((value, index) => {
          const member = asRecord(value);
          return formatCard(index, member.name, [
            `Role: ${display(member.role)}`,
            `Guest: ${yesNo(member.isGuest)}`,
            `Gold: ${yesNo(member.isGold)}`,
            `Default split: ${display(member.defaultSplitPercentage)}`,
            `Joined: ${display(member.joinedAt)}`,
            `Member ID: ${display(member.id)}`,
            `User ID: ${display(member.userId)}`,
          ]);
        }),
      ].join("\n\n");
    }
    case "activities": {
      const items = asArray(body);
      if (!items.length) return "No group activities.";
      return [
        "Group activities",
        ...items.map((value, index) => {
          const activity = asRecord(value);
          if (activity.entity === "payment") {
            const from = asRecord(activity.from);
            const to = asRecord(activity.to);
            return formatCard(index, `Payment: ${display(activity.description)}`, [
              `Amount: ${humanAmount(activity.amount, activity.currency)}`,
              `From: ${display(from.name)}`,
              `To: ${display(to.name)}`,
              `Settlement: ${yesNo(activity.isSettlement)}`,
              `Date: ${display(activity.date)}`,
              `ID: ${display(activity.id)}`,
            ]);
          }
          const paidBy = asRecord(activity.paidBy);
          return formatCard(index, `Expense: ${display(activity.title)}`, [
            `Amount: ${humanAmount(activity.amount, activity.currency)}`,
            `Paid by: ${display(paidBy.name)}`,
            `Category: ${display(activity.category)}`,
            `Split: ${display(activity.splitType)}`,
            `Recurring: ${yesNo(activity.isRecurring)}`,
            `Date: ${display(activity.date)}`,
            `ID: ${display(activity.id)}`,
          ]);
        }),
      ].join("\n\n");
    }
    case "expense-created": {
      const splits = asArray(response.splits);
      return [
        "Expense created",
        `Title: ${display(response.title)}`,
        `Amount: ${humanAmount(response.amount, response.currencyId)}`,
        `Paid by: ${display(response.paidById)}`,
        `Group ID: ${display(response.groupId)}`,
        `Date: ${display(response.date)}`,
        `Split type: ${display(response.splitType)}`,
        `ID: ${display(response.id)}`,
        "",
        "Splits",
        ...(splits.length
          ? splits.map((value) => {
              const split = asRecord(value);
              return `${display(split.userId)}: ${humanAmount(split.amount, response.currencyId)}`;
            })
          : ["—"]),
      ].join("\n");
    }
    case "payment-created": {
      const payments = Array.isArray(body) ? body : [body];
      return [
        payments.length === 1
          ? "Payment created"
          : `${payments.length} payments created`,
        ...payments.map((value, index) => {
          const payment = asRecord(value);
          return formatCard(index, payment.id, [
            `Amount: ${humanAmount(payment.amount, payment.currencyId)}`,
            `From: ${display(payment.fromUserId)}`,
            `To: ${display(payment.toUserId)}`,
            `Group ID: ${display(payment.groupId)}`,
            `Date: ${display(payment.date)}`,
          ]);
        }),
      ].join("\n\n");
    }
    case "group-created":
      return [
        "Group created",
        `Name: ${display(response.name)}`,
        `Description: ${display(response.description)}`,
        `Type: ${display(response.type)}`,
        `Currency ID: ${display(response.currencyId)}`,
        `Default split: ${display(response.defaultSplitType)}`,
        `Balance visibility: ${display(response.memberBalanceVisibility)}`,
        `ID: ${display(response.id)}`,
      ].join("\n");
  }
}

function serializeFailure(error: unknown) {
  const failure =
    error instanceof CliFailure
      ? error
      : new CliFailure(
          "network",
          error instanceof Error ? error.message : String(error),
        );
  return {
    exitCode: failure.type === "usage" ? 2 : 1,
    json: JSON.stringify({
      error: {
        type: failure.type,
        ...(failure.status === undefined ? {} : { status: failure.status }),
        message: failure.message,
        ...(failure.body === undefined ? {} : { body: failure.body }),
      },
    }),
  };
}

export async function runCli(
  args: string[],
  runtime: CliRuntime = {},
): Promise<number> {
  const stdout = runtime.stdout ?? console.log;
  const stderr = runtime.stderr ?? console.error;

  try {
    const output = parseOutputFlags(args);
    const command = parseCommand(output.args);
    if (command.kind === "help") {
      stdout(command.text);
      return 0;
    }

    const browserPresentation = isBrowserPresentation(command.presentation)
      ? command.presentation
      : undefined;

    const pager =
      output.mode === "human" && isListPresentation(command.presentation)
        ? (runtime.pager ??
          (runtime.stdout === undefined &&
          !browserPresentation &&
          hasInteractivePager()
            ? pageWithLess
            : undefined))
        : undefined;
    const browser =
      output.mode === "human" && browserPresentation
        ? (runtime.browser ??
          (runtime.stdout === undefined && hasInteractiveBrowser()
            ? browseCollection
            : undefined))
        : undefined;
    const hasExplicitLimit = output.args.some(
      (arg) => arg === "--limit" || arg.startsWith("--limit="),
    );
    if (
      (pager || browser) &&
      (command.presentation === "group-list" ||
        command.presentation === "friend-list") &&
      !hasExplicitLimit
    ) {
      command.query?.delete("l");
    }

    const requestRuntime = {
      fetch: runtime.fetch ?? globalThis.fetch,
      timeoutMs: runtime.timeoutMs ?? REQUEST_TIMEOUT_MS,
    };
    const env = runtime.env ?? process.env;
    let body = await request(command, requestRuntime, env);
    if (output.mode !== "raw" && command.presentation === "group") {
      const members = await request(
        {
          kind: "request",
          path: `${command.path}/members`,
          presentation: "members",
        },
        requestRuntime,
        env,
      );
      body = {
        ...asRecord(body),
        memberCount: asArray(members).length,
      };
    }
    if (output.mode === "raw") {
      stdout(JSON.stringify(body));
    } else {
      const clean = cleanResponse(command.presentation, body);
      if (output.mode === "json") {
        stdout(JSON.stringify(clean));
      } else {
        const human = formatHuman(command.presentation, clean);
        if (
          (!browser ||
            !browserPresentation ||
            !(await browser(
              browserPresentation,
              clean,
              (item) => loadBrowserDetail(command, item, requestRuntime, env),
            ))) &&
          (!pager || !(await pager(human)))
        ) {
          stdout(human);
        }
      }
    }
    return 0;
  } catch (error) {
    const failure = serializeFailure(error);
    stderr(failure.json);
    return failure.exitCode;
  }
}

if (import.meta.main) {
  process.exitCode = await runCli(process.argv.slice(2));
}
