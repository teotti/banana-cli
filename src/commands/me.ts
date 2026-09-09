import {
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
      return section(
        heading("Account"),
        fields([
          ["Name", display(user.name)],
          ["Email", display(user.email)],
          ["Username", display(user.username)],
          ["ID", display(user.id), true],
          ["Currency ID", display(user.currencyId), true],
        ]),
      );
    },
  },
} satisfies Record<"user", Presenter>;
