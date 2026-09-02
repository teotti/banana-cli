import {
  browseCollection,
  hasInteractiveBrowser,
  hasInteractivePager,
  isBrowserPresentation,
  isListPresentation,
  pageWithLess,
} from "./browser";
import { balancePresenters, parseBalance } from "./commands/balance";
import { currencyPresenters, parseCurrencies } from "./commands/currencies";
import { expensePresenters, parseExpenses } from "./commands/expenses";
import { friendPresenters, parseFriends } from "./commands/friends";
import { groupPresenters, parseGroups } from "./commands/groups";
import { mePresenters, parseMe } from "./commands/me";
import { parsePayments, paymentPresenters } from "./commands/payments";
import { DEFAULT_API_URL, REQUEST_TIMEOUT_MS, request } from "./request";
import { asArray, asRecord } from "./shared";
import {
  CliFailure,
  type CliRuntime,
  type CommandParser,
  type OutputMode,
  type Presentation,
  type Presenter,
  type RequestCommand,
} from "./types";

const ROOT_HELP = `Usage: banana [--json | --raw] <command>

Commands:
  me                         Show the authenticated user
  balance                    Show the aggregate balance
  balance users              Show balances by user
  balances                   Show balances by user
  currencies [list]          List currencies
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

const COMMANDS: Record<string, CommandParser> = {
  balance: parseBalance,
  currencies: parseCurrencies,
  expenses: parseExpenses,
  friends: parseFriends,
  groups: parseGroups,
  me: parseMe,
  payments: parsePayments,
};

const PRESENTERS: Record<Presentation, Presenter> = {
  ...mePresenters,
  ...balancePresenters,
  ...currencyPresenters,
  ...friendPresenters,
  ...groupPresenters,
  ...expensePresenters,
  ...paymentPresenters,
};

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

function parseCommand(args: string[]) {
  if (
    args.length === 0 ||
    args[0] === "--help" ||
    args[0] === "-h" ||
    args[0] === "help"
  ) {
    return { kind: "help" as const, text: ROOT_HELP };
  }
  if (args[0] === "balances") args = ["balance", "users", ...args.slice(1)];
  const [name, ...rest] = args;
  const parser = COMMANDS[name];
  if (!parser) throw new CliFailure("usage", ROOT_HELP);
  return parser(rest);
}

function serializeFailure(error: unknown, mode: OutputMode) {
  const failure =
    error instanceof CliFailure
      ? error
      : new CliFailure(
          "network",
          error instanceof Error ? error.message : String(error),
        );
  const json = JSON.stringify({
    error: {
      type: failure.type,
      ...(failure.status === undefined ? {} : { status: failure.status }),
      message: failure.message,
      ...(failure.body === undefined ? {} : { body: failure.body }),
    },
  });
  return {
    exitCode: failure.type === "usage" ? 2 : 1,
    output:
      mode === "human"
        ? `Error: ${failure.message}`
        : mode === "raw" &&
            failure.type === "api" &&
            failure.body !== undefined &&
            failure.body !== null
          ? JSON.stringify(failure.body)
          : json,
  };
}

export async function runCli(
  args: string[],
  runtime: CliRuntime = {},
): Promise<number> {
  const stdout = runtime.stdout ?? console.log;
  const stderr = runtime.stderr ?? console.error;
  const outputMode: OutputMode = args.includes("--json")
    ? "json"
    : args.includes("--raw")
      ? "raw"
      : "human";

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
      body = { ...asRecord(body), memberCount: asArray(members).length };
    }

    if (output.mode === "raw") {
      stdout(JSON.stringify(body));
      return 0;
    }

    const presenter = PRESENTERS[command.presentation];
    const clean = presenter.clean(body);
    if (output.mode === "json") {
      stdout(JSON.stringify(clean));
      return 0;
    }

    const human = presenter.format(clean);
    const browserPresenter = presenter.browser;
    const loadDetail = async (item: Record<string, unknown>) => {
      if (!browserPresenter) {
        throw new CliFailure("api", "Details are unavailable for this item");
      }
      const detailCommand: RequestCommand = {
        kind: "request",
        path: browserPresenter.detailPath(command, item),
        presentation: command.presentation,
      };
      const detail = await request(detailCommand, requestRuntime, env);
      return browserPresenter.formatDetail(item, detail);
    };
    if (
      (!browser ||
        !browserPresentation ||
        !(await browser(browserPresentation, clean, loadDetail))) &&
      (!pager || !(await pager(human)))
    ) {
      stdout(human);
    }
    return 0;
  } catch (error) {
    const failure = serializeFailure(error, outputMode);
    stderr(failure.output);
    return failure.exitCode;
  }
}
