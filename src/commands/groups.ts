import {
  DEFAULT_LIST_LIMIT,
  SEARCH_LIMIT,
  appendQuery,
  asArray,
  asRecord,
  currencyCode,
  display,
  encodedDetailId,
  enumValue,
  humanAmount,
  humanDate,
  matchItems,
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
  yesNo,
} from "../shared";
import { helpText } from "../help";
import { type Field, fields, heading, note, section, table } from "../render";
import {
  type BrowserLink,
  type ParsedCommand,
  type Presenter,
  type Reference,
  type RequestCommand,
} from "../types";

const HELP = helpText({
  summary: "Create groups and browse their members, balances and activity.",
  usage: ["banana groups [list] [flags]", "banana groups <command> [flags]"],
  commands: [
    ["list", "List your groups and their balances"],
    ["create", "Create a group"],
    ["get <group>", "Show one group"],
    ["members <group>", "List the members of a group"],
    ["activities <group>", "List the expenses and payments in a group"],
  ],
  notes: [
    "`banana groups` on its own runs `banana groups list`.",
    "A group is named by its name, a prefix of it, or its id.",
  ],
  examples: [
    "banana groups",
    'banana groups get "Lisbon trip"',
    "banana groups activities Lisbon --type expenses",
  ],
  learnMore: ["banana groups <command> --help"],
});
const LIST_HELP = helpText({
  summary: "List your groups, newest activity first.",
  usage: ["banana groups list [flags]"],
  options: [
    ["--search TEXT", "Only groups whose name matches"],
    ["--limit N", `Groups to fetch (default: ${DEFAULT_LIST_LIMIT})`],
    ["--cursor CURSOR", "Continue from a cursor returned by a previous page"],
    ["--archived", "Include archived groups"],
    ["--sort balance|lastActivity", "Order the list"],
  ],
  notes: [
    "--search matches on the name, case-insensitively. It fetches a wider\npage and filters it here, so pass --limit to widen it further.",
  ],
  examples: [
    "banana groups list",
    "banana groups list --search lisbon",
    "banana groups list --limit 20 --archived",
  ],
});
const GET_HELP = helpText({
  summary: "Show one group with its currency, type and member count.",
  usage: ["banana groups get <group>"],
  notes: ["A group is named by its name, a prefix of it, or its id."],
  examples: ['banana groups get "Lisbon trip"', "banana groups get Lisbon --json"],
});
const MEMBERS_HELP = helpText({
  summary: "List the members of a group and what each one owes.",
  usage: ["banana groups members <group>"],
  notes: ["A group is named by its name, a prefix of it, or its id."],
  examples: [
    'banana groups members "Lisbon trip"',
    "banana groups members Lisbon --json",
  ],
});
const CREATE_HELP = helpText({
  summary: "Create a group, optionally with its members.",
  usage: [
    "banana groups create --name TEXT --currency CODE [flags]",
    "banana groups create JSON",
  ],
  options: [
    ["--name TEXT", "Group name (required)"],
    ["--currency CODE", "Currency the group settles in (required)"],
    ["--description TEXT", "What the group is for"],
    ["--type TYPE", "vacation|roommates|couple|travel|party|other"],
    ["--member WHO", "Add a member; repeat for several"],
  ],
  notes: [
    "--currency and --member take a code or name as well as an id.",
  ],
  examples: [
    'banana groups create --name "Lisbon trip" --currency EUR',
    "banana groups create --name Flat --currency EUR \\",
    "  --type roommates --member Ana",
  ],
});
const ACTIVITIES_HELP = helpText({
  summary: "List the expenses and payments recorded in a group.",
  usage: ["banana groups activities <group> [flags]"],
  options: [
    ["--search QUERY", "Only activities matching a search"],
    ["--limit N", "Activities per page"],
    ["--cursor CURSOR", "Continue from a cursor returned by a previous page"],
    ["--type TYPE", "all|expenses|payments|recurring_expenses"],
    ["--sort date|amount", "Order the list"],
    ["--direction asc|desc", "Sort direction"],
  ],
  examples: [
    'banana groups activities "Lisbon trip"',
    "banana groups activities Lisbon --type expenses --sort amount",
    'banana groups activities Lisbon --search "dinner"',
  ],
});

/** The `<group>` argument every group command takes: a name, prefix or id. */
function groupReference(value: string): Reference {
  return { field: "path", flag: "<group>", kind: "group", value };
}

function parseGroupsList(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: LIST_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      archived: { type: "boolean" },
      cursor: { type: "string" },
      limit: { type: "string" },
      search: { type: "string" },
      sort: { type: "string" },
    },
    LIST_HELP,
  );
  requirePositionals(positionals, 0, LIST_HELP);

  const search = values.search as string | undefined;
  const query = new URLSearchParams();
  appendQuery(
    query,
    "l",
    positiveInteger(values.limit, "--limit") ??
      // The API has no name filter, so a search has to see more than one
      // default page of groups to filter anything worth filtering.
      String(search === undefined ? DEFAULT_LIST_LIMIT : SEARCH_LIMIT),
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
    ...(search === undefined
      ? {}
      : { postFilter: matchItems(search, (group: Record<string, unknown>) => [
            group.name,
          ]) }),
  };
}

function parseGroupsCreate(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: CREATE_HELP };
  const { positionals, values } = parseOptions(
    args,
    {
      currency: { type: "string" },
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
      ...(description === undefined ? {} : { description }),
      ...(type === undefined ? {} : { type }),
      ...(groupMembers.length === 0 ? {} : { groupMembers }),
    },
    references: [
      {
        field: "currencyId",
        flag: "--currency",
        kind: "currency",
        value: requiredString(values.currency, "--currency", CREATE_HELP),
      },
      ...groupMembers.map((member, index) => ({
        field: `groupMembers.${index}`,
        flag: "--member",
        kind: "user" as const,
        value: member,
      })),
    ],
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

  const search = values.search as string | undefined;
  if (search !== undefined) query.set("q", search);
  return {
    kind: "request",
    path: `/groups/:ref/activities${search === undefined ? "" : "/search"}`,
    presentation: "activities",
    query,
    references: [groupReference(positionals[0]!)],
  };
}

export function parseGroups(args: string[]): ParsedCommand {
  if (args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  // `banana groups --search x` is the list, the same as `banana groups`.
  if (args.length === 0 || args[0]!.startsWith("-")) return parseGroupsList(args);

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
      path: `/groups/:ref${command === "members" ? "/members" : ""}`,
      presentation: command === "members" ? "members" : "group",
      references: [groupReference(positionals[0]!)],
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
        ...userRef("fromUserId", "from", activity.fromUser),
        ...userRef("toUserId", "to", activity.toUser),
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
      ...userRef("paidById", "paidBy", activity.paidByUser),
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
    ...userRef("paidById", "paidBy", expense.paidByUser),
    ...userRef("creatorId", "creator", expense.creator),
    ...userRef("groupId", "group", expense.group),
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
        ...userRef("userId", "user", share.user),
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
    ...userRef("fromUserId", "from", payment.fromUser),
    ...userRef("toUserId", "to", payment.toUser),
    ...userRef("creatorId", "creator", payment.creator),
    ...userRef("groupId", "group", payment.group),
    isSettlement: payment.isSettlement === true,
    usedOptimalSettlement: payment.usedOptimalSettlement === true,
  };
}

/** The collections a group's details drill into, wherever it is listed. */
function groupLinks(
  _command: RequestCommand,
  item: Record<string, unknown>,
): BrowserLink[] {
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
}

function cleanSharedGroups(body: unknown) {
  return asArray(body).map((value) => {
    const group = asRecord(value);
    return {
      id: group.id ?? null,
      name: group.name ?? null,
      description: group.description ?? null,
      type: group.type ?? null,
    };
  });
}

function formatGroup(body: unknown, title = "Group") {
  const response = asRecord(body);
  return section(
    heading(title),
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
    return section(
      heading("Payment"),
      fields([
        ["Description", display(payment.description)],
        ["Amount", humanAmount(payment.amount, payment.currency)],
        ["From", display(payment.from)],
        ["To", display(payment.to)],
        ["Settlement", yesNo(payment.isSettlement)],
        ["Optimal settlement", yesNo(payment.usedOptimalSettlement)],
        ["Date", humanDate(payment.date)],
        ["Timezone", display(payment.timezone)],
        ["Group", display(payment.group)],
        ["Created by", display(payment.creator)],
        ["ID", display(payment.id), true],
      ]),
    );
  }

  const expense = asRecord(cleanExpenseDetail(body));
  const recurrence = asRecord(expense.recurrence);
  const splits = asArray(expense.splits);
  return section(
    heading("Expense"),
    fields([
      ["Description", display(expense.description)],
      ["Amount", humanAmount(expense.amount, expense.currency)],
      ["Paid by", display(expense.paidBy)],
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
      ["Group", display(expense.group)],
      ["Created by", display(expense.creator)],
      ["ID", display(expense.id), true],
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
            return [split.user, humanAmount(split.amount, expense.currency)];
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
                { label: "Name", max: 24 },
                { label: "Type", max: 12 },
                { label: "Members", align: "right" },
                { label: "Balance", align: "right" },
                { label: "Last activity" },
              ],
              items.map((value) => {
                const group = asRecord(value);
                return [
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
      links: groupLinks,
      formatDetail(item, body) {
        return formatGroup(cleanGroup({
          ...asRecord(body),
          memberCount: item.memberCount,
        }));
      },
    },
  },
  group: { clean: cleanGroup, format: formatGroup },
  "friend-groups": {
    clean: cleanSharedGroups,
    format(body) {
      const items = asArray(body);
      if (!items.length) return note("No shared groups.");
      return table(
        [
          { label: "Name", max: 24 },
          { label: "Type", max: 12 },
          { label: "Description", max: 32 },
        ],
        items.map((value) => {
          const group = asRecord(value);
          return [group.name, group.type, group.description];
        }),
      );
    },
    browser: {
      detailPath(_command, item) {
        return `/groups/${encodedDetailId(item.id)}`;
      },
      links: groupLinks,
      formatDetail(_item, body) {
        return formatGroup(cleanGroup(body));
      },
    },
  },
  members: {
    clean: cleanMembers,
    format(body) {
      const items = asArray(body);
      if (!items.length) return note("No group members.");
      return table(
        [
          { label: "Name", max: 24 },
          { label: "Role", max: 12 },
          { label: "Guest" },
          { label: "Default split", align: "right" },
          { label: "Joined" },
        ],
        items.map((value) => {
          const member = asRecord(value);
          return [
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
                    ? `${display(activity.from)} → ${display(activity.to)}`
                    : activity.paidBy,
                  humanAmount(activity.amount, activity.currency),
                ];
              }),
            )
          : note("No group activities."),
        note(
          response.hasMore && response.nextCursor
            ? `More activities available. Next page: banana groups activities <group> --cursor ${JSON.stringify(response.nextCursor)}`
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
    clean: cleanGroup,
    format: (body) => formatGroup(body, "Group created"),
  },
} satisfies Record<
  | "group-list"
  | "group"
  | "friend-groups"
  | "members"
  | "activities"
  | "group-created",
  Presenter
>;
