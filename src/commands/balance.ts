import {
  asArray,
  asRecord,
  currencyCode,
  display,
  encodedDetailId,
  humanAmount,
  humanNumber,
  numeric,
  usageFailure,
  userRef,
  wantsHelp,
} from "../shared";
import { helpText } from "../help";
import { fields, heading, note, section, table } from "../render";
import { type ParsedCommand, type Presenter } from "../types";

const HELP = helpText({
  summary: "Show what you owe and what you are owed.",
  usage: ["banana balance [users]"],
  commands: [
    ["balance", "The totals across everyone you split with"],
    ["balance users", "The same totals broken down per person"],
  ],
  notes: ["`banana balances` is a shortcut for `banana balance users`."],
  examples: ["banana balance", "banana balances", "banana balance users --json"],
});

export function parseBalance(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: HELP };
  if (args.length === 0) {
    return { kind: "request", path: "/balance", presentation: "balance" };
  }
  if (args.length === 1 && args[0] === "users") {
    return {
      kind: "request",
      path: "/balance/users",
      presentation: "balance-users",
    };
  }
  throw usageFailure(`Unexpected argument: ${args[0]}`, HELP);
}

function cleanBalanceUsers(body: unknown) {
  return asArray(body).map((value) => {
    const entry = asRecord(value);
    return {
      ...userRef("userId", "user", entry.user),
      balance: numeric(entry.balance),
      totalOwed: numeric(entry.totalOwed),
      totalOwing: numeric(entry.totalOwing),
    };
  });
}

function cleanBalanceDetail(body: unknown, item: Record<string, unknown>) {
  const response = asRecord(body);
  return {
    userId: item.userId ?? null,
    user: item.user ?? null,
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

export const balancePresenters = {
  balance: {
    clean(body) {
      const response = asRecord(body);
      return {
        balance: numeric(response.balance),
        totalOwed: numeric(response.totalOwed),
        totalOwing: numeric(response.totalOwing),
      };
    },
    format(body) {
      const response = asRecord(body);
      return fields([
        ["Balance", humanNumber(response.balance)],
        ["Owed", humanNumber(response.totalOwed)],
        ["Owing", humanNumber(response.totalOwing)],
      ]);
    },
  },
  "balance-users": {
    clean: cleanBalanceUsers,
    format(body) {
      const items = asArray(body);
      if (!items.length) return note("No user balances.");
      return table(
        [
          { label: "Name", max: 24 },
          { label: "Balance", align: "right" },
          { label: "Owed", align: "right" },
          { label: "Owing", align: "right" },
        ],
        items.map((value) => {
          const entry = asRecord(value);
          return [
            entry.user,
            humanNumber(entry.balance),
            humanNumber(entry.totalOwed),
            humanNumber(entry.totalOwing),
          ];
        }),
      );
    },
    browser: {
      detailPath(_command, item) {
        return `/users/${encodedDetailId(item.userId)}/balances`;
      },
      formatDetail(item, body) {
        const detail = asRecord(cleanBalanceDetail(body, item));
        const breakdown = asArray(detail.breakdown);
        return section(
          fields([
            ["Balance", humanAmount(detail.balance, detail.currency)],
            ["Owed", humanAmount(detail.totalOwed, detail.currency)],
            ["Owing", humanAmount(detail.totalOwing, detail.currency)],
            ["User ID", display(detail.userId), true],
          ]),
          heading("Balance breakdown"),
          breakdown.length
            ? table(
                [
                  { label: "Group", max: 24 },
                  { label: "Balance", align: "right" },
                ],
                breakdown.map((value) => {
                  const entry = asRecord(value);
                  return [
                    entry.groupName,
                    humanAmount(entry.balance, detail.currency),
                  ];
                }),
              )
            : note("No balances to break down."),
        );
      },
    },
  },
} satisfies Record<"balance" | "balance-users", Presenter>;
