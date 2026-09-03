import { describe, expect, it } from "bun:test";
import { PassThrough } from "node:stream";
import { browseCollection } from "../src/browser";
import { renderCollectionBrowser, renderGroupBrowser, runCli } from "../src/index";
import { CliFailure } from "../src/types";
import { harness } from "./helpers";

async function withBrowserTerminal(
  check: (key: (name: string, text?: string) => void, screens: string[]) => Promise<void>,
) {
  const stdin = Object.getOwnPropertyDescriptor(process, "stdin")!;
  const stdout = Object.getOwnPropertyDescriptor(process, "stdout")!;
  const ci = process.env.CI;
  const input = Object.assign(new PassThrough(), {
    isTTY: true,
    isRaw: false,
    setRawMode(value: boolean) { this.isRaw = value; return this; },
  });
  const output = Object.assign(new PassThrough(), { isTTY: true, rows: 16 });
  const screens: string[] = [];
  output.on("data", (chunk) => screens.push(String(chunk)));
  const key = (name: string, text = "") => input.emit("keypress", text, { name });
  try {
    delete process.env.CI;
    Object.defineProperty(process, "stdin", { configurable: true, value: input });
    Object.defineProperty(process, "stdout", { configurable: true, value: output });
    await check(key, screens);
  } finally {
    key("q");
    Object.defineProperty(process, "stdin", stdin);
    Object.defineProperty(process, "stdout", stdout);
    if (ci === undefined) delete process.env.CI;
    else process.env.CI = ci;
    input.destroy();
    output.destroy();
  }
}

describe("BananaSplit CLI", () => {
  it("appends expense pages at the last item, retaining filters and selection", async () => {
    await withBrowserTerminal(async (key, screens) => {
      const { calls, runtime, stdout } = harness((url) => Response.json(
        url.searchParams.get("cursor") === "start"
          ? { items: [{ id: "e-1", title: "First" }, { id: "e-2", title: "Second" }],
              hasMore: true, nextCursor: "next +/=" }
          : { items: [{ id: "e-3", title: "Third", amount: "8.10" }],
              hasMore: false, nextCursor: null },
      ));
      const fetch = runtime.fetch!;
      let release!: () => void;
      let pageRequests = 0;
      runtime.fetch = async (input, init) => {
        if (new URL(String(input)).searchParams.get("cursor") === "next +/=") {
          pageRequests++;
          await new Promise<void>((resolve) => { release = resolve; });
        }
        return fetch(input, init);
      };
      runtime.browser = browseCollection;
      const result = runCli([
        "expenses", "list", "--cursor", "start", "--limit", "2",
        "--sort", "amount", "--direction", "desc", "--no-recurring",
      ], runtime);
      await Bun.sleep(0);
      expect(pageRequests).toBe(0);
      key("down");
      expect(screens.at(-1)).toContain("Loading more expenses…");
      key("down");
      expect(pageRequests).toBe(1);
      release();
      await Bun.sleep(0);
      const rendered = screens.at(-1)!;
      expect(rendered).toContain("First");
      expect(rendered).toContain("Second");
      expect(rendered).toContain("Third");
      expect(rendered.replace(/\x1b\[[0-9;]*m/g, "")).toContain("› ● Expense: Second");
      expect(Object.fromEntries(calls[1].url.searchParams)).toEqual({
        cursor: "next +/=", l: "2", sort: "amount", direction: "desc", recurring: "false",
      });
      key("down");
      key("down");
      expect(pageRequests).toBe(1);
      key("q");
      expect(await result).toBe(0);
      expect(stdout).toEqual([]);
    });
  });

  it("keeps loaded expenses on failure, retries, and searches appended pages", async () => {
    await withBrowserTerminal(async (key, screens) => {
      let attempts = 0;
      const browsing = browseCollection("expense-list", {
        items: [{ id: "e-1", title: "Dinner" }], hasMore: true, nextCursor: "next",
      }, async () => "", async (cursor) => {
        expect(cursor).toBe("next");
        if (++attempts === 1) throw new CliFailure("network", "Offline");
        return { items: [{ id: "e-2", title: "Taxi" }], hasMore: false, nextCursor: null };
      });
      key("down");
      await Bun.sleep(0);
      expect(screens.at(-1)).toContain("Offline");
      expect(screens.at(-1)).toContain("Press ↓ to retry");
      expect(screens.at(-1)).toContain("Dinner");
      key("t", "t");
      key("a", "a");
      key("x", "x");
      expect(screens.at(-1)).toContain("No matching expenses.");
      key("down");
      await Bun.sleep(0);
      expect(attempts).toBe(2);
      expect(screens.at(-1)).toContain("Taxi");
      expect(screens.at(-1)).toContain("1/2");
      expect(screens.at(-1)).not.toContain("Offline");
      key("escape");
      expect(screens.at(-1)).toContain("Dinner");
      key("q");
      expect(await browsing).toBe(true);
    });
  });

  it("ignores a page that completes after quitting the browser", async () => {
    await withBrowserTerminal(async (key, screens) => {
      let release!: (page: unknown) => void;
      const browsing = browseCollection("expense-list", {
        items: [], hasMore: true, nextCursor: "next",
      }, async () => "", () => new Promise((resolve) => { release = resolve; }));
      key("down");
      key("q");
      expect(await browsing).toBe(true);
      const count = screens.length;
      release({ items: [{ title: "Late" }], hasMore: false, nextCursor: null });
      await Bun.sleep(0);
      expect(screens).toHaveLength(count);
    });
  });

  it("keeps the selected expense visible as the list grows", () => {
    const rendered = renderCollectionBrowser("expense-list", {
      items: Array.from({ length: 50 }, (_, id) => ({ id, title: `Expense ${id}` })),
      hasMore: true,
    }, "", 49, undefined, 16);
    expect(rendered).toContain("Expense 49");
    expect(rendered).not.toContain("Expense 0");
    expect(rendered.split("\n").length).toBeLessThan(16);
  });

  it("browses and searches the loaded expense page", () => {
    const body = {
      items: [{ id: "e-1", title: "Dinner", group: { name: "Lisbon" } },
              { id: "e-2", title: "Taxi" }],
      hasMore: true, nextCursor: "next",
    };
    const rendered = renderCollectionBrowser("expense-list", body, " LISBON ");
    expect(rendered).toContain("1/2");
    expect(rendered).toContain("Expense: Dinner");
    expect(rendered).not.toContain("Taxi");
    expect(rendered).toContain("Reach the last item to load more expenses");
    expect(rendered).toContain("enter details");
    expect(renderCollectionBrowser("expense-list", body, "missing"))
      .toContain("No matching expenses.");
  });

  it("loads full expense splits only when opening browser details", async () => {
    const { calls, runtime, stdout } = harness((url) => Response.json(
      url.pathname === "/base/expenses"
        ? { items: [{ id: "expense/one", title: "Dinner", share: { amount: "20" } }],
            hasMore: false, nextCursor: null }
        : { id: "expense/one", title: "Dinner", amount: "42",
            currency: { code: "EUR" }, paidByUser: { id: "u-1", name: "Leonardo" },
            shares: [{ user: { id: "u-2", name: "Ana" }, amount: "20" }] },
    ));
    runtime.browser = async (presentation, body, loadDetail) => {
      expect(presentation).toBe("expense-list");
      expect(calls).toHaveLength(1);
      const item = (body as { items: Record<string, unknown>[] }).items[0];
      expect(item.share).toBe(20);
      expect(item).not.toHaveProperty("splits");
      const detail = await loadDetail(item);
      expect(detail).toContain("Paid by: Leonardo · u-1");
      expect(detail).toContain("Splits");
      expect(detail).toContain("Ana · u-2: 20 EUR");
      return true;
    };
    expect(await runCli(["expenses", "list", "--recurring", "--sort", "amount"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/expenses", "/base/expenses/expense%2Fone",
    ]);
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      recurring: "true", sort: "amount",
    });
    expect(calls[1].url.search).toBe("");
    expect(stdout).toEqual([]);
  });

  it("preserves explicit expense limits and supports browser fallback and output modes", async () => {
    for (const limit of [["--limit", "7"], ["--limit=7"]]) {
      const { calls, runtime, stdout } = harness(Response.json({
        items: [{ id: "e-1", title: "Dinner" }], hasMore: false, nextCursor: null,
      }));
      let browsed = 0;
      let paged = 0;
      runtime.browser = async () => { browsed++; return false; };
      runtime.pager = async (text) => {
        paged++;
        expect(text).toContain("1. Dinner");
        return false;
      };
      expect(await runCli(["expenses", "list", ...limit], runtime)).toBe(0);
      expect(calls[0].url.searchParams.get("l")).toBe("7");
      expect(stdout[0]).toContain("1. Dinner");
      for (const mode of ["--json", "--raw"]) {
        expect(await runCli(["expenses", "list", mode], runtime)).toBe(0);
        expect(calls.at(-1)?.url.searchParams.get("l")).toBe("5");
      }
      expect(browsed).toBe(1);
      expect(paged).toBe(1);
    }
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
