import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { version } from "../package.json";
import { asArray, asRecord } from "../src/shared";
import { asObject, Blocked, expectError, expectExit, expectJson } from "./assert";
import { HELP_PAGES } from "./coverage";
import type { ScenarioContext } from "./creates";
import { close, type BalanceSnapshot } from "./money";
import { walkPages, type PageRow } from "./pages";
import { logLine } from "./process";

export type Scenario = {
  id: string;
  area: string;
  title: string;
  covers: string[];
  run(ctx: ScenarioContext): Promise<void>;
};

function items(body: unknown) {
  return (Array.isArray(body) ? body : asArray(asRecord(body).items)).map(asRecord);
}

function hasId(body: unknown, id: string) {
  return items(body).some((item) => item.id === id);
}

function day(value: unknown) {
  return String(value ?? "").slice(0, 10);
}

function partnerBalance(snapshot: BalanceSnapshot, userId: string) {
  return snapshot.users.find((user) => user.userId === userId)?.balance ?? 0;
}

function yesterday() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function assertAllocation(
  body: Record<string, unknown>,
  splitType: string,
  expected: Array<{ userId: string; amount: string }>,
) {
  if (body.splitType !== splitType) {
    throw new Error(`expected split type ${splitType}, got ${String(body.splitType)}`);
  }
  const splits = asArray(body.splits).map(asRecord);
  if (splits.length !== expected.length) {
    throw new Error(
      `${splitType} split count was ${splits.length}, expected ${expected.length}`,
    );
  }
  for (const share of expected) {
    const found = splits.find((entry) => entry.userId === share.userId);
    if (!found || !close(found.amount, share.amount)) {
      throw new Error(
        `${splitType} allocation for ${share.userId} was ${String(found?.amount)}, expected ${share.amount}`,
      );
    }
  }
}

function page(
  ctx: ScenarioContext,
  label: string,
  args: string[],
  options: {
    expected?: string[];
    paginate?: boolean;
    idOf?: (row: PageRow) => string | null;
    order?: { field: string; direction: "asc" | "desc" | "monotonic" };
  } = {},
) {
  return walkPages({
    label,
    expected: options.expected,
    paginate: options.paginate,
    idOf: options.idOf,
    order: options.order,
    fetch: async (cursor) =>
      expectJson(
        await ctx.banana([
          ...args,
          ...(cursor ? ["--cursor", cursor] : []),
          "--json",
        ]),
      ),
  });
}

function scenario(
  id: string,
  area: string,
  title: string,
  covers: string[],
  run: Scenario["run"],
): Scenario {
  return { id, area, title, covers, run };
}

export const scenarios: Scenario[] = [
  scenario(
    "reads",
    "Reads",
    "Profile, balances, currencies, friends and groups",
    [
      "command:me",
      "command:balance",
      "command:balance users",
      "alias:balances",
      "command:currencies",
      "command:currencies list",
      "currencies --code",
      "currencies --search",
      "command:friends",
      "command:friends list",
      "friends.list --search",
      "friends.list --sort",
      "friends.list --filter",
      "friends.list --limit",
      "command:groups",
      "command:groups list",
      "groups.list --archived",
      "groups.list --sort",
    ],
    async (ctx) => {
      const me = asObject(expectJson(await ctx.banana(["me", "--json"])));
      if (me.id !== ctx.config.accountId) {
        throw new Error("Signed-in user does not match BANANASPLIT_E2E_ACCOUNT_ID.");
      }
      ctx.world.meName = typeof me.name === "string" ? me.name : undefined;
      expectExit(await ctx.banana(["balance"]), 0);
      expectJson(await ctx.banana(["balance", "users", "--json"]));
      expectJson(await ctx.banana(["balances", "--json"]));

      const currencies = items(
        expectJson(await ctx.banana(["currencies", "--json"])),
      );
      const currency = currencies.find(
        (entry) =>
          String(entry.code ?? "").toLowerCase() === ctx.config.currency.toLowerCase(),
      );
      if (!currency || typeof currency.id !== "string") {
        throw new Blocked(
          `Currency ${ctx.config.currency} is not in the catalog.`,
        );
      }
      ctx.world.currencyId = currency.id;
      ctx.world.currencyName =
        typeof currency.name === "string" ? currency.name : undefined;
      const byCode = items(
        expectJson(
          await ctx.banana([
            "currencies",
            "list",
            "--code",
            ctx.config.currency,
            "--json",
          ]),
        ),
      );
      if (byCode.length !== 1) {
        throw new Error(`--code ${ctx.config.currency} returned ${byCode.length} rows`);
      }
      const searched = items(
        expectJson(
          await ctx.banana([
            "currencies",
            "--search",
            ctx.config.currency,
            "--json",
          ]),
        ),
      );
      if (!searched.some((entry) => entry.id === currency.id)) {
        throw new Error("currency --search missed the configured code");
      }

      const friends = items(
        expectJson(
          await ctx.banana([
            "friends",
            "--search",
            ctx.config.partnerName,
            "--limit",
            "25",
            "--json",
          ]),
        ),
      );
      if (!friends.some((friend) => friend.userId === ctx.config.partnerId)) {
        throw new Blocked(
          "BANANASPLIT_E2E_PARTNER_ID is not in friends --search for the partner name.",
        );
      }
      expectExit(await ctx.banana(["friends", "list", "--sort", "balance"]), 0);
      const everyone = await page(ctx, "friends --filter all", [
        "friends",
        "list",
        "--filter",
        "all",
        "--limit",
        "100",
      ], {
        idOf: (row) => (typeof row.userId === "string" ? row.userId : null),
      });
      const partner = everyone.rows.find(
        (friend) => friend.userId === ctx.config.partnerId,
      );
      if (!partner) {
        throw new Blocked(
          "BANANASPLIT_E2E_PARTNER_ID is not in friends --filter all.",
        );
      }
      if (partner.isGuest === true) {
        throw new Blocked(
          "BANANASPLIT_E2E_PARTNER_ID is a guest, so --filter guests has no non-guest to exclude.",
        );
      }
      const guest = everyone.rows.find((friend) => friend.isGuest === true);
      if (!guest || typeof guest.userId !== "string") {
        logLine(
          "skipped friends --filter guests: this account has no guest friend",
        );
      } else {
        const guests = await page(ctx, "friends --filter guests", [
          "friends",
          "--filter",
          "guests",
          "--limit",
          "100",
        ], {
          idOf: (row) => (typeof row.userId === "string" ? row.userId : null),
          expected: [guest.userId],
        });
        if (guests.rows.some((friend) => friend.isGuest !== true)) {
          throw new Error("--filter guests included someone who is not a guest");
        }
        if (guests.ids.has(ctx.config.partnerId)) {
          throw new Error("--filter guests included the non-guest partner");
        }
      }
      expectExit(await ctx.banana(["groups"]), 0);
      expectJson(
        await ctx.banana([
          "groups",
          "list",
          "--archived",
          "--sort",
          "lastActivity",
          "--json",
        ]),
      );
    },
  ),

  scenario(
    "groups",
    "Groups/payments",
    "Create a group and its membership",
    [
      "command:groups create",
      "command:groups get",
      "command:groups members",
      "command:groups activities",
      "groups.create --name",
      "groups.create --currency",
      "groups.create --description",
      "groups.create --type",
      "groups.create --member",
    ],
    async (ctx) => {
      const group = await ctx.createGroup({
        label: "primary",
        name: `${ctx.marker} alpha zebra${ctx.marker}`,
        type: "vacation",
        member: true,
      });
      ctx.world.groupId = group.id;
      ctx.world.groupName = group.name;
      const detail = asObject(
        expectJson(await ctx.banana(["groups", "get", group.id, "--json"])),
      );
      if (detail.name !== group.name || detail.currency !== ctx.config.currency) {
        throw new Error("group get did not return the created name and currency");
      }
      if (detail.type !== "vacation") {
        throw new Error(`expected group type vacation, got ${String(detail.type)}`);
      }
      const members = items(
        expectJson(await ctx.banana(["groups", "members", group.name, "--json"])),
      );
      if (!members.some((member) => member.userId === ctx.config.partnerId)) {
        throw new Error("the partner was not added to the group");
      }
      expectJson(await ctx.banana(["groups", "activities", group.id, "--json"]));
      await ctx.createGroup({ label: "alpine" });
    },
  ),

  scenario(
    "expenses",
    "Expenses",
    "Create, edit, delete and restore expenses",
    [
      "command:expenses add",
      "command:expenses get",
      "command:expenses edit",
      "command:expenses delete",
      "command:expenses restore",
      "expenses.add --title",
      "expenses.add --amount",
      "expenses.add --currency",
      "expenses.add --date",
      "expenses.add --paid-by",
      "expenses.add --group",
      "expenses.add --description",
      "expenses.add --notify-me",
      "expenses.add --split-type",
      "expenses.add --split",
      "expenses.edit --title",
      "expenses.edit --amount",
      "expenses.edit --currency",
      "expenses.edit --paid-by",
      "expenses.edit --date",
      "expenses.edit --description",
      "expenses.edit --group",
      "expenses.edit --no-group",
      "expenses.edit --split-type",
      "expenses.edit --split",
    ],
    async (ctx) => {
      const partner = ctx.config.partnerName;
      const equal = await ctx.createExpense({
        label: "equal",
        amount: "2.00",
        group: true,
        splitType: "equal",
        paidBy: "me",
        notify: true,
        splits: [
          ["me", "1.00"],
          [partner, "1.00"],
        ],
      });
      ctx.world.expenseId = equal.id;
      ctx.world.expenseTitle = String(equal.body.title ?? "");
      ctx.world.oneOffId = equal.id;
      const me = ctx.config.accountId;
      const partnerId = ctx.config.partnerId;
      const halves = [
        { userId: me, amount: "1.00" },
        { userId: partnerId, amount: "1.00" },
      ];
      assertAllocation(equal.body, "equal", halves);

      const direct = await ctx.createExpense({
        label: "direct",
        amount: "2.00",
        description: `${ctx.marker} kept`,
        date: "2020-01-17",
        paidBy: ctx.config.partnerId,
        splits: [
          ["me", "1.00"],
          [partner, "1.00"],
        ],
      });
      const renamed = `${ctx.marker} renamed`;
      const edited = asObject(
        expectJson(
          await ctx.banana([
            "expenses",
            "edit",
            direct.id,
            "--title",
            renamed,
            "--json",
          ]),
        ),
      );
      if (edited.title !== renamed || edited.description !== `${ctx.marker} kept`) {
        throw new Error("editing the title changed another field");
      }
      if (day(edited.date) !== "2020-01-17") {
        throw new Error("editing the title changed the date");
      }
      const amount = asObject(
        expectJson(
          await ctx.banana([
            "expenses",
            "edit",
            direct.id,
            "--amount",
            "6.00",
            "--currency",
            ctx.config.currency,
            "--paid-by",
            "me",
            "--date",
            "2020-01-18",
            "--description",
            `${ctx.marker} kept`,
            "--split-type",
            "custom",
            "--split",
            "me=3.00",
            "--split",
            `${partner}=3.00`,
            "--json",
          ]),
        ),
      );
      if (!close(amount.amount, "6.00") || amount.paidById !== ctx.config.accountId) {
        throw new Error("amount edit did not apply the new total and payer");
      }
      assertAllocation(amount, "custom", [
        { userId: ctx.config.accountId, amount: "3.00" },
        { userId: ctx.config.partnerId, amount: "3.00" },
      ]);
      const moved = asObject(
        expectJson(
          await ctx.banana([
            "expenses",
            "edit",
            direct.id,
            "--group",
            ctx.world.groupName ?? "",
            "--json",
          ]),
        ),
      );
      if (moved.groupId !== ctx.world.groupId) {
        throw new Error("the expense did not move into the group");
      }
      const detached = asObject(
        expectJson(
          await ctx.banana(["expenses", "edit", direct.id, "--no-group", "--json"]),
        ),
      );
      if (detached.groupId !== null) {
        throw new Error("the expense stayed on the group after --no-group");
      }

      const removed = await ctx.createExpense({
        label: "restore",
        amount: "2.00",
        group: true,
        splits: [
          ["me", "1.00"],
          [partner, "1.00"],
        ],
      });
      expectExit(await ctx.banana(["expenses", "delete", removed.id, "--json"]), 0);
      const afterDelete = await page(ctx, "expenses list", [
        "expenses",
        "list",
        "--limit",
        "100",
      ]);
      if (afterDelete.ids.has(removed.id)) {
        throw new Error("deleted expense was still in the active list");
      }
      expectExit(await ctx.banana(["expenses", "restore", removed.id, "--json"]), 0);
      expectExit(await ctx.banana(["expenses", "restore", removed.id, "--json"]), 0);
      const restored = asObject(
        expectJson(await ctx.banana(["expenses", "get", removed.id, "--json"])),
      );
      if (restored.id !== removed.id) throw new Error("restored expense id changed");
    },
  ),

  scenario(
    "payments",
    "Groups/payments",
    "Payment direction, balance effect and restore",
    [
      "command:payments add",
      "command:payments get",
      "command:payments restore",
      "payments.add --amount",
      "payments.add --currency",
      "payments.add --from",
      "payments.add --to",
      "payments.add --date",
      "payments.add --group",
      "payments.add --description",
    ],
    async (ctx) => {
      const before = await ctx.balances();
      const expense = await ctx.createExpense({
        label: "balance",
        amount: "2.00",
        group: true,
        paidBy: "me",
        splits: [
          ["me", "1.00"],
          [ctx.config.partnerName, "1.00"],
        ],
      });
      const owed = await ctx.balances();
      const delta =
        partnerBalance(owed, ctx.config.partnerId) -
        partnerBalance(before, ctx.config.partnerId);
      if (!close(delta, 1)) {
        throw new Error(
          `expected the partner balance to rise by 1 after ${expense.id}, delta was ${delta}`,
        );
      }
      const settled = await ctx.createPayment({
        label: "from-partner",
        amount: "1.00",
        from: ctx.config.partnerName,
        to: "me",
      });
      if (
        settled.body.fromUserId !== ctx.config.partnerId ||
        settled.body.toUserId !== ctx.config.accountId
      ) {
        throw new Error("payment direction did not match --from and --to");
      }
      const afterSettle = await ctx.balances();
      const settledDelta =
        partnerBalance(afterSettle, ctx.config.partnerId) -
        partnerBalance(owed, ctx.config.partnerId);
      if (!close(settledDelta, -1)) {
        throw new Error(
          `expected the settlement to reverse the balance, delta was ${settledDelta}`,
        );
      }
      const loaded = asObject(
        expectJson(await ctx.banana(["payments", "get", settled.id, "--json"])),
      );
      if (loaded.id !== settled.id) throw new Error("payments get returned another row");

      await ctx.hidePayment(settled.id);
      expectExit(await ctx.banana(["payments", "restore", settled.id, "--json"]), 0);
      expectExit(await ctx.banana(["payments", "restore", settled.id, "--json"]), 0);
    },
  ),

  scenario(
    "recurring",
    "Recurring",
    "Create, inspect, edit, pause, resume and delete a rule",
    [
      "alias:expenses recurring",
      "command:recurring list",
      "command:recurring add",
      "command:recurring get",
      "command:recurring edit",
      "command:recurring delete",
      "recurring.list --status",
      "recurring.list --limit",
      "recurring.list --cursor",
      "recurring.add --title",
      "recurring.add --amount",
      "recurring.add --currency",
      "recurring.add --frequency",
      "recurring.add --start",
      "recurring.add --split",
      "recurring.add --interval",
      "recurring.add --end",
      "recurring.add --paid-by",
      "recurring.add --group",
      "recurring.add --description",
      "recurring.add --split-type",
      "recurring.edit --title",
      "recurring.edit --amount",
      "recurring.edit --currency",
      "recurring.edit --frequency",
      "recurring.edit --interval",
      "recurring.edit --start",
      "recurring.edit --end",
      "recurring.edit --no-end",
      "recurring.edit --paid-by",
      "recurring.edit --group",
      "recurring.edit --no-group",
      "recurring.edit --description",
      "recurring.edit --split-type",
      "recurring.edit --split",
      "recurring.edit --active",
      "recurring.edit --inactive",
      "expenses.list --recurring",
      "expenses.list --no-recurring",
    ],
    async (ctx) => {
      const partner = ctx.config.partnerName;
      const halves = [
        { userId: ctx.config.accountId, amount: "1.00" },
        { userId: ctx.config.partnerId, amount: "1.00" },
      ];
      const rule = await ctx.createRule({
        label: "rent",
        amount: "2.00",
        start: "2099-01-01",
        frequency: "monthly",
        interval: "2",
        end: "2099-06-01",
        splitType: "equal",
      });
      assertAllocation(rule.body, "equal", halves);
      const occurredOn = yesterday();
      const occurred = await ctx.createRule({
        label: "occurrence",
        amount: "2.00",
        start: occurredOn,
        end: occurredOn,
        frequency: "daily",
        splitType: "equal",
      });
      const generated = asArray(
        asObject(
          expectJson(await ctx.banana(["recurring", "get", occurred.id, "--json"])),
        ).occurrences,
      ).map(asRecord);
      const occurrence = generated.find((entry) => typeof entry.id === "string");
      if (!occurrence || typeof occurrence.id !== "string") {
        throw new Blocked(
          "A rule starting yesterday produced no expense, so --recurring cannot be checked.",
        );
      }
      ctx.world.recurringExpenseId = occurrence.id;
      await page(
        ctx,
        "recurring list",
        ["recurring", "list", "--status", "all", "--limit", "1"],
        { expected: [rule.id, occurred.id], paginate: true },
      );
      await page(
        ctx,
        "expenses recurring list",
        ["expenses", "recurring", "list", "--status", "all", "--limit", "1"],
        { expected: [rule.id, occurred.id], paginate: true },
      );
      const detail = asObject(
        expectJson(await ctx.banana(["recurring", "get", rule.id, "--json"])),
      );
      if (detail.currency !== ctx.config.currency) {
        throw new Error("recurring get did not expand the currency code");
      }
      if (typeof detail.paidBy !== "string" || detail.paidBy.length === 0) {
        throw new Error("recurring get did not expand the payer's name");
      }
      if (detail.group !== ctx.world.groupName) {
        throw new Error("recurring get did not expand the group name");
      }
      const occurrences = asArray(detail.occurrences);
      for (const occurrence of occurrences) {
        const id = asRecord(occurrence).id;
        if (typeof id === "string") {
          // Cleanup discovers these too; touching the row keeps the id in the run.
          expectExit(await ctx.banana(["expenses", "get", id, "--json"]), 0);
        }
      }

      const renamed = `${ctx.marker} rent renamed`;
      const edited = asObject(
        expectJson(
          await ctx.banana([
            "recurring",
            "edit",
            rule.id,
            "--title",
            renamed,
            "--amount",
            "4.00",
            "--currency",
            ctx.config.currency,
            "--frequency",
            "yearly",
            "--interval",
            "1",
            "--start",
            "2099-03-01",
            "--end",
            "2099-12-01",
            "--paid-by",
            "me",
            "--group",
            ctx.world.groupName ?? "",
            "--description",
            ctx.marker,
            "--split-type",
            "custom",
            "--split",
            "me=2.00",
            "--split",
            `${partner}=2.00`,
            "--json",
          ]),
        ),
      );
      if (edited.title !== renamed || !close(edited.amount, 4)) {
        throw new Error("recurring edit did not keep the new title and amount");
      }
      assertAllocation(edited, "custom", [
        { userId: ctx.config.accountId, amount: "2.00" },
        { userId: ctx.config.partnerId, amount: "2.00" },
      ]);
      const paused = asObject(
        expectJson(
          await ctx.banana(["recurring", "edit", rule.id, "--inactive", "--json"]),
        ),
      );
      if (paused.active !== false) throw new Error("the rule was not paused");
      const inactive = items(
        expectJson(
          await ctx.banana(["recurring", "list", "--status", "inactive", "--json"]),
        ),
      );
      if (!inactive.some((entry) => entry.id === rule.id)) {
        throw new Error("paused rule was absent from --status inactive");
      }
      const resumed = asObject(
        expectJson(
          await ctx.banana([
            "recurring",
            "edit",
            rule.id,
            "--active",
            "--no-end",
            "--json",
          ]),
        ),
      );
      if (resumed.active !== true || resumed.endDate !== null) {
        throw new Error("the rule did not resume without an end date");
      }
      const detached = asObject(
        expectJson(
          await ctx.banana(["recurring", "edit", rule.id, "--no-group", "--json"]),
        ),
      );
      if (detached.groupId !== null) {
        throw new Error("the rule stayed on the group after --no-group");
      }

      if (!ctx.world.oneOffId) throw new Error("expected a one-off expense");
      if (!ctx.world.recurringExpenseId) {
        throw new Blocked("--recurring needs a generated expense");
      }
      const recurringOnly = await page(
        ctx,
        "expenses --recurring",
        ["expenses", "list", "--recurring", "--limit", "100"],
        { expected: [ctx.world.recurringExpenseId] },
      );
      if (recurringOnly.ids.has(ctx.world.oneOffId)) {
        throw new Error("--recurring included a one-off expense");
      }
      const oneOff = await page(
        ctx,
        "expenses --no-recurring",
        ["expenses", "list", "--no-recurring", "--limit", "100"],
        { expected: [ctx.world.oneOffId] },
      );
      if (oneOff.ids.has(ctx.world.recurringExpenseId)) {
        throw new Error("--no-recurring included a generated expense");
      }

      expectExit(await ctx.banana(["recurring", "delete", rule.id, "--json"]), 0);
      expectExit(await ctx.banana(["recurring", "delete", occurred.id, "--json"]), 0);
    },
  ),

  scenario(
    "queries",
    "Queries",
    "Search, filter, sort and paginate",
    [
      "command:expenses list",
      "expenses.list --sort",
      "expenses.list --direction",
      "expenses.list --limit",
      "expenses.list --cursor",
      "groups.list --search",
      "groups.list --limit",
      "groups.list --cursor",
      "groups.activities --search",
      "groups.activities --limit",
      "groups.activities --cursor",
      "groups.activities --type",
      "groups.activities --sort",
      "groups.activities --direction",
      "friends.list --cursor",
    ],
    async (ctx) => {
      if (!ctx.world.groupId || !ctx.world.groupName || !ctx.world.expenseTitle) {
        throw new Error("queries need the group and an expense");
      }
      const found = items(
        expectJson(
          await ctx.banana([
            "groups",
            "list",
            "--search",
            ctx.world.groupName,
            "--json",
          ]),
        ),
      );
      if (!found.some((group) => group.id === ctx.world.groupId)) {
        throw new Error("group search missed the created group");
      }
      const missing = items(
        expectJson(
          await ctx.banana([
            "groups",
            "--search",
            `zzzz-no-such-${ctx.marker}`,
            "--json",
          ]),
        ),
      );
      if (missing.length !== 0) {
        throw new Error("group search returned rows for a non-match");
      }
      const groupIds = ctx.world.groupIds ?? [];
      if (groupIds.length < 2) throw new Error("queries need more than one group");
      await page(
        ctx,
        "groups list",
        [
          "groups",
          "list",
          "--search",
          ctx.marker,
          "--limit",
          "1",
          "--sort",
          "balance",
        ],
        {
          expected: groupIds,
          paginate: true,
          order: { field: "balance", direction: "monotonic" },
        },
      );

      const expenseIds = ctx.world.expenseIds ?? [];
      if (expenseIds.length < 2) throw new Error("queries need more than one expense");
      await page(
        ctx,
        "expenses list",
        ["expenses", "list", "--limit", "1", "--sort", "amount", "--direction", "asc"],
        {
          expected: expenseIds,
          paginate: true,
          order: { field: "amount", direction: "asc" },
        },
      );

      const activity = items(
        expectJson(
          await ctx.banana([
            "groups",
            "activities",
            ctx.world.groupId,
            "--search",
            ctx.world.expenseTitle,
            "--type",
            "expenses",
            "--sort",
            "date",
            "--direction",
            "desc",
            "--json",
          ]),
        ),
      );
      if (!activity.some((entry) => entry.title === ctx.world.expenseTitle)) {
        throw new Error("activity search missed the created expense");
      }
      const activityMiss = items(
        expectJson(
          await ctx.banana([
            "groups",
            "activities",
            ctx.world.groupId,
            "--search",
            `zzzz-no-such-${ctx.marker}`,
            "--type",
            "payments",
            "--json",
          ]),
        ),
      );
      if (activityMiss.length !== 0) {
        throw new Error("activity search returned rows for a non-match");
      }
      const activityIds = [
        ...(ctx.world.groupExpenseIds ?? []),
        ...(ctx.world.paymentIds ?? []),
      ];
      if (activityIds.length < 2) {
        throw new Error("activity pagination needs a group expense and a payment");
      }
      await page(
        ctx,
        "groups activities",
        [
          "groups",
          "activities",
          ctx.world.groupId,
          "--limit",
          "1",
          "--type",
          "all",
          "--sort",
          "amount",
          "--direction",
          "asc",
        ],
        {
          expected: activityIds,
          paginate: true,
          order: { field: "amount", direction: "asc" },
        },
      );
      if (!ctx.world.recurringExpenseId || !ctx.world.oneOffId) {
        throw new Blocked(
          "activity type recurring_expenses needs a generated expense and a one-off",
        );
      }
      const recurringActivity = await page(
        ctx,
        "groups activities recurring_expenses",
        [
          "groups",
          "activities",
          ctx.world.groupId,
          "--type",
          "recurring_expenses",
          "--sort",
          "amount",
          "--direction",
          "asc",
          "--limit",
          "100",
        ],
        {
          expected: [ctx.world.recurringExpenseId],
          order: { field: "amount", direction: "asc" },
        },
      );
      if (recurringActivity.ids.has(ctx.world.oneOffId)) {
        throw new Error("recurring_expenses included a one-off expense");
      }

      const friends = await page(
        ctx,
        "friends list",
        ["friends", "list", "--limit", "1", "--sort", "balance"],
        {
          idOf: (row) => (typeof row.userId === "string" ? row.userId : null),
          expected: [ctx.config.partnerId],
          order: { field: "balance", direction: "monotonic" },
        },
      );
      if (friends.ids.size < 2) {
        throw new Blocked(
          "friends --cursor needs at least two friends on the staging account",
        );
      }
      if (friends.pages < 2) {
        throw new Error("friends list returned every friend on one page");
      }
    },
  ),

  scenario(
    "resolution",
    "Resolution",
    "Ids, names, prefixes, substrings, usernames, emails, me, ambiguity and missing rows",
    [
      "expenses.add --currency",
      "expenses.add --paid-by",
      "expenses.add --group",
      "expenses.add --split",
    ],
    async (ctx) => {
      const groupName = ctx.world.groupName;
      const groupId = ctx.world.groupId;
      const currencyId = ctx.world.currencyId;
      if (!groupName || !groupId || !currencyId) {
        throw new Error("resolution needs the group and currency");
      }
      const { config } = ctx;
      const labels = [config.partnerName, config.partnerUsername, config.partnerEmail]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());
      const prefix = config.partnerPrefix.toLowerCase();
      if (!labels.some((label) => label.startsWith(prefix) && label !== prefix)) {
        throw new Blocked(
          "BANANASPLIT_E2E_PARTNER_PREFIX must be a proper prefix of the partner's name, username, or email.",
        );
      }
      const fragment = config.partnerSubstring.toLowerCase();
      if (
        !labels.some((label) => label.includes(fragment)) ||
        labels.some((label) => label.startsWith(fragment))
      ) {
        throw new Blocked(
          "BANANASPLIT_E2E_PARTNER_SUBSTRING must occur inside a partner label and must not be a prefix of one.",
        );
      }

      const exact = asObject(
        expectJson(await ctx.banana(["groups", "get", groupName, "--json"])),
      );
      if (exact.id !== groupId) throw new Error("exact group name resolved elsewhere");
      const prefixed = asObject(
        expectJson(
          await ctx.banana(["groups", "get", `${ctx.marker} alpha z`, "--json"]),
        ),
      );
      if (prefixed.id !== groupId) throw new Error("group prefix resolved elsewhere");
      const sub = asObject(
        expectJson(
          await ctx.banana(["groups", "get", `zebra${ctx.marker}`, "--json"]),
        ),
      );
      if (sub.id !== groupId) throw new Error("group substring resolved elsewhere");
      const byId = asObject(
        expectJson(await ctx.banana(["groups", "get", groupId, "--json"])),
      );
      if (byId.id !== groupId) throw new Error("group id was not returned as itself");

      const ambiguous = await ctx.banana([
        "groups",
        "get",
        `${ctx.marker} alp`,
        "--json",
      ]);
      expectError(ambiguous, 2, "usage");
      const missing = await ctx.banana([
        "groups",
        "get",
        `${ctx.marker} missing-group`,
        "--json",
      ]);
      expectError(missing, 2, "usage");

      const currencies = items(expectJson(await ctx.banana(["currencies", "--json"])));
      const ours = currencies.find((entry) => entry.id === currencyId);
      const name = String(ours?.name ?? "");
      const code = String(ours?.code ?? config.currency);
      const catalog = currencies.map((entry) => ({
        labels: [entry.code, entry.name]
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.toLowerCase()),
      }));
      const currencyPrefix = uniqueAffix(catalog, [code, name], "prefix");
      const currencySubstring = uniqueAffix(catalog, [code, name], "substring");
      if (!currencyPrefix || !currencySubstring) {
        throw new Blocked(
          "Could not find a unique currency prefix and substring in the catalog.",
        );
      }

      const splits: Array<[string, string]> = [
        ["me", "1.00"],
        [config.partnerName, "1.00"],
      ];
      const currencyForms: Array<[string, string]> = [
        [code, "code"],
        [name, "currency-name"],
        [currencyPrefix, "currency-prefix"],
        [currencySubstring, "currency-substring"],
        [currencyId, "currency-id"],
      ];
      const priced = await ctx.createExpense({
        label: "currency",
        amount: "2.00",
        group: true,
        paidBy: "me",
        splits,
      });
      for (const [value, label] of currencyForms) {
        const edited = asObject(
          expectJson(
            await ctx.banana([
              "expenses",
              "edit",
              priced.id,
              "--currency",
              value,
              "--json",
            ]),
          ),
        );
        if (edited.currencyId !== currencyId && edited.currency !== code) {
          throw new Error(`${label} did not resolve to ${code}`);
        }
      }
      const people: Array<[string, string]> = [
        [config.partnerId, "user-id"],
        [config.partnerName, "user-name"],
        [config.partnerPrefix, "user-prefix"],
        [config.partnerSubstring, "user-substring"],
        [config.partnerUsername, "username"],
        ...(config.partnerEmail
          ? ([[config.partnerEmail, "email"]] as Array<[string, string]>)
          : []),
      ];
      const payer = await ctx.createExpense({
        label: "payer",
        amount: "2.00",
        group: true,
        paidBy: config.partnerId,
        splits,
      });
      for (const [value, label] of people) {
        const edited = asObject(
          expectJson(
            await ctx.banana([
              "expenses",
              "edit",
              payer.id,
              "--paid-by",
              value,
              "--json",
            ]),
          ),
        );
        if (edited.paidById !== config.partnerId) {
          throw new Error(`${label} did not resolve to the partner`);
        }
      }
      const mine = asObject(
        expectJson(
          await ctx.banana([
            "expenses",
            "edit",
            payer.id,
            "--paid-by",
            "me",
            "--json",
          ]),
        ),
      );
      if (mine.paidById !== config.accountId) {
        throw new Error("--paid-by me was not the signed-in user");
      }
      const unknown = await ctx.banana([
        "expenses",
        "add",
        "--title",
        `${ctx.marker} missing-user`,
        "--amount",
        "2.00",
        "--currency",
        code,
        "--date",
        "2020-01-15",
        "--group",
        groupName,
        "--split",
        "me=1.00",
        "--split",
        `nobody-${ctx.marker}=1.00`,
        "--json",
      ]);
      expectError(unknown, 2, "usage");
    },
  ),

  scenario(
    "interfaces",
    "Interfaces",
    "Human, JSON and raw output, help, aliases, JSON bodies and errors",
    [
      "root --json",
      "root --raw",
      "command:version",
      "alias:-v",
      "root -v",
      "alias:update",
    ],
    async (ctx) => {
      if (!ctx.world.meName) throw new Error("me did not return a name");
      const human = await ctx.banana(["me"]);
      expectExit(human, 0);
      if (!human.stdout.includes(ctx.world.meName)) {
        throw new Error("human output omitted the signed-in name");
      }
      const raw = asObject(expectJson(await ctx.banana(["me", "--raw"])));
      if (raw.id !== ctx.config.accountId) throw new Error("--raw omitted the user id");
      expectError(await ctx.banana(["me", "--json", "--raw"]), 2, "usage");
      for (const page of HELP_PAGES) {
        const help = await ctx.banana(page.args);
        expectExit(help, 0);
        if (!help.stdout.includes("USAGE") && !help.stdout.includes("Usage")) {
          throw new Error(`${page.args.join(" ")} did not print help`);
        }
      }
      const versionText = await ctx.banana(["version"]);
      expectExit(versionText, 0);
      if (!versionText.stdout.includes(version)) {
        throw new Error(`version printed ${versionText.stdout.trim()}`);
      }
      const alias = await ctx.banana(["-v"]);
      expectExit(alias, 0);
      if (alias.stdout.trim() !== versionText.stdout.trim()) {
        throw new Error("-v did not match version");
      }
      expectExit(await ctx.banana(["update", "--help"]), 0);
      expectExit(await ctx.banana(["balances", "--json"]), 0);

      if (!ctx.world.currencyId || !ctx.world.groupId) {
        throw new Error("JSON bodies need the currency and group ids");
      }
      await ctx.createExpense({
        label: "json",
        amount: "2.00",
        group: true,
        json: {
          amount: "2.00",
          currencyId: ctx.world.currencyId,
          paidById: ctx.config.accountId,
          groupId: ctx.world.groupId,
          date: "2020-01-20T00:00:00.000Z",
          splits: [
            { userId: ctx.config.accountId, amount: "1.00" },
            { userId: ctx.config.partnerId, amount: "1.00" },
          ],
        },
      });

      expectError(await ctx.banana(["expenses", "add", "--json"]), 2, "usage");
      const humanUsage = await ctx.banana(["expenses", "add"]);
      expectExit(humanUsage, 2);
      if (!humanUsage.stderr.includes("Error:") || !humanUsage.stderr.includes("--title")) {
        throw new Error("human usage error omitted the reason or the help");
      }
      expectError(
        await ctx.banana([
          "expenses",
          "get",
          "00000000-0000-4000-8000-000000000099",
          "--json",
        ]),
        1,
        "api",
      );
      expectError(
        await ctx.banana(["me", "--json"], { BANANASPLIT_API_URL: "http://example.com" }),
        1,
        "config",
      );
    },
  ),

  scenario(
    "local",
    "Local features",
    "Doctor and skill install and removal in a disposable directory",
    [
      "command:doctor",
      "command:skill install",
      "command:skill uninstall",
      "skill.install --agent",
      "skill.install --all",
      "skill.install --dir",
      "skill.install --force",
      "skill.install --list",
      "skill.install --print",
      "skill.uninstall --agent",
      "skill.uninstall --all",
      "skill.uninstall --dir",
      "skill.uninstall --force",
      "skill.uninstall --list",
    ],
    async (ctx) => {
      const doctor = asObject(expectJson(await ctx.banana(["doctor", "--json"])));
      if (doctor.ok !== true) {
        throw new Error(`doctor failed: ${JSON.stringify(doctor.checks ?? doctor)}`);
      }
      const home = await mkdtemp(join(tmpdir(), "banana-e2e-skill-"));
      const dir = await mkdtemp(join(tmpdir(), "banana-e2e-skill-dir-"));
      const env = {
        HOME: home,
        CLAUDE_CONFIG_DIR: "",
        CODEX_HOME: "",
        XDG_CONFIG_HOME: join(home, ".config"),
      };
      try {
        const listed = await ctx.banana(["skill", "install", "--list"], env);
        expectExit(listed, 0);
        const printed = await ctx.banana(["skill", "install", "--print"], env);
        expectExit(printed, 0);
        if (!printed.stdout.includes("banana me")) {
          throw new Error("--print did not write the skill");
        }
        expectExit(await ctx.banana(["skill", "uninstall", "--list"], env), 0);

        expectExit(await ctx.banana(["skill", "install", "--dir", dir], env), 0);
        const skillFile = join(dir, "banana", "SKILL.md");
        await writeFile(skillFile, "edited\n");
        const kept = await ctx.banana(["skill", "install", "--dir", dir], env);
        expectExit(kept, 1);
        expectExit(
          await ctx.banana(["skill", "install", "--dir", dir, "--force"], env),
          0,
        );
        await writeFile(skillFile, "edited again\n");
        const refused = await ctx.banana(["skill", "uninstall", "--dir", dir], env);
        expectExit(refused, 1);
        expectExit(
          await ctx.banana(["skill", "uninstall", "--dir", dir, "--force"], env),
          0,
        );

        await mkdir(join(home, ".cursor"));
        expectExit(await ctx.banana(["skill", "install"], env), 0);
        expectExit(await ctx.banana(["skill", "uninstall"], env), 0);
        expectExit(
          await ctx.banana(["skill", "install", "--agent", "cursor"], env),
          0,
        );
        expectExit(
          await ctx.banana(["skill", "uninstall", "--agent", "cursor"], env),
          0,
        );
        expectExit(await ctx.banana(["skill", "install", "--all"], env), 0);
        expectExit(await ctx.banana(["skill", "uninstall", "--all"], env), 0);
      } finally {
        await rm(home, { recursive: true, force: true });
        await rm(dir, { recursive: true, force: true });
      }
    },
  ),
];

export function uniqueAffix(
  catalog: Array<{ labels: string[] }>,
  labels: string[],
  mode: "prefix" | "substring",
) {
  const ours = labels.map((value) => value.toLowerCase()).filter(Boolean);
  for (const label of ours) {
    for (let length = 1; length < label.length; length++) {
      const query = mode === "prefix" ? label.slice(0, length) : label.slice(length);
      if (!query || query === label) continue;
      const hits = catalog.filter((item) =>
        item.labels.some((text) =>
          mode === "prefix" ? text.startsWith(query) : text.includes(query),
        ),
      );
      const prefixOfOurs = ours.some((item) => item.startsWith(query));
      if (hits.length === 1 && (mode === "prefix" || !prefixOfOurs)) return query;
    }
  }
  return undefined;
}
