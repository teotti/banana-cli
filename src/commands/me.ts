import {
  asArray,
  asRecord,
  display,
  parseOptions,
  requirePositionals,
  wantsHelp,
} from "../shared";
import { helpText } from "../help";
import { fields, heading, section } from "../render";
import type { ParsedCommand, Presenter } from "../types";

const HELP = helpText({
  summary: "Show the signed-in BananaSplit user.",
  usage: ["banana me [--json | --raw]"],
  examples: ["banana me", "banana me --json"],
});

export function parseMe(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: HELP };
  const { positionals } = parseOptions(args, {}, HELP);
  requirePositionals(positionals, 0, HELP);
  return { kind: "request", path: "/current-user", presentation: "user" };
}

type Lookup = (path: string) => Promise<unknown>;

/**
 * `/current-user` points at the default currency by id only, so its code and
 * symbol come from `/currencies` — the whole list, since that route takes no
 * filter. A lookup that fails costs the code, not the command.
 */
export async function nameUserCurrency(body: unknown, get: Lookup) {
  const user = asRecord(body);
  if (typeof user.currencyId !== "string" || !user.currencyId) return body;
  try {
    const currency = asArray(await get("/currencies"))
      .map(asRecord)
      .find((value) => value.id === user.currencyId);
    return currency ? { ...user, currency } : body;
  } catch {
    return body;
  }
}

export const mePresenters = {
  user: {
    clean(body) {
      const user = asRecord(body);
      return {
        id: user.id ?? null,
        name: user.name ?? null,
        email: user.email ?? null,
        username: user.username ?? null,
        isGuest: user.isGuest === true,
        currencyId: user.currencyId ?? null,
        currency: asRecord(user.currency).code ?? null,
        currencySymbol: asRecord(user.currency).symbol ?? null,
      };
    },
    format(body) {
      const user = asRecord(body);
      return section(
        heading("Account"),
        fields([
          ["Name", display(user.name)],
          ["Email", display(user.email)],
          ["Username", display(user.username)],
          ["ID", display(user.id), true],
          ["Default currency", defaultCurrency(user)],
        ]),
      );
    },
  },
} satisfies Record<"user", Presenter>;

/** `EUR (€)`, the bare code when the symbol adds nothing, or the id unnamed. */
function defaultCurrency(user: Record<string, unknown>) {
  const { currency, currencySymbol } = user;
  if (typeof currency !== "string") return display(user.currencyId);
  return typeof currencySymbol === "string" && currencySymbol && currencySymbol !== currency
    ? `${currency} (${currencySymbol})`
    : currency;
}
