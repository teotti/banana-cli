import { describe, expect, it } from "bun:test";
import { renderCollectionBrowser, runCli } from "../src/index";
import { harness } from "./helpers";

describe("BananaSplit CLI", () => {
  it("lists friends with pagination options and curated output", async () => {
    const { calls, runtime, stdout } = harness(
      Response.json({
        items: [
          {
            id: "friendship-1",
            user: {
              id: "user-2",
              name: "Ana",
              isGuest: false,
              isGold: true,
            },
            currency: { code: "EUR" },
            balance: "12.5",
            mostRecentActivity: "2026-09-01T10:00:00.000Z",
          },
        ],
        hasMore: true,
        nextCursor: "cursor-2",
      }),
    );

    expect(
      await runCli(
        [
          "friends",
          "list",
          "--limit",
          "10",
          "--cursor",
          "next page",
          "--sort",
          "lastActivity",
          "--filter",
          "guests",
          "--json",
        ],
        runtime,
      ),
    ).toBe(0);
    expect(calls[0].url.pathname).toBe("/base/friends");
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      l: "10",
      cursor: "next page",
      sort: "lastActivity",
      filter: "guests",
    });
    expect(JSON.parse(stdout[0])).toEqual({
      items: [
        {
          id: "friendship-1",
          userId: "user-2",
          user: "Ana",
          balance: 12.5,
          currency: "EUR",
          isGuest: false,
          isGold: true,
          mostRecentActivity: "2026-09-01T10:00:00.000Z",
        },
      ],
      hasMore: true,
      nextCursor: "cursor-2",
    });

    expect(await runCli(["friends", "list", "--json"], runtime)).toBe(0);
    expect(calls[1].url.searchParams.get("l")).toBe("5");
  });

  it("browses all friends and loads friend details", async () => {
    let rendered = "";
    let detail = "";
    const { calls, runtime, stdout } = harness((url) =>
      url.pathname.endsWith("/friendship%2Fone")
        ? Response.json({
            id: "friendship/one",
            status: "accepted",
            acceptedAt: "2026-08-01T10:00:00.000Z",
            user: {
              id: "user-2",
              name: "Ana",
              isGuest: false,
              isGold: true,
            },
          })
        : Response.json({
            items: [
              {
                id: "friendship/one",
                user: {
                  id: "user-2",
                  name: "Ana",
                  isGuest: false,
                  isGold: true,
                },
                currency: { code: "EUR" },
                balance: 7,
                mostRecentActivity: "2026-09-01T10:00:00.000Z",
              },
            ],
            hasMore: true,
            nextCursor: "cursor-2",
          }),
    );
    runtime.browser = async (presentation, body, loadDetail) => {
      expect(presentation).toBe("friend-list");
      rendered = renderCollectionBrowser(presentation, body, "ana");
      detail = await loadDetail((body as any).items[0]);
      return true;
    };

    expect(await runCli(["friends", "list"], runtime)).toBe(0);
    expect(calls.map(({ url }) => url.pathname)).toEqual([
      "/base/friends",
      "/base/friends/friendship%2Fone",
    ]);
    expect(calls[0].url.searchParams.has("l")).toBe(false);
    expect(rendered).toContain("friends");
    expect(rendered).toContain("Ana");
    expect(rendered).toContain("More friends are available");
    expect(detail).toContain("Balance:       7.00 EUR");
    expect(detail).toContain("Status:        accepted");
    expect(detail).toContain("Friendship ID: friendship/one");
    expect(stdout).toEqual([]);
  });

});
