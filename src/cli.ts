import {
  browseCollection,
  hasInteractiveBrowser,
  hasInteractivePager,
  isBrowserPresentation,
  isListPresentation,
  pageWithLess,
} from "./browser";
import { createAuthRuntime, login, logout } from "./auth";
import { balancePresenters, parseBalance } from "./commands/balance";
import { currencyPresenters, parseCurrencies } from "./commands/currencies";
import {
  expensePresenters,
  mergeExpenseBody,
  parseExpenses,
} from "./commands/expenses";
import { friendPresenters, parseFriends } from "./commands/friends";
import { groupPresenters, parseGroups } from "./commands/groups";
import { mePresenters, parseMe } from "./commands/me";
import { parsePayments, paymentPresenters } from "./commands/payments";
import { colorizeHelp, helpHeader } from "./help";
import { DEFAULT_API_URL, request } from "./request";
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
import { updateCli } from "./update";

const ROOT_HELP = `USAGE
  banana [--json | --raw] <command>

BALANCES
  balance                    Show the aggregate balance
  balance users              Show balances by user
  balances                   Show balances by user

EXPENSES & PAYMENTS
  expenses list              List the authenticated user's expenses
  expenses add               Add an expense
  expenses get <expense-id>  Show an expense
  expenses edit <expense-id> Edit an expense
  payments add               Add a payment
  payments get <payment-id>  Show a payment

GROUPS & FRIENDS
  groups [list]              List groups
  groups create              Create a group
  groups get <group-id>      Show a group
  groups members <group-id>  List group members
  groups activities <group-id>
                             List group activities
  friends [list]             List friends
  currencies [list]          List currencies

ACCOUNT & CLI
  me                         Show the authenticated user
  login                      Sign in with a browser and store credentials securely
  logout                     Revoke and delete stored credentials
  update                     Update the CLI to the latest stable release

OUTPUT
  --json                     Print curated operational JSON
  --raw                      Print the complete API response as JSON

ENVIRONMENT
  BANANASPLIT_API_URL        API base URL (default: ${DEFAULT_API_URL})
  BANANASPLIT_AUTH_URL       Auth base URL (default: API origin + /api)

Run \`banana <command> --help\` for the options of a command.`;

const AUTH_HELP: Record<"login" | "logout", string> = {
  login: `USAGE
  banana login

Sign in through the browser and store renewable credentials securely.`,
  logout: `USAGE
  banana logout

Revoke and delete the stored credentials.`,
};

const UPDATE_HELP = `USAGE
  banana update

Update the CLI to the latest stable release.`;

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
    return { kind: "help" as const, text: `${helpHeader()}

${ROOT_HELP}` };
  }
  if (args[0] === "balances") args = ["balance", "users", ...args.slice(1)];
  const [name, ...rest] = args;
  if (name === "update") {
    if (rest.length === 0) return { kind: "update" as const };
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      return { kind: "help" as const, text: UPDATE_HELP };
    }
    throw new CliFailure("usage", UPDATE_HELP);
  }
  if (name === "login" || name === "logout") {
    if (rest.length === 0) return { action: name, kind: "auth" as const };
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      return { kind: "help" as const, text: AUTH_HELP[name] };
    }
    throw new CliFailure("usage", AUTH_HELP[name]);
  }
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
    exitCode:
      failure.type === "cancelled" ? 130 : failure.type === "usage" ? 2 : 1,
    output:
      mode === "human"
        ? colorizeHelp(`Error: ${failure.message}`)
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
      stdout(colorizeHelp(command.text));
      return 0;
    }
    if (
      (command.kind === "auth" || command.kind === "update") &&
      output.mode !== "human"
    ) {
      throw new CliFailure(
        "usage",
        `--${output.mode} is not supported for banana ${
          command.kind === "auth" ? command.action : "update"
        }`,
      );
    }

    const env = runtime.env ?? process.env;
    if (command.kind === "update") {
      stdout(await (runtime.update ?? updateCli)());
      return 0;
    }
    const requestRuntime = createAuthRuntime(runtime);
    if (command.kind === "auth") {
      if (command.action === "login") {
        await login(requestRuntime, env, stdout, stderr);
      } else {
        await logout(requestRuntime, env, stdout);
      }
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
        command.presentation === "expense-list" ||
        command.presentation === "friend-list") &&
      !hasExplicitLimit
    ) {
      command.query?.delete("l");
    }

    if (command.mergeExpense !== undefined) {
      const current = await request(
        {
          kind: "request",
          path: command.mergeExpense,
          presentation: "expense",
        },
        requestRuntime,
        env,
      );
      command.body = mergeExpenseBody(
        current,
        asRecord(command.body) as Record<string, unknown>,
      );
    }
    let body = await request(command, requestRuntime, env);
    if (output.mode !== "raw" && command.presentation === "expense-updated") {
      // PUT answers with a flat row, so re-read the expense for its
      // paidBy / group / category / splits expansions.
      body = await request(
        {
          kind: "request",
          path: command.path,
          presentation: "expense-updated",
        },
        requestRuntime,
        env,
      );
    }
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
    const loadPage = command.presentation === "expense-list"
      ? async (cursor: string) => {
          const query = new URLSearchParams(command.query);
          query.set("cursor", cursor);
          return presenter.clean(await request(
            { ...command, query }, requestRuntime, env,
          ));
        }
      : undefined;
    if (
      (!browser ||
        !browserPresentation ||
        !(await browser(browserPresentation, clean, loadDetail, loadPage))) &&
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
