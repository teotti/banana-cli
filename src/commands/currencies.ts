import {
  asArray,
  asRecord,
  matchItems,
  numeric,
  parseOptions,
  requirePositionals,
  wantsHelp,
} from "../shared";
import { helpText } from "../help";
import { note, table } from "../render";
import type { ParsedCommand, Presenter } from "../types";

const HELP = helpText({
  summary: "List the currencies an expense or payment can use.",
  usage: ["banana currencies [list] [flags]"],
  options: [
    ["--code CODE", "Only the currency with this code"],
    ["--search TEXT", "Only currencies whose code or name matches"],
  ],
  notes: [
    "Writes take a code directly — `--currency EUR` — so this is for\nbrowsing, not for looking an id up first.",
    "The API returns every currency at once; both filters narrow the list\nhere rather than on the server.",
  ],
  examples: [
    "banana currencies --code EUR",
    "banana currencies --search krona",
    "banana currencies --json",
  ],
});

export function parseCurrencies(args: string[]): ParsedCommand {
  if (args[0] === "list") args = args.slice(1);
  if (wantsHelp(args)) return { kind: "help", text: HELP };
  const { positionals, values } = parseOptions(
    args,
    { code: { type: "string" }, search: { type: "string" } },
    HELP,
  );
  requirePositionals(positionals, 0, HELP);

  const code = values.code as string | undefined;
  const search = values.search as string | undefined;
  const filter =
    code !== undefined
      ? (body: unknown) =>
          asArray(body).filter(
            (value) =>
              String(asRecord(value).code ?? "").toLowerCase() ===
              code.toLowerCase(),
          )
      : search === undefined
        ? undefined
        : matchItems(search, (currency) => [currency.code, currency.name]);

  return {
    kind: "request",
    path: "/currencies",
    presentation: "currency-list",
    ...(filter === undefined ? {} : { postFilter: filter }),
  };
}

export const currencyPresenters = {
  "currency-list": {
    clean: (body) => asArray(body),
    format(body) {
      const currencies = asArray(body);
      if (!currencies.length) return note("No currencies.");
      return table(
        [
          { label: "Code" },
          { label: "Name", max: 24 },
          { label: "Symbol" },
          { label: "Type" },
          { label: "Decimals", align: "right" },
          { label: "Rate to base", align: "right" },
        ],
        currencies.map((value) => {
          const currency = asRecord(value);
          return [
            currency.code,
            currency.name,
            currency.symbol,
            currency.type,
            currency.decimals,
            numeric(currency.exchangeRateToBase),
          ];
        }),
      );
    },
  },
} satisfies Record<"currency-list", Presenter>;
