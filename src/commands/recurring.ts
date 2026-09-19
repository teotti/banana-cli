import {
  asArray,
  asRecord,
  display,
  enumValue,
  humanAmount,
  humanDate,
  isoDate,
  numeric,
  parseJsonBody,
  parseOptions,
  positiveInteger,
  repeatedStrings,
  requiredString,
  requirePositionals,
  usageFailure,
  wantsHelp,
  yesNo,
} from "../shared";
import { splitEvenly } from "./expenses";
import { helpText } from "../help";
import { fields, heading, note, section, table } from "../render";
import {
  CliFailure,
  type ParsedCommand,
  type Presenter,
  type Reference,
} from "../types";

/** Where every recurring rule lives; `/expenses` itself holds the occurrences. */
export const RECURRING_PATH = "/expenses/recurring";

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
const SPLIT_TYPES = "equal|custom|percentage|shares";
const NAMES_NOTE =
  "--currency, --group, --paid-by and --split take a code, a name or a\nprefix of one, as well as an id. `--paid-by me` is you.";
const DATE_NOTE =
  "--start and --end take YYYY-MM-DD or DD-MM-YYYY, and accept a time after\na T (2026-09-16T21:20:00). Without an offset the time is read as UTC.";
const SPLITS_NOTE =
  "The splits are the template every occurrence is created from, so at least\none --split is required and they must add up to --amount.";

const HELP = helpText({
  summary: "List, add, inspect and edit the rules that create expenses on a schedule.",
  usage: ["banana recurring <command> [flags]"],
  commands: [
    ["list", "List your recurring rules"],
    ["add", "Add a recurring rule"],
    ["get <rule-id>", "Show one rule, its splits and what it created"],
    ["edit <rule-id>", "Change fields of a rule, or pause it"],
    ["delete <rule-id>", "Delete a rule"],
  ],
  notes: [
    "A rule is not an expense: it creates one every time it comes round.\n`banana expenses list --recurring` lists the expenses it made.",
    "`banana expenses recurring <command>` reaches the same commands.",
  ],
  examples: [
    "banana recurring list",
    "banana recurring get <rule-id>",
    "banana recurring edit <rule-id> --inactive",
  ],
  learnMore: ["banana recurring <command> --help"],
});
const LIST_HELP = helpText({
  summary: "List the recurring rules you are part of.",
  usage: ["banana recurring list [flags]"],
  options: [["--status all|active|inactive", "Which rules to list (default: all)"]],
  notes: ["The listing is not paged: it answers with every rule at once."],
  examples: [
    "banana recurring list",
    "banana recurring list --status active --json",
  ],
});
const GET_HELP = helpText({
  summary: "Show one recurring rule, how it splits, and the expenses it created.",
  usage: ["banana recurring get <rule-id>"],
  examples: [
    "banana recurring get <rule-id>",
    "banana recurring get <rule-id> --json",
  ],
});
const ADD_HELP = helpText({
  summary: "Add a rule that creates the same expense on a schedule.",
  usage: [
    "banana recurring add --title TEXT --amount AMOUNT --currency CODE",
    "                    --frequency FREQ --start DATE --split WHO=AMOUNT",
    "                    [flags]",
    "banana recurring add JSON",
  ],
  options: [
    ["--title TEXT", "What the expense is for (required)"],
    ["--amount AMOUNT", "Total amount of each occurrence (required)"],
    ["--currency CODE", "Currency of the amount (required)"],
    ["--frequency FREQ", `${FREQUENCIES.join("|")} (required)`],
    ["--start DATE", "First occurrence (required)"],
    ["--split WHO=AMOUNT", "One person's share; repeat for each split"],
    ["--interval N", "Run every N periods instead of every one (default: 1)"],
    ["--end DATE", "Stop after this date"],
    ["--paid-by WHO", "Who pays (default: you)"],
    ["--group NAME", "Charge each occurrence to a group"],
    ["--description TEXT", "Longer note"],
    ["--split-type TYPE", SPLIT_TYPES],
  ],
  notes: [SPLITS_NOTE, NAMES_NOTE, DATE_NOTE],
  examples: [
    "banana recurring add --title Rent --amount 900 --currency EUR \\",
    "  --frequency monthly --start 2026-10-01 --group Flat \\",
    "  --split me=450 --split Ana=450",
    "banana recurring add --title Netflix --amount 12 --currency EUR \\",
    "  --frequency monthly --start 2026-10-05 --split me=6 --split Ana=6",
  ],
});
const EDIT_HELP = helpText({
  summary: "Change one or more fields of a recurring rule, or pause it.",
  usage: [
    "banana recurring edit <rule-id> [flags]",
    "banana recurring edit <rule-id> JSON",
  ],
  options: [
    ["--title TEXT", "What the expense is for"],
    ["--amount AMOUNT", "Total amount of each occurrence"],
    ["--currency CODE", "Currency of the amount"],
    ["--frequency FREQ", FREQUENCIES.join("|")],
    ["--interval N", "Run every N periods instead of every one"],
    ["--start DATE", "First occurrence"],
    ["--end DATE", "Stop after this date"],
    ["--no-end", "Let the rule run with no end date"],
    ["--paid-by WHO", "Who pays"],
    ["--group NAME", "Charge each occurrence to a group"],
    ["--no-group", "Detach the rule from its group"],
    ["--description TEXT", "Longer note"],
    ["--split-type TYPE", SPLIT_TYPES],
    ["--split WHO=AMOUNT", "One person's share; repeat for each split"],
    ["--active", "Resume a paused rule"],
    ["--inactive", "Pause the rule without deleting it"],
  ],
  notes: [
    "Only the fields you pass change; everything else keeps its current value.\nChanging --amount means passing splits that add up to the new total.",
    "Pausing a rule stops it creating expenses and leaves the ones it already\ncreated alone.",
    NAMES_NOTE,
    DATE_NOTE,
  ],
  examples: [
    "banana recurring edit <rule-id> --amount 950 --split me=475 --split Ana=475",
    "banana recurring edit <rule-id> --inactive",
    "banana recurring edit <rule-id> --end 2027-01-01",
  ],
});
const DELETE_HELP = helpText({
  summary: "Delete a recurring rule.",
  usage: ["banana recurring delete <rule-id>"],
  notes: [
    "This removes the rule itself. To stop it creating expenses without\nremoving it, use `banana recurring edit <rule-id> --inactive`.",
  ],
  examples: ["banana recurring delete <rule-id>"],
});

function parseSplits(value: unknown, usage: string) {
  return repeatedStrings(value).map((split) => {
    const separator = split.indexOf("=");
    if (separator < 1 || separator === split.length - 1) {
      throw usageFailure("--split must use WHO=AMOUNT", usage);
    }
    return {
      userId: split.slice(0, separator),
      amount: split.slice(separator + 1),
    };
  });
}

/** Every `--split WHO=AMOUNT` names a person the same way `--paid-by` does. */
function splitReferences(splits: { userId: string }[]): Reference[] {
  return splits.map((split, index) => ({
    field: `splits.${index}.userId`,
    flag: "--split",
    kind: "user" as const,
    value: split.userId,
  }));
}

const WRITE_OPTIONS = {
  amount: { type: "string" },
  currency: { type: "string" },
  description: { type: "string" },
  end: { type: "string" },
  frequency: { type: "string" },
  group: { type: "string" },
  interval: { type: "string" },
  "paid-by": { type: "string" },
  split: { type: "string", multiple: true },
  "split-type": { type: "string" },
  start: { type: "string" },
  title: { type: "string" },
} as const;

export function parseRecurring(args: string[]): ParsedCommand {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  const [command, ...rest] = args;
  if (command === "list") return parseRecurringList(rest);
  if (command === "get") {
    if (wantsHelp(rest)) return { kind: "help", text: GET_HELP };
    const { positionals } = parseOptions(rest, {}, GET_HELP);
    requirePositionals(positionals, 1, GET_HELP);
    return {
      kind: "request",
      path: `${RECURRING_PATH}/${encodeURIComponent(positionals[0])}`,
      presentation: "recurring",
    };
  }
  if (command === "delete") {
    if (wantsHelp(rest)) return { kind: "help", text: DELETE_HELP };
    const { positionals } = parseOptions(rest, {}, DELETE_HELP);
    requirePositionals(positionals, 1, DELETE_HELP);
    return {
      kind: "request",
      method: "DELETE",
      path: `${RECURRING_PATH}/${encodeURIComponent(positionals[0])}`,
      presentation: "recurring-deleted",
    };
  }
  if (command === "edit") return parseRecurringEdit(rest);
  if (command !== "add") {
    throw usageFailure(`Unknown command: recurring ${command}`, HELP);
  }
  return parseRecurringAdd(rest);
}

function parseRecurringList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: LIST_HELP };
  const { positionals, values } = parseOptions(
    args,
    { status: { type: "string" } },
    LIST_HELP,
  );
  requirePositionals(positionals, 0, LIST_HELP);
  const query = new URLSearchParams({
    // The API's own default is not part of the contract, so the CLI states
    // one: everything, with an Active column to tell them apart.
    status:
      enumValue(values.status, "--status", ["all", "active", "inactive"] as const) ??
      "all",
  });
  return {
    kind: "request",
    path: RECURRING_PATH,
    presentation: "recurring-list",
    query,
  };
}

function parseRecurringAdd(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: ADD_HELP };
  const { positionals, values } = parseOptions(args, WRITE_OPTIONS, ADD_HELP);
  const jsonBody = parseJsonBody(positionals, values, ADD_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: RECURRING_PATH,
      presentation: "recurring-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, ADD_HELP);

  const group = values.group as string | undefined;
  const description = values.description as string | undefined;
  const end = values.end as string | undefined;
  const splits = parseSplits(values.split, ADD_HELP);
  const splitType = enumValue(values["split-type"], "--split-type", [
    "equal",
    "custom",
    "percentage",
    "shares",
  ] as const);
  // Unlike a plain expense, the API takes no rule without splits: there is no
  // group to spread an occurrence over at the moment it is generated.
  if (splits.length === 0) {
    throw usageFailure("At least one --split is required", ADD_HELP);
  }

  return {
    kind: "request",
    method: "POST",
    path: RECURRING_PATH,
    presentation: "recurring-created",
    body: {
      title: requiredString(values.title, "--title", ADD_HELP),
      amount: requiredString(values.amount, "--amount", ADD_HELP),
      frequency: requiredFrequency(values.frequency, ADD_HELP),
      interval: Number(positiveInteger(values.interval, "--interval") ?? "1"),
      startDate: isoDate(values.start, ADD_HELP, "--start"),
      splits,
      ...(end === undefined ? {} : { endDate: isoDate(end, ADD_HELP, "--end") }),
      ...(description === undefined ? {} : { description }),
      ...(splitType === undefined ? {} : { splitType }),
    },
    references: [
      {
        field: "currencyId",
        flag: "--currency",
        kind: "currency",
        value: requiredString(values.currency, "--currency", ADD_HELP),
      },
      // Left without a value on purpose: a rule you do not attribute to anyone
      // else is one you pay.
      {
        field: "paidById",
        flag: "--paid-by",
        kind: "user",
        value: values["paid-by"] as string | undefined,
      },
      ...(group === undefined
        ? []
        : [{ field: "groupId", flag: "--group", kind: "group" as const, value: group }]),
      ...splitReferences(splits),
    ],
  };
}

function requiredFrequency(value: unknown, usage: string) {
  return enumValue(
    requiredString(value, "--frequency", usage),
    "--frequency",
    FREQUENCIES,
  )!;
}

function parseRecurringEdit(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: EDIT_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      ...WRITE_OPTIONS,
      active: { type: "boolean" },
      inactive: { type: "boolean" },
      "no-end": { type: "boolean" },
      "no-group": { type: "boolean" },
    },
    EDIT_HELP,
  );
  if (positionals.length === 0) {
    throw usageFailure("A recurring rule id is required", EDIT_HELP);
  }
  const [id, ...rest] = positionals;
  const path = `${RECURRING_PATH}/${encodeURIComponent(id)}`;

  const jsonBody = parseJsonBody(rest, values, EDIT_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "PUT",
      path,
      presentation: "recurring-updated",
      merge: { path, kind: "recurring" },
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 1, EDIT_HELP);

  const group = values.group as string | undefined;
  if (group !== undefined && values["no-group"] === true) {
    throw usageFailure("--group and --no-group cannot be used together", EDIT_HELP);
  }
  const end = values.end as string | undefined;
  if (end !== undefined && values["no-end"] === true) {
    throw usageFailure("--end and --no-end cannot be used together", EDIT_HELP);
  }
  if (values.active === true && values.inactive === true) {
    throw usageFailure("--active and --inactive cannot be used together", EDIT_HELP);
  }
  const splits = parseSplits(values.split, EDIT_HELP);
  const splitType = enumValue(values["split-type"], "--split-type", [
    "equal",
    "custom",
    "percentage",
    "shares",
  ] as const);
  const frequency = enumValue(values.frequency, "--frequency", FREQUENCIES);
  const currency = values.currency as string | undefined;
  const paidBy = values["paid-by"] as string | undefined;
  const patch: Record<string, unknown> = {
    ...(values.title === undefined ? {} : { title: values.title }),
    ...(values.amount === undefined ? {} : { amount: values.amount }),
    ...(values.description === undefined
      ? {}
      : { description: values.description }),
    ...(frequency === undefined ? {} : { frequency }),
    ...(values.interval === undefined
      ? {}
      : { interval: Number(positiveInteger(values.interval, "--interval")) }),
    ...(values.start === undefined
      ? {}
      : { startDate: isoDate(values.start, EDIT_HELP, "--start") }),
    ...(end === undefined ? {} : { endDate: isoDate(end, EDIT_HELP, "--end") }),
    ...(values["no-end"] === true ? { endDate: null } : {}),
    ...(values["no-group"] === true ? { groupId: null } : {}),
    ...(values.active === true ? { active: true } : {}),
    ...(values.inactive === true ? { active: false } : {}),
    ...(splitType === undefined ? {} : { splitType }),
    ...(splits.length === 0 ? {} : { splits }),
  };
  const references: Reference[] = [
    ...(currency === undefined
      ? []
      : [{ field: "currencyId", flag: "--currency", kind: "currency" as const, value: currency }]),
    ...(paidBy === undefined
      ? []
      : [{ field: "paidById", flag: "--paid-by", kind: "user" as const, value: paidBy }]),
    ...(group === undefined
      ? []
      : [{ field: "groupId", flag: "--group", kind: "group" as const, value: group }]),
    ...splitReferences(splits),
  ];
  if (Object.keys(patch).length === 0 && references.length === 0) {
    throw usageFailure("At least one field to change is required", EDIT_HELP);
  }

  return {
    kind: "request",
    method: "PUT",
    path,
    presentation: "recurring-updated",
    merge: { path, kind: "recurring" },
    body: patch,
    references,
  };
}

/**
 * `PUT` replaces the whole rule, so an edit sends the row it read back with
 * the flags merged over it — the same contract `expenses edit` works under.
 */
export function mergeRecurringBody(
  current: unknown,
  patch: Record<string, unknown>,
) {
  const rule = asRecord(current);
  const shares = asArray(rule.shares).map((value) => {
    const share = asRecord(value);
    return {
      userId: String(share.userId ?? ""),
      amount: String(share.amount ?? ""),
    };
  });
  const merged: Record<string, unknown> = {
    title: rule.title,
    description: rule.description ?? null,
    amount: String(rule.amount ?? ""),
    currencyId: rule.currencyId,
    paidById: rule.paidById,
    groupId: rule.groupId ?? null,
    frequency: rule.frequency,
    interval: rule.interval,
    startDate: rule.startDate,
    endDate: rule.endDate ?? null,
    timezone: rule.timezone ?? "UTC",
    active: rule.active,
    splitType: rule.splitType,
    categoryId: rule.categoryId ?? null,
    splits: shares,
    ...patch,
  };

  const amountChanged =
    "amount" in patch && String(patch.amount) !== String(rule.amount);
  if (amountChanged && !("splits" in patch)) {
    const evenly =
      merged.splitType === "equal"
        ? splitEvenly(
            String(merged.amount),
            shares.map((share) => share.userId),
          )
        : undefined;
    if (evenly === undefined) {
      throw new CliFailure(
        "usage",
        `Changing --amount on a ${display(merged.splitType)} split needs matching --split values\n${EDIT_HELP}`,
      );
    }
    merged.splits = evenly;
  }
  return merged;
}

/**
 * The create answers `201 Created` with no row and no id, so the rule that was
 * just written is found in the listing: the newest one that matches what was
 * sent. Everything else about a write — reading the row back, names instead of
 * ids — hangs off having that id.
 */
export function findCreatedRecurring(sent: unknown, listing: unknown) {
  const wanted = asRecord(sent);
  const matches = asArray(listing)
    .map(asRecord)
    .filter(
      (rule) =>
        (wanted.title === undefined || rule.title === wanted.title) &&
        (wanted.amount === undefined ||
          numeric(rule.amount) === numeric(wanted.amount)) &&
        (wanted.frequency === undefined || rule.frequency === wanted.frequency),
    )
    .sort((one, other) =>
      String(other.createdAt ?? "").localeCompare(String(one.createdAt ?? "")),
    );
  return matches[0] ?? {};
}

type Lookup = (path: string, query?: URLSearchParams) => Promise<unknown>;

/**
 * A rule carries ids where an expense carries expansions: no currency code, no
 * payer, no group. Names are taken from the occurrences the rule already
 * created when there are any, and otherwise from one wide page per kind —
 * fetched only when a rule still needs it, and never more than once. A lookup
 * that fails costs the name, not the command.
 */
export async function nameRecurring(body: unknown, get: Lookup) {
  const rules = (Array.isArray(body) ? body : [body]).map(asRecord);
  const currencies = new Map<string, string>();
  const users = new Map<string, string>();
  const groups = new Map<string, string>();

  // An occurrence of the rule names everything the rule itself only points at.
  for (const rule of rules) {
    for (const value of asArray(rule.related)) {
      const occurrence = asRecord(value);
      remember(currencies, occurrence.currencyId, asRecord(occurrence.currency).code);
      const payer = asRecord(occurrence.paidByUser);
      remember(users, payer.id, payer.name);
      for (const shared of asArray(occurrence.shares)) {
        const user = asRecord(asRecord(shared).user);
        remember(users, user.id, user.name);
      }
    }
  }

  const missing = (map: Map<string, string>, ids: unknown[]) =>
    ids.some((id) => typeof id === "string" && id && !map.has(id));
  const userIds = rules.flatMap((rule) => [
    rule.paidById,
    ...asArray(rule.shares).map((share) => asRecord(share).userId),
  ]);

  const lookups: Promise<void>[] = [];
  if (missing(currencies, rules.map((rule) => rule.currencyId))) {
    lookups.push(
      fill(async () => {
        for (const value of asArray(await get("/currencies"))) {
          const currency = asRecord(value);
          remember(currencies, currency.id, currency.code);
        }
      }),
    );
  }
  if (missing(groups, rules.map((rule) => rule.groupId))) {
    lookups.push(
      fill(async () => {
        const page = await get("/groups", new URLSearchParams({ l: "100" }));
        for (const value of asArray(asRecord(page).items)) {
          const group = asRecord(value);
          remember(groups, group.id, group.name);
        }
      }),
    );
  }
  if (missing(users, userIds)) {
    lookups.push(
      fill(async () => {
        const [me, page] = await Promise.all([
          get("/current-user"),
          get("/friends", new URLSearchParams({ l: "100" })),
        ]);
        remember(users, asRecord(me).id, asRecord(me).name);
        for (const value of asArray(asRecord(page).items)) {
          const user = asRecord(asRecord(value).user);
          remember(users, user.id, user.name);
        }
      }),
    );
  }
  await Promise.all(lookups);

  const named = rules.map((rule) => ({
    ...rule,
    ...expansion("currency", "code", currencies.get(String(rule.currencyId))),
    ...expansion("group", "name", groups.get(String(rule.groupId))),
    ...(users.has(String(rule.paidById))
      ? {
          paidByUser: {
            id: rule.paidById,
            name: users.get(String(rule.paidById)),
          },
        }
      : {}),
    ...("shares" in rule
      ? {
          shares: asArray(rule.shares).map((value) => {
            const share = asRecord(value);
            const name = users.get(String(share.userId));
            return name === undefined
              ? share
              : { ...share, user: { id: share.userId, name } };
          }),
        }
      : {}),
  }));
  return Array.isArray(body) ? named : named[0];
}

function remember(map: Map<string, string>, id: unknown, name: unknown) {
  if (typeof id === "string" && id && typeof name === "string" && name) {
    map.set(id, name);
  }
}

function expansion(key: string, field: string, value: string | undefined) {
  return value === undefined ? {} : { [key]: { [field]: value } };
}

async function fill(load: () => Promise<void>) {
  try {
    await load();
  } catch {
    // A name the CLI could not look up prints as the id it already has.
  }
}

/** `every 2 weeks`, or plain `weekly` when it comes round every period. */
export function humanFrequency(frequency: unknown, interval: unknown) {
  const every = numeric(interval);
  if (typeof frequency !== "string") return display(frequency);
  if (every === null || every <= 1) return frequency;
  const period = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[
    frequency
  ];
  return period === undefined
    ? `${frequency} × ${every}`
    : `every ${every} ${period}s`;
}

function cleanRule(body: unknown) {
  const rule = asRecord(body);
  return {
    id: rule.id ?? null,
    title: rule.title ?? null,
    description: rule.description ?? null,
    amount: numeric(rule.amount),
    currencyId: rule.currencyId ?? null,
    currency: asRecord(rule.currency).code ?? null,
    // The id is the rule's own; only the name depends on a lookup landing.
    paidById: rule.paidById ?? asRecord(rule.paidByUser).id ?? null,
    paidBy: asRecord(rule.paidByUser).name ?? null,
    groupId: rule.groupId ?? null,
    group: asRecord(rule.group).name ?? null,
    frequency: rule.frequency ?? null,
    interval: numeric(rule.interval),
    startDate: rule.startDate ?? null,
    endDate: rule.endDate ?? null,
    nextOccurrence: rule.nextOccurrence ?? null,
    lastGenerated: rule.lastGenerated ?? null,
    active: rule.active === true,
    splitType: rule.splitType ?? null,
    timezone: rule.timezone ?? null,
  };
}

function cleanRecurring(body: unknown) {
  const rule = asRecord(body);
  return {
    ...cleanRule(rule),
    splits: asArray(rule.shares).map((value) => {
      const share = asRecord(value);
      return {
        userId: share.userId ?? asRecord(share.user).id ?? null,
        user: asRecord(share.user).name ?? null,
        amount: numeric(share.amount),
      };
    }),
    // The expenses this rule has created so far, newest first.
    occurrences: asArray(rule.related)
      .map((value) => {
        const occurrence = asRecord(value);
        return {
          id: occurrence.id ?? null,
          date: occurrence.date ?? null,
          amount: numeric(occurrence.amount),
          currency: asRecord(occurrence.currency).code ?? null,
        };
      })
      .sort((one, other) =>
        String(other.date ?? "").localeCompare(String(one.date ?? "")),
      ),
  };
}

function cleanRecurringList(body: unknown) {
  return asArray(body).map((value) => {
    const rule = asRecord(value);
    return {
      ...cleanRule(rule),
      totalOccurrences: numeric(rule.totalOccurrences),
    };
  });
}

const OCCURRENCES_SHOWN = 5;

/** The rule's own fields; everything a flat DB row can say on its own. */
function formatRule(body: unknown, title: string) {
  const rule = asRecord(body);
  return section(
    heading(title),
    fields([
      ["Title", display(rule.title)],
      ["Amount", humanAmount(rule.amount, rule.currency)],
      ["Every", humanFrequency(rule.frequency, rule.interval)],
      ["Paid by", display(rule.paidBy ?? rule.paidById)],
      ["Group", display(rule.group ?? rule.groupId)],
      ["Description", display(rule.description)],
      ["Starts", humanDate(rule.startDate)],
      ["Ends", humanDate(rule.endDate)],
      ["Next", humanDate(rule.nextOccurrence)],
      ["Last created", humanDate(rule.lastGenerated)],
      ["Active", yesNo(rule.active)],
      ["Split type", display(rule.splitType)],
      ["ID", display(rule.id), true],
    ]),
  );
}

function formatRecurring(body: unknown, title: string) {
  const rule = asRecord(body);
  const splits = asArray(rule.splits);
  const occurrences = asArray(rule.occurrences);
  return section(
    formatRule(rule, title),
    heading("Splits"),
    splits.length
      ? table(
          [
            { label: "Name", max: 24 },
            { label: "Amount", align: "right" },
          ],
          splits.map((value) => {
            const split = asRecord(value);
            return [
              split.user ?? split.userId,
              humanAmount(split.amount, rule.currency),
            ];
          }),
        )
      : note("This rule has no splits."),
    ...(occurrences.length
      ? [
          heading("Expenses created"),
          table(
            [
              { label: "ID", id: true },
              { label: "Date" },
              { label: "Amount", align: "right" },
            ],
            occurrences.slice(0, OCCURRENCES_SHOWN).map((value) => {
              const occurrence = asRecord(value);
              return [
                occurrence.id,
                humanDate(occurrence.date),
                humanAmount(occurrence.amount, occurrence.currency ?? rule.currency),
              ];
            }),
          ),
          ...(occurrences.length > OCCURRENCES_SHOWN
            ? [
                note(
                  `${occurrences.length} expenses so far. banana expenses list --recurring shows them all.`,
                ),
              ]
            : []),
        ]
      : []),
  );
}

export const recurringPresenters = {
  "recurring-list": {
    clean: cleanRecurringList,
    format(body) {
      const rules = asArray(body);
      return section(
        rules.length
          ? table(
              [
                { label: "ID", id: true },
                { label: "Title", max: 24 },
                { label: "Every" },
                { label: "Next" },
                { label: "Paid by", max: 16 },
                { label: "Amount", align: "right" },
                { label: "Active" },
              ],
              rules.map((value) => {
                const rule = asRecord(value);
                return [
                  rule.id,
                  rule.title,
                  humanFrequency(rule.frequency, rule.interval),
                  humanDate(rule.nextOccurrence),
                  rule.paidBy ?? rule.paidById,
                  humanAmount(rule.amount, rule.currency),
                  yesNo(rule.active),
                ];
              }),
            )
          : note("No recurring expenses."),
        note("banana recurring get <rule-id> shows one rule and its splits."),
      );
    },
  },
  recurring: {
    clean: cleanRecurring,
    format: (body) => formatRecurring(body, "Recurring expense"),
  },
  "recurring-created": {
    clean: cleanRecurring,
    format: (body) => formatRecurring(body, "Recurring expense created"),
  },
  "recurring-updated": {
    clean: cleanRecurring,
    format: (body) => formatRecurring(body, "Recurring expense updated"),
  },
  // A delete answers with the flat row: no shares to show, and no occurrences.
  "recurring-deleted": {
    clean: cleanRecurring,
    format: (body) => formatRule(body, "Recurring expense deleted"),
  },
} satisfies Record<
  | "recurring-list"
  | "recurring"
  | "recurring-created"
  | "recurring-updated"
  | "recurring-deleted",
  Presenter
>;
