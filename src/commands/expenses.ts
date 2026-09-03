import {
  DEFAULT_LIST_LIMIT,
  appendQuery,
  asArray,
  asRecord,
  cleanUserSummary,
  display,
  encodedDetailId,
  enumValue,
  formatCard,
  humanAmount,
  isoDate,
  namedEntity,
  numeric,
  parseJsonBody,
  parseOptions,
  positiveInteger,
  repeatedStrings,
  requiredString,
  requirePositionals,
  wantsHelp,
  yesNo,
} from "../shared";
import { CliFailure, type ParsedCommand, type Presenter } from "../types";

const HELP = `Usage: banana expenses list [--sort date|amount] [--direction asc|desc]
                            [--limit N] [--cursor CURSOR]
                            [--recurring | --no-recurring]
   or: banana expenses add JSON
   or: banana expenses add --title TEXT --amount AMOUNT
                           --currency-id ID --paid-by-id ID
                           --date YYYY-MM-DD|DD-MM-YYYY
                           [--group-id ID] [--description TEXT]
                           [--split-type equal|custom|percentage|shares]
                           [--split USER_ID=AMOUNT]...
   or: banana expenses get <expense-id>
   or: banana expenses edit <expense-id> JSON
   or: banana expenses edit <expense-id> [--title TEXT] [--amount AMOUNT]
                           [--currency-id ID] [--paid-by-id ID] [--date DATE]
                           [--description TEXT] [--group-id ID | --no-group]
                           [--split-type equal|custom|percentage|shares]
                           [--split USER_ID=AMOUNT]...`;
const GET_HELP = "Usage: banana expenses get <expense-id>";
const LIST_HELP = `Usage: banana expenses list [options]

Options:
  --sort date|amount
  --direction asc|desc
  --limit N                     (default: ${DEFAULT_LIST_LIMIT}; API default in browser)
  --cursor CURSOR
  --recurring                   Only recurring expenses
  --no-recurring                Only non-recurring expenses

Omit both recurring flags to include all expenses.
In the browser, reaching the last item loads the next page automatically.
Reuse the same options when requesting the next cursor.`;
const EDIT_HELP = `Usage: banana expenses edit <expense-id> JSON
   or: banana expenses edit <expense-id> [--title TEXT] [--amount AMOUNT]
                           [--currency-id ID] [--paid-by-id ID] [--date DATE]
                           [--description TEXT] [--group-id ID | --no-group]
                           [--split-type equal|custom|percentage|shares]
                           [--split USER_ID=AMOUNT]...

Only the fields you pass change; everything else keeps its current value.`;

function parseSplits(value: unknown) {
  return repeatedStrings(value).map((split) => {
    const separator = split.indexOf("=");
    if (separator < 1 || separator === split.length - 1) {
      throw new CliFailure(
        "usage",
        `--split must use USER_ID=AMOUNT\n${HELP}`,
      );
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
    const { positionals } = parseOptions(rest);
    requirePositionals(positionals, 1, GET_HELP);
    return {
      kind: "request",
      path: `/expenses/${encodeURIComponent(positionals[0])}`,
      presentation: "expense",
    };
  }
  if (command === "edit") return parseExpensesEdit(rest);
  if (command !== "add") throw new CliFailure("usage", HELP);
  if (wantsHelp(rest)) return { kind: "help", text: HELP };

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
  const jsonBody = parseJsonBody(positionals, values, HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/expenses",
      presentation: "expense-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, HELP);

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
      `At least one --split is required unless --group-id is provided\n${HELP}`,
    );
  }
  if (splits.length === 0 && splitType !== undefined) {
    throw new CliFailure(
      "usage",
      `At least one --split is required with --split-type\n${HELP}`,
    );
  }

  return {
    kind: "request",
    method: "POST",
    path: "/expenses",
    presentation: "expense-created",
    body: {
      title: requiredString(values.title, "--title", HELP),
      amount: requiredString(values.amount, "--amount", HELP),
      currencyId: requiredString(values["currency-id"], "--currency-id", HELP),
      paidById: requiredString(values["paid-by-id"], "--paid-by-id", HELP),
      date: isoDate(values.date, HELP),
      splits,
      ...(groupId === undefined ? {} : { groupId }),
      ...(description === undefined ? {} : { description }),
      ...(splitType === undefined ? {} : { splitType }),
    },
  };
}

function parseExpensesList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: LIST_HELP };
  const { positionals, values } = parseOptions(args, {
    cursor: { type: "string" },
    direction: { type: "string" },
    limit: { type: "string" },
    "no-recurring": { type: "boolean" },
    recurring: { type: "boolean" },
    sort: { type: "string" },
  });
  requirePositionals(positionals, 0, LIST_HELP);
  if (values.recurring && values["no-recurring"]) {
    throw new CliFailure(
      "usage",
      `--recurring and --no-recurring cannot be used together\n${LIST_HELP}`,
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
  const { positionals, values } = parseOptions(args, {
    amount: { type: "string" },
    "currency-id": { type: "string" },
    date: { type: "string" },
    description: { type: "string" },
    "group-id": { type: "string" },
    "no-group": { type: "boolean" },
    "paid-by-id": { type: "string" },
    split: { type: "string", multiple: true },
    "split-type": { type: "string" },
    title: { type: "string" },
  });
  if (positionals.length === 0) {
    throw new CliFailure("usage", EDIT_HELP);
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

  const groupId = values["group-id"] as string | undefined;
  if (groupId !== undefined && values["no-group"] === true) {
    throw new CliFailure(
      "usage",
      `--group-id and --no-group cannot be used together\n${EDIT_HELP}`,
    );
  }
  const splits = parseSplits(values.split);
  const splitType = enumValue(values["split-type"], "--split-type", [
    "equal",
    "custom",
    "percentage",
    "shares",
  ] as const);
  const patch: Record<string, unknown> = {
    ...(values.title === undefined ? {} : { title: values.title }),
    ...(values.amount === undefined ? {} : { amount: values.amount }),
    ...(values["currency-id"] === undefined
      ? {}
      : { currencyId: values["currency-id"] }),
    ...(values["paid-by-id"] === undefined
      ? {}
      : { paidById: values["paid-by-id"] }),
    ...(values.date === undefined
      ? {}
      : { date: isoDate(values.date, EDIT_HELP) }),
    ...(values.description === undefined
      ? {}
      : { description: values.description }),
    ...(groupId === undefined ? {} : { groupId }),
    ...(values["no-group"] === true ? { groupId: null } : {}),
    ...(splitType === undefined ? {} : { splitType }),
    ...(splits.length === 0 ? {} : { splits }),
  };
  if (Object.keys(patch).length === 0) {
    throw new CliFailure(
      "usage",
      `At least one field to change is required\n${EDIT_HELP}`,
    );
  }

  return {
    kind: "request",
    method: "PUT",
    path,
    presentation: "expense-updated",
    mergeExpense: path,
    body: patch,
  };
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
    currency: asRecord(expense.currency).code ?? expense.currencyId ?? null,
    paidBy: cleanUserSummary(expense.paidByUser),
    group: expense.groupId
      ? {
          id: expense.groupId,
          name: asRecord(expense.group).name ?? null,
        }
      : null,
    category: asRecord(expense.category).name ?? null,
    date: expense.date ?? null,
    splitType: expense.splitType ?? null,
    createdAt: expense.createdAt ?? null,
    splits: asArray(expense.shares).map((value) => {
      const share = asRecord(value);
      return {
        user: cleanUserSummary(share.user),
        amount: numeric(share.amount),
      };
    }),
  };
}

function formatExpense(body: unknown, title: string) {
  const response = asRecord(body);
  const splits = asArray(response.splits);
  const group = asRecord(response.group);
  return [
    title,
    `Title: ${display(response.title)}`,
    `Amount: ${humanAmount(response.amount, response.currency)}`,
    `Paid by: ${namedEntity(response.paidBy)}`,
    `Group: ${response.group ? namedEntity(group) : "—"}`,
    `Category: ${display(response.category)}`,
    `Description: ${display(response.description)}`,
    `Date: ${display(response.date)}`,
    `Split type: ${display(response.splitType)}`,
    `ID: ${display(response.id)}`,
    "",
    "Splits",
    ...(splits.length
      ? splits.map((value) => {
          const split = asRecord(value);
          return `${namedEntity(split.user)}: ${humanAmount(split.amount, response.currency)}`;
        })
      : ["—"]),
  ].join("\n");
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
      const lines = items.length
        ? [
            "Expenses",
            ...items.map((value, index) => {
              const expense = asRecord(value);
              return formatCard(index, expense.title, [
                `ID: ${display(expense.id)}`,
                `Amount: ${humanAmount(expense.amount, expense.currency)}`,
                `Your share: ${humanAmount(expense.share, expense.currency)}`,
                `Paid by: ${namedEntity(expense.paidBy)}`,
                `Group: ${expense.group ? namedEntity(expense.group) : "—"}`,
                `Category: ${display(expense.category)}`,
                `Date: ${display(expense.date)}`,
                `Recurring: ${yesNo(expense.isRecurring)}`,
              ]);
            }),
          ]
        : ["No expenses."];
      lines.push(
        response.hasMore
          ? [
              "More expenses available.",
              ...(response.nextCursor
                ? [
                    `Next cursor: ${JSON.stringify(response.nextCursor)}`,
                    "Run banana expenses list with --cursor and the same options.",
                  ]
                : []),
            ].join("\n")
          : "End of expenses.",
      );
      return lines.join("\n\n");
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
    clean: cleanCreatedExpense,
    format(body) {
      const response = asRecord(body);
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
    },
  },
} satisfies Record<
  "expense-list" | "expense" | "expense-updated" | "expense-created",
  Presenter
>;
