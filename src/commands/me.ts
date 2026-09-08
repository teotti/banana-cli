import {
  asRecord,
  display,
  parseOptions,
  requirePositionals,
  wantsHelp,
} from "../shared";
import type { ParsedCommand, Presenter } from "../types";

const HELP = `USAGE
  banana me`;

export function parseMe(args: string[]): ParsedCommand {
  if (wantsHelp(args)) return { kind: "help", text: HELP };
  const { positionals } = parseOptions(args);
  requirePositionals(positionals, 0, HELP);
  return { kind: "request", path: "/current-user", presentation: "user" };
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
      };
    },
    format(body) {
      const user = asRecord(body);
      return [
        `Name: ${display(user.name)}`,
        `Email: ${display(user.email)}`,
        `Username: ${display(user.username)}`,
        `Currency ID: ${display(user.currencyId)}`,
        `ID: ${display(user.id)}`,
      ].join("\n");
    },
  },
} satisfies Record<"user", Presenter>;
