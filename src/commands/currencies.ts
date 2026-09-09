import {
  asArray,
  asRecord,
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
  usage: ["banana currencies [list]"],
  notes: ["The id of a currency is what --currency-id takes."],
  examples: ["banana currencies", "banana currencies --json"],
});

export function parseCurrencies(args: string[]): ParsedCommand {
  if (args[0] === "list") args = args.slice(1);
  if (wantsHelp(args)) return { kind: "help", text: HELP };
  const { positionals } = parseOptions(args, {}, HELP);
  requirePositionals(positionals, 0, HELP);
  return {
    kind: "request",
    path: "/currencies",
    presentation: "currency-list",
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
          { label: "ID", id: true },
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
            currency.id,
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
