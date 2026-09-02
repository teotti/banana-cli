import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness } from "./helpers";

describe("BananaSplit CLI", () => {
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
