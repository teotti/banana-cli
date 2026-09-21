import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { ANA, GROUP, ME, harness, lookup } from "./helpers";

const RULE = {
  id: "rule-1",
  title: "Rent",
  description: null,
  amount: "900.000000000000000000",
  currencyId: "currency-eur",
  paidById: ME.id,
  groupId: GROUP.id,
  frequency: "monthly",
  interval: 1,
  startDate: "2026-10-01T00:00:00.000Z",
  endDate: null,
  nextOccurrence: "2026-11-01T00:00:00.000Z",
  lastGenerated: "2026-10-01T00:00:00.000Z",
  active: true,
  splitType: "equal",
  timezone: "UTC",
  totalOccurrences: 1,
};
const SHARES = [
  { userId: ME.id, amount: "450.000000000000000000" },
  { userId: ANA.id, amount: "450.000000000000000000" },
];
const OCCURRENCE = {
  id: "expense-1",
  title: "Rent",
  amount: "900.000000000000000000",
  date: "2026-10-01T00:00:00.000Z",
  currencyId: "currency-eur",
  currency: { code: "EUR" },
  paidByUser: ME,
  shares: [
    { userId: ME.id, amount: "450.000000000000000000", user: ME },
    { userId: ANA.id, amount: "450.000000000000000000", user: ANA },
  ],
};
const DETAIL = { ...RULE, shares: SHARES, related: [OCCURRENCE] };

/** Routes the recurring endpoints, and leaves the name lookups to `lookup`. */
function api(
  handle: (url: URL, init?: RequestInit) => Response | undefined,
) {
  return (url: URL, init?: RequestInit) =>
    handle(url, init) ?? lookup(url, init) ?? Response.json({});
}

describe("banana recurring", () => {
  // The server matches `/expenses/:id` before the literal segment, so a
  // collection request without the trailing slash is served as an expense
  // lookup for the id "recurring" and answers 500.
  it("sends the collection with a trailing slash and the sub-routes without one", async () => {
    const { calls, runtime } = harness((url, init) =>
      init?.method === "POST" || init?.method === "PUT"
        ? Response.json({ id: "rule-1" })
        : Response.json([]),
    );

    expect(await runCli(["recurring", "list"], runtime)).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/expenses/recurring/");

    calls.length = 0;
    expect(await runCli(["recurring", "get", "rule-1"], runtime)).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/expenses/recurring/rule-1");
    expect(calls[0].url.pathname.endsWith("/")).toBe(false);

    calls.length = 0;
    expect(await runCli(["recurring", "delete", "rule-1"], runtime)).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/expenses/recurring/rule-1");
  });

  it("lists rules with the names their ids stand for", async () => {
    const { calls, runtime, stdout } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/"
          ? Response.json([RULE])
          : undefined,
      ),
    );

    expect(await runCli(["recurring", "list"], runtime)).toBe(0);

    expect(calls[0].url.pathname).toBe("/base/expenses/recurring/");
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      status: "all",
    });
    expect(stdout[0].split("\n")).toEqual([
      "ID      Title  Every    Next        Paid by       Amount  Active",
      "rule-1  Rent   monthly  2026-11-01  Leonardo  900.00 EUR  yes",
      "",
      "banana recurring get <rule-id> shows one rule and its splits.",
    ]);
  });

  it("passes --status through and carries both ids and names in --json", async () => {
    const { calls, runtime, stdout } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/"
          ? Response.json([RULE])
          : undefined,
      ),
    );

    expect(
      await runCli(["recurring", "list", "--status", "active", "--json"], runtime),
    ).toBe(0);

    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      status: "active",
    });
    expect(JSON.parse(stdout[0])).toEqual([
      {
        id: "rule-1",
        title: "Rent",
        description: null,
        amount: 900,
        currencyId: "currency-eur",
        currency: "EUR",
        paidById: ME.id,
        paidBy: "Leonardo",
        groupId: GROUP.id,
        group: "Lisbon trip",
        frequency: "monthly",
        interval: 1,
        startDate: "2026-10-01T00:00:00.000Z",
        endDate: null,
        nextOccurrence: "2026-11-01T00:00:00.000Z",
        lastGenerated: "2026-10-01T00:00:00.000Z",
        active: true,
        splitType: "equal",
        timezone: "UTC",
        totalOccurrences: 1,
      },
    ]);
  });

  it("rejects a --status the API does not take", async () => {
    const { calls, runtime, stderr } = harness();

    expect(await runCli(["recurring", "list", "--status", "paused"], runtime)).toBe(2);

    expect(stderr.join("\n")).toContain("--status must be one of: all, active, inactive");
    expect(calls).toEqual([]);
  });

  it("names a rule's splits from the expenses it has already created", async () => {
    const { calls, runtime, stdout } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/rule-1"
          ? Response.json(DETAIL)
          : undefined,
      ),
    );

    expect(await runCli(["recurring", "get", "rule-1"], runtime)).toBe(0);

    // An occurrence carries the currency, the payer and every split's user,
    // so naming the rule costs no lookup of its own.
    expect(calls).toHaveLength(2);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/expenses/recurring/rule-1",
      "/base/groups",
    ]);
    expect(stdout[0].split("\n")).toEqual([
      "Recurring expense",
      "",
      "Title:        Rent",
      "Amount:       900.00 EUR",
      "Every:        monthly",
      "Paid by:      Leonardo",
      "Group:        Lisbon trip",
      "Description:  —",
      "Starts:       2026-10-01",
      "Ends:         —",
      "Next:         2026-11-01",
      "Last created: 2026-10-01",
      "Active:       yes",
      "Split type:   equal",
      "ID:           rule-1",
      "",
      "Splits",
      "",
      "Name          Amount",
      "Leonardo  450.00 EUR",
      "Ana       450.00 EUR",
      "",
      "Expenses created",
      "",
      "ID         Date            Amount",
      "expense-1  2026-10-01  900.00 EUR",
    ]);
  });

  it("reads an interval back as the schedule it describes", async () => {
    const { runtime, stdout } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/"
          ? Response.json([{ ...RULE, frequency: "weekly", interval: 2 }])
          : undefined,
      ),
    );

    expect(await runCli(["recurring", "list"], runtime)).toBe(0);

    expect(stdout[0]).toContain("every 2 weeks");
  });

  it("adds a rule by name and reads the row the create does not answer with", async () => {
    const { calls, runtime, stdout } = harness(
      api((url, init) => {
        if (url.pathname === "/base/expenses/recurring/") {
          return init?.method === "POST"
            ? new Response("Created", { status: 201 })
            : Response.json([RULE]);
        }
        return url.pathname === "/base/expenses/recurring/rule-1"
          ? Response.json(DETAIL)
          : undefined;
      }),
    );

    expect(
      await runCli(
        [
          "recurring", "add", "--title", "Rent", "--amount", "900",
          "--currency", "EUR", "--frequency", "monthly",
          "--start", "01-10-2026", "--group", "Lisbon",
          "--split", "me=450", "--split", "Ana=450",
        ],
        runtime,
      ),
    ).toBe(0);

    const post = calls.find(({ init }) => init?.method === "POST")!;
    expect(post.url.pathname).toBe("/base/expenses/recurring/");
    expect(JSON.parse(String(post.init?.body))).toEqual({
      title: "Rent",
      amount: "900",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-10-01T00:00:00.000Z",
      splits: [
        { userId: ME.id, amount: "450" },
        { userId: ANA.id, amount: "450" },
      ],
      currencyId: "currency-eur",
      paidById: ME.id,
      groupId: GROUP.id,
    });
    // The created rule is found in the listing, then read back in full.
    expect(calls.map(({ url }) => url.pathname)).toContain(
      "/base/expenses/recurring/rule-1",
    );
    expect(stdout[0]).toContain("Recurring expense created");
    expect(stdout[0]).toContain("900.00 EUR");
  });

  it("takes an --interval and an --end date", async () => {
    const { calls, runtime } = harness(
      api((url, init) =>
        url.pathname === "/base/expenses/recurring/" && init?.method === "POST"
          ? new Response("Created", { status: 201 })
          : url.pathname === "/base/expenses/recurring/"
            ? Response.json([])
            : undefined,
      ),
    );

    expect(
      await runCli(
        [
          "recurring", "add", "--title", "Cleaner", "--amount", "40",
          "--currency", "EUR", "--frequency", "weekly", "--interval", "2",
          "--start", "2026-10-03", "--end", "2027-10-03", "--split", "me=40",
        ],
        runtime,
      ),
    ).toBe(0);

    const post = calls.find(({ init }) => init?.method === "POST")!;
    expect(JSON.parse(String(post.init?.body))).toMatchObject({
      frequency: "weekly",
      interval: 2,
      startDate: "2026-10-03T00:00:00.000Z",
      endDate: "2027-10-03T00:00:00.000Z",
    });
  });

  it("will not write a rule with nothing to split", async () => {
    const { calls, runtime, stderr } = harness();

    expect(
      await runCli(
        [
          "recurring", "add", "--title", "Rent", "--amount", "900",
          "--currency", "EUR", "--frequency", "monthly", "--start", "2026-10-01",
        ],
        runtime,
      ),
    ).toBe(2);

    expect(stderr.join("\n")).toContain("At least one --split is required");
    expect(calls).toEqual([]);
  });

  it("reports a missing --frequency with the command's help", async () => {
    const { runtime, stderr } = harness();

    expect(
      await runCli(
        [
          "recurring", "add", "--title", "Rent", "--amount", "900",
          "--currency", "EUR", "--start", "2026-10-01", "--split", "me=900",
        ],
        runtime,
      ),
    ).toBe(2);

    expect(stderr.join("\n")).toContain("--frequency is required");
  });

  it("names the date flag that was wrong", async () => {
    const { runtime, stderr } = harness();

    expect(
      await runCli(
        [
          "recurring", "add", "--title", "Rent", "--amount", "900",
          "--currency", "EUR", "--frequency", "monthly",
          "--start", "October", "--split", "me=900",
        ],
        runtime,
      ),
    ).toBe(2);

    expect(stderr.join("\n")).toContain("--start must use YYYY-MM-DD");
  });

  it("pauses a rule by sending the whole row back with one field changed", async () => {
    const { calls, runtime, stdout } = harness(
      api((url, init) =>
        url.pathname === "/base/expenses/recurring/rule-1"
          ? Response.json(
              init?.method === "PUT" ? { ...RULE, active: false } : DETAIL,
            )
          : undefined,
      ),
    );

    expect(await runCli(["recurring", "edit", "rule-1", "--inactive"], runtime)).toBe(0);

    const put = calls.find(({ init }) => init?.method === "PUT")!;
    expect(put.url.pathname).toBe("/base/expenses/recurring/rule-1");
    expect(JSON.parse(String(put.init?.body))).toEqual({
      title: "Rent",
      description: null,
      amount: "900.000000000000000000",
      currencyId: "currency-eur",
      paidById: ME.id,
      groupId: GROUP.id,
      frequency: "monthly",
      interval: 1,
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: null,
      timezone: "UTC",
      active: false,
      splitType: "equal",
      categoryId: null,
      splits: [
        { userId: ME.id, amount: "450.000000000000000000" },
        { userId: ANA.id, amount: "450.000000000000000000" },
      ],
    });
    expect(stdout[0]).toContain("Recurring expense updated");
  });

  it("recomputes an equal split when the amount changes", async () => {
    const { calls, runtime } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/rule-1"
          ? Response.json(DETAIL)
          : undefined,
      ),
    );

    expect(
      await runCli(["recurring", "edit", "rule-1", "--amount", "901"], runtime),
    ).toBe(0);

    const put = calls.find(({ init }) => init?.method === "PUT")!;
    expect(JSON.parse(String(put.init?.body))).toMatchObject({
      amount: "901",
      splits: [
        { userId: ME.id, amount: "450.50" },
        { userId: ANA.id, amount: "450.50" },
      ],
    });
  });

  it("refuses a new amount it cannot split on its own", async () => {
    const { calls, runtime, stderr } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/rule-1"
          ? Response.json({ ...DETAIL, splitType: "shares" })
          : undefined,
      ),
    );

    expect(
      await runCli(["recurring", "edit", "rule-1", "--amount", "901"], runtime),
    ).toBe(2);

    expect(stderr.join("\n")).toContain(
      "Changing --amount on a shares split needs matching --split values",
    );
    expect(calls.some(({ init }) => init?.method === "PUT")).toBe(false);
  });

  it("rejects flags that contradict each other", async () => {
    for (const flags of [
      ["--active", "--inactive"],
      ["--group", "Lisbon", "--no-group"],
      ["--end", "2027-01-01", "--no-end"],
    ]) {
      const { calls, runtime, stderr } = harness();

      expect(await runCli(["recurring", "edit", "rule-1", ...flags], runtime)).toBe(2);

      expect(stderr.join("\n")).toContain("cannot be used together");
      expect(calls).toEqual([]);
    }
  });

  it("asks for something to change", async () => {
    const { runtime, stderr } = harness();

    expect(await runCli(["recurring", "edit", "rule-1"], runtime)).toBe(2);

    expect(stderr.join("\n")).toContain("At least one field to change is required");
  });

  it("deletes a rule and reports the row that is gone", async () => {
    const { calls, runtime, stdout } = harness(
      api((url, init) =>
        url.pathname === "/base/expenses/recurring/rule-1" && init?.method === "DELETE"
          ? Response.json(RULE)
          : undefined,
      ),
    );

    expect(await runCli(["recurring", "delete", "rule-1"], runtime)).toBe(0);

    expect(calls[0].init?.method).toBe("DELETE");
    expect(calls[0].url.pathname).toBe("/base/expenses/recurring/rule-1");
    expect(stdout[0]).toContain("Recurring expense deleted");
    // Nothing is read back from a row that no longer exists.
    expect(
      calls.some(({ url }) => url.pathname === "/base/expenses/recurring/"),
    ).toBe(false);
  });

  it("--raw answers with the API's own response and looks up no names", async () => {
    const { calls, runtime, stdout } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/"
          ? Response.json([RULE])
          : undefined,
      ),
    );

    expect(await runCli(["recurring", "list", "--raw"], runtime)).toBe(0);

    expect(JSON.parse(stdout[0])).toEqual([RULE]);
    expect(calls).toHaveLength(1);
  });

  it("keeps the ids when a name lookup fails", async () => {
    const { runtime, stdout } = harness((url) =>
      url.pathname === "/base/expenses/recurring/"
        ? Response.json([RULE])
        : new Response("nope", { status: 500 }),
    );

    expect(await runCli(["recurring", "list", "--json"], runtime)).toBe(0);

    expect(JSON.parse(stdout[0])[0]).toMatchObject({
      currencyId: "currency-eur",
      currency: null,
      paidById: ME.id,
      paidBy: null,
      groupId: GROUP.id,
      group: null,
    });
  });

  it("answers to `expenses recurring` too, where people look for it", async () => {
    const { calls, runtime, stdout } = harness(
      api((url) =>
        url.pathname === "/base/expenses/recurring/"
          ? Response.json([RULE])
          : undefined,
      ),
    );

    expect(await runCli(["expenses", "recurring", "list", "--json"], runtime)).toBe(0);

    expect(calls[0].url.pathname).toBe("/base/expenses/recurring/");
    expect(JSON.parse(stdout[0])[0]).toMatchObject({ id: "rule-1" });

    await runCli(["expenses", "recurring", "--help"], runtime);
    expect(stdout[1]).toContain("banana recurring <command>");

    // The expenses help is where someone looking for it starts.
    await runCli(["expenses", "--help"], runtime);
    expect(stdout[2]).toContain("recurring");
  });

  it("is listed in the root help", async () => {
    const { runtime, stdout } = harness();

    await runCli(["--help"], runtime);

    expect(stdout.join("\n")).toContain("recurring list");
  });

  it("reports an unknown subcommand with its help", async () => {
    const { runtime, stderr } = harness();

    expect(await runCli(["recurring", "pause", "rule-1"], runtime)).toBe(2);

    expect(stderr.join("\n")).toContain("Unknown command: recurring pause");
  });
});
