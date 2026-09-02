import { describe, expect, it } from "bun:test";
import { renderCollectionBrowser, renderGroupBrowser, runCli } from "../src/index";
import { harness } from "./helpers";

describe("BananaSplit CLI", () => {
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

});
