import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { ANA, GROUP, ME, harness, lookup } from "./helpers";

const CREATED = {
  id: "payment-1",
  description: "Settle up",
  amount: "12",
  currencyId: "currency-eur",
  fromUserId: ME.id,
  toUserId: ANA.id,
  groupId: GROUP.id,
  date: "2026-09-01",
  timezone: "UTC",
  isSettlement: true,
  usedOptimalSettlement: true,
};

const PAYMENT = {
  id: "payment-1",
  description: "Settle up",
  amount: "20",
  currency: { code: "EUR" },
  fromUser: ANA,
  toUser: ME,
  groupId: null,
  date: "2026-09-01T00:00:00.000Z",
  isSettlement: true,
};

describe("BananaSplit CLI", () => {
  it("names the currency, the group and both sides of a payment", async () => {
    const { calls, runtime, stdout } = harness((url, init) => {
      const answer = lookup(url, init);
      if (answer) return answer;
      return url.pathname === "/base/payments"
        ? Response.json(CREATED)
        : Response.json(PAYMENT);
    });

    expect(
      await runCli(
        [
          "payments",
          "add",
          "--amount",
          "15",
          "--currency",
          "EUR",
          "--from",
          "me",
          "--to",
          "Ana",
          "--date",
          "2026-09-01",
          "--group",
          "Lisbon",
          "--description",
          "Settle up",
        ],
        runtime,
      ),
    ).toBe(0);

    const post = calls.find(({ init }) => init?.method === "POST")!;
    expect(post.url.pathname).toBe("/base/payments");
    expect(JSON.parse(String(post.init?.body))).toEqual({
      amount: "15",
      date: "2026-09-01T00:00:00.000Z",
      description: "Settle up",
      currencyId: "currency-eur",
      fromUserId: ME.id,
      toUserId: ANA.id,
      groupId: GROUP.id,
    });
    // The created row is read back, so the output names what it made.
    expect(calls.at(-1)!.url.pathname).toBe("/base/payments/payment-1");
    expect(stdout[0]).toContain("Payment created");
    expect(stdout[0]).toContain("Amount:      20.00 EUR");
    expect(stdout[0]).toContain("From:        Ana");
    expect(stdout[0]).not.toContain("currency-eur");
  });

  it("takes ids without looking anything up", async () => {
    const { calls, runtime } = harness((url) =>
      url.pathname === "/base/payments"
        ? Response.json(CREATED)
        : Response.json(PAYMENT),
    );

    expect(
      await runCli(
        [
          "payments",
          "add",
          "--amount",
          "15",
          "--currency",
          "11111111-1111-4111-8111-111111111111",
          "--from",
          ME.id,
          "--to",
          ANA.id,
          "--date",
          "2026-09-01",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].init?.method).toBe("POST");
  });

  it("presents a multi-payment settlement as the rows it created", async () => {
    const { runtime, stdout } = harness((url, init) => {
      const answer = lookup(url, init);
      return answer ?? Response.json([CREATED, { ...CREATED, id: "payment-2" }]);
    });

    expect(
      await runCli(
        [
          "payments",
          "add",
          "--amount",
          "15",
          "--currency",
          "EUR",
          "--from",
          "me",
          "--to",
          "Ana",
          "--date",
          "2026-09-01",
          "--json",
        ],
        runtime,
      ),
    ).toBe(0);
    const output = JSON.parse(stdout[0]);
    expect(output).toHaveLength(2);
    expect(output[0]).toEqual({
      id: "payment-1",
      description: "Settle up",
      amount: 12,
      currencyId: "currency-eur",
      fromUserId: ME.id,
      toUserId: ANA.id,
      groupId: GROUP.id,
      date: "2026-09-01",
      timezone: "UTC",
      isSettlement: true,
      usedOptimalSettlement: true,
    });
  });

  it("shows a payment by id", async () => {
    const { calls, runtime, stdout } = harness(Response.json(PAYMENT));

    expect(await runCli(["payments", "get", "payment-1"], runtime)).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/payments/payment-1");
    expect(stdout[0]).toContain("From:        Ana");
    expect(stdout[0]).toContain("To:          Leonardo");
    expect(stdout[0]).toContain("Group:       —");
    expect(stdout[0]).toContain("Settlement:  yes");
  });

  it("reports a name that matches nothing", async () => {
    const { runtime, stderr } = harness((url, init) => lookup(url, init) ?? Response.json({}));

    expect(
      await runCli(
        [
          "payments",
          "add",
          "--amount",
          "15",
          "--currency",
          "GBP",
          "--from",
          "me",
          "--to",
          "Ana",
          "--date",
          "2026-09-01",
        ],
        runtime,
      ),
    ).toBe(2);
    expect(stderr[0]).toContain('No currency matches "GBP"');
    expect(stderr[0]).toContain("banana currencies --search");
  });
});
