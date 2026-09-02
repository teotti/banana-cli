import { describe, expect, it } from "bun:test";
import { runCli, type CliRuntime } from "../src/index";

const TOKEN = "secret-session-token";

function harness(
  response: Response | ((url: URL, init?: RequestInit) => Response) =
    Response.json({ ok: true }),
) {
  const calls: Array<{ init?: RequestInit; url: URL }> = [];
  const stdout: string[] = [];
  const stderr: string[] = [];
  const runtime: CliRuntime = {
    env: {
      BANANASPLIT_API_URL: "https://api.example.test/base",
      BANANASPLIT_TOKEN: TOKEN,
    },
    fetch: async (input, init) => {
      const url = new URL(String(input));
      calls.push({ init, url });
      return typeof response === "function"
        ? response(url, init)
        : response.clone();
    },
    stderr: (value) => stderr.push(value),
    stdout: (value) => stdout.push(value),
  };

  return { calls, runtime, stderr, stdout };
}

describe("BananaSplit CLI", () => {
  it("prints help without requiring authentication", async () => {
    const { runtime, stderr, stdout } = harness();
    runtime.env = {};

    expect(await runCli([], runtime)).toBe(0);
    expect(stdout[0]).toContain("Usage: banana [--json | --raw] <command>");
    expect(stderr).toEqual([]);
  });

  it("requires a bearer token before making a request", async () => {
    const { calls, runtime, stderr } = harness();
    runtime.env = {};

    expect(await runCli(["me"], runtime)).toBe(1);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(stderr[0])).toEqual({
      error: {
        type: "config",
        message: "BANANASPLIT_TOKEN is required",
      },
    });
  });

  it("fetches the current user with the bearer token", async () => {
    const { calls, runtime, stderr, stdout } = harness(
      Response.json({
        id: "user-1",
        name: "Leonardo",
        email: "leo@example.test",
        username: null,
        isGuest: false,
        currencyId: "currency-eur",
      }),
    );

    expect(await runCli(["me"], runtime)).toBe(0);
    expect(calls[0].url.href).toBe("https://api.example.test/base/current-user");
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe(
      `Bearer ${TOKEN}`,
    );
    expect(stdout).toEqual([
      [
        "Name: Leonardo",
        "Email: leo@example.test",
        "Username: —",
        "Guest: no",
        "Currency ID: currency-eur",
        "ID: user-1",
      ].join("\n"),
    ]);
    expect(stderr).toEqual([]);
  });

  it("supports curated JSON and untouched raw output", async () => {
    const response = {
      id: "user-1",
      name: "Leonardo",
      email: "leo@example.test",
      username: "leo",
      isGuest: false,
      currencyId: "currency-eur",
      inviteToken: "private-token",
    };
    const { runtime, stdout } = harness(Response.json(response));

    expect(await runCli(["--json", "me"], runtime)).toBe(0);
    expect(await runCli(["me", "--raw"], runtime)).toBe(0);
    expect(JSON.parse(stdout[0])).toEqual({
      id: "user-1",
      name: "Leonardo",
      email: "leo@example.test",
      username: "leo",
      isGuest: false,
      currencyId: "currency-eur",
    });
    expect(JSON.parse(stdout[1])).toEqual(response);
  });

  it("rejects conflicting output flags before making a request", async () => {
    const { calls, runtime, stderr } = harness();

    expect(await runCli(["--json", "me", "--raw"], runtime)).toBe(2);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(stderr[0]).error).toEqual({
      type: "usage",
      message: "Choose only one of --json or --raw",
    });
  });

  it("maps balance commands to their API endpoints", async () => {
    const { calls, runtime } = harness();

    expect(await runCli(["balance"], runtime)).toBe(0);
    expect(await runCli(["balance", "users"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/balance",
      "/base/balance/users",
    ]);
  });

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

  it("opens all groups in the interactive pager", async () => {
    const paged: string[] = [];
    const { calls, runtime, stdout } = harness(
      Response.json({
        items: [
          {
            id: "group-1",
            name: "Lisbon trip",
            type: "travel",
            currency: { code: "EUR" },
            balance: 12.5,
            groupMembers: [],
            mostRecentActivity: null,
          },
        ],
        hasMore: false,
        nextCursor: null,
      }),
    );
    runtime.pager = async (value) => {
      paged.push(value);
      return true;
    };

    expect(await runCli(["groups", "list"], runtime)).toBe(0);
    expect(calls[0].url.searchParams.has("l")).toBe(false);
    expect(paged[0]).toContain("1. Lisbon trip");
    expect(stdout).toEqual([]);
  });

  it("opens every human collection in the interactive pager", async () => {
    const cases = [
      {
        args: ["balance", "users"],
        response: [
          {
            user: { id: "user-1", name: "Leonardo" },
            balance: 10,
            totalOwed: 10,
            totalOwing: 0,
          },
        ],
        heading: "User balances",
      },
      {
        args: ["groups", "members", "group-1"],
        response: [
          {
            id: "member-1",
            userId: "user-1",
            name: "Leonardo",
            role: "admin",
          },
        ],
        heading: "Group members",
      },
      {
        args: ["groups", "activities", "group-1"],
        response: [
          {
            entity: "expense",
            id: "expense-1",
            title: "Dinner",
            amount: 42,
            currency: { code: "EUR" },
          },
        ],
        heading: "Group activities",
      },
    ];

    for (const testCase of cases) {
      const paged: string[] = [];
      const { runtime, stdout } = harness(Response.json(testCase.response));
      runtime.pager = async (value) => {
        paged.push(value);
        return true;
      };

      expect(await runCli(testCase.args, runtime)).toBe(0);
      expect(paged[0]).toContain(testCase.heading);
      expect(stdout).toEqual([]);
    }
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

  it("presents aggregate and per-user balances", async () => {
    const aggregateHarness = harness(
      Response.json({ balance: 9, totalOwed: 12, totalOwing: 3 }),
    );

    expect(await runCli(["balance"], aggregateHarness.runtime)).toBe(0);
    expect(aggregateHarness.stdout[0]).toBe(
      "Balance: 9\nOwed: 12\nOwing: 3",
    );

    const usersHarness = harness(
      Response.json([
        {
          user: { id: "user-2", name: "Ana", image: "ignored.png" },
          balance: -5,
          totalOwed: 0,
          totalOwing: 5,
        },
      ]),
    );
    expect(
      await runCli(["--json", "balance", "users"], usersHarness.runtime),
    ).toBe(0);
    expect(JSON.parse(usersHarness.stdout[0])).toEqual([
      {
        user: { id: "user-2", name: "Ana" },
        balance: -5,
        totalOwed: 0,
        totalOwing: 5,
      },
    ]);
    expect(
      await runCli(["balance", "users"], usersHarness.runtime),
    ).toBe(0);
    expect(usersHarness.stdout[1]).toBe(
      [
        "User balances",
        "",
        "1. Ana",
        "   User ID: user-2",
        "   Balance: -5",
        "   Owed: 0",
        "   Owing: 5",
      ].join("\n"),
    );
  });

  it("prints explicit messages for empty collections", async () => {
    const groupsHarness = harness(
      Response.json({ items: [], hasMore: false, nextCursor: null }),
    );
    expect(
      await runCli(["groups", "list"], groupsHarness.runtime),
    ).toBe(0);
    expect(groupsHarness.stdout[0]).toBe("No groups.\n\nEnd of groups.");

    const activitiesHarness = harness(Response.json([]));
    expect(
      await runCli(
        ["groups", "activities", "group-1"],
        activitiesHarness.runtime,
      ),
    ).toBe(0);
    expect(activitiesHarness.stdout[0]).toBe("No group activities.");
  });

  it("rejects invalid arguments without making a request", async () => {
    const { calls, runtime, stderr } = harness();

    expect(
      await runCli(["groups", "list", "--limit", "zero"], runtime),
    ).toBe(2);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(stderr[0]).error).toEqual({
      type: "usage",
      message: "--limit must be a positive integer",
    });
  });

  it("rejects unknown commands and enum values", async () => {
    const { calls, runtime, stderr } = harness();

    expect(await runCli(["unknown"], runtime)).toBe(2);
    expect(
      await runCli(["groups", "list", "--sort", "newest"], runtime),
    ).toBe(2);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(stderr[1]).error.message).toBe(
      "--sort must be one of: balance, lastActivity",
    );
  });

  it("rejects an invalid API URL before making a request", async () => {
    const { calls, runtime, stderr } = harness();
    runtime.env = {
      BANANASPLIT_API_URL: "not a URL",
      BANANASPLIT_TOKEN: TOKEN,
    };

    expect(await runCli(["me"], runtime)).toBe(1);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(stderr[0]).error).toEqual({
      type: "config",
      message: "BANANASPLIT_API_URL must be a valid URL",
    });
  });

  it("returns structured API errors", async () => {
    const { runtime, stderr, stdout } = harness(
      Response.json(
        { code: "FORBIDDEN", message: "Not a member" },
        { status: 403 },
      ),
    );

    expect(await runCli(["groups", "get", "group-1"], runtime)).toBe(1);
    expect(stdout).toEqual([]);
    expect(JSON.parse(stderr[0])).toEqual({
      error: {
        type: "api",
        status: 403,
        message: "Not a member",
        body: { code: "FORBIDDEN", message: "Not a member" },
      },
    });
  });

  it("preserves text API error messages", async () => {
    const { runtime, stderr } = harness(
      new Response("Unauthorized", { status: 401 }),
    );

    expect(await runCli(["me"], runtime)).toBe(1);
    expect(JSON.parse(stderr[0]).error).toEqual({
      type: "api",
      status: 401,
      message: "Unauthorized",
      body: "Unauthorized",
    });
  });

  it("does not leak the token in network errors", async () => {
    const { runtime, stderr } = harness();
    runtime.fetch = async () => {
      throw new Error("connection refused");
    };

    expect(await runCli(["balance"], runtime)).toBe(1);
    expect(stderr[0]).not.toContain(TOKEN);
    expect(JSON.parse(stderr[0]).error).toEqual({
      type: "network",
      message: "connection refused",
    });
  });

  it("reports request timeouts", async () => {
    const { runtime, stderr } = harness();
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    runtime.timeoutMs = 25;
    runtime.fetch = async () => {
      throw timeout;
    };

    expect(await runCli(["balance"], runtime)).toBe(1);
    expect(JSON.parse(stderr[0]).error).toEqual({
      type: "network",
      message: "Request timed out after 25ms",
    });
  });

  it("prints command-level help", async () => {
    const { calls, runtime, stdout } = harness();

    expect(
      await runCli(["groups", "activities", "--help"], runtime),
    ).toBe(0);
    expect(stdout[0]).toContain(
      "Usage: banana groups activities <group-id> [options]",
    );
    expect(calls).toHaveLength(0);
  });
});
