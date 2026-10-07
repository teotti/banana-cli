import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { CURRENCIES, harness, TOKEN } from "./helpers";

const USER = {
  id: "user-1",
  name: "Leonardo",
  email: "leo@example.test",
  username: null,
  isGuest: false,
  currencyId: "currency-eur",
};

function currentUser(user: object, currencies: Response = Response.json(CURRENCIES)) {
  return (url: URL) =>
    url.pathname.endsWith("/currencies") ? currencies.clone() : Response.json(user);
}

describe("BananaSplit CLI", () => {
  it("fetches the current user with the bearer token", async () => {
    const { calls, runtime, stderr, stdout } = harness(currentUser(USER));

    expect(await runCli(["me"], runtime)).toBe(0);
    expect(calls.map((call) => call.url.pathname)).toEqual([
      "/base/current-user",
      "/base/currencies",
    ]);
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe(
      `Bearer ${TOKEN}`,
    );
    expect(stdout).toEqual([
      [
        "Account",
        "",
        "Name:             Leonardo",
        "Email:            leo@example.test",
        "Username:         —",
        "ID:               user-1",
        "Default currency: EUR (€)",
      ].join("\n"),
    ]);
    expect(stderr).toEqual([]);
  });

  it("prints the currency id when its code cannot be looked up", async () => {
    const { runtime, stderr, stdout } = harness(
      currentUser(USER, Response.json({ error: "Not found" }, { status: 404 })),
    );

    expect(await runCli(["me"], runtime)).toBe(0);
    expect(stdout[0]).toContain("Default currency: currency-eur");
    expect(stderr).toEqual([]);
  });

  it("supports curated JSON and untouched raw output", async () => {
    const response = { ...USER, username: "leo", inviteToken: "private-token" };
    const { calls, runtime, stdout } = harness(currentUser(response));

    expect(await runCli(["--json", "me"], runtime)).toBe(0);
    expect(await runCli(["me", "--raw"], runtime)).toBe(0);
    expect(JSON.parse(stdout[0])).toEqual({
      id: "user-1",
      name: "Leonardo",
      email: "leo@example.test",
      username: "leo",
      isGuest: false,
      currencyId: "currency-eur",
      currency: "EUR",
      currencySymbol: "€",
    });
    expect(JSON.parse(stdout[1])).toEqual(response);
    // `--raw` prints the API's answer as it came, so it skips the lookup.
    expect(calls.map((call) => call.url.pathname)).toEqual([
      "/base/current-user",
      "/base/currencies",
      "/base/current-user",
    ]);
  });
});
