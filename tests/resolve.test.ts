import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { ANA, GROUP, ME, harness, lookup } from "./helpers";

describe("BananaSplit CLI", () => {
  it("looks each kind of name up once, however many flags use it", async () => {
    const { calls, runtime } = harness((url, init) => {
      const answer = lookup(url, init);
      return answer ?? Response.json({ id: "expense-1" });
    });

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Dinner",
          "--amount",
          "42",
          "--currency",
          "EUR",
          "--paid-by",
          "Ana",
          "--date",
          "2026-09-01",
          "--split",
          "me=22",
          "--split",
          "Ana=20",
        ],
        runtime,
      ),
    ).toBe(0);

    const paths = calls.map(({ url }) => url.pathname);
    expect(paths.filter((path) => path === "/base/friends")).toHaveLength(1);
    expect(paths.filter((path) => path === "/base/currencies")).toHaveLength(1);
    expect(paths.filter((path) => path === "/base/current-user")).toHaveLength(1);
  });

  it("matches a name exactly before matching it as a prefix", async () => {
    const { calls, runtime } = harness((url, init) => {
      if (init?.method === undefined && url.pathname === "/base/groups") {
        return Response.json({
          items: [
            { id: "group-long", name: "Amália 26" },
            { id: "group-exact", name: "Amália" },
          ],
        });
      }
      return lookup(url, init) ?? Response.json({ id: "expense-1" });
    });

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Dinner",
          "--amount",
          "42",
          "--currency",
          "EUR",
          "--date",
          "2026-09-01",
          "--group",
          "Amália",
        ],
        runtime,
      ),
    ).toBe(0);
    const post = calls.find(({ init }) => init?.method === "POST")!;
    expect(JSON.parse(String(post.init?.body)).groupId).toBe("group-exact");
  });

  it("names a person by username or email as well as by name", async () => {
    const { calls, runtime } = harness((url, init) => {
      const answer = lookup(url, init);
      return answer ?? Response.json({ id: "payment-1" });
    });

    expect(
      await runCli(
        [
          "payments",
          "add",
          "--amount",
          "5",
          "--currency",
          "Euro",
          "--from",
          "leo@example.test",
          "--to",
          ANA.id,
          "--date",
          "2026-09-01",
        ],
        runtime,
      ),
    ).toBe(0);
    const post = calls.find(({ init }) => init?.method === "POST")!;
    expect(JSON.parse(String(post.init?.body))).toMatchObject({
      currencyId: "currency-eur",
      fromUserId: ME.id,
      toUserId: ANA.id,
    });
  });

  it("reports a group name that matches nothing, with where to look", async () => {
    const { calls, runtime, stderr } = harness((url, init) =>
      lookup(url, init) ?? Response.json({}),
    );

    expect(await runCli(["groups", "get", "Berlin"], runtime)).toBe(2);
    expect(stderr[0]).toContain('No group matches "Berlin"');
    expect(stderr[0]).toContain("banana groups --search");
    // Nothing is written when a name cannot be resolved.
    expect(calls.every(({ init }) => init?.method === undefined)).toBe(true);
  });

  it("asks the API to filter groups and friends by name", async () => {
    const { calls, runtime, stdout } = harness((url) =>
      url.pathname === "/base/groups"
        ? Response.json({
            items: [{ id: "group-1", name: "Lisbon trip", type: "travel" }],
          })
        : Response.json({ items: [{ id: "friendship-1", user: ANA }] }),
    );

    expect(await runCli(["groups", "--search", "lisbon"], runtime)).toBe(0);
    expect(calls[0].url.searchParams.get("q")).toBe("lisbon");
    expect(calls[0].url.searchParams.get("l")).toBe("5");
    expect(stdout[0]).toContain("Lisbon trip");

    expect(await runCli(["friends", "--search", "ana", "--json"], runtime)).toBe(0);
    expect(calls[1].url.searchParams.get("q")).toBe("ana");
    const { items } = JSON.parse(stdout[1]);
    expect(items[0].user).toBe("Ana");
  });

  it("asks for one name by name, and sweeps a page for several", async () => {
    const { calls, runtime } = harness((url, init) => {
      const answer = lookup(url, init);
      return answer ?? Response.json({ id: "expense-1" });
    });

    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Dinner",
          "--amount",
          "42",
          "--currency",
          "EUR",
          "--date",
          "2026-09-01",
          "--group",
          "Lisbon trip",
          "--split",
          "Ana=42",
        ],
        runtime,
      ),
    ).toBe(0);
    const searched = (path: string) =>
      calls
        .filter(({ url }) => url.pathname === path)
        .map(({ url }) => url.searchParams.get("q"));
    // One group name and one person: each is asked for by name.
    expect(searched("/base/groups")).toEqual(["Lisbon trip"]);
    expect(searched("/base/friends")).toEqual(["Ana"]);

    const { calls: sweptCalls, runtime: sweptRuntime } = harness((url, init) => {
      const answer = lookup(url, init);
      return answer ?? Response.json({ id: "expense-1" });
    });
    expect(
      await runCli(
        [
          "expenses",
          "add",
          "--title",
          "Dinner",
          "--amount",
          "42",
          "--currency",
          "EUR",
          "--date",
          "2026-09-01",
          "--split",
          "me=22",
          "--split",
          "Ana=20",
        ],
        sweptRuntime,
      ),
    ).toBe(0);
    // Two people: one page, matched here, instead of a request each.
    const friends = sweptCalls.filter(
      ({ url }) => url.pathname === "/base/friends",
    );
    expect(friends).toHaveLength(1);
    expect(friends[0].url.searchParams.get("q")).toBeNull();
    expect(friends[0].url.searchParams.get("l")).toBe("100");
  });

  it("sweeps a wide page when the API search and a username disagree", async () => {
    const { calls, runtime } = harness((url, init) => {
      // The API searches on the name, so an email finds nothing.
      if (init?.method === undefined && url.pathname === "/base/friends") {
        return Response.json({
          items: url.searchParams.has("q") ? [] : [{ id: "f-1", user: ANA }],
        });
      }
      return lookup(url, init) ?? Response.json({ id: "payment-1" });
    });

    expect(
      await runCli(
        [
          "payments",
          "add",
          "--amount",
          "5",
          "--currency",
          "EUR",
          "--from",
          ME.id,
          "--to",
          "ana@example.test",
          "--date",
          "2026-09-01",
        ],
        runtime,
      ),
    ).toBe(2);
    const friends = calls.filter(({ url }) => url.pathname === "/base/friends");
    expect(friends.map(({ url }) => url.searchParams.get("q"))).toEqual([
      "ana@example.test",
      null,
    ]);
  });
});
