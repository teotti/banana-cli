import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness } from "./helpers";

describe("BananaSplit CLI", () => {
  it("maps group list options to API query parameters", async () => {
    const { calls, runtime } = harness();

    expect(
      await runCli(
        [
          "groups",
          "list",
          "--limit",
          "5",
          "--cursor",
          "next page",
          "--archived",
          "--sort",
          "lastActivity",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/groups");
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      l: "5",
      cursor: "next page",
      archived: "true",
      sort: "lastActivity",
    });
  });

  it("limits the default group page to keep output navigable", async () => {
    const { calls, runtime } = harness(
      Response.json({ items: [], hasMore: false, nextCursor: null }),
    );

    expect(await runCli(["groups", "list"], runtime)).toBe(0);
    expect(calls[0].url.searchParams.get("l")).toBe("5");
  });

  it("presents groups with operational fields and pagination", async () => {
    const response = {
      items: [
        {
          id: "group-1",
          name: "Lisbon trip",
          description: null,
          type: "travel",
          currency: { code: "EUR", symbol: "€" },
          balance: 12.5,
          groupMembers: [
            { id: "user-1", name: "Leonardo", image: null },
            { id: "user-2", name: "Ana", image: null },
          ],
          mostRecentActivity: "2026-08-28T10:00:00.000Z",
          token: "private-invite-token",
          createdAt: "2026-08-01T10:00:00.000Z",
        },
      ],
      hasMore: true,
      nextCursor: "cursor-2",
    };
    const { runtime, stdout } = harness(Response.json(response));

    expect(
      await runCli(["groups", "list", "--json"], runtime),
    ).toBe(0);
    expect(JSON.parse(stdout[0])).toEqual({
      items: [
        {
          id: "group-1",
          name: "Lisbon trip",
          description: null,
          type: "travel",
          currency: "EUR",
          balance: 12.5,
          memberCount: 2,
          members: ["Leonardo", "Ana"],
          mostRecentActivity: "2026-08-28T10:00:00.000Z",
        },
      ],
      hasMore: true,
      nextCursor: "cursor-2",
    });
    expect(stdout[0]).not.toContain("private-invite-token");

    expect(await runCli(["groups", "list"], runtime)).toBe(0);
    expect(stdout[1]).toBe(
      [
        "Groups",
        "",
        "1. Lisbon trip",
        "   ID: group-1",
        "   Type: travel",
        "   Description: —",
        "   Balance: 12.5 EUR",
        "   Members: 2",
        "   Last activity: 2026-08-28T10:00:00.000Z",
        "",
        "More groups available.",
        'Next page: banana groups list --cursor "cursor-2"',
      ].join("\n"),
    );
  });

  it("presents group details and members", async () => {
    const group = {
      id: "group-1",
      name: "Lisbon trip",
      description: "Summer holiday",
      type: "travel",
      currency: { code: "EUR" },
      balance: -8,
      totalOwed: 2,
      totalOwing: 10,
      defaultSplitType: "equal",
      useOptimalSettlement: true,
      memberBalanceVisibility: "all_members",
      token: "private-invite-token",
    };
    const groupHarness = harness((url) =>
      Response.json(
        url.pathname.endsWith("/members")
          ? [{ id: "member-1" }, { id: "member-2" }]
          : group,
      ),
    );

    expect(
      await runCli(["--json", "groups", "get", "group-1"], groupHarness.runtime),
    ).toBe(0);
    expect(JSON.parse(groupHarness.stdout[0])).toEqual({
      id: "group-1",
      name: "Lisbon trip",
      description: "Summer holiday",
      type: "travel",
      currency: "EUR",
      balance: -8,
      totalOwed: 2,
      totalOwing: 10,
      memberCount: 2,
      defaultSplitType: "equal",
      useOptimalSettlement: true,
      memberBalanceVisibility: "all_members",
    });
    expect(
      await runCli(["groups", "get", "group-1"], groupHarness.runtime),
    ).toBe(0);
    expect(groupHarness.stdout[1]).toContain("Members: 2");

    const membersHarness = harness(
      Response.json([
        {
          id: "member-1",
          userId: "user-1",
          name: "Leonardo",
          role: "admin",
          isGuest: false,
          isGold: true,
          defaultSplitPercentage: null,
          joinedAt: "2026-08-01T10:00:00.000Z",
          image: "ignored.png",
        },
      ]),
    );
    expect(
      await runCli(
        ["groups", "members", "group-1", "--json"],
        membersHarness.runtime,
      ),
    ).toBe(0);
    expect(JSON.parse(membersHarness.stdout[0])).toEqual([
      {
        id: "member-1",
        userId: "user-1",
        name: "Leonardo",
        role: "admin",
        isGuest: false,
        isGold: true,
        defaultSplitPercentage: null,
        joinedAt: "2026-08-01T10:00:00.000Z",
      },
    ]);
    expect(
      await runCli(
        ["groups", "members", "group-1"],
        membersHarness.runtime,
      ),
    ).toBe(0);
    expect(membersHarness.stdout[1]).toBe(
      [
        "Group members",
        "",
        "1. Leonardo",
        "   Role: admin",
        "   Guest: no",
        "   Gold: yes",
        "   Default split: —",
        "   Joined: 2026-08-01T10:00:00.000Z",
        "   Member ID: member-1",
        "   User ID: user-1",
      ].join("\n"),
    );
  });

  it("encodes group IDs for get and member requests", async () => {
    const { calls, runtime } = harness();

    expect(await runCli(["groups", "get", "group/one"], runtime)).toBe(0);
    expect(
      await runCli(["groups", "members", "group/one"], runtime),
    ).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/groups/group%2Fone",
      "/base/groups/group%2Fone/members",
      "/base/groups/group%2Fone/members",
    ]);
  });

  it("uses the search activity endpoint and forwards filters", async () => {
    const { calls, runtime } = harness();

    expect(
      await runCli(
        [
          "groups",
          "activities",
          "group-1",
          "--search",
          "dinner out",
          "--limit",
          "10",
          "--page",
          "2",
          "--type",
          "expenses",
          "--sort",
          "amount",
          "--direction",
          "desc",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].url.pathname).toBe(
      "/base/groups/group-1/activities/search",
    );
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      l: "10",
      p: "2",
      type: "expenses",
      sort: "amount",
      direction: "desc",
      q: "dinner out",
    });
  });

  it("presents expense and payment activities", async () => {
    const { runtime, stdout } = harness(
      Response.json([
        {
          entity: "expense",
          id: "expense-1",
          title: "Dinner",
          amount: 42,
          currency: { code: "EUR" },
          date: "2026-08-27T20:00:00.000Z",
          paidByUser: { id: "user-1", name: "Leonardo", email: "ignored" },
          category: { id: "category-1", name: "Food" },
          splitType: "equal",
          recurringExpenseRuleId: "rule-1",
          description: "ignored",
        },
        {
          entity: "payment",
          id: "payment-1",
          description: null,
          amount: 15,
          currency: { code: "EUR" },
          date: "2026-08-28T09:00:00.000Z",
          fromUser: { id: "user-2", name: "Ana" },
          toUser: { id: "user-1", name: "Leonardo" },
          isSettlement: true,
          createdAt: "ignored",
        },
      ]),
    );

    expect(
      await runCli(
        ["groups", "activities", "group-1", "--json"],
        runtime,
      ),
    ).toBe(0);
    expect(JSON.parse(stdout[0])).toEqual([
      {
        entity: "expense",
        id: "expense-1",
        title: "Dinner",
        amount: 42,
        currency: "EUR",
        date: "2026-08-27T20:00:00.000Z",
        paidBy: { id: "user-1", name: "Leonardo" },
        category: "Food",
        splitType: "equal",
        isRecurring: true,
      },
      {
        entity: "payment",
        id: "payment-1",
        description: null,
        amount: 15,
        currency: "EUR",
        date: "2026-08-28T09:00:00.000Z",
        from: { id: "user-2", name: "Ana" },
        to: { id: "user-1", name: "Leonardo" },
        isSettlement: true,
      },
    ]);
    expect(
      await runCli(["groups", "activities", "group-1"], runtime),
    ).toBe(0);
    expect(stdout[1]).toBe(
      [
        "Group activities",
        "",
        "1. Expense: Dinner",
        "   Amount: 42 EUR",
        "   Paid by: Leonardo",
        "   Category: Food",
        "   Split: equal",
        "   Recurring: yes",
        "   Date: 2026-08-27T20:00:00.000Z",
        "   ID: expense-1",
        "",
        "2. Payment: —",
        "   Amount: 15 EUR",
        "   From: Ana",
        "   To: Leonardo",
        "   Settlement: yes",
        "   Date: 2026-08-28T09:00:00.000Z",
        "   ID: payment-1",
      ].join("\n"),
    );
  });

  it("creates a group without exposing its invite token", async () => {
    const { calls, runtime, stdout } = harness(
      Response.json({
        id: "group-1",
        name: "Lisbon trip",
        description: "Summer holiday",
        type: "travel",
        currencyId: "currency-eur",
        creatorId: "user-1",
        defaultSplitType: "equal",
        memberBalanceVisibility: "all_members",
        token: "private-invite-token",
      }),
    );

    expect(
      await runCli(
        [
          "groups",
          "create",
          "--name",
          "Lisbon trip",
          "--currency-id",
          "currency-eur",
          "--description",
          "Summer holiday",
          "--type",
          "travel",
          "--member",
          "user-2",
          "--member",
          "user-3",
          "--json",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/groups");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      name: "Lisbon trip",
      currencyId: "currency-eur",
      description: "Summer holiday",
      type: "travel",
      groupMembers: ["user-2", "user-3"],
    });
    expect(JSON.parse(stdout[0])).toEqual({
      id: "group-1",
      name: "Lisbon trip",
      description: "Summer holiday",
      type: "travel",
      currencyId: "currency-eur",
      creatorId: "user-1",
      defaultSplitType: "equal",
      memberBalanceVisibility: "all_members",
    });
    expect(stdout[0]).not.toContain("private-invite-token");
  });

});
