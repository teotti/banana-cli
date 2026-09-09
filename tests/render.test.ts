import { describe, expect, it } from "bun:test";
import { fields, heading, note, section, table } from "../src/render";

describe("table", () => {
  const columns = [
    { label: "ID", id: true },
    { label: "Name", max: 8 },
    { label: "Amount", align: "right" as const },
  ];

  it("pads every column to its widest value, headings included", () => {
    expect(
      table(
        columns,
        [
          ["expense-1", "Dinner", "42.00 EUR"],
          ["e-2", "Taxi", "8.10 EUR"],
        ],
        false,
      ).split("\n"),
    ).toEqual([
      "ID         Name       Amount",
      "expense-1  Dinner  42.00 EUR",
      "e-2        Taxi     8.10 EUR",
    ]);
  });

  it("truncates a value past the column's maximum and renders gaps as —", () => {
    expect(table(columns, [["e-1", "Dinner at the port", null]], false)).toContain(
      "e-1  Dinner …       —",
    );
  });

  it("paints the headings and the id column when colour is on", () => {
    const rendered = table(columns, [["e-1", "Taxi", "8.10 EUR"]], true);

    expect(rendered).toContain("\x1b[1m\x1b[38;2;45;111;196mID ");
    expect(rendered).toContain("\x1b[38;2;45;111;196me-1\x1b[0m");
    expect(rendered).not.toContain("\x1b[38;2;45;111;196mTaxi");
  });
});

describe("fields", () => {
  it("lines the values up in one column and paints the ids", () => {
    expect(
      fields([["Name", "Ana"], ["Last activity", "2026-09-01"]], false).split("\n"),
    ).toEqual(["Name:          Ana", "Last activity: 2026-09-01"]);
    expect(fields([["ID", "user-1", true]], true)).toBe(
      "\x1b[2mID:\x1b[0m \x1b[38;2;45;111;196muser-1\x1b[0m",
    );
  });
});

describe("section", () => {
  it("joins the blocks it is given, skipping the empty ones", () => {
    expect(section(heading("Expense", false), undefined, note("None.", false))).toBe(
      "Expense\n\nNone.",
    );
  });
});
