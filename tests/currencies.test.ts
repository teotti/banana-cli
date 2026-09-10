import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { CURRENCIES, harness } from "./helpers";

describe("BananaSplit CLI", () => {
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
    expect(stdout[0].split("\n")).toEqual([
      "Code  Name  Symbol  Type  Decimals  Rate to base",
      "EUR   Euro  €       fiat         2             1",
    ]);
    expect(JSON.parse(stdout[1])).toEqual(response);
  });

  it("filters the currency list by code and by search", async () => {
    const response = [
      ...CURRENCIES,
      {
        id: "currency-sek",
        name: "Swedish krona",
        code: "SEK",
        symbol: "kr",
        type: "fiat",
        decimals: 2,
        exchangeRateToBase: "11",
      },
    ];
    const { runtime, stdout } = harness(Response.json(response));

    expect(await runCli(["currencies", "--code", "eur", "--json"], runtime)).toBe(0);
    expect(JSON.parse(stdout[0])).toEqual(CURRENCIES);

    expect(await runCli(["currencies", "--search", "krona"], runtime)).toBe(0);
    expect(stdout[1]).toContain("SEK");
    expect(stdout[1]).not.toContain("EUR");

    expect(await runCli(["currencies", "--code", "gbp"], runtime)).toBe(0);
    expect(stdout[2]).toContain("No currencies.");
  });
});
