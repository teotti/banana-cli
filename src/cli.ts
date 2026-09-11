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
import { colorizeHelp, errorText, helpHeader, helpText } from "./help";
import { DEFAULT_API_URL, request } from "./request";
import { resolveReferences } from "./resolve";
import { asArray, asRecord, usageFailure } from "./shared";
import {
  CliFailure,
  type BrowserLevel,
  type BrowserLink,
  type BrowserPresentation,
  type CliRuntime,
  type CommandParser,
  type OutputMode,
  type Presentation,
  type Presenter,
  type RequestCommand,
} from "./types";
import { installSkill, parseSkill, SKILL_TEXT } from "./skill";
import { updateCli } from "./update";

const ROOT_HELP = helpText({
  usage: ["banana <command> [--json | --raw]"],
  sections: [
    {
      title: "BALANCES",
      rows: [
        ["balance", "Show the aggregate balance"],
        ["balance users", "Show balances by user"],
        ["balances", "Alias for `balance users`"],
      ],
    },
    {
      title: "EXPENSES & PAYMENTS",
      rows: [
        ["expenses list", "List the authenticated user's expenses"],
        ["expenses add", "Add an expense"],
        ["expenses get <expense-id>", "Show an expense"],
        ["expenses edit <expense-id>", "Edit an expense"],
        ["payments add", "Add a payment"],
        ["payments get <payment-id>", "Show a payment"],
      ],
    },
    {
      title: "GROUPS & FRIENDS",
      rows: [
        ["groups [list]", "List groups"],
        ["groups create", "Create a group"],
        ["groups get <group>", "Show a group"],
        ["groups members <group>", "List group members"],
        ["groups activities <group>", "List group activities"],
        ["friends [list]", "List friends"],
        ["currencies [list]", "List currencies"],
      ],
    },
    {
      title: "ACCOUNT & CLI",
      rows: [
        ["me", "Show the authenticated user"],
        ["login", "Sign in with a browser and store credentials securely"],
        ["logout", "Revoke and delete stored credentials"],
        ["update", "Update the CLI to the latest stable release"],
        ["skill install", "Install the agent skill for driving this CLI"],
      ],
    },
    {
      title: "OUTPUT",
      rows: [
        ["--json", "Print curated operational JSON"],
        ["--raw", "Print the complete API response as JSON"],
      ],
    },
    {
      title: "ENVIRONMENT",
      rows: [
        ["BANANASPLIT_API_URL", `API base URL (default: ${DEFAULT_API_URL})`],
        ["BANANASPLIT_AUTH_URL", "Auth base URL (default: API origin + /api)"],
      ],
    },
  ],
  notes: [
    "Currencies, groups and people are named by code, name or prefix\nwherever a command takes one — ids work too, and `me` is you.",
  ],
  examples: [
    "banana balance",
    "banana expenses list --limit 10",
    'banana expenses add --title Dinner --amount 42 --currency EUR \\',
    '  --date 2026-09-09 --group "Lisbon trip"',
    "banana expenses get <expense-id> --json",
  ],
  learnMore: ["banana <command> --help"],
});

const AUTH_HELP: Record<"login" | "logout", string> = {
  login: helpText({
    summary: "Sign in through the browser and store renewable credentials securely.",
    usage: ["banana login"],
    examples: ["banana login"],
  }),
  logout: helpText({
    summary: "Revoke and delete the stored credentials.",
    usage: ["banana logout"],
    examples: ["banana logout"],
  }),
};

const UPDATE_HELP = helpText({
  summary: "Update the CLI to the latest stable release.",
  usage: ["banana update"],
  examples: ["banana update"],
});

/** Where a write's created row is read back from, to present it in full. */
const CREATED_COLLECTIONS: Partial<Record<Presentation, string>> = {
  "expense-created": "/expenses",
  "group-created": "/groups",
  "payment-created": "/payments",
};

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
    throw usageFailure(`Unexpected argument: ${rest[0]}`, UPDATE_HELP);
  }
  if (name === "skill") return parseSkill(rest);
  if (name === "login" || name === "logout") {
    if (rest.length === 0) return { action: name, kind: "auth" as const };
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      return { kind: "help" as const, text: AUTH_HELP[name] };
    }
    throw usageFailure(`Unexpected argument: ${rest[0]}`, AUTH_HELP[name]);
  }
  const parser = COMMANDS[name];
  if (!parser) throw usageFailure(`Unknown command: ${name}`, ROOT_HELP);
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
        ? errorText(failure.message, failure.help)
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
      (command.kind === "auth" ||
        command.kind === "update" ||
        command.kind === "skill") &&
      output.mode !== "human"
    ) {
      throw new CliFailure(
        "usage",
        `--${output.mode} is not supported for banana ${
          command.kind === "auth"
            ? command.action
            : command.kind === "skill"
              ? "skill"
              : "update"
        }`,
      );
    }

    const env = runtime.env ?? process.env;
    if (command.kind === "skill") {
      stdout(
        command.print
          ? SKILL_TEXT
          : await (runtime.installSkill ?? installSkill)(command, { env }),
      );
      return 0;
    }
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

    // Names become ids before anything is sent, so a write costs the caller
    // no lookup call of its own.
    if (command.references?.length) {
      command.path = await resolveReferences(
        command.references,
        command.body,
        command.path,
        requestRuntime,
        env,
      );
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

    // A write answers with the flat DB row: currency ids instead of codes, no
    // names, no shares. Reading the row back here is what lets one command
    // print — and answer --json with — the whole created object, so nothing
    // has to follow up with a `get` to see what it made.
    const created = CREATED_COLLECTIONS[command.presentation];
    if (
      output.mode !== "raw" &&
      created &&
      command.presentation === "payment-created" &&
      Array.isArray(body)
    ) {
      // An optimal settlement answers with several rows and no single id.
      command.presentation = "payments-created";
    }
    const createdId = created ? asRecord(body).id : undefined;
    const detailPath =
      output.mode === "raw"
        ? undefined
        : command.presentation === "expense-updated"
          ? command.path
          : typeof createdId === "string"
            ? `${created}/${encodeURIComponent(createdId)}`
            : undefined;
    if (detailPath) {
      body = await request(
        {
          kind: "request",
          path: detailPath,
          presentation: command.presentation,
        },
        requestRuntime,
        env,
      );
    }

    // A group's member count is a second call wherever a group is shown.
    if (
      output.mode !== "raw" &&
      (command.presentation === "group" ||
        (command.presentation === "group-created" && detailPath))
    ) {
      const members = await request(
        {
          kind: "request",
          path: `${detailPath ?? command.path}/members`,
          presentation: "members",
        },
        requestRuntime,
        env,
      );
      body = { ...asRecord(body), memberCount: asArray(members).length };
    }

    if (command.postFilter) body = command.postFilter(body);

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
    // Every browsable collection — the one asked for and any drilled into from
    // an item's details — is browsed the same way, off its own command.
    const browserLevel = (
      levelCommand: RequestCommand,
      levelBody: unknown,
    ): BrowserLevel => {
      const levelPresenter = PRESENTERS[levelCommand.presentation];
      const browserPresenter = levelPresenter.browser;
      return {
        presentation: levelCommand.presentation as BrowserPresentation,
        body: levelBody,
        async loadDetail(item) {
          if (!browserPresenter) {
            throw new CliFailure("api", "Details are unavailable for this item");
          }
          const detail = await request(
            {
              kind: "request",
              path: browserPresenter.detailPath(levelCommand, item),
              presentation: levelCommand.presentation,
            },
            requestRuntime,
            env,
          );
          return browserPresenter.formatDetail(item, detail);
        },
        links: browserPresenter?.links
          ? (item) => browserPresenter.links!(levelCommand, item)
          : undefined,
        loadPage:
          levelCommand.presentation === "expense-list" ||
          levelCommand.presentation === "activities"
            ? async (cursor: string) => {
                const query = new URLSearchParams(levelCommand.query);
                query.set("cursor", cursor);
                return levelPresenter.clean(
                  await request(
                    { ...levelCommand, query },
                    requestRuntime,
                    env,
                  ),
                );
              }
            : undefined,
      };
    };
    const level = browserLevel(command, clean);
    const openLink = async (link: BrowserLink) => {
      const linkCommand: RequestCommand = {
        kind: "request",
        path: link.path,
        presentation: link.presentation,
        query: link.query,
      };
      const linkBody = PRESENTERS[link.presentation].clean(
        await request(linkCommand, requestRuntime, env),
      );
      return browserLevel(linkCommand, linkBody);
    };
    if (
      (!browser ||
        !browserPresentation ||
        !(await browser(browserPresentation, clean, level.loadDetail,
          level.loadPage, { links: level.links, open: openLink }))) &&
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
