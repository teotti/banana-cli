import {
  asArray,
  asRecord,
  display,
  formatCard,
  parseOptions,
  requirePositionals,
  wantsHelp,
} from "../shared";
import type { ParsedCommand, Presenter } from "../types";

const HELP = "Usage: banana currencies [list]";

export function parseCurrencies(args: string[]): ParsedCommand {
  if (args[0] === "list") args = args.slice(1);
  if (wantsHelp(args)) return { kind: "help", text: HELP };
  const { positionals } = parseOptions(args);
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
      if (!currencies.length) return "No currencies.";
      return [
        "Currencies",
        ...currencies.map((value, index) => {
          const currency = asRecord(value);
          return formatCard(index, currency.name, [
            `ID: ${display(currency.id)}`,
            `Code: ${display(currency.code)}`,
            `Symbol: ${display(currency.symbol)}`,
            `Type: ${display(currency.type)}`,
            `Decimals: ${display(currency.decimals)}`,
            `Rate to base: ${display(currency.exchangeRateToBase)}`,
            `Updated: ${display(currency.updatedAt)}`,
          ]);
        }),
      ].join("\n\n");
    },
  },
} satisfies Record<"currency-list", Presenter>;
