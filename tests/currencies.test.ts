import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness } from "./helpers";

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
      "ID            Code  Name  Symbol  Type  Decimals  Rate to base",
      "currency-eur  EUR   Euro  €       fiat         2             1",
    ]);
    expect(JSON.parse(stdout[1])).toEqual(response);
  });

});
