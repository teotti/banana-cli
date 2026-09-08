import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { harness, TOKEN } from "./helpers";

describe("BananaSplit CLI", () => {
  it("prints help without requiring authentication", async () => {
    const { runtime, stderr, stdout } = harness();
    runtime.env = {};

    expect(await runCli([], runtime)).toBe(0);
    expect(stdout[0]).toContain("banana [--json | --raw] <command>");
    expect(stderr).toEqual([]);
  });

  it("updates without authentication or an API request", async () => {
    const { calls, runtime, stderr, stdout } = harness();
    runtime.env = {};
    runtime.update = async () => "Banana is up to date.";

    expect(await runCli(["update"], runtime)).toBe(0);
    expect(calls).toEqual([]);
    expect(stdout).toEqual(["Banana is up to date."]);
    expect(stderr).toEqual([]);
  });

  it("prints update help and rejects update arguments and output flags", async () => {
    const { calls, runtime, stderr, stdout } = harness();
    let updates = 0;
    runtime.update = async () => {
      updates += 1;
      return "updated";
    };

    expect(await runCli(["update", "--help"], runtime)).toBe(0);
    expect(stdout[0]).toBe(
      "USAGE\n  banana update\n\nUpdate the CLI to the latest stable release.",
    );
    expect(await runCli(["update", "later"], runtime)).toBe(2);
    expect(await runCli(["update", "--json"], runtime)).toBe(2);
    expect(await runCli(["--raw", "update"], runtime)).toBe(2);
    expect(stderr).toEqual([
      "Error: USAGE\n  banana update\n\nUpdate the CLI to the latest stable release.",
      "{\"error\":{\"type\":\"usage\",\"message\":\"--json is not supported for banana update\"}}",
      "{\"error\":{\"type\":\"usage\",\"message\":\"--raw is not supported for banana update\"}}",
    ]);
    expect(updates).toBe(0);
    expect(calls).toEqual([]);
  });

  it("reports updater launch failures", async () => {
    const { runtime, stderr } = harness();
    runtime.update = async () => {
      throw new Error("Could not start updater");
    };

    expect(await runCli(["update"], runtime)).toBe(1);
    expect(stderr).toEqual(["Error: Could not start updater"]);
  });

  it("requires a stored login before making a request", async () => {
    const { calls, runtime, stderr } = harness();
    runtime.env = {};

    expect(await runCli(["me"], runtime)).toBe(1);
    expect(await runCli(["me", "--raw"], runtime)).toBe(1);
    expect(calls).toHaveLength(0);
    expect(stderr[0]).toBe("Error: Not logged in. Run banana login.");
    expect(JSON.parse(stderr[1])).toEqual({
      error: {
        type: "config",
        message: "Not logged in. Run banana login.",
      },
    });
  });

  it("rejects conflicting output flags before making a request", async () => {
    const { calls, runtime, stderr } = harness();

    expect(await runCli(["--json", "me", "--raw"], runtime)).toBe(2);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(stderr[0]).error).toEqual({
      type: "usage",
      message: "Choose only one of --json or --raw",
    });
  });

  it("supports top-level list aliases", async () => {
    const { calls, runtime } = harness();

    expect(await runCli(["friends", "--raw"], runtime)).toBe(0);
    expect(await runCli(["groups", "--raw"], runtime)).toBe(0);
    expect(await runCli(["balances", "--raw"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/friends",
      "/base/groups",
      "/base/balance/users",
    ]);
  });

  it("prints explicit messages for empty collections", async () => {
    const groupsHarness = harness(
      Response.json({ items: [], hasMore: false, nextCursor: null }),
    );
    expect(
      await runCli(["groups", "list"], groupsHarness.runtime),
    ).toBe(0);
    expect(groupsHarness.stdout[0]).toBe("No groups.\n\nEnd of groups.");

    const activitiesHarness = harness(Response.json([]));
    expect(
      await runCli(
        ["groups", "activities", "group-1"],
        activitiesHarness.runtime,
      ),
    ).toBe(0);
    expect(activitiesHarness.stdout[0]).toBe("No group activities.");
  });

  it("rejects invalid arguments without making a request", async () => {
    const { calls, runtime, stderr } = harness();

    expect(
      await runCli(["groups", "list", "--limit", "zero"], runtime),
    ).toBe(2);
    expect(calls).toHaveLength(0);
    expect(stderr[0]).toBe("Error: --limit must be a positive integer");
  });

  it("rejects unknown commands and enum values", async () => {
    const { calls, runtime, stderr } = harness();

    expect(await runCli(["--json", "unknown"], runtime)).toBe(2);
    expect(
      await runCli(
        ["--json", "groups", "list", "--sort", "newest"],
        runtime,
      ),
    ).toBe(2);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(stderr[1]).error.message).toBe(
      "--sort must be one of: balance, lastActivity",
    );
  });

  it("rejects an invalid API URL before making a request", async () => {
    const { calls, runtime, stderr } = harness();
    runtime.env = {
      BANANASPLIT_API_URL: "not a URL",
    };

    expect(await runCli(["me"], runtime)).toBe(1);
    expect(calls).toHaveLength(0);
    expect(stderr[0]).toBe(
      "Error: BANANASPLIT_API_URL must be a valid URL",
    );
  });

  it("formats API errors for human, JSON, and raw output", async () => {
    const { runtime, stderr, stdout } = harness(
      Response.json(
        { code: "FORBIDDEN", message: "Not a member" },
        { status: 403 },
      ),
    );

    expect(await runCli(["groups", "get", "group-1"], runtime)).toBe(1);
    expect(
      await runCli(["--json", "groups", "get", "group-1"], runtime),
    ).toBe(1);
    expect(
      await runCli(["--raw", "groups", "get", "group-1"], runtime),
    ).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toBe("Error: Not a member");
    expect(JSON.parse(stderr[1])).toEqual({
      error: {
        type: "api",
        status: 403,
        message: "Not a member",
        body: { code: "FORBIDDEN", message: "Not a member" },
      },
    });
    expect(JSON.parse(stderr[2])).toEqual({
      code: "FORBIDDEN",
      message: "Not a member",
    });
  });

  it("refreshes rather than rendering a token-related 401", async () => {
    const { runtime, stderr } = harness(
      new Response("Unauthorized", { status: 401 }),
    );

    expect(await runCli(["me", "--raw"], runtime)).toBe(1);
    expect(JSON.parse(stderr[0]).error.message).toBe(
      "Could not refresh login. Run banana login.",
    );
  });

  it("uses the structured fallback for empty raw API errors", async () => {
    const { runtime, stderr } = harness(
      new Response(null, { status: 500 }),
    );

    expect(await runCli(["me", "--raw"], runtime)).toBe(1);
    expect(JSON.parse(stderr[0])).toEqual({
      error: {
        type: "api",
        status: 500,
        message: "500 Request failed",
        body: null,
      },
    });
  });

  it("does not leak the token in network errors", async () => {
    const { runtime, stderr } = harness();
    runtime.fetch = async () => {
      throw new Error("connection refused");
    };

    expect(await runCli(["balance"], runtime)).toBe(1);
    expect(stderr[0]).not.toContain(TOKEN);
    expect(stderr[0]).toBe("Error: connection refused");
  });

  it("reports request timeouts", async () => {
    const { runtime, stderr } = harness();
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    runtime.timeoutMs = 25;
    runtime.fetch = async () => {
      throw timeout;
    };

    expect(await runCli(["balance"], runtime)).toBe(1);
    expect(stderr[0]).toBe("Error: Request timed out after 25ms");
  });

  it("accepts JSON bodies for create commands", async () => {
    const cases = [
      {
        args: ["expenses", "add"],
        path: "/base/expenses",
        body: {
          title: "Dinner",
          amount: "42",
          currencyId: "currency-eur",
          paidById: "user-1",
          date: "2026-09-01",
          splits: [{ userId: "user-1", amount: "42" }],
          categoryId: "category-food",
        },
      },
      {
        args: ["payments", "add"],
        path: "/base/payments",
        body: {
          amount: "20",
          currencyId: "currency-eur",
          fromUserId: "user-1",
          toUserId: "user-2",
          date: "2026-09-01",
          timezone: "Europe/Lisbon",
        },
      },
      {
        args: ["groups", "create"],
        path: "/base/groups",
        body: {
          name: "Lisbon trip",
          currencyId: "currency-eur",
          groupMembers: ["user-2"],
        },
      },
    ];

    for (const testCase of cases) {
      const { calls, runtime } = harness();
      expect(
        await runCli(
          [...testCase.args, JSON.stringify(testCase.body)],
          runtime,
        ),
      ).toBe(0);
      expect(calls[0].url.pathname).toBe(testCase.path);
      expect(JSON.parse(String(calls[0].init?.body))).toEqual(testCase.body);
    }
  });

  it("rejects invalid create arguments before making a request", async () => {
    const cases = [
      [
        "expenses",
        "add",
        "--title",
        "Dinner",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--paid-by-id",
        "user-1",
        "--date",
        "2026-09-01",
      ],
      [
        "expenses",
        "add",
        "--title",
        "Dinner",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--paid-by-id",
        "user-1",
        "--date",
        "2026-09-01",
        "--split",
        "missing-amount=",
      ],
      [
        "payments",
        "add",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--from-user-id",
        "user-1",
        "--date",
        "2026-09-01",
      ],
      ["groups", "create", "--name", "Home"],
      ["expenses", "add", "[]"],
      ["payments", "add", "{"],
      ["groups", "create", "{}", "--name", "Home"],
    ];

    for (const args of cases) {
      const { calls, runtime, stderr } = harness();
      expect(await runCli(["--json", ...args], runtime)).toBe(2);
      expect(calls).toHaveLength(0);
      expect(JSON.parse(stderr[0]).error.type).toBe("usage");
    }
  });

  it("rejects malformed and impossible dates before making a request", async () => {
    const cases = [
      [
        "expenses",
        "add",
        "--title",
        "Dinner",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--paid-by-id",
        "user-1",
        "--date",
        "2026/09/02",
        "--group-id",
        "group-1",
      ],
      [
        "payments",
        "add",
        "--amount",
        "10",
        "--currency-id",
        "currency-eur",
        "--from-user-id",
        "user-1",
        "--to-user-id",
        "user-2",
        "--date",
        "31-02-2026",
      ],
    ];

    for (const args of cases) {
      const { calls, runtime, stderr } = harness();
      expect(await runCli(["--json", ...args], runtime)).toBe(2);
      expect(calls).toHaveLength(0);
      expect(JSON.parse(stderr[0]).error.message).toBe(
        "--date must use YYYY-MM-DD or DD-MM-YYYY",
      );
    }
  });

  it("prints command-level help", async () => {
    const { calls, runtime, stdout } = harness();

    expect(
      await runCli(["groups", "activities", "--help"], runtime),
    ).toBe(0);
    expect(stdout[0]).toContain(
      "banana groups activities <group-id> [options]",
    );
    expect(calls).toHaveLength(0);
  });
});
