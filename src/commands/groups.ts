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
  humanAmount,
  humanDate,
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
import { type Field, fields, heading, note, section, table } from "../render";
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
    ["--cursor CURSOR", "Continue from a cursor returned by a previous page"],
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
      cursor: { type: "string" },
      direction: { type: "string" },
      limit: { type: "string" },
      search: { type: "string" },
      sort: { type: "string" },
      type: { type: "string" },
    },
    ACTIVITIES_HELP,
  );
  requirePositionals(positionals, 1, ACTIVITIES_HELP);

  const query = new URLSearchParams();
  appendQuery(query, "l", positiveInteger(values.limit, "--limit"));
  appendQuery(query, "cursor", values.cursor as string | undefined);
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
  const response = asRecord(body);
  const items = asArray(response.items).map((value) => {
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
  return {
    items,
    hasMore: response.hasMore === true,
    nextCursor: response.nextCursor ?? null,
  };
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
  return section(
    heading("Group"),
    fields([
      ["Name", display(response.name)],
      ["Description", display(response.description)],
      ["Type", display(response.type)],
      ["Currency", display(response.currency)],
      ["Balance", humanAmount(response.balance, response.currency)],
      ["Owed", humanAmount(response.totalOwed, response.currency)],
      ["Owing", humanAmount(response.totalOwing, response.currency)],
      ["Members", display(response.memberCount)],
      ["Default split", display(response.defaultSplitType)],
      ["Optimal settlement", yesNo(response.useOptimalSettlement)],
      ["Balance visibility", display(response.memberBalanceVisibility)],
      ["ID", display(response.id), true],
    ]),
  );
}

function activityDetailPath(item: Record<string, unknown>) {
  const collection = item.entity === "payment" ? "payments" : "expenses";
  return `/${collection}/${encodedDetailId(item.id)}`;
}

function formatActivityDetail(item: Record<string, unknown>, body: unknown) {
  if (item.entity === "payment") {
    const payment = asRecord(cleanPaymentDetail(body));
    const from = asRecord(payment.from);
    const to = asRecord(payment.to);
    return section(
      heading("Payment"),
      fields([
        ["Description", display(payment.description)],
        ["Amount", humanAmount(payment.amount, payment.currency)],
        ["From", display(from.name)],
        ["To", display(to.name)],
        ["Settlement", yesNo(payment.isSettlement)],
        ["Optimal settlement", yesNo(payment.usedOptimalSettlement)],
        ["Date", humanDate(payment.date)],
        ["Timezone", display(payment.timezone)],
        ["Group", display(asRecord(payment.group).name)],
        ["Created by", display(asRecord(payment.creator).name)],
        ["ID", display(payment.id), true],
        ["From ID", display(from.id), true],
        ["To ID", display(to.id), true],
        ["Group ID", display(asRecord(payment.group).id), true],
      ]),
    );
  }

  const expense = asRecord(cleanExpenseDetail(body));
  const recurrence = asRecord(expense.recurrence);
  const splits = asArray(expense.splits);
  const paidBy = asRecord(expense.paidBy);
  const group = asRecord(expense.group);
  return section(
    heading("Expense"),
    fields([
      ["Description", display(expense.description)],
      ["Amount", humanAmount(expense.amount, expense.currency)],
      ["Paid by", display(paidBy.name)],
      ["Category", display(expense.category)],
      ["Split", display(expense.splitType)],
      ["Recurring", yesNo(expense.isRecurring)],
      ...(expense.recurrence == null
        ? []
        : ([
            ["Recurrence frequency", display(recurrence.frequency)],
            ["Recurrence interval", display(recurrence.interval)],
          ] as Field[])),
      ["Date", humanDate(expense.date)],
      ["Timezone", display(expense.timezone)],
      ["Group", display(group.name)],
      ["Created by", display(asRecord(expense.creator).name)],
      ["ID", display(expense.id), true],
      ["Paid by ID", display(paidBy.id), true],
      ["Group ID", display(group.id), true],
    ]),
    heading("Splits"),
    splits.length
      ? table(
          [
            { label: "User ID", id: true },
            { label: "Name", max: 24 },
            { label: "Amount", align: "right" },
          ],
          splits.map((value) => {
            const split = asRecord(value);
            const user = asRecord(split.user);
            return [
              split.userId,
              user.name,
              humanAmount(split.amount, expense.currency),
            ];
          }),
        )
      : note("This expense has no splits."),
  );
}

export const groupPresenters = {
  "group-list": {
    clean: cleanGroupList,
    format(body) {
      const response = asRecord(body);
      const items = asArray(response.items);
      return section(
        items.length
          ? table(
              [
                { label: "ID", id: true },
                { label: "Name", max: 24 },
                { label: "Type", max: 12 },
                { label: "Members", align: "right" },
                { label: "Balance", align: "right" },
                { label: "Last activity" },
              ],
              items.map((value) => {
                const group = asRecord(value);
                return [
                  group.id,
                  group.name,
                  group.type,
                  group.memberCount,
                  humanAmount(group.balance, group.currency),
                  humanDate(group.mostRecentActivity),
                ];
              }),
            )
          : note("No groups."),
        note(
          response.hasMore && response.nextCursor
            ? `More groups available. Next page: banana groups list --cursor ${JSON.stringify(response.nextCursor)}`
            : "End of groups.",
        ),
      );
    },
    browser: {
      detailPath(_command, item) {
        return `/groups/${encodedDetailId(item.id)}`;
      },
      links(_command, item) {
        const group = `/groups/${encodedDetailId(item.id)}`;
        return [
          { key: "m", label: "members", presentation: "members",
            path: `${group}/members` },
          { key: "e", label: "expenses", presentation: "activities",
            path: `${group}/activities`,
            query: new URLSearchParams({ type: "expenses" }) },
          { key: "a", label: "activity", presentation: "activities",
            path: `${group}/activities` },
        ];
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
      if (!items.length) return note("No group members.");
      return table(
        [
          { label: "User ID", id: true },
          { label: "Name", max: 24 },
          { label: "Role", max: 12 },
          { label: "Guest" },
          { label: "Default split", align: "right" },
          { label: "Joined" },
        ],
        items.map((value) => {
          const member = asRecord(value);
          return [
            member.userId,
            member.name,
            member.role,
            yesNo(member.isGuest),
            member.defaultSplitPercentage,
            humanDate(member.joinedAt),
          ];
        }),
      );
    },
    browser: {
      detailPath(command, item) {
        return `${command.path}/${encodedDetailId(item.id)}`;
      },
      formatDetail(_item, body) {
        const member = asRecord(cleanMemberDetail(body));
        return section(
          heading("Member"),
          fields([
            ["Name", display(member.name)],
            ["Username", display(member.username)],
            ["Email", display(member.email)],
            ["Bio", display(member.bio)],
            ["Role", display(member.role)],
            ["Guest", yesNo(member.isGuest)],
            ["Gold", yesNo(member.isGold)],
            ["Default split", display(member.defaultSplitPercentage)],
            ["Joined", humanDate(member.joinedAt)],
            ["Member ID", display(member.id), true],
            ["User ID", display(member.userId), true],
          ]),
        );
      },
    },
  },
  activities: {
    clean: cleanActivities,
    format(body) {
      const response = asRecord(body);
      const items = asArray(response.items);
      return section(
        items.length
          ? table(
              [
                { label: "ID", id: true },
                { label: "Date" },
                { label: "Kind" },
                { label: "Title", max: 24 },
                { label: "Who", max: 20 },
                { label: "Amount", align: "right" },
              ],
              items.map((value) => {
                const activity = asRecord(value);
                const payment = activity.entity === "payment";
                return [
                  activity.id,
                  humanDate(activity.date),
                  payment ? "payment" : "expense",
                  payment ? activity.description : activity.title,
                  payment
                    ? `${display(asRecord(activity.from).name)} → ${display(asRecord(activity.to).name)}`
                    : asRecord(activity.paidBy).name,
                  humanAmount(activity.amount, activity.currency),
                ];
              }),
            )
          : note("No group activities."),
        note(
          response.hasMore && response.nextCursor
            ? `More activities available. Next page: banana groups activities <group-id> --cursor ${JSON.stringify(response.nextCursor)}`
            : "End of activities.",
        ),
      );
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
      return section(
        heading("Group created"),
        fields([
          ["Name", display(response.name)],
          ["Description", display(response.description)],
          ["Type", display(response.type)],
          ["Default split", display(response.defaultSplitType)],
          ["Balance visibility", display(response.memberBalanceVisibility)],
          ["ID", display(response.id), true],
          ["Currency ID", display(response.currencyId), true],
        ]),
      );
    },
  },
} satisfies Record<
  "group-list" | "group" | "members" | "activities" | "group-created",
  Presenter
>;
