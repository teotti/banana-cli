import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness } from "./helpers";

describe("BananaSplit CLI", () => {
  it("maps balance commands to their API endpoints", async () => {
    const { calls, runtime } = harness();

    expect(await runCli(["balance"], runtime)).toBe(0);
    expect(await runCli(["balance", "users"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/balance",
      "/base/balance/users",
    ]);
  });

  it("presents aggregate and per-user balances", async () => {
    const aggregateHarness = harness(
      Response.json({ balance: 9, totalOwed: 12, totalOwing: 3 }),
    );

    expect(await runCli(["balance"], aggregateHarness.runtime)).toBe(0);
    expect(aggregateHarness.stdout[0]).toBe(
      ["Balance: 9.00", "Owed:    12.00", "Owing:   3.00"].join("\n"),
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
        "User ID  Name  Balance  Owed  Owing",
        "user-2   Ana     -5.00  0.00   5.00",
      ].join("\n"),
    );
  });

});
