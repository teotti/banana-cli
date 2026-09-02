import {
  asArray,
  asRecord,
  display,
  enumValue,
  humanAmount,
  isoDate,
  numeric,
  parseJsonBody,
  parseOptions,
  repeatedStrings,
  requiredString,
  requirePositionals,
  wantsHelp,
} from "../shared";
import { CliFailure, type ParsedCommand, type Presenter } from "../types";

const HELP = `Usage: banana expenses add JSON
   or: banana expenses add --title TEXT --amount AMOUNT
                           --currency-id ID --paid-by-id ID
                           --date YYYY-MM-DD|DD-MM-YYYY
                           [--group-id ID] [--description TEXT]
                           [--split-type equal|custom|percentage|shares]
                           [--split USER_ID=AMOUNT]...`;

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

export const expensePresenters = {
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
} satisfies Record<"expense-created", Presenter>;
