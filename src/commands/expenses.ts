import {
  DEFAULT_LIST_LIMIT,
  appendQuery,
  asArray,
  asRecord,
  display,
  encodedDetailId,
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
  userRef,
  wantsHelp,
} from "../shared";
import { helpText } from "../help";
import { fields, heading, note, section, table } from "../render";
import {
  CliFailure,
  type ParsedCommand,
  type Presenter,
  type Reference,
} from "../types";

const SPLIT_TYPES = "equal|custom|percentage|shares";
const NAMES_NOTE =
  "--currency, --group, --paid-by and --split take a code, a name or a\nprefix of one, as well as an id. `--paid-by me` is you.";
const ADD_HELP = helpText({
  summary: "Add an expense and split it between people.",
  usage: [
    "banana expenses add --title TEXT --amount AMOUNT --currency CODE",
    "                    --date DATE [flags]",
    "banana expenses add JSON",
  ],
  options: [
    ["--title TEXT", "What the expense was for (required)"],
    ["--amount AMOUNT", "Total amount (required)"],
    ["--currency CODE", "Currency of the amount (required)"],
    ["--date DATE", "YYYY-MM-DD or DD-MM-YYYY (required)"],
    ["--paid-by WHO", "Who paid (default: you)"],
    ["--group NAME", "Charge the expense to a group"],
    ["--description TEXT", "Longer note"],
    ["--split-type TYPE", SPLIT_TYPES],
    ["--split WHO=AMOUNT", "One person's share; repeat for each split"],
  ],
  notes: [
    "The splits must add up to --amount. Without --group at least one\n--split is required.",
    NAMES_NOTE,
  ],
  examples: [
    'banana expenses add --title Dinner --amount 42 --currency EUR \\',
    '  --date 2026-09-09 --group "Lisbon trip"',
    "banana expenses add --title Taxi --amount 20 --currency EUR \\",
    "  --date 09-09-2026 --split me=10 --split Ana=10",
  ],
});
const HELP = helpText({
  summary: "List, add, inspect and edit your expenses.",
  usage: ["banana expenses <command> [flags]"],
  commands: [
    ["list", "List your expenses"],
    ["add", "Add an expense"],
    ["get <expense-id>", "Show one expense and its splits"],
    ["edit <expense-id>", "Change fields of an expense"],
  ],
  examples: [
    "banana expenses list --limit 10",
    "banana expenses get <expense-id>",
    "banana expenses edit <expense-id> --amount 45",
  ],
  learnMore: ["banana expenses <command> --help"],
});
const GET_HELP = helpText({
  summary: "Show one expense with who paid and how it was split.",
  usage: ["banana expenses get <expense-id>"],
  examples: [
    "banana expenses get <expense-id>",
    "banana expenses get <expense-id> --json",
  ],
});
const LIST_HELP = helpText({
  summary: "List the expenses you are part of, newest first.",
  usage: ["banana expenses list [flags]"],
  options: [
    ["--sort date|amount", "Order the list"],
    ["--direction asc|desc", "Sort direction"],
    ["--limit N", `Expenses to fetch (default: ${DEFAULT_LIST_LIMIT})`],
    ["--cursor CURSOR", "Continue from a cursor returned by a previous page"],
    ["--recurring", "Only recurring expenses"],
    ["--no-recurring", "Only one-off expenses"],
  ],
  notes: [
    "Omit both recurring flags to include all expenses.\nIn the browser, reaching the last item loads the next page automatically.\nReuse the same options when requesting the next cursor.",
  ],
  examples: [
    "banana expenses list",
    "banana expenses list --limit 20 --sort amount --direction desc",
    "banana expenses list --no-recurring --json",
  ],
});
const EDIT_HELP = helpText({
  summary: "Change one or more fields of an expense.",
  usage: [
    "banana expenses edit <expense-id> [flags]",
    "banana expenses edit <expense-id> JSON",
  ],
  options: [
    ["--title TEXT", "What the expense was for"],
    ["--amount AMOUNT", "Total amount"],
    ["--currency CODE", "Currency of the amount"],
    ["--paid-by WHO", "Who paid"],
    ["--date DATE", "YYYY-MM-DD or DD-MM-YYYY"],
    ["--description TEXT", "Longer note"],
    ["--group NAME", "Move the expense to a group"],
    ["--no-group", "Detach the expense from its group"],
    ["--split-type TYPE", SPLIT_TYPES],
    ["--split WHO=AMOUNT", "One person's share; repeat for each split"],
  ],
  notes: [
    "Only the fields you pass change; everything else keeps its current value.\nChanging --amount means passing splits that add up to the new total.",
    NAMES_NOTE,
  ],
  examples: [
    "banana expenses edit <expense-id> --title Groceries",
    "banana expenses edit <expense-id> --amount 45 --split me=45",
    "banana expenses edit <expense-id> --no-group",
  ],
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

export function parseExpenses(args: string[]): ParsedCommand {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  const [command, ...rest] = args;
  if (command === "list") return parseExpensesList(rest);
  if (command === "get") {
    if (wantsHelp(rest)) return { kind: "help", text: GET_HELP };
    const { positionals } = parseOptions(rest, {}, GET_HELP);
    requirePositionals(positionals, 1, GET_HELP);
    return {
      kind: "request",
      path: `/expenses/${encodeURIComponent(positionals[0])}`,
      presentation: "expense",
    };
  }
  if (command === "edit") return parseExpensesEdit(rest);
  if (command !== "add") {
    throw usageFailure(`Unknown command: expenses ${command}`, HELP);
  }
  if (wantsHelp(rest)) return { kind: "help", text: ADD_HELP };

  const { positionals, values } = parseOptions(
    rest,
    {
      amount: { type: "string" },
      currency: { type: "string" },
      date: { type: "string" },
      description: { type: "string" },
      group: { type: "string" },
      "paid-by": { type: "string" },
      split: { type: "string", multiple: true },
      "split-type": { type: "string" },
      title: { type: "string" },
    },
    ADD_HELP,
  );
  const jsonBody = parseJsonBody(positionals, values, ADD_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/expenses",
      presentation: "expense-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, ADD_HELP);

  const group = values.group as string | undefined;
  const description = values.description as string | undefined;
  const splits = parseSplits(values.split, ADD_HELP);
  const splitType = enumValue(values["split-type"], "--split-type", [
    "equal",
    "custom",
    "percentage",
    "shares",
  ] as const);
  if (splits.length === 0 && group === undefined) {
    throw usageFailure(
      "At least one --split is required unless --group is provided",
      ADD_HELP,
    );
  }
  if (splits.length === 0 && splitType !== undefined) {
    throw usageFailure(
      "At least one --split is required with --split-type",
      ADD_HELP,
    );
  }

  return {
    kind: "request",
    method: "POST",
    path: "/expenses",
    presentation: "expense-created",
    body: {
      title: requiredString(values.title, "--title", ADD_HELP),
      amount: requiredString(values.amount, "--amount", ADD_HELP),
      date: isoDate(values.date, ADD_HELP),
      splits,
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
      // Left without a value on purpose: an expense you do not attribute to
      // anyone else is one you paid.
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

/** Every `--split WHO=AMOUNT` names a person the same way `--paid-by` does. */
function splitReferences(splits: { userId: string }[]) {
  return splits.map((split, index) => ({
    field: `splits.${index}.userId`,
    flag: "--split",
    kind: "user" as const,
    value: split.userId,
  }));
}

function parseExpensesList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: LIST_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      cursor: { type: "string" },
      direction: { type: "string" },
      limit: { type: "string" },
      "no-recurring": { type: "boolean" },
      recurring: { type: "boolean" },
      sort: { type: "string" },
    },
    LIST_HELP,
  );
  requirePositionals(positionals, 0, LIST_HELP);
  if (values.recurring && values["no-recurring"]) {
    throw usageFailure(
      "--recurring and --no-recurring cannot be used together",
      LIST_HELP,
    );
  }

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
    enumValue(values.sort, "--sort", ["date", "amount"] as const),
  );
  appendQuery(
    query,
    "direction",
    enumValue(values.direction, "--direction", ["asc", "desc"] as const),
  );
  appendQuery(
    query,
    "recurring",
    values["no-recurring"] ? false : (values.recurring as boolean | undefined),
  );
  return {
    kind: "request",
    path: "/expenses",
    presentation: "expense-list",
    query,
  };
}

function parseExpensesEdit(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: EDIT_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      amount: { type: "string" },
      currency: { type: "string" },
      date: { type: "string" },
      description: { type: "string" },
      group: { type: "string" },
      "no-group": { type: "boolean" },
      "paid-by": { type: "string" },
      split: { type: "string", multiple: true },
      "split-type": { type: "string" },
      title: { type: "string" },
    },
    EDIT_HELP,
  );
  if (positionals.length === 0) {
    throw usageFailure("An expense id is required", EDIT_HELP);
  }
  const [id, ...rest] = positionals;
  const path = `/expenses/${encodeURIComponent(id)}`;

  const jsonBody = parseJsonBody(rest, values, EDIT_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "PUT",
      path,
      presentation: "expense-updated",
      mergeExpense: path,
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 1, EDIT_HELP);

  const group = values.group as string | undefined;
  if (group !== undefined && values["no-group"] === true) {
    throw usageFailure(
      "--group and --no-group cannot be used together",
      EDIT_HELP,
    );
  }
  const splits = parseSplits(values.split, EDIT_HELP);
  const splitType = enumValue(values["split-type"], "--split-type", [
    "equal",
    "custom",
    "percentage",
    "shares",
  ] as const);
  const currency = values.currency as string | undefined;
  const paidBy = values["paid-by"] as string | undefined;
  const patch: Record<string, unknown> = {
    ...(values.title === undefined ? {} : { title: values.title }),
    ...(values.amount === undefined ? {} : { amount: values.amount }),
    ...(values.date === undefined
      ? {}
      : { date: isoDate(values.date, EDIT_HELP) }),
    ...(values.description === undefined
      ? {}
      : { description: values.description }),
    ...(values["no-group"] === true ? { groupId: null } : {}),
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
    presentation: "expense-updated",
    mergeExpense: path,
    body: patch,
    references,
  };
}

function splitEvenly(total: string, userIds: string[]) {
  const cents = Math.round(Number(total) * 100);
  if (!Number.isFinite(cents) || userIds.length === 0) return undefined;
  const base = Math.floor(cents / userIds.length);
  let remainder = cents - base * userIds.length;
  return userIds.map((userId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { userId, amount: ((base + extra) / 100).toFixed(2) };
  });
}

export function mergeExpenseBody(current: unknown, patch: Record<string, unknown>) {
  const expense = asRecord(current);
  const shares = asArray(expense.shares).map((value) => {
    const share = asRecord(value);
    return {
      userId: String(share.userId ?? ""),
      amount: String(share.amount ?? ""),
    };
  });
  const merged: Record<string, unknown> = {
    title: expense.title,
    description: expense.description ?? null,
    amount: String(expense.amount ?? ""),
    currencyId: expense.currencyId,
    paidById: expense.paidById,
    groupId: expense.groupId ?? null,
    friendshipId: expense.friendshipId ?? null,
    date: expense.date,
    timezone: expense.timezone ?? "UTC",
    splitType: expense.splitType,
    categoryId: expense.categoryId ?? null,
    splits: shares,
    ...patch,
  };

  // A group expense and a direct (friendship) expense are mutually exclusive.
  if ("groupId" in patch) {
    if (patch.groupId === null) {
      merged.groupId = null;
    } else {
      merged.friendshipId = null;
    }
  }

  const amountChanged =
    "amount" in patch && String(patch.amount) !== String(expense.amount);
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

function cleanExpense(body: unknown) {
  const expense = asRecord(body);
  return {
    id: expense.id ?? null,
    title: expense.title ?? null,
    description: expense.description ?? null,
    amount: numeric(expense.amount),
    currencyId: expense.currencyId ?? null,
    currency: asRecord(expense.currency).code ?? null,
    ...userRef("paidById", "paidBy", expense.paidByUser),
    groupId: expense.groupId ?? null,
    group: asRecord(expense.group).name ?? null,
    category: asRecord(expense.category).name ?? null,
    date: expense.date ?? null,
    splitType: expense.splitType ?? null,
    createdAt: expense.createdAt ?? null,
    splits: asArray(expense.shares).map((value) => {
      const share = asRecord(value);
      return {
        ...userRef("userId", "user", share.user),
        amount: numeric(share.amount),
      };
    }),
  };
}

// Names carry the meaning here; the ids are in --json for whoever needs them.
function formatExpense(body: unknown, title: string) {
  const response = asRecord(body);
  const splits = asArray(response.splits);
  return section(
    heading(title),
    fields([
      ["Title", display(response.title)],
      ["Amount", humanAmount(response.amount, response.currency)],
      ["Paid by", display(response.paidBy)],
      ["Group", display(response.group)],
      ["Category", display(response.category)],
      ["Description", display(response.description)],
      ["Date", humanDate(response.date)],
      ["Split type", display(response.splitType)],
      ["ID", display(response.id), true],
    ]),
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
              split.user,
              humanAmount(split.amount, response.currency),
            ];
          }),
        )
      : note("This expense has no splits."),
  );
}

export const expensePresenters = {
  "expense-list": {
    clean(body) {
      const response = asRecord(body);
      return {
        items: asArray(response.items).map((value) => {
          const expense = asRecord(value);
          const { splits, ...summary } = cleanExpense(expense);
          return {
            ...summary,
            isRecurring:
              expense.recurringExpenseRuleId != null || expense.recurrence != null,
            share: numeric(asRecord(expense.share).amount),
          };
        }),
        hasMore: response.hasMore === true,
        nextCursor: response.nextCursor ?? null,
      };
    },
    format(body) {
      const response = asRecord(body);
      const items = asArray(response.items);
      return section(
        items.length
          ? table(
              [
                { label: "ID", id: true },
                { label: "Date" },
                { label: "Title", max: 24 },
                { label: "Paid by", max: 16 },
                { label: "Amount", align: "right" },
                { label: "Your share", align: "right" },
              ],
              items.map((value) => {
                const expense = asRecord(value);
                return [
                  expense.id,
                  humanDate(expense.date),
                  expense.title,
                  expense.paidBy,
                  humanAmount(expense.amount, expense.currency),
                  humanAmount(expense.share, expense.currency),
                ];
              }),
            )
          : note("No expenses."),
        note(
          response.hasMore
            ? response.nextCursor
              ? `More expenses available. Next page: banana expenses list --cursor ${JSON.stringify(response.nextCursor)}`
              : "More expenses available."
            : "End of expenses.",
        ),
      );
    },
    browser: {
      detailPath(_command, item) {
        return `/expenses/${encodedDetailId(item.id)}`;
      },
      formatDetail(_item, body) {
        return formatExpense(cleanExpense(body), "Expense");
      },
    },
  },
  expense: {
    clean: cleanExpense,
    format: (body) => formatExpense(body, "Expense"),
  },
  "expense-updated": {
    clean: cleanExpense,
    format: (body) => formatExpense(body, "Expense updated"),
  },
  "expense-created": {
    clean: cleanExpense,
    format: (body) => formatExpense(body, "Expense created"),
  },
} satisfies Record<
  "expense-list" | "expense" | "expense-updated" | "expense-created",
  Presenter
>;
