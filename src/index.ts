#!/usr/bin/env bun

import { spawn, spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { parseArgs } from "node:util";

const DEFAULT_API_URL = "https://api.bananasplit.net";
const DEFAULT_GROUPS_LIMIT = 5;
const PAGER_PROMPT = "↑/↓ navigate · q quit";
const REQUEST_TIMEOUT_MS = 15_000;

const ROOT_HELP = `Usage: banana [--json | --raw] <command>

Commands:
  me                         Show the authenticated user
  balance                    Show the aggregate balance
  balance users              Show balances by user
  groups list                List groups
  groups get <group-id>      Show a group
  groups members <group-id>  List group members
  groups activities <group-id>
                             List group activities

Output:
  --json                     Print curated operational JSON
  --raw                      Print the complete API response as JSON

Environment:
  BANANASPLIT_TOKEN          Required bearer session token
  BANANASPLIT_API_URL        API base URL (default: ${DEFAULT_API_URL})`;

const ME_HELP = "Usage: banana me";
const BALANCE_HELP = `Usage: banana balance [users]`;
const GROUPS_HELP = `Usage: banana groups <command>

Commands:
  list [--limit N] [--cursor CURSOR] [--archived] [--sort balance|lastActivity]
  get <group-id>
  members <group-id>
  activities <group-id> [--search QUERY] [--limit N] [--page N]
             [--type all|expenses|payments|recurring_expenses]
             [--sort date|amount] [--direction asc|desc]`;

const GROUPS_LIST_HELP = `Usage: banana groups list [options]

Options:
  --limit N                     (default: ${DEFAULT_GROUPS_LIMIT})
  --cursor CURSOR
  --archived
  --sort balance|lastActivity`;

const GROUPS_GET_HELP = "Usage: banana groups get <group-id>";
const GROUPS_MEMBERS_HELP = "Usage: banana groups members <group-id>";
const GROUPS_ACTIVITIES_HELP = `Usage: banana groups activities <group-id> [options]

Options:
  --search QUERY
  --limit N
  --page N
  --type all|expenses|payments|recurring_expenses
  --sort date|amount
  --direction asc|desc`;

type ErrorType = "api" | "config" | "network" | "usage";
type Environment = Record<string, string | undefined>;
type OutputWriter = (value: string) => void;
type OutputMode = "human" | "json" | "raw";
type Pager = (value: string) => Promise<boolean>;
type Presentation =
  | "user"
  | "balance"
  | "balance-users"
  | "group-list"
  | "group"
  | "members"
  | "activities";
type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface CliRuntime {
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
  { type: "boolean" | "string"; short?: string }
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
    positiveInteger(values.limit, "--limit") ?? String(DEFAULT_GROUPS_LIMIT),
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
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: GROUPS_HELP };
  }

  const [command, ...rest] = args;
  if (command === "list") return parseGroupsList(rest);
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

function parseCommand(args: string[]): ParsedCommand {
  if (
    args.length === 0 ||
    args[0] === "--help" ||
    args[0] === "-h" ||
    args[0] === "help"
  ) {
    return { kind: "help", text: ROOT_HELP };
  }

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

  if (command === "groups") return parseGroups(rest);
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
        "user-agent": "bananasplit-cli",
      },
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
    case "group-list":
      return cleanGroupList(body);
    case "group":
      return cleanGroup(body);
    case "members":
      return cleanMembers(body);
    case "activities":
      return cleanActivities(body);
  }
}

function display(value: unknown) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
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

    const pager =
      output.mode === "human" && isListPresentation(command.presentation)
        ? (runtime.pager ??
          (runtime.stdout === undefined && hasInteractivePager()
            ? pageWithLess
            : undefined))
        : undefined;
    const hasExplicitLimit = output.args.some(
      (arg) => arg === "--limit" || arg.startsWith("--limit="),
    );
    if (pager && command.presentation === "group-list" && !hasExplicitLimit) {
      command.query?.delete("l");
    }

    let body = await request(
      command,
      {
        fetch: runtime.fetch ?? globalThis.fetch,
        timeoutMs: runtime.timeoutMs ?? REQUEST_TIMEOUT_MS,
      },
      runtime.env ?? process.env,
    );
    if (output.mode !== "raw" && command.presentation === "group") {
      const members = await request(
        {
          kind: "request",
          path: `${command.path}/members`,
          presentation: "members",
        },
        {
          fetch: runtime.fetch ?? globalThis.fetch,
          timeoutMs: runtime.timeoutMs ?? REQUEST_TIMEOUT_MS,
        },
        runtime.env ?? process.env,
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
        if (!pager || !(await pager(human))) {
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
