import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness } from "./helpers";

describe("BananaSplit CLI", () => {
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

});
