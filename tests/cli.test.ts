import { describe, expect, it } from "bun:test";
import {
  renderCollectionBrowser,
  renderGroupBrowser,
  runCli,
  type CliRuntime,
} from "../src/index";

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
    expect(await runCli(["me", "--raw"], runtime)).toBe(1);
    expect(calls).toHaveLength(0);
    expect(stderr[0]).toBe("Error: BANANASPLIT_TOKEN is required");
    expect(JSON.parse(stderr[1])).toEqual({
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

  it("supports top-level list aliases", async () => {
    const { calls, runtime } = harness();

    expect(await runCli(["friends", "--raw"], runtime)).toBe(0);
    expect(await runCli(["groups", "--raw"], runtime)).toBe(0);
    expect(await runCli(["balances", "--raw"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/friends",
      "/base/groups",
      "/base/balance/users",
    ]);
  });

  it("lists currencies with both command forms", async () => {
    const response = [
      {
        id: "currency-eur",
        name: "Euro",
        code: "EUR",
        symbol: "€",
        type: "fiat",
        decimals: 2,
        exchangeRateToBase: "1",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ];
    const { calls, runtime, stdout } = harness(Response.json(response));

    expect(await runCli(["currencies"], runtime)).toBe(0);
    expect(await runCli(["currencies", "list", "--raw"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/currencies",
      "/base/currencies",
    ]);
    expect(stdout[0]).toContain("1. Euro");
    expect(stdout[0]).toContain("ID: currency-eur");
    expect(JSON.parse(stdout[1])).toEqual(response);
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

  it("renders a searchable interactive group browser", () => {
    const rendered = renderGroupBrowser(
      {
        items: [
          {
            id: "group-1",
            name: "Lisbon trip",
            description: "Summer holiday",
            type: "travel",
            currency: "EUR",
            balance: 12.5,
            memberCount: 2,
            members: ["Leonardo", "Ana"],
            mostRecentActivity: "2026-08-28T10:00:00.000Z",
          },
          { id: "group-2", name: "Home", members: [] },
        ],
        hasMore: false,
      },
      "lisbon",
    );

    expect(rendered).toContain("BANANA");
    expect(rendered).toContain("1/2");
    expect(rendered).toContain("Lisbon trip");
    expect(rendered).toContain("enter details");
    expect(rendered).not.toContain("Summer holiday");
    expect(rendered).not.toContain("Members: Leonardo, Ana");
    expect(rendered).not.toContain("Home");
  });

  it("renders searchable balance, member, and activity browsers", () => {
    const balances = renderCollectionBrowser(
      "balance-users",
      [
        {
          user: { id: "user-1", name: "Leonardo" },
          balance: 10,
          totalOwed: 10,
          totalOwing: 0,
        },
        {
          user: { id: "user-2", name: "Ana" },
          balance: -5,
          totalOwed: 0,
          totalOwing: 5,
        },
      ],
      "ana",
    );
    expect(balances).toContain("1/2");
    expect(balances).toContain("Ana");
    expect(balances).not.toContain("Balance: -5");
    expect(balances).not.toContain("Leonardo");

    const members = renderCollectionBrowser(
      "members",
      [
        { id: "member-1", name: "Leonardo", role: "admin" },
        { id: "member-2", name: "Ana", role: "member", isGold: true },
      ],
      "ana",
    );
    expect(members).toContain("1/2");
    expect(members).toContain("Ana");
    expect(members).not.toContain("Role: member");
    expect(members).not.toContain("Leonardo");

    const activities = renderCollectionBrowser(
      "activities",
      [
        { entity: "expense", id: "expense-1", title: "Dinner" },
        {
          entity: "payment",
          id: "payment-1",
          description: "Payback",
          amount: 15,
          currency: "EUR",
          from: { name: "Ana" },
          to: { name: "Leonardo" },
        },
      ],
      "ana",
    );
    expect(activities).toContain("1/2");
    expect(activities).toContain("Payment: Payback");
    expect(activities).not.toContain("From: Ana");
    expect(activities).not.toContain("Dinner");
  });

  it("renders loading and error detail screens", () => {
    const body = [{ id: "member-1", name: "Leonardo" }];

    const loading = renderCollectionBrowser(
      "members",
      body,
      "leo",
      0,
      { status: "loading", title: "Leonardo" },
    );
    expect(loading).toContain("Loading details…");
    expect(loading).toContain("esc back · q quit");
    expect(loading).not.toContain("Search: leo");

    const error = renderCollectionBrowser(
      "members",
      body,
      "leo",
      0,
      { status: "error", title: "Leonardo", message: "Not found" },
    );
    expect(error).toContain("Unable to load details: Not found");
  });

  it("loads curated group details from the browser", async () => {
    let detail = "";
    const { calls, runtime, stdout } = harness((url) =>
      url.pathname === "/base/groups"
        ? Response.json({
            items: [
              {
                id: "group/one",
                name: "Lisbon trip",
                currency: { code: "EUR" },
                balance: 12.5,
                groupMembers: [
                  { id: "user-1", name: "Leonardo" },
                  { id: "user-2", name: "Ana" },
                ],
              },
            ],
            hasMore: false,
            nextCursor: null,
          })
        : Response.json({
            id: "group/one",
            name: "Lisbon trip",
            description: "Summer holiday",
            type: "travel",
            currency: { code: "EUR" },
            balance: 12.5,
            totalOwed: 20,
            totalOwing: 7.5,
            defaultSplitType: "equal",
            useOptimalSettlement: true,
            memberBalanceVisibility: "all_members",
            token: "private-invite-token",
          }),
    );
    runtime.browser = async (presentation, body, loadDetail) => {
      expect(presentation).toBe("group-list");
      detail = await loadDetail((body as any).items[0]);
      return true;
    };

    expect(await runCli(["groups", "list"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/groups",
      "/base/groups/group%2Fone",
    ]);
    expect(detail).toContain("Description: Summer holiday");
    expect(detail).toContain("Owed: 20 EUR");
    expect(detail).toContain("Members: 2");
    expect(detail).toContain("Optimal settlement: yes");
    expect(detail).not.toContain("private-invite-token");
    expect(stdout).toEqual([]);
  });

  it("loads curated member details from the browser", async () => {
    let detail = "";
    const { calls, runtime } = harness((url) =>
      url.pathname.endsWith("/member%2Fone")
        ? Response.json({
            id: "member/one",
            userId: "user-1",
            role: "admin",
            isGuest: false,
            isGold: true,
            defaultSplitPercentage: "60",
            joinedAt: "2026-08-01T10:00:00.000Z",
            user: {
              id: "user-1",
              name: "Leonardo",
              displayUsername: "leo",
              email: "leo@example.test",
              bio: "Banana keeper",
              inviteToken: "private-user-token",
            },
          })
        : Response.json([
            {
              id: "member/one",
              userId: "user-1",
              name: "Leonardo",
              role: "admin",
            },
          ]),
    );
    runtime.browser = async (_presentation, body, loadDetail) => {
      detail = await loadDetail((body as any[])[0]);
      return true;
    };

    expect(
      await runCli(["groups", "members", "group/one"], runtime),
    ).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/groups/group%2Fone/members",
      "/base/groups/group%2Fone/members/member%2Fone",
    ]);
    expect(detail).toContain("Username: leo");
    expect(detail).toContain("Email: leo@example.test");
    expect(detail).toContain("Bio: Banana keeper");
    expect(detail).toContain("Default split: 60");
    expect(detail).not.toContain("private-user-token");
  });

  it("loads expense splits and payment details from the activity browser", async () => {
    const details: string[] = [];
    const { calls, runtime } = harness((url) => {
      if (url.pathname.endsWith("/expense%2Fone")) {
        return Response.json({
          id: "expense/one",
          title: "Dinner",
          description: "Team dinner",
          amount: "42",
          currency: { code: "EUR" },
          date: "2026-08-27T20:00:00.000Z",
          timezone: "Europe/Lisbon",
          paidByUser: { id: "user-1", name: "Leonardo" },
          creator: { id: "user-1", name: "Leonardo" },
          group: { id: "group-1", name: "Lisbon trip", token: "private" },
          category: { name: "Food" },
          splitType: "shares",
          recurrence: { frequency: "monthly", interval: 1 },
          shares: [
            {
              userId: "user-1",
              amount: "22",
              user: { id: "user-1", name: "Leonardo" },
            },
            {
              userId: "user-2",
              amount: "20",
              user: { id: "user-2", name: "Ana" },
            },
          ],
        });
      }
      if (url.pathname.endsWith("/payment%2Fone")) {
        return Response.json({
          id: "payment/one",
          description: "Payback",
          amount: "15",
          currency: { code: "EUR" },
          date: "2026-08-28T09:00:00.000Z",
          timezone: "Europe/Lisbon",
          fromUser: { id: "user-2", name: "Ana" },
          toUser: { id: "user-1", name: "Leonardo" },
          creator: { id: "user-2", name: "Ana" },
          group: { id: "group-1", name: "Lisbon trip" },
          isSettlement: true,
          usedOptimalSettlement: true,
        });
      }
      return Response.json([
        {
          entity: "expense",
          id: "expense/one",
          title: "Dinner",
          amount: 42,
          currency: { code: "EUR" },
        },
        {
          entity: "payment",
          id: "payment/one",
          description: "Payback",
          amount: 15,
          currency: { code: "EUR" },
        },
      ]);
    });
    runtime.browser = async (_presentation, body, loadDetail) => {
      for (const item of body as any[]) details.push(await loadDetail(item));
      return true;
    };

    expect(
      await runCli(["groups", "activities", "group-1"], runtime),
    ).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/groups/group-1/activities",
      "/base/expenses/expense%2Fone",
      "/base/payments/payment%2Fone",
    ]);
    expect(details[0]).toContain("Description: Team dinner");
    expect(details[0]).toContain("Recurrence frequency: monthly");
    expect(details[0]).toContain("Recurrence interval: 1");
    expect(details[0]).toContain("Leonardo: 22 EUR");
    expect(details[0]).toContain("Ana: 20 EUR");
    expect(details[0]).not.toContain("private");
    expect(details[1]).toContain("From: Ana");
    expect(details[1]).toContain("To: Leonardo");
    expect(details[1]).toContain("Optimal settlement: yes");
    expect(details[1]).toContain("Timezone: Europe/Lisbon");
  });

  it("loads per-user balance breakdowns from the browser", async () => {
    let detail = "";
    const { calls, runtime } = harness((url) =>
      url.pathname.endsWith("/balances")
        ? Response.json({
            balance: -7,
            currency: { code: "EUR" },
            balanceByGroup: [
              { balance: -2, group: null },
              {
                balance: -5,
                group: { id: "group-1", name: "Lisbon trip" },
              },
            ],
          })
        : Response.json([
            {
              user: { id: "user/one", name: "Ana" },
              balance: -7,
              totalOwed: 2,
              totalOwing: 9,
            },
          ]),
    );
    runtime.browser = async (_presentation, body, loadDetail) => {
      detail = await loadDetail((body as any[])[0]);
      return true;
    };

    expect(await runCli(["balance", "users"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/balance/users",
      "/base/users/user%2Fone/balances",
    ]);
    expect(detail).toContain("Balance: -7 EUR");
    expect(detail).toContain("Owed: 2 EUR");
    expect(detail).toContain("Direct: -2 EUR");
    expect(detail).toContain("Lisbon trip: -5 EUR · group-1");
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
    expect(stderr[0]).toBe("Error: --limit must be a positive integer");
  });

  it("rejects unknown commands and enum values", async () => {
    const { calls, runtime, stderr } = harness();

    expect(await runCli(["--json", "unknown"], runtime)).toBe(2);
    expect(
      await runCli(
        ["--json", "groups", "list", "--sort", "newest"],
        runtime,
      ),
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
    expect(stderr[0]).toBe(
      "Error: BANANASPLIT_API_URL must be a valid URL",
    );
  });

  it("formats API errors for human, JSON, and raw output", async () => {
    const { runtime, stderr, stdout } = harness(
      Response.json(
        { code: "FORBIDDEN", message: "Not a member" },
        { status: 403 },
      ),
    );

    expect(await runCli(["groups", "get", "group-1"], runtime)).toBe(1);
    expect(
      await runCli(["--json", "groups", "get", "group-1"], runtime),
    ).toBe(1);
    expect(
      await runCli(["--raw", "groups", "get", "group-1"], runtime),
    ).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toBe("Error: Not a member");
    expect(JSON.parse(stderr[1])).toEqual({
      error: {
        type: "api",
        status: 403,
        message: "Not a member",
        body: { code: "FORBIDDEN", message: "Not a member" },
      },
    });
    expect(JSON.parse(stderr[2])).toEqual({
      code: "FORBIDDEN",
      message: "Not a member",
    });
  });

  it("preserves text API error messages in raw output", async () => {
    const { runtime, stderr } = harness(
      new Response("Unauthorized", { status: 401 }),
    );

    expect(await runCli(["me", "--raw"], runtime)).toBe(1);
    expect(stderr[0]).toBe(JSON.stringify("Unauthorized"));
  });

  it("uses the structured fallback for empty raw API errors", async () => {
    const { runtime, stderr } = harness(
      new Response(null, { status: 500 }),
    );

    expect(await runCli(["me", "--raw"], runtime)).toBe(1);
    expect(JSON.parse(stderr[0])).toEqual({
      error: {
        type: "api",
        status: 500,
        message: "500 Request failed",
        body: null,
      },
    });
  });

  it("does not leak the token in network errors", async () => {
    const { runtime, stderr } = harness();
    runtime.fetch = async () => {
      throw new Error("connection refused");
    };

    expect(await runCli(["balance"], runtime)).toBe(1);
    expect(stderr[0]).not.toContain(TOKEN);
    expect(stderr[0]).toBe("Error: connection refused");
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
    expect(stderr[0]).toBe("Error: Request timed out after 25ms");
  });

  it("lists friends with pagination options and curated output", async () => {
    const { calls, runtime, stdout } = harness(
      Response.json({
        items: [
          {
            id: "friendship-1",
            user: {
              id: "user-2",
              name: "Ana",
              isGuest: false,
              isGold: true,
            },
            currency: { code: "EUR" },
            balance: "12.5",
            mostRecentActivity: "2026-09-01T10:00:00.000Z",
          },
        ],
        hasMore: true,
        nextCursor: "cursor-2",
      }),
    );

    expect(
      await runCli(
        [
          "friends",
          "list",
          "--limit",
          "10",
          "--cursor",
          "next page",
          "--sort",
          "lastActivity",
          "--filter",
          "guests",
          "--json",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/friends");
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      l: "10",
      cursor: "next page",
      sort: "lastActivity",
      filter: "guests",
    });
    expect(JSON.parse(stdout[0])).toEqual({
      items: [
        {
          id: "friendship-1",
          user: { id: "user-2", name: "Ana" },
          balance: 12.5,
          currency: "EUR",
          isGuest: false,
          isGold: true,
          mostRecentActivity: "2026-09-01T10:00:00.000Z",
        },
      ],
      hasMore: true,
      nextCursor: "cursor-2",
    });

    expect(await runCli(["friends", "list", "--json"], runtime)).toBe(0);
    expect(calls[1].url.searchParams.get("l")).toBe("5");
  });

  it("browses all friends and loads friend details", async () => {
    let rendered = "";
    let detail = "";
    const { calls, runtime, stdout } = harness((url) =>
      url.pathname.endsWith("/friendship%2Fone")
        ? Response.json({
            id: "friendship/one",
            status: "accepted",
            acceptedAt: "2026-08-01T10:00:00.000Z",
            user: {
              id: "user-2",
              name: "Ana",
              isGuest: false,
              isGold: true,
            },
          })
        : Response.json({
            items: [
              {
                id: "friendship/one",
                user: {
                  id: "user-2",
                  name: "Ana",
                  isGuest: false,
                  isGold: true,
                },
                currency: { code: "EUR" },
                balance: 7,
                mostRecentActivity: "2026-09-01T10:00:00.000Z",
              },
            ],
            hasMore: true,
            nextCursor: "cursor-2",
          }),
    );
    runtime.browser = async (presentation, body, loadDetail) => {
      expect(presentation).toBe("friend-list");
      rendered = renderCollectionBrowser(presentation, body, "ana");
      detail = await loadDetail((body as any).items[0]);
      return true;
    };

    expect(await runCli(["friends", "list"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/friends",
      "/base/friends/friendship%2Fone",
    ]);
    expect(calls[0].url.searchParams.has("l")).toBe(false);
    expect(rendered).toContain("friends");
    expect(rendered).toContain("Ana");
    expect(rendered).toContain("More friends are available");
    expect(detail).toContain("Balance: 7 EUR");
    expect(detail).toContain("Status: accepted");
    expect(detail).toContain("Friendship ID: friendship/one");
    expect(stdout).toEqual([]);
  });

  it("adds an expense with repeated splits", async () => {
    const { calls, runtime, stdout } = harness(
      Response.json({
        id: "expense-1",
        title: "Dinner",
        description: "Team meal",
        amount: "42",
        currencyId: "currency-eur",
        paidById: "user-1",
        groupId: "group-1",
        date: "2026-09-01",
        timezone: "UTC",
        splitType: "custom",
        shares: [
          { userId: "user-1", amount: "22" },
          { userId: "user-2", amount: "20" },
        ],
      }),
    );

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Dinner",
          "--amount",
          "42",
          "--currency-id",
          "currency-eur",
          "--paid-by-id",
          "user-1",
          "--date",
          "2026-09-01",
          "--group-id",
          "group-1",
          "--description",
          "Team meal",
          "--split-type",
          "custom",
          "--split",
          "user-1=22",
          "--split",
          "user-2=20",
          "--json",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/expenses");
    expect(calls[0].init?.method).toBe("POST");
    expect(new Headers(calls[0].init?.headers).get("content-type")).toBe(
      "application/json",
    );
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      title: "Dinner",
      amount: "42",
      currencyId: "currency-eur",
      paidById: "user-1",
      date: "2026-09-01T00:00:00.000Z",
      splits: [
        { userId: "user-1", amount: "22" },
        { userId: "user-2", amount: "20" },
      ],
      groupId: "group-1",
      description: "Team meal",
      splitType: "custom",
    });
    expect(JSON.parse(stdout[0])).toEqual({
      id: "expense-1",
      title: "Dinner",
      description: "Team meal",
      amount: 42,
      currencyId: "currency-eur",
      paidById: "user-1",
      groupId: "group-1",
      date: "2026-09-01",
      timezone: "UTC",
      splitType: "custom",
      splits: [
        { userId: "user-1", amount: 22 },
        { userId: "user-2", amount: 20 },
      ],
    });
  });

  it("uses server defaults for group expense splits", async () => {
    const { calls, runtime } = harness(Response.json({ id: "expense-1" }));

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Rent",
          "--amount",
          "1000",
          "--currency-id",
          "currency-eur",
          "--paid-by-id",
          "user-1",
          "--date",
          "01-09-2026",
          "--group-id",
          "group-1",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      title: "Rent",
      amount: "1000",
      currencyId: "currency-eur",
      paidById: "user-1",
      date: "2026-09-01T00:00:00.000Z",
      splits: [],
      groupId: "group-1",
    });
  });

  it("adds a payment and supports multi-payment responses", async () => {
    const { calls, runtime, stdout } = harness(
      Response.json([
        {
          id: "payment-1",
          description: "Settle up",
          amount: "12",
          currencyId: "currency-eur",
          fromUserId: "user-1",
          toUserId: "user-2",
          groupId: "group-1",
          date: "2026-09-01",
          timezone: "UTC",
          isSettlement: true,
          usedOptimalSettlement: true,
        },
        {
          id: "payment-2",
          amount: "3",
          currencyId: "currency-eur",
          fromUserId: "user-1",
          toUserId: "user-3",
          groupId: "group-1",
          date: "2026-09-01",
        },
      ]),
    );

    expect(
      await runCli(
        [
          "payments",
          "add",
          "--amount",
          "15",
          "--currency-id",
          "currency-eur",
          "--from-user-id",
          "user-1",
          "--to-user-id",
          "user-2",
          "--date",
          "2026-09-01",
          "--group-id",
          "group-1",
          "--description",
          "Settle up",
          "--json",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/payments");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      amount: "15",
      currencyId: "currency-eur",
      fromUserId: "user-1",
      toUserId: "user-2",
      date: "2026-09-01T00:00:00.000Z",
      groupId: "group-1",
      description: "Settle up",
    });
    const output = JSON.parse(stdout[0]);
    expect(output).toHaveLength(2);
    expect(output[0]).toEqual({
      id: "payment-1",
      description: "Settle up",
      amount: 12,
      currencyId: "currency-eur",
      fromUserId: "user-1",
      toUserId: "user-2",
      groupId: "group-1",
      date: "2026-09-01",
      timezone: "UTC",
      isSettlement: true,
      usedOptimalSettlement: true,
    });
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

  it("accepts JSON bodies for create commands", async () => {
    const cases = [
      {
        args: ["expenses", "add"],
        path: "/base/expenses",
        body: {
          title: "Dinner",
          amount: "42",
          currencyId: "currency-eur",
          paidById: "user-1",
          date: "2026-09-01",
          splits: [{ userId: "user-1", amount: "42" }],
          categoryId: "category-food",
        },
      },
      {
        args: ["payments", "add"],
        path: "/base/payments",
        body: {
          amount: "20",
          currencyId: "currency-eur",
          fromUserId: "user-1",
          toUserId: "user-2",
          date: "2026-09-01",
          timezone: "Europe/Lisbon",
        },
      },
      {
        args: ["groups", "create"],
        path: "/base/groups",
        body: {
          name: "Lisbon trip",
          currencyId: "currency-eur",
          groupMembers: ["user-2"],
        },
      },
    ];

    for (const testCase of cases) {
      const { calls, runtime } = harness();
      expect(
        await runCli(
          [...testCase.args, JSON.stringify(testCase.body)],
          runtime,
        ),
      ).toBe(0);
      expect(calls[0].url.pathname).toBe(testCase.path);
      expect(JSON.parse(String(calls[0].init?.body))).toEqual(testCase.body);
    }
  });

  it("rejects invalid create arguments before making a request", async () => {
    const cases = [
      [
        "expenses",
        "add",
        "--title",
        "Dinner",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--paid-by-id",
        "user-1",
        "--date",
        "2026-09-01",
      ],
      [
        "expenses",
        "add",
        "--title",
        "Dinner",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--paid-by-id",
        "user-1",
        "--date",
        "2026-09-01",
        "--split",
        "missing-amount=",
      ],
      [
        "payments",
        "add",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--from-user-id",
        "user-1",
        "--date",
        "2026-09-01",
      ],
      ["groups", "create", "--name", "Home"],
      ["expenses", "add", "[]"],
      ["payments", "add", "{"],
      ["groups", "create", "{}", "--name", "Home"],
    ];

    for (const args of cases) {
      const { calls, runtime, stderr } = harness();
      expect(await runCli(["--json", ...args], runtime)).toBe(2);
      expect(calls).toHaveLength(0);
      expect(JSON.parse(stderr[0]).error.type).toBe("usage");
    }
  });

  it("rejects malformed and impossible dates before making a request", async () => {
    const cases = [
      [
        "expenses",
        "add",
        "--title",
        "Dinner",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--paid-by-id",
        "user-1",
        "--date",
        "2026/09/02",
        "--group-id",
        "group-1",
      ],
      [
        "payments",
        "add",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--from-user-id",
        "user-1",
        "--to-user-id",
        "user-2",
        "--date",
        "31-02-2026",
      ],
    ];

    for (const args of cases) {
      const { calls, runtime, stderr } = harness();
      expect(await runCli(["--json", ...args], runtime)).toBe(2);
      expect(calls).toHaveLength(0);
      expect(JSON.parse(stderr[0]).error.message).toBe(
        "--date must use YYYY-MM-DD or DD-MM-YYYY",
      );
    }
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
