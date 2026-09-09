import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness } from "./helpers";

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
        currency: "EUR", paidBy: { id: "user-1", name: "Leonardo" },
        group: { id: "group-1", name: "Lisbon trip" }, category: "Food",
        date: "2026-09-01T00:00:00.000Z", splitType: null, createdAt: null,
        isRecurring: true, share: 20,
      }],
      hasMore: true, nextCursor: "cursor-2",
    });
    expect(await runCli(["expenses", "list"], runtime)).toBe(0);
    for (const text of [
      "Expenses", "1. Dinner", "ID: expense-1", "Amount: 42 EUR",
      "Your share: 20 EUR", "Paid by: Leonardo · user-1",
      "Group: Lisbon trip · group-1", "Category: Food",
      "Date: 2026-09-01T00:00:00.000Z", "Recurring: yes",
      'Next cursor: "cursor-2"', "--cursor and the same options",
    ]) expect(stdout[1]).toContain(text);
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
    expect(items[0]).toMatchObject({ amount: 8.1, group: null, category: null,
      share: null, isRecurring: false });
    expect(items[1]).toMatchObject({ share: 0, isRecurring: true });
    expect(await runCli(["expenses", "list"], runtime)).toBe(0);
    expect(stdout[1]).toContain("Your share: — EUR");
    expect(stdout[1]).toContain("Group: —");
    expect(stdout[1]).toContain("Recurring: no");
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
    expect(stdout[0]).toContain("Paid by: Leonardo · user-1");
    expect(stdout[0]).toContain("Group: Lisbon trip · group-1");
    expect(stdout[0]).toContain("Category: Food & Drinks");
    expect(stdout[0]).toContain("Leonardo · user-1: 22 EUR");
    expect(stdout[0]).toContain("Ana · user-2: 20 EUR");
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
        ["expenses", "edit", "expense-1", "--title", "Chinese dinner", "--group-id", "group-1"],
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
      groupId: "group-1",
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
        ["expenses", "edit", "expense-1", "--group-id", "group-1", "--no-group"],
        runtime,
      ),
    ).toBe(2);
    expect(calls).toHaveLength(0);
    expect(stderr[0]).toContain("At least one field to change is required");
    expect(stderr[1]).toContain(
      "--group-id and --no-group cannot be used together",
    );
  });

});
