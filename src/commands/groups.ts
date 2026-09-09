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
  namedEntity,
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
import { helpText } from "../help";
import { type ParsedCommand, type Presenter } from "../types";

const HELP = helpText({
  summary: "Create groups and browse their members, balances and activity.",
  usage: ["banana groups [list] [flags]", "banana groups <command> [flags]"],
  commands: [
    ["list", "List your groups and their balances"],
    ["create", "Create a group"],
    ["get <group-id>", "Show one group"],
    ["members <group-id>", "List the members of a group"],
    ["activities <group-id>", "List the expenses and payments in a group"],
  ],
  notes: ["`banana groups` on its own runs `banana groups list`."],
  examples: [
    "banana groups",
    "banana groups get <group-id>",
    "banana groups activities <group-id> --type expenses",
  ],
  learnMore: ["banana groups <command> --help"],
});
const LIST_HELP = helpText({
  summary: "List your groups, newest activity first.",
  usage: ["banana groups list [flags]"],
  options: [
    ["--limit N", `Groups to fetch (default: ${DEFAULT_LIST_LIMIT})`],
    ["--cursor CURSOR", "Continue from a cursor returned by a previous page"],
    ["--archived", "Include archived groups"],
    ["--sort balance|lastActivity", "Order the list"],
  ],
  examples: [
    "banana groups list",
    "banana groups list --limit 20 --archived",
    "banana groups list --sort balance --json",
  ],
});
const GET_HELP = helpText({
  summary: "Show one group with its currency, type and member count.",
  usage: ["banana groups get <group-id>"],
  examples: ["banana groups get <group-id>", "banana groups get <group-id> --json"],
});
const MEMBERS_HELP = helpText({
  summary: "List the members of a group and what each one owes.",
  usage: ["banana groups members <group-id>"],
  examples: [
    "banana groups members <group-id>",
    "banana groups members <group-id> --json",
  ],
});
const CREATE_HELP = helpText({
  summary: "Create a group, optionally with its members.",
  usage: [
    "banana groups create --name TEXT --currency-id ID [flags]",
    "banana groups create JSON",
  ],
  options: [
    ["--name TEXT", "Group name (required)"],
    ["--currency-id ID", "Currency the group settles in (required)"],
    ["--description TEXT", "What the group is for"],
    ["--type TYPE", "vacation|roommates|couple|travel|party|other"],
    ["--member USER_ID", "Add a member; repeat for several"],
  ],
  notes: ["Run `banana currencies` for the ids --currency-id takes."],
  examples: [
    'banana groups create --name "Lisbon trip" --currency-id <currency-id>',
    'banana groups create --name Flat --currency-id <currency-id> \\',
    "  --type roommates --member <user-id>",
    'banana groups create \'{"name":"Lisbon trip","currencyId":"<currency-id>"}\'',
  ],
});
const ACTIVITIES_HELP = helpText({
  summary: "List the expenses and payments recorded in a group.",
  usage: ["banana groups activities <group-id> [flags]"],
  options: [
    ["--search QUERY", "Only activities matching a search"],
    ["--limit N", "Activities per page"],
    ["--page N", "Page to fetch, 1-based"],
    ["--type TYPE", "all|expenses|payments|recurring_expenses"],
    ["--sort date|amount", "Order the list"],
    ["--direction asc|desc", "Sort direction"],
  ],
  examples: [
    "banana groups activities <group-id>",
    "banana groups activities <group-id> --type expenses --sort amount",
    'banana groups activities <group-id> --search "dinner"',
  ],
});

function parseGroupsList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: LIST_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      archived: { type: "boolean" },
      cursor: { type: "string" },
      limit: { type: "string" },
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
  appendQuery(query, "cursor", values.cursor as string | undefined);
  appendQuery(query, "archived", values.archived as boolean | undefined);
  appendQuery(
    query,
    "sort",
    enumValue(values.sort, "--sort", ["balance", "lastActivity"] as const),
  );
  return {
    kind: "request",
    path: "/groups",
    presentation: "group-list",
    query,
  };
}

function parseGroupsCreate(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: CREATE_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      "currency-id": { type: "string" },
      description: { type: "string" },
      member: { type: "string", multiple: true },
      name: { type: "string" },
      type: { type: "string" },
    },
    CREATE_HELP,
  );
  const jsonBody = parseJsonBody(positionals, values, CREATE_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/groups",
      presentation: "group-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, CREATE_HELP);

  const description = values.description as string | undefined;
  const groupMembers = repeatedStrings(values.member);
  const type = enumValue(values.type, "--type", [
    "vacation",
    "roommates",
    "couple",
    "travel",
    "party",
    "other",
  ] as const);
  return {
    kind: "request",
    method: "POST",
    path: "/groups",
    presentation: "group-created",
    body: {
      name: requiredString(values.name, "--name", CREATE_HELP),
      currencyId: requiredString(
        values["currency-id"],
        "--currency-id",
        CREATE_HELP,
      ),
      ...(description === undefined ? {} : { description }),
      ...(type === undefined ? {} : { type }),
      ...(groupMembers.length === 0 ? {} : { groupMembers }),
    },
  };
}

function parseGroupsActivities(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: ACTIVITIES_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      direction: { type: "string" },
      limit: { type: "string" },
      page: { type: "string" },
      search: { type: "string" },
      sort: { type: "string" },
      type: { type: "string" },
    },
    ACTIVITIES_HELP,
  );
  requirePositionals(positionals, 1, ACTIVITIES_HELP);

  const query = new URLSearchParams();
  appendQuery(query, "l", positiveInteger(values.limit, "--limit"));
  appendQuery(query, "p", positiveInteger(values.page, "--page"));
  appendQuery(
    query,
    "type",
    enumValue(values.type, "--type", [
      "all",
      "expenses",
      "payments",
      "recurring_expenses",
    ] as const),
  );
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

  const groupId = encodeURIComponent(positionals[0]);
  const search = values.search as string | undefined;
  if (search !== undefined) query.set("q", search);
  return {
    kind: "request",
    path: `/groups/${groupId}/activities${search === undefined ? "" : "/search"}`,
    presentation: "activities",
    query,
  };
}

export function parseGroups(args: string[]): ParsedCommand {
  if (args.length === 0) return parseGroupsList(args);
  if (args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }

  const [command, ...rest] = args;
  if (command === "list") return parseGroupsList(rest);
  if (command === "create") return parseGroupsCreate(rest);
  if (command === "activities") return parseGroupsActivities(rest);
  if (command === "get" || command === "members") {
    const help = command === "get" ? GET_HELP : MEMBERS_HELP;
    if (wantsHelp(rest)) return { kind: "help", text: help };
    const { positionals } = parseOptions(rest, {}, help);
    requirePositionals(positionals, 1, help);
    return {
      kind: "request",
      path: `/groups/${encodeURIComponent(positionals[0])}${
        command === "members" ? "/members" : ""
      }`,
      presentation: command === "members" ? "members" : "group",
    };
  }
  throw usageFailure(`Unknown command: groups ${command}`, HELP);
}

function cleanGroupList(body: unknown) {
  const response = asRecord(body);
  return {
    items: asArray(response.items).map((value) => {
      const group = asRecord(value);
      const members = asArray(group.groupMembers)
        .map((member) => asRecord(member).name)
        .filter((name): name is string => typeof name === "string");
      return {
        id: group.id ?? null,
        name: group.name ?? null,
        description: group.description ?? null,
        type: group.type ?? null,
        currency: currencyCode(group.currency),
        balance: numeric(group.balance),
        memberCount: members.length,
        members,
        mostRecentActivity: group.mostRecentActivity ?? null,
      };
    }),
    hasMore: response.hasMore === true,
    nextCursor: response.nextCursor ?? null,
  };
}

function cleanGroup(body: unknown) {
  const group = asRecord(body);
  return {
    id: group.id ?? null,
    name: group.name ?? null,
    description: group.description ?? null,
    type: group.type ?? null,
    currency: currencyCode(group.currency),
    balance: numeric(group.balance),
    totalOwed: numeric(group.totalOwed),
    totalOwing: numeric(group.totalOwing),
    memberCount: numeric(group.memberCount),
    defaultSplitType: group.defaultSplitType ?? null,
    useOptimalSettlement: group.useOptimalSettlement === true,
    memberBalanceVisibility: group.memberBalanceVisibility ?? null,
  };
}

function cleanMembers(body: unknown) {
  return asArray(body).map((value) => {
    const member = asRecord(value);
    return {
      id: member.id ?? null,
      userId: member.userId ?? null,
      name: member.name ?? null,
      role: member.role ?? null,
      isGuest: member.isGuest === true,
      isGold: member.isGold === true,
      defaultSplitPercentage: numeric(member.defaultSplitPercentage),
      joinedAt: member.joinedAt ?? null,
    };
  });
}

function cleanActivities(body: unknown) {
  return asArray(body).map((value) => {
    const activity = asRecord(value);
    if (activity.entity === "payment") {
      return {
        entity: "payment",
        id: activity.id ?? null,
        description: activity.description ?? null,
        amount: numeric(activity.amount),
        currency: currencyCode(activity.currency),
        date: activity.date ?? null,
        from: cleanUserSummary(activity.fromUser),
        to: cleanUserSummary(activity.toUser),
        isSettlement: activity.isSettlement === true,
      };
    }
    return {
      entity: "expense",
      id: activity.id ?? null,
      title: activity.title ?? null,
      amount: numeric(activity.amount),
      currency: currencyCode(activity.currency),
      date: activity.date ?? null,
      paidBy: cleanUserSummary(activity.paidByUser),
      category: asRecord(activity.category).name ?? null,
      splitType: activity.splitType ?? null,
      isRecurring: activity.recurringExpenseRuleId != null,
    };
  });
}

function cleanCreatedGroup(body: unknown) {
  const group = asRecord(body);
  return {
    id: group.id ?? null,
    name: group.name ?? null,
    description: group.description ?? null,
    type: group.type ?? null,
    currencyId: group.currencyId ?? null,
    creatorId: group.creatorId ?? null,
    defaultSplitType: group.defaultSplitType ?? null,
    memberBalanceVisibility: group.memberBalanceVisibility ?? null,
  };
}

function cleanMemberDetail(body: unknown) {
  const member = asRecord(body);
  const user = asRecord(member.user);
  return {
    id: member.id ?? null,
    userId: member.userId ?? user.id ?? null,
    name: user.name ?? member.name ?? null,
    username: user.displayUsername ?? user.username ?? null,
    email: user.email ?? null,
    bio: user.bio ?? null,
    role: member.role ?? null,
    isGuest: member.isGuest === true,
    isGold: member.isGold === true,
    defaultSplitPercentage: numeric(member.defaultSplitPercentage),
    joinedAt: member.joinedAt ?? null,
  };
}

function cleanExpenseDetail(body: unknown) {
  const expense = asRecord(body);
  const recurrence = asRecord(expense.recurrence);
  return {
    id: expense.id ?? null,
    title: expense.title ?? null,
    description: expense.description ?? null,
    amount: numeric(expense.amount),
    currency: currencyCode(expense.currency),
    date: expense.date ?? null,
    timezone: expense.timezone ?? null,
    paidBy: cleanUserSummary(expense.paidByUser),
    creator: cleanUserSummary(expense.creator),
    group: cleanUserSummary(expense.group),
    category: asRecord(expense.category).name ?? null,
    splitType: expense.splitType ?? null,
    isRecurring:
      expense.recurringExpenseRuleId != null || expense.recurrence != null,
    recurrence:
      expense.recurrence == null
        ? null
        : {
            frequency: recurrence.frequency ?? null,
            interval: numeric(recurrence.interval),
          },
    splits: asArray(expense.shares).map((value) => {
      const share = asRecord(value);
      return {
        user: cleanUserSummary(share.user),
        userId: share.userId ?? null,
        amount: numeric(share.amount),
      };
    }),
  };
}

function cleanPaymentDetail(body: unknown) {
  const payment = asRecord(body);
  return {
    id: payment.id ?? null,
    description: payment.description ?? null,
    amount: numeric(payment.amount),
    currency: currencyCode(payment.currency),
    date: payment.date ?? null,
    timezone: payment.timezone ?? null,
    from: cleanUserSummary(payment.fromUser),
    to: cleanUserSummary(payment.toUser),
    creator: cleanUserSummary(payment.creator),
    group: cleanUserSummary(payment.group),
    isSettlement: payment.isSettlement === true,
    usedOptimalSettlement: payment.usedOptimalSettlement === true,
  };
}

function formatGroup(body: unknown) {
  const response = asRecord(body);
  return [
    `Name: ${display(response.name)}`,
    `Description: ${display(response.description)}`,
    `Type: ${display(response.type)}`,
    `Currency: ${display(response.currency)}`,
    `Balance: ${humanAmount(response.balance, response.currency)}`,
    `Owed: ${humanAmount(response.totalOwed, response.currency)}`,
    `Owing: ${humanAmount(response.totalOwing, response.currency)}`,
    `Members: ${display(response.memberCount)}`,
    `Default split: ${display(response.defaultSplitType)}`,
    `Optimal settlement: ${yesNo(response.useOptimalSettlement)}`,
    `Balance visibility: ${display(response.memberBalanceVisibility)}`,
    `ID: ${display(response.id)}`,
  ].join("\n");
}

function activityDetailPath(item: Record<string, unknown>) {
  const collection = item.entity === "payment" ? "payments" : "expenses";
  return `/${collection}/${encodedDetailId(item.id)}`;
}

function formatActivityDetail(item: Record<string, unknown>, body: unknown) {
  if (item.entity === "payment") {
    const payment = asRecord(cleanPaymentDetail(body));
    return [
      `Description: ${display(payment.description)}`,
      `Amount: ${humanAmount(payment.amount, payment.currency)}`,
      `From: ${namedEntity(payment.from)}`,
      `To: ${namedEntity(payment.to)}`,
      `Settlement: ${yesNo(payment.isSettlement)}`,
      `Optimal settlement: ${yesNo(payment.usedOptimalSettlement)}`,
      `Date: ${display(payment.date)}`,
      `Timezone: ${display(payment.timezone)}`,
      `Group: ${namedEntity(payment.group)}`,
      `Created by: ${namedEntity(payment.creator)}`,
      `ID: ${display(payment.id)}`,
    ].join("\n");
  }

  const expense = asRecord(cleanExpenseDetail(body));
  const recurrence = asRecord(expense.recurrence);
  const splits = asArray(expense.splits);
  return [
    `Description: ${display(expense.description)}`,
    `Amount: ${humanAmount(expense.amount, expense.currency)}`,
    `Paid by: ${namedEntity(expense.paidBy)}`,
    `Category: ${display(expense.category)}`,
    `Split: ${display(expense.splitType)}`,
    `Recurring: ${yesNo(expense.isRecurring)}`,
    ...(expense.recurrence == null
      ? []
      : [
          `Recurrence frequency: ${display(recurrence.frequency)}`,
          `Recurrence interval: ${display(recurrence.interval)}`,
        ]),
    `Date: ${display(expense.date)}`,
    `Timezone: ${display(expense.timezone)}`,
    `Group: ${namedEntity(expense.group)}`,
    `Created by: ${namedEntity(expense.creator)}`,
    `ID: ${display(expense.id)}`,
    "",
    "Splits",
    ...(splits.length
      ? splits.map((value) => {
          const split = asRecord(value);
          const user = asRecord(split.user);
          return `${display(user.name ?? split.userId)}: ${humanAmount(split.amount, expense.currency)}${
            split.userId ? ` · ${String(split.userId)}` : ""
          }`;
        })
      : ["—"]),
  ].join("\n");
}

export const groupPresenters = {
  "group-list": {
    clean: cleanGroupList,
    format(body) {
      const response = asRecord(body);
      const items = asArray(response.items);
      const lines = items.length
        ? [
            "Groups",
            ...items.map((value, index) => {
              const group = asRecord(value);
              return formatCard(index, group.name, [
                `ID: ${display(group.id)}`,
                `Type: ${display(group.type)}`,
                `Description: ${display(group.description)}`,
                `Balance: ${humanAmount(group.balance, group.currency)}`,
                `Members: ${display(group.memberCount)}`,
                `Last activity: ${display(group.mostRecentActivity)}`,
              ]);
            }),
          ]
        : ["No groups."];
      lines.push(
        response.hasMore && response.nextCursor
          ? [
              "More groups available.",
              `Next page: banana groups list --cursor ${JSON.stringify(response.nextCursor)}`,
            ].join("\n")
          : "End of groups.",
      );
      return lines.join("\n\n");
    },
    browser: {
      detailPath(_command, item) {
        return `/groups/${encodedDetailId(item.id)}`;
      },
      formatDetail(item, body) {
        return formatGroup(cleanGroup({
          ...asRecord(body),
          memberCount: item.memberCount,
        }));
      },
    },
  },
  group: { clean: cleanGroup, format: formatGroup },
  members: {
    clean: cleanMembers,
    format(body) {
      const items = asArray(body);
      if (!items.length) return "No group members.";
      return [
        "Group members",
        ...items.map((value, index) => {
          const member = asRecord(value);
          return formatCard(index, member.name, [
            `Role: ${display(member.role)}`,
            `Guest: ${yesNo(member.isGuest)}`,
            `Gold: ${yesNo(member.isGold)}`,
            `Default split: ${display(member.defaultSplitPercentage)}`,
            `Joined: ${display(member.joinedAt)}`,
            `Member ID: ${display(member.id)}`,
            `User ID: ${display(member.userId)}`,
          ]);
        }),
      ].join("\n\n");
    },
    browser: {
      detailPath(command, item) {
        return `${command.path}/${encodedDetailId(item.id)}`;
      },
      formatDetail(_item, body) {
        const member = asRecord(cleanMemberDetail(body));
        return [
          `Name: ${display(member.name)}`,
          `Username: ${display(member.username)}`,
          `Email: ${display(member.email)}`,
          `Bio: ${display(member.bio)}`,
          `Role: ${display(member.role)}`,
          `Guest: ${yesNo(member.isGuest)}`,
          `Gold: ${yesNo(member.isGold)}`,
          `Default split: ${display(member.defaultSplitPercentage)}`,
          `Joined: ${display(member.joinedAt)}`,
          `Member ID: ${display(member.id)}`,
          `User ID: ${display(member.userId)}`,
        ].join("\n");
      },
    },
  },
  activities: {
    clean: cleanActivities,
    format(body) {
      const items = asArray(body);
      if (!items.length) return "No group activities.";
      return [
        "Group activities",
        ...items.map((value, index) => {
          const activity = asRecord(value);
          if (activity.entity === "payment") {
            const from = asRecord(activity.from);
            const to = asRecord(activity.to);
            return formatCard(
              index,
              `Payment: ${display(activity.description)}`,
              [
                `Amount: ${humanAmount(activity.amount, activity.currency)}`,
                `From: ${display(from.name)}`,
                `To: ${display(to.name)}`,
                `Settlement: ${yesNo(activity.isSettlement)}`,
                `Date: ${display(activity.date)}`,
                `ID: ${display(activity.id)}`,
              ],
            );
          }
          const paidBy = asRecord(activity.paidBy);
          return formatCard(
            index,
            `Expense: ${display(activity.title)}`,
            [
              `Amount: ${humanAmount(activity.amount, activity.currency)}`,
              `Paid by: ${display(paidBy.name)}`,
              `Category: ${display(activity.category)}`,
              `Split: ${display(activity.splitType)}`,
              `Recurring: ${yesNo(activity.isRecurring)}`,
              `Date: ${display(activity.date)}`,
              `ID: ${display(activity.id)}`,
            ],
          );
        }),
      ].join("\n\n");
    },
    browser: {
      detailPath(_command, item) {
        return activityDetailPath(item);
      },
      formatDetail: formatActivityDetail,
    },
  },
  "group-created": {
    clean: cleanCreatedGroup,
    format(body) {
      const response = asRecord(body);
      return [
        "Group created",
        `Name: ${display(response.name)}`,
        `Description: ${display(response.description)}`,
        `Type: ${display(response.type)}`,
        `Currency ID: ${display(response.currencyId)}`,
        `Default split: ${display(response.defaultSplitType)}`,
        `Balance visibility: ${display(response.memberBalanceVisibility)}`,
        `ID: ${display(response.id)}`,
      ].join("\n");
    },
  },
} satisfies Record<
  "group-list" | "group" | "members" | "activities" | "group-created",
  Presenter
>;
