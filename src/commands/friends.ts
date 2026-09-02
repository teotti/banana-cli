import {
  DEFAULT_LIST_LIMIT,
  appendQuery,
  asArray,
  asRecord,
  cleanUserSummary,
  currencyCode,
  display,
  encodedDetailId,
  enumValue,
  formatCard,
  humanAmount,
  numeric,
  parseOptions,
  positiveInteger,
  requirePositionals,
  wantsHelp,
  yesNo,
} from "../shared";
import { CliFailure, type ParsedCommand, type Presenter } from "../types";

const HELP = `Usage: banana friends <command>

Commands:
  list [--limit N] [--cursor CURSOR] [--sort balance|lastActivity]
       [--filter all|guests]`;
const LIST_HELP = `Usage: banana friends list [options]

Options:
  --limit N                     (default: ${DEFAULT_LIST_LIMIT})
  --cursor CURSOR
  --sort balance|lastActivity
  --filter all|guests`;

function parseFriendsList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: LIST_HELP };
  const { positionals, values } = parseOptions(args, {
    cursor: { type: "string" },
    filter: { type: "string" },
    limit: { type: "string" },
    sort: { type: "string" },
  });
  requirePositionals(positionals, 0, LIST_HELP);

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
    enumValue(values.sort, "--sort", ["balance", "lastActivity"] as const),
  );
  appendQuery(
    query,
    "filter",
    enumValue(values.filter, "--filter", ["all", "guests"] as const),
  );

  return {
    kind: "request",
    path: "/friends",
    presentation: "friend-list",
    query,
  };
}

export function parseFriends(args: string[]): ParsedCommand {
  if (args.length === 0) return parseFriendsList(args);
  if (args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  const [command, ...rest] = args;
  if (command === "list") return parseFriendsList(rest);
  throw new CliFailure("usage", HELP);
}

function cleanFriendList(body: unknown) {
  const response = asRecord(body);
  return {
    items: asArray(response.items).map((value) => {
      const friendship = asRecord(value);
      const user = asRecord(friendship.user);
      return {
        id: friendship.id ?? null,
        user: cleanUserSummary(user),
        balance: numeric(friendship.balance),
        currency: currencyCode(friendship.currency),
        isGuest: user.isGuest === true,
        isGold: user.isGold === true,
        mostRecentActivity: friendship.mostRecentActivity ?? null,
      };
    }),
    hasMore: response.hasMore === true,
    nextCursor: response.nextCursor ?? null,
  };
}

export const friendPresenters = {
  "friend-list": {
    clean: cleanFriendList,
    format(body) {
      const response = asRecord(body);
      const items = asArray(response.items);
      const lines = items.length
        ? [
            "Friends",
            ...items.map((value, index) => {
              const friendship = asRecord(value);
              const user = asRecord(friendship.user);
              return formatCard(index, user.name, [
                `Friendship ID: ${display(friendship.id)}`,
                `User ID: ${display(user.id)}`,
                `Balance: ${humanAmount(friendship.balance, friendship.currency)}`,
                `Guest: ${yesNo(friendship.isGuest)}`,
                `Gold: ${yesNo(friendship.isGold)}`,
                `Last activity: ${display(friendship.mostRecentActivity)}`,
              ]);
            }),
          ]
        : ["No friends."];
      lines.push(
        response.hasMore && response.nextCursor
          ? [
              "More friends available.",
              `Next page: banana friends list --cursor ${JSON.stringify(response.nextCursor)}`,
            ].join("\n")
          : "End of friends.",
      );
      return lines.join("\n\n");
    },
    browser: {
      detailPath(_command, item) {
        return `/friends/${encodedDetailId(item.id)}`;
      },
      formatDetail(item, body) {
        const friendship = asRecord(body);
        const user = asRecord(friendship.user);
        return [
          `Name: ${display(user.name)}`,
          `Balance: ${humanAmount(item.balance, item.currency)}`,
          `Guest: ${yesNo(user.isGuest)}`,
          `Gold: ${yesNo(user.isGold)}`,
          `Status: ${display(friendship.status)}`,
          `Accepted: ${display(friendship.acceptedAt)}`,
          `Last activity: ${display(item.mostRecentActivity)}`,
          `User ID: ${display(user.id)}`,
          `Friendship ID: ${display(friendship.id ?? item.id)}`,
        ].join("\n");
      },
    },
  },
} satisfies Record<"friend-list", Presenter>;
