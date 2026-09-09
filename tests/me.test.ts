import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness, TOKEN } from "./helpers";

describe("BananaSplit CLI", () => {
  it("fetches the current user with the bearer token", async () => {
    const { calls, runtime, stderr, stdout } = harness(
      Response.json({
        id: "user-1",
        name: "Leonardo",
        email: "leo@example.test",
        username: null,
        isGuest: false,
        currencyId: "currency-eur",
      }),
    );

    expect(await runCli(["me"], runtime)).toBe(0);
    expect(calls[0].url.href).toBe("https://api.example.test/base/current-user");
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe(
      `Bearer ${TOKEN}`,
    );
    expect(stdout).toEqual([
      [
        "Account",
        "",
        "Name:        Leonardo",
        "Email:       leo@example.test",
        "Username:    —",
        "ID:          user-1",
        "Currency ID: currency-eur",
      ].join("\n"),
    ]);
    expect(stderr).toEqual([]);
  });

  it("supports curated JSON and untouched raw output", async () => {
    const response = {
      id: "user-1",
      name: "Leonardo",
      email: "leo@example.test",
      username: "leo",
      isGuest: false,
      currencyId: "currency-eur",
      inviteToken: "private-token",
    };
    const { runtime, stdout } = harness(Response.json(response));

    expect(await runCli(["--json", "me"], runtime)).toBe(0);
    expect(await runCli(["me", "--raw"], runtime)).toBe(0);
    expect(JSON.parse(stdout[0])).toEqual({
      id: "user-1",
      name: "Leonardo",
      email: "leo@example.test",
      username: "leo",
      isGuest: false,
      currencyId: "currency-eur",
    });
    expect(JSON.parse(stdout[1])).toEqual(response);
  });

});
