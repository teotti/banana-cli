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

});
