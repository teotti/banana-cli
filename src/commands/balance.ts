import {
  asArray,
  asRecord,
  cleanUserSummary,
  currencyCode,
  display,
  encodedDetailId,
  formatCard,
  humanAmount,
  numeric,
  wantsHelp,
} from "../shared";
import { CliFailure, type ParsedCommand, type Presenter } from "../types";

const HELP = "Usage: banana balance [users]";

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
  throw new CliFailure("usage", HELP);
}

function cleanBalanceUsers(body: unknown) {
  return asArray(body).map((value) => {
    const entry = asRecord(value);
    return {
      user: cleanUserSummary(entry.user),
      balance: numeric(entry.balance),
      totalOwed: numeric(entry.totalOwed),
      totalOwing: numeric(entry.totalOwing),
    };
  });
}

function cleanBalanceDetail(body: unknown, item: Record<string, unknown>) {
  const response = asRecord(body);
  return {
    user: cleanUserSummary(item.user),
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
      return [
        `Balance: ${display(response.balance)}`,
        `Owed: ${display(response.totalOwed)}`,
        `Owing: ${display(response.totalOwing)}`,
      ].join("\n");
    },
  },
  "balance-users": {
    clean: cleanBalanceUsers,
    format(body) {
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
    },
    browser: {
      detailPath(_command, item) {
        return `/users/${encodedDetailId(asRecord(item.user).id)}/balances`;
      },
      formatDetail(item, body) {
        const detail = asRecord(cleanBalanceDetail(body, item));
        const breakdown = asArray(detail.breakdown);
        return [
          `Balance: ${humanAmount(detail.balance, detail.currency)}`,
          `Owed: ${humanAmount(detail.totalOwed, detail.currency)}`,
          `Owing: ${humanAmount(detail.totalOwing, detail.currency)}`,
          `User ID: ${display(asRecord(detail.user).id)}`,
          "",
          "Balance breakdown",
          ...(breakdown.length
            ? breakdown.map((value) => {
                const entry = asRecord(value);
                return `${display(entry.groupName)}: ${humanAmount(entry.balance, detail.currency)}${
                  entry.groupId ? ` · ${String(entry.groupId)}` : ""
                }`;
              })
            : ["—"]),
        ].join("\n");
      },
    },
  },
} satisfies Record<"balance" | "balance-users", Presenter>;
