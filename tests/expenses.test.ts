import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { ANA, GROUP, ME, harness, lookup } from "./helpers";

describe("BananaSplit CLI", () => {
  it("maps expense list sorting, recurring filters, and cursors to the API", async () => {
    for (const [filter, recurring, sort, direction] of [
      ["--recurring", "true", "amount", "desc"],
      ["--no-recurring", "false", "date", "asc"],
    ]) {
      const { calls, runtime } = harness(
        Response.json({ items: [], hasMore: false, nextCursor: null }),
      );
      expect(await runCli([
        "expenses", "list", "--limit", "10", "--cursor", "next +/=? page",
        "--sort", sort, "--direction", direction, filter,
      ], runtime)).toBe(0);
      expect(calls).toHaveLength(1);
      expect(calls[0].url.pathname).toBe("/base/expenses");
      expect(calls[0].init?.method ?? "GET").toBe("GET");
      expect(calls[0].init?.body).toBeUndefined();
      expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
        l: "10", cursor: "next +/=? page", sort, direction, recurring,
      });
    }
  });

  it("uses five expenses per page and leaves sorting and filtering to the API", async () => {
    const response = { items: [], hasMore: false, nextCursor: null };
    const { calls, runtime, stdout } = harness(Response.json(response));
    expect(await runCli(["expenses", "list"], runtime)).toBe(0);
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ l: "5" });
    expect(stdout[0]).toBe("No expenses.\n\nEnd of expenses.");
    expect(await runCli(["expenses", "list", "--json"], runtime)).toBe(0);
    expect(JSON.parse(stdout[1])).toEqual(response);
  });

  it("presents expense shares and pagination without fetching detail rows", async () => {
    const response = {
      items: [{
        id: "expense-1",
        title: "Dinner",
        amount: "42.000000000000000000",
        currency: { code: "EUR" },
        paidByUser: { id: "user-1", name: "Leonardo" },
        groupId: "group-1",
        group: { name: "Lisbon trip", token: "private-group-token" },
        category: { name: "Food" },
        date: "2026-09-01T00:00:00.000Z",
        share: { userId: "user-2", amount: "20.000000000000000000" },
        recurrence: { frequency: "monthly" },
      }],
      hasMore: true,
      nextCursor: "cursor-2",
    };
    const { calls, runtime, stdout } = harness(Response.json(response));
    expect(await runCli(["expenses", "list", "--json"], runtime)).toBe(0);
    expect(JSON.parse(stdout[0])).toEqual({
      items: [{
        id: "expense-1", title: "Dinner", description: null, amount: 42,
        currencyId: null, currency: "EUR",
        paidById: "user-1", paidBy: "Leonardo",
        groupId: "group-1", group: "Lisbon trip", category: "Food",
        date: "2026-09-01T00:00:00.000Z", splitType: null, createdAt: null,
        isRecurring: true, share: 20,
      }],
      hasMore: true, nextCursor: "cursor-2",
    });
    expect(await runCli(["expenses", "list"], runtime)).toBe(0);
    expect(stdout[1].split("\n")).toEqual([
      "ID         Date        Title   Paid by      Amount  Your share",
      "expense-1  2026-09-01  Dinner  Leonardo  42.00 EUR   20.00 EUR",
      "",
      'More expenses available. Next page: banana expenses list --cursor "cursor-2"',
    ]);
    expect(stdout[1]).not.toContain("private-group-token");
    expect(await runCli(["expenses", "list", "--raw"], runtime)).toBe(0);
    expect(JSON.parse(stdout[2])).toEqual(response);
    expect(calls).toHaveLength(3);
    expect(calls.every(({ url }) => url.pathname === "/base/expenses")).toBe(true);
  });

  it("handles missing and zero shares and recurring rules without expansions", async () => {
    const { runtime, stdout } = harness(Response.json({
      items: [
        { id: "direct", title: "Taxi", amount: "8.10", currencyId: "EUR",
          groupId: null, category: null, share: null, recurrence: null },
        { id: "recurring", title: "Rent", amount: "100", currencyId: "EUR",
          share: { amount: "0" }, recurringExpenseRuleId: "rule-1" },
      ],
      hasMore: false, nextCursor: null,
    }));
    expect(await runCli(["expenses", "list", "--json"], runtime)).toBe(0);
    const { items } = JSON.parse(stdout[0]);
    expect(items[0]).toMatchObject({ amount: 8.1, groupId: null, group: null,
      category: null, share: null, isRecurring: false });
    expect(items[1]).toMatchObject({ share: 0, isRecurring: true });
    expect(await runCli(["expenses", "list"], runtime)).toBe(0);
    expect(stdout[1]).toContain("Taxi   —          8.10           —");
    expect(stdout[1]).toContain("recurring  —     Rent   —        100.00        0.00");
    expect(stdout[1]).toContain("End of expenses.");
  });

  it("rejects invalid expense list options before fetching", async () => {
    for (const options of [
      ["--sort", "title"], ["--direction", "up"], ["--limit", "0"],
      ["--limit", "-1"], ["--limit", "1.5"], ["--limit", "many"],
      ["--recurring", "--no-recurring"], ["--recurring=false"],
      ["--page", "2"], ["--cursor"], ["unexpected"],
    ]) {
      const { calls, runtime, stderr } = harness();
      expect(await runCli(["expenses", "list", ...options, "--json"], runtime)).toBe(2);
      expect(calls).toHaveLength(0);
      expect(JSON.parse(stderr[0]).error.type).toBe("usage");
    }
  });

  it("documents expense lists and preserves bare expense help without auth", async () => {
    const { calls, runtime, stdout } = harness();
    runtime.env = {};
    for (const args of [[], ["expenses"], ["expenses", "list", "--help"]]) {
      expect(await runCli(args, runtime)).toBe(0);
    }
    expect(stdout.every((text) => text.includes("expenses list"))).toBe(true);
    expect(stdout[1]).toContain("add                Add an expense");
    expect(stdout[2]).toContain("--no-recurring");
    expect(calls).toHaveLength(0);
  });

  it("adds an expense, naming the currency, group and people", async () => {
    const created = {
      id: "expense-1",
      title: "Dinner",
      description: "Team meal",
      amount: "42",
      currencyId: "currency-eur",
      currency: { code: "EUR" },
      paidById: ME.id,
      paidByUser: ME,
      groupId: GROUP.id,
      group: GROUP,
      date: "2026-09-01",
      splitType: "custom",
      shares: [
        { userId: ME.id, amount: "22", user: ME },
        { userId: ANA.id, amount: "20", user: ANA },
      ],
    };
    const { calls, runtime, stdout } = harness((url, init) => {
      const answer = lookup(url, init);
      return answer ?? Response.json(created);
    });

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Dinner",
          "--amount",
          "42",
          "--currency",
          "EUR",
          "--paid-by",
          "me",
          "--date",
          "2026-09-01",
          "--group",
          "Lisbon",
          "--description",
          "Team meal",
          "--split-type",
          "custom",
          "--split",
          "me=22",
          "--split",
          "Ana=20",
        ],
        runtime,
      ),
    ).toBe(0);

    const post = calls.find(({ init }) => init?.method === "POST")!;
    expect(post.url.pathname).toBe("/base/expenses");
    expect(new Headers(post.init?.headers).get("content-type")).toBe(
      "application/json",
    );
    expect(JSON.parse(String(post.init?.body))).toEqual({
      title: "Dinner",
      amount: "42",
      date: "2026-09-01T00:00:00.000Z",
      splits: [
        { userId: ME.id, amount: "22" },
        { userId: ANA.id, amount: "20" },
      ],
      description: "Team meal",
      splitType: "custom",
      currencyId: "currency-eur",
      paidById: ME.id,
      groupId: GROUP.id,
    });
    // The created row is read back, so one command shows the whole expense.
    expect(calls.at(-1)!.url.pathname).toBe("/base/expenses/expense-1");
    expect(stdout[0]).toContain("Expense created");
    expect(stdout[0]).toContain("Amount:      42.00 EUR");
    expect(stdout[0]).toContain("Paid by:     Leonardo");
    expect(stdout[0]).toContain("Group:       Lisbon trip");
    expect(stdout[0]).toContain("Ana       20.00 EUR");
    expect(stdout[0]).not.toContain(ANA.id);
  });

  it("defaults the payer to the signed-in user", async () => {
    const { calls, runtime } = harness((url, init) => {
      const answer = lookup(url, init);
      return answer ?? Response.json({ id: "expense-1" });
    });

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Rent",
          "--amount",
          "1000",
          "--currency",
          "EUR",
          "--date",
          "01-09-2026",
          "--group",
          "Lisbon trip",
        ],
        runtime,
      ),
    ).toBe(0);
    const post = calls.find(({ init }) => init?.method === "POST")!;
    expect(JSON.parse(String(post.init?.body))).toEqual({
      title: "Rent",
      amount: "1000",
      date: "2026-09-01T00:00:00.000Z",
      splits: [],
      currencyId: "currency-eur",
      paidById: ME.id,
      groupId: GROUP.id,
    });
  });

  it("keeps ids working and looks nothing up for them", async () => {
    const { calls, runtime } = harness(Response.json({ id: "expense-1" }));

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Taxi",
          "--amount",
          "20",
          "--currency",
          "44444444-4444-4444-8444-444444444444",
          "--paid-by",
          ME.id,
          "--date",
          "2026-09-01",
          "--split",
          `${ANA.id}=20`,
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({
      currencyId: "44444444-4444-4444-8444-444444444444",
      paidById: ME.id,
      splits: [{ userId: ANA.id, amount: "20" }],
    });
  });

  it("reports an ambiguous name instead of guessing", async () => {
    const { runtime, stderr } = harness((url, init) => {
      if (init?.method === undefined && url.pathname.endsWith("/groups")) {
        return Response.json({
          items: [
            { id: "group-1", name: "Lisbon trip" },
            { id: "group-2", name: "Lisbon flat" },
          ],
        });
      }
      return lookup(url, init) ?? Response.json({ id: "expense-1" });
    });

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Rent",
          "--amount",
          "1000",
          "--currency",
          "EUR",
          "--date",
          "2026-09-01",
          "--group",
          "Lisbon",
        ],
        runtime,
      ),
    ).toBe(2);
    expect(stderr[0]).toContain("--group \"Lisbon\" matches 2 groups");
    expect(stderr[0]).toContain("Lisbon trip, Lisbon flat");
  });

  it("shows an expense by id with resolved names", async () => {
    const { calls, runtime, stdout } = harness(
      Response.json({
        id: "expense-1",
        title: "Dinner",
        description: null,
        amount: "42.000000000000000000",
        currencyId: "currency-eur",
        currency: { code: "EUR" },
        paidById: "user-1",
        paidByUser: { id: "user-1", name: "Leonardo" },
        groupId: "group-1",
        group: { id: "group-1", name: "Lisbon trip" },
        category: { name: "Food & Drinks" },
        date: "2026-09-01T00:00:00.000Z",
        splitType: "custom",
        shares: [
          { userId: "user-1", amount: "22", user: { id: "user-1", name: "Leonardo" } },
          { userId: "user-2", amount: "20", user: { id: "user-2", name: "Ana" } },
        ],
      }),
    );

    expect(await runCli(["expenses", "get", "expense-1"], runtime)).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/expenses/expense-1");
    expect(calls[0].init?.method).toBeUndefined();
    expect(stdout[0]).toContain("Paid by:     Leonardo");
    expect(stdout[0]).toContain("Group:       Lisbon trip");
    expect(stdout[0]).toContain("Category:    Food & Drinks");
    expect(stdout[0]).toContain("Leonardo  22.00 EUR");
    expect(stdout[0]).toContain("Ana       20.00 EUR");
    expect(stdout[0]).not.toContain("user-2");
  });

  it("merges edited fields over the current expense before the PUT", async () => {
    const { calls, runtime } = harness((url, init) =>
      init?.method === "PUT"
        ? Response.json({ id: "expense-1" })
        : Response.json({
            id: "expense-1",
            title: "Dinner",
            description: "Split later",
            amount: "42",
            currencyId: "currency-eur",
            paidById: "user-1",
            groupId: null,
            friendshipId: "friendship-1",
            date: "2026-09-01T00:00:00.000Z",
            timezone: "Europe/Lisbon",
            splitType: "custom",
            categoryId: "category-1",
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
          "edit",
          "expense-1",
          "--title",
          "Chinese dinner",
          "--group",
          "44444444-4444-4444-8444-444444444444",
        ],
        runtime,
      ),
    ).toBe(0);

    expect(calls.map(({ init }) => init?.method)).toEqual([
      undefined,
      "PUT",
      undefined,
    ]);
    expect(JSON.parse(String(calls[1].init?.body))).toEqual({
      title: "Chinese dinner",
      description: "Split later",
      amount: "42",
      currencyId: "currency-eur",
      paidById: "user-1",
      groupId: "44444444-4444-4444-8444-444444444444",
      friendshipId: null,
      date: "2026-09-01T00:00:00.000Z",
      timezone: "Europe/Lisbon",
      splitType: "custom",
      categoryId: "category-1",
      splits: [
        { userId: "user-1", amount: "22" },
        { userId: "user-2", amount: "20" },
      ],
    });
  });

  it("edits an expense whose only change is a named currency", async () => {
    const { calls, runtime } = harness((url, init) => {
      const answer = lookup(url, init);
      if (answer) return answer;
      return init?.method === "PUT"
        ? Response.json({ id: "expense-1" })
        : Response.json({
            id: "expense-1",
            title: "Dinner",
            amount: "42",
            currencyId: "currency-usd",
            paidById: ME.id,
            splitType: "custom",
            date: "2026-09-01T00:00:00.000Z",
            shares: [{ userId: ME.id, amount: "42" }],
          });
    });

    expect(
      await runCli(["expenses", "edit", "expense-1", "--currency", "EUR"], runtime),
    ).toBe(0);
    const put = calls.find(({ init }) => init?.method === "PUT")!;
    expect(JSON.parse(String(put.init?.body))).toMatchObject({
      currencyId: "currency-eur",
      amount: "42",
    });
  });

  it("redistributes an equal split when the amount changes", async () => {
    const { calls, runtime } = harness((url, init) =>
      init?.method === "PUT"
        ? Response.json({ id: "expense-1" })
        : Response.json({
            id: "expense-1",
            title: "Gomas",
            amount: "8.10",
            currencyId: "currency-eur",
            paidById: "user-1",
            groupId: "group-1",
            splitType: "equal",
            date: "2026-09-02T00:00:00.000Z",
            shares: [
              { userId: "user-1", amount: "4.05" },
              { userId: "user-2", amount: "4.05" },
            ],
          }),
    );

    expect(
      await runCli(["expenses", "edit", "expense-1", "--amount", "8.11"], runtime),
    ).toBe(0);
    expect(JSON.parse(String(calls[1].init?.body)).splits).toEqual([
      { userId: "user-1", amount: "4.06" },
      { userId: "user-2", amount: "4.05" },
    ]);
  });

  it("refuses an amount change that would leave other split types out of sync", async () => {
    const { calls, runtime, stderr } = harness(
      Response.json({
        id: "expense-1",
        amount: "42",
        splitType: "custom",
        shares: [{ userId: "user-1", amount: "42" }],
      }),
    );

    expect(
      await runCli(["expenses", "edit", "expense-1", "--amount", "60"], runtime),
    ).toBe(2);
    expect(calls.map(({ init }) => init?.method)).toEqual([undefined]);
    expect(stderr[0]).toContain(
      "Changing --amount on a custom split needs matching --split values",
    );
  });

  it("rejects an edit with nothing to change or conflicting group flags", async () => {
    const { calls, runtime, stderr } = harness();

    expect(await runCli(["expenses", "edit", "expense-1"], runtime)).toBe(2);
    expect(
      await runCli(
        ["expenses", "edit", "expense-1", "--group", "Lisbon", "--no-group"],
        runtime,
      ),
    ).toBe(2);
    expect(calls).toHaveLength(0);
    expect(stderr[0]).toContain("At least one field to change is required");
    expect(stderr[1]).toContain("--group and --no-group cannot be used together");
  });

});
