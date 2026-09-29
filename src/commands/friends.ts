import {
  DEFAULT_LIST_LIMIT,
  appendQuery,
  asArray,
  asRecord,
  currencyCode,
  display,
  encodedDetailId,
  enumValue,
  humanAmount,
  humanDate,
  numeric,
  parseOptions,
  positiveInteger,
  requirePositionals,
  usageFailure,
  userRef,
  wantsHelp,
  yesNo,
} from "../shared";
import { helpText } from "../help";
import { fields, heading, note, section, table } from "../render";
import { type ParsedCommand, type Presenter } from "../types";

const LIST_HELP = helpText({
  summary:
    "List the people you split expenses with, and your balance with each.",
  usage: ["banana friends list [flags]"],
  options: [
    ["--search TEXT", "Only people whose name matches"],
    ["--limit N", `Friends to fetch (default: ${DEFAULT_LIST_LIMIT})`],
    ["--cursor CURSOR", "Continue from a cursor returned by a previous page"],
    ["--sort balance|lastActivity", "Order the list"],
    ["--filter all|guests", "Show everyone, or only guest accounts"],
  ],
  notes: ["--search matches on the name, and combines with the other options."],
  examples: [
    "banana friends",
    "banana friends --search ana",
    "banana friends list --sort balance --json",
  ],
});
const HELP = helpText({
  summary: "List the people you split expenses with.",
  usage: ["banana friends [list] [flags]"],
  commands: [["list", "List friends and your balance with each"]],
  notes: ["`banana friends` on its own runs `banana friends list`."],
  examples: ["banana friends", "banana friends list --sort balance"],
  learnMore: ["banana friends list --help"],
});

function parseFriendsList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: LIST_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      cursor: { type: "string" },
      filter: { type: "string" },
      limit: { type: "string" },
      search: { type: "string" },
      sort: { type: "string" },
    },
    LIST_HELP,
  );
  requirePositionals(positionals, 0, LIST_HELP);

  const query = new URLSearchParams();
  appendQuery(
    query,
    "l",
    positiveInteger(values.limit, "--limit") ?? String(DEFAULT_LIST_LIMIT),
  );
  appendQuery(query, "q", values.search as string | undefined);
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
  if (args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  // `banana friends --search x` is the list, the same as `banana friends`.
  if (args.length === 0 || args[0]!.startsWith("-")) return parseFriendsList(args);
  const [command, ...rest] = args;
  if (command === "list") return parseFriendsList(rest);
  throw usageFailure(`Unknown command: friends ${command}`, HELP);
}

function cleanFriendList(body: unknown) {
  const response = asRecord(body);
  return {
    items: asArray(response.items).map((value) => {
      const friendship = asRecord(value);
      const user = asRecord(friendship.user);
      return {
        id: friendship.id ?? null,
        ...userRef("userId", "user", user),
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
      return section(
        items.length
          ? table(
              [
                { label: "Name", max: 24 },
                { label: "Guest" },
                { label: "Balance", align: "right" },
                { label: "Last activity" },
              ],
              items.map((value) => {
                const friendship = asRecord(value);
                return [
                  friendship.user,
                  yesNo(friendship.isGuest),
                  humanAmount(friendship.balance, friendship.currency),
                  humanDate(friendship.mostRecentActivity),
                ];
              }),
            )
          : note("No friends."),
        note(
          response.hasMore && response.nextCursor
            ? `More friends available. Next page: banana friends list --cursor ${JSON.stringify(response.nextCursor)}`
            : "End of friends.",
        ),
      );
    },
    browser: {
      detailPath(_command, item) {
        return `/friends/${encodedDetailId(item.id)}`;
      },
      links(_command, item) {
        const friendship = `/friends/${encodedDetailId(item.id)}`;
        return [
          { key: "e", label: "expenses", presentation: "activities",
            path: `${friendship}/activities`,
            query: new URLSearchParams({ type: "expenses" }) },
          { key: "a", label: "activity", presentation: "activities",
            path: `${friendship}/activities` },
          { key: "g", label: "shared groups", presentation: "friend-groups",
            path: `${friendship}/groups` },
        ];
      },
      formatDetail(item, body) {
        const friendship = asRecord(body);
        const user = asRecord(friendship.user);
        return section(
          heading("Friend"),
          fields([
            ["Name", display(user.name)],
            ["Balance", humanAmount(item.balance, item.currency)],
            ["Guest", yesNo(user.isGuest)],
            ["Gold", yesNo(user.isGold)],
            ["Status", display(friendship.status)],
            ["Accepted", humanDate(friendship.acceptedAt)],
            ["Last activity", humanDate(item.mostRecentActivity)],
            ["User ID", display(user.id), true],
            ["Friendship ID", display(friendship.id ?? item.id), true],
          ]),
        );
      },
    },
  },
} satisfies Record<"friend-list", Presenter>;
