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
import {
  findCreatedRecurring,
  mergeRecurringBody,
  nameRecurring,
  parseRecurring,
  RECURRING_PATH,
  recurringPresenters,
} from "./commands/recurring";
import { version as CLI_VERSION } from "../package.json";
import { formatChecks, overall, runDoctor } from "./doctor";
import { uninstallCli } from "./uninstall";
import { colorizeHelp, errorText, helpHeader, helpText, supportsColor } from "./help";
import { request } from "./request";
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
        ["expenses delete <expense-id>", "Delete an expense"],
        ["recurring list", "List recurring expense rules"],
        ["recurring add", "Add a recurring expense rule"],
        ["recurring get <rule-id>", "Show a recurring rule"],
        ["recurring edit <rule-id>", "Edit or pause a recurring rule"],
        ["recurring delete <rule-id>", "Delete a recurring rule"],
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
        ["doctor", "Check the CLI, your login and the agent skill"],
        ["version", "Print the installed version"],
        ["upgrade", "Upgrade the CLI to the latest stable release"],
        ["update", "Alias for `upgrade`"],
        ["skill install", "Install the agent skill for driving this CLI"],
        ["skill uninstall", "Remove the agent skill again"],
        ["uninstall", "Remove the CLI and the login it stored"],
      ],
    },
    {
      title: "OUTPUT",
      rows: [
        ["--json", "Print curated operational JSON"],
        ["--raw", "Print the complete API response as JSON"],
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

const DOCTOR_HELP = helpText({
  summary: "Check that the CLI, your login and the agent skill are in order.",
  usage: ["banana doctor [--json]"],
  notes: [
    "It checks the version, which `banana` your shell runs, the API it talks\nto, whether you are signed in, and whether an installed skill still\nmatches this version of the CLI.",
    "Each check is ok, warn or fail, and anything that can be fixed by running\nsomething says what. Exit 1 if a check failed.",
  ],
  examples: ["banana doctor", "banana doctor --json"],
});

const UNINSTALL_HELP = helpText({
  summary: "Remove the CLI and the login it stored.",
  usage: ["banana uninstall [--yes]"],
  options: [["--yes", "Do not ask before removing anything"]],
  notes: [
    "It removes the binary (or the npm package, however you installed it) and\nrevokes your login before deleting it.",
    "The agent skill and, on Windows, the Path entry are named but left alone;\n`banana skill uninstall` removes the skill.",
    "Without a terminal to ask in, it prints what it would remove and stops\nunless --yes is given.",
  ],
  examples: ["banana uninstall", "banana uninstall --yes"],
});

const VERSION_HELP = helpText({
  summary: "Print the installed version.",
  usage: ["banana version"],
  examples: ["banana version"],
});

const UPGRADE_HELP = helpText({
  summary: "Upgrade the CLI to the latest stable release.",
  usage: ["banana upgrade"],
  notes: ["`banana update` is the older name for this command, and still works."],
  examples: ["banana upgrade"],
});

/** Where a write's created row is read back from, to present it in full. */
const CREATED_COLLECTIONS: Partial<Record<Presentation, string>> = {
  "expense-created": "/expenses",
  "recurring-created": RECURRING_PATH,
  "group-created": "/groups",
  "payment-created": "/payments",
};

/** Presentations whose rows carry ids where every other row carries names. */
const NAMED_RECURRING = new Set<Presentation>([
  "recurring-list",
  "recurring",
  "recurring-created",
  "recurring-updated",
  "recurring-deleted",
]);

const COMMANDS: Record<string, CommandParser> = {
  balance: parseBalance,
  currencies: parseCurrencies,
  expenses: parseExpenses,
  friends: parseFriends,
  groups: parseGroups,
  me: parseMe,
  payments: parsePayments,
  recurring: parseRecurring,
};

const PRESENTERS: Record<Presentation, Presenter> = {
  ...mePresenters,
  ...balancePresenters,
  ...currencyPresenters,
  ...friendPresenters,
  ...groupPresenters,
  ...expensePresenters,
  ...recurringPresenters,
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
  // A rule is its own row, not an expense, so `recurring` is a command of its
  // own — but it is under `expenses` that people look for it.
  if (args[0] === "expenses" && args[1] === "recurring") args = args.slice(1);
  const [name, ...rest] = args;
  // `update` is what this command shipped as; `upgrade` is what people reach
  // for. Both run it, and the help page names the canonical one.
  if (name === "upgrade" || name === "update") {
    if (rest.length === 0) return { kind: "update" as const };
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      return { kind: "help" as const, text: UPGRADE_HELP };
    }
    throw usageFailure(`Unexpected argument: ${rest[0]}`, UPGRADE_HELP);
  }
  if (name === "doctor") {
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      return { kind: "help" as const, text: DOCTOR_HELP };
    }
    if (rest.length > 0) {
      throw usageFailure(`Unexpected argument: ${rest[0]}`, DOCTOR_HELP);
    }
    return { kind: "doctor" as const };
  }
  if (name === "uninstall") {
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      return { kind: "help" as const, text: UNINSTALL_HELP };
    }
    const yes = rest.length === 1 && (rest[0] === "--yes" || rest[0] === "-y");
    if (rest.length === 0 || yes) {
      return { kind: "uninstall" as const, yes };
    }
    throw usageFailure(`Unexpected argument: ${rest[0]}`, UNINSTALL_HELP);
  }
  if (name === "version") {
    if (rest.length === 0) return { kind: "version" as const };
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      return { kind: "help" as const, text: VERSION_HELP };
    }
    throw usageFailure(`Unexpected argument: ${rest[0]}`, VERSION_HELP);
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
    if (command.kind === "doctor" && output.mode === "raw") {
      throw new CliFailure(
        "usage",
        "--raw is not supported for banana doctor",
      );
    }
    if (
      (command.kind === "auth" ||
        command.kind === "update" ||
        command.kind === "version" ||
        command.kind === "uninstall" ||
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
              : command.kind === "version"
                ? "version"
                : command.kind === "uninstall"
                  ? "uninstall"
                  : "upgrade"
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
    if (command.kind === "version") {
      stdout(`banana version ${CLI_VERSION}`);
      return 0;
    }
    if (command.kind === "update") {
      stdout(await (runtime.update ?? updateCli)());
      return 0;
    }
    const requestRuntime = createAuthRuntime(runtime);
    if (command.kind === "doctor") {
      const { checks, failed } = await (runtime.doctor ??
        (() =>
          runDoctor({
            env,
            whoami: async () => {
              const body = await request(
                { kind: "request", path: "/current-user", presentation: "user" },
                requestRuntime,
                env,
              );
              const name = asRecord(body).name;
              return typeof name === "string" ? name : "you";
            },
          })))();
      stdout(
        output.mode === "json"
          ? JSON.stringify({ checks, status: overall(checks), ok: !failed })
          : formatChecks(checks, runtime.stdout === undefined && supportsColor()),
      );
      return failed ? 1 : 0;
    }
    if (command.kind === "uninstall") {
      stdout(
        await (runtime.uninstall ??
          ((only: { yes: boolean }) =>
            uninstallCli(only, {
              // `logout` reports to the terminal; here its sentence belongs in
              // the uninstall summary instead.
              logout: async () => {
                let said: string | undefined;
                await logout(requestRuntime, env, (line) => {
                  said = line;
                });
                return said;
              },
            })))(command),
      );
      return 0;
    }
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

    if (command.merge !== undefined) {
      const current = await request(
        {
          kind: "request",
          path: command.merge.path,
          presentation: command.merge.kind === "recurring" ? "recurring" : "expense",
        },
        requestRuntime,
        env,
      );
      const mergeBody =
        command.merge.kind === "recurring" ? mergeRecurringBody : mergeExpenseBody;
      command.body = mergeBody(
        current,
        asRecord(command.body) as Record<string, unknown>,
      );
    }
    // A deleted row cannot be read back, so the receipt is read before the
    // delete rather than after it — what goes is named, not just an id.
    const receipt =
      output.mode !== "raw" && command.presentation === "expense-deleted"
        ? await request(
            { kind: "request", path: command.path, presentation: "expense" },
            requestRuntime,
            env,
          )
        : undefined;
    let body = await request(command, requestRuntime, env);
    if (receipt !== undefined) body = receipt;

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
    // `POST /expenses/recurring` answers `201 Created` with no row at all, so
    // the id every read-back needs is found in the listing instead.
    if (
      output.mode !== "raw" &&
      command.presentation === "recurring-created" &&
      typeof asRecord(body).id !== "string"
    ) {
      body = findCreatedRecurring(
        command.body,
        await request(
          {
            kind: "request",
            path: RECURRING_PATH,
            presentation: "recurring-list",
            query: new URLSearchParams({ status: "all" }),
          },
          requestRuntime,
          env,
        ),
      );
    }
    const createdId = created ? asRecord(body).id : undefined;
    const detailPath =
      output.mode === "raw"
        ? undefined
        : command.presentation === "expense-updated" ||
            command.presentation === "recurring-updated"
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

    // A rule points at its currency, payer and group by id and nothing else,
    // so the names the terminal prints are looked up here.
    if (output.mode !== "raw" && NAMED_RECURRING.has(command.presentation)) {
      body = await nameRecurring(body, (path, query) =>
        request(
          { kind: "request", path, presentation: "user", query },
          requestRuntime,
          env,
        ),
      );
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
