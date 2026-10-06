/** Every command, alias, and documented flag the suite has to account for. */
export type Disposition = "auto" | "manual";

export type CoverageItem = {
  id: string;
  kind: "command" | "alias" | "flag";
  disposition: Disposition;
};

export type HelpPage = { id: string; args: string[] };

export const HELP_PAGES: HelpPage[] = [
  { id: "root", args: ["--help"] },
  { id: "balance", args: ["balance", "--help"] },
  { id: "expenses", args: ["expenses", "--help"] },
  { id: "expenses.list", args: ["expenses", "list", "--help"] },
  { id: "expenses.add", args: ["expenses", "add", "--help"] },
  { id: "expenses.get", args: ["expenses", "get", "--help"] },
  { id: "expenses.edit", args: ["expenses", "edit", "--help"] },
  { id: "expenses.delete", args: ["expenses", "delete", "--help"] },
  { id: "expenses.restore", args: ["expenses", "restore", "--help"] },
  { id: "expenses.recurring", args: ["expenses", "recurring", "--help"] },
  { id: "recurring", args: ["recurring", "--help"] },
  { id: "recurring.list", args: ["recurring", "list", "--help"] },
  { id: "recurring.add", args: ["recurring", "add", "--help"] },
  { id: "recurring.get", args: ["recurring", "get", "--help"] },
  { id: "recurring.edit", args: ["recurring", "edit", "--help"] },
  { id: "recurring.delete", args: ["recurring", "delete", "--help"] },
  { id: "payments", args: ["payments", "--help"] },
  { id: "payments.add", args: ["payments", "add", "--help"] },
  { id: "payments.get", args: ["payments", "get", "--help"] },
  { id: "payments.restore", args: ["payments", "restore", "--help"] },
  { id: "groups", args: ["groups", "--help"] },
  { id: "groups.list", args: ["groups", "list", "--help"] },
  { id: "groups.create", args: ["groups", "create", "--help"] },
  { id: "groups.get", args: ["groups", "get", "--help"] },
  { id: "groups.members", args: ["groups", "members", "--help"] },
  { id: "groups.activities", args: ["groups", "activities", "--help"] },
  { id: "friends", args: ["friends", "--help"] },
  { id: "friends.list", args: ["friends", "list", "--help"] },
  { id: "currencies", args: ["currencies", "--help"] },
  { id: "me", args: ["me", "--help"] },
  { id: "login", args: ["login", "--help"] },
  { id: "logout", args: ["logout", "--help"] },
  { id: "doctor", args: ["doctor", "--help"] },
  { id: "version", args: ["version", "--help"] },
  { id: "upgrade", args: ["upgrade", "--help"] },
  { id: "update", args: ["update", "--help"] },
  { id: "skill", args: ["skill", "--help"] },
  { id: "skill.install", args: ["skill", "install", "--help"] },
  { id: "skill.uninstall", args: ["skill", "uninstall", "--help"] },
  { id: "uninstall", args: ["uninstall", "--help"] },
];

function item(
  id: string,
  kind: CoverageItem["kind"],
  disposition: Disposition = "auto",
): CoverageItem {
  return { id, kind, disposition };
}

function flags(page: string, names: string[], disposition: Disposition = "auto") {
  return names.map((name) => item(`${page} ${name}`, "flag", disposition));
}

export const COVERAGE: CoverageItem[] = [
  item("command:balance", "command"),
  item("command:balance users", "command"),
  item("alias:balances", "alias"),
  item("command:expenses list", "command"),
  item("command:expenses add", "command"),
  item("command:expenses get", "command"),
  item("command:expenses edit", "command"),
  item("command:expenses delete", "command"),
  item("command:expenses restore", "command"),
  item("alias:expenses recurring", "alias"),
  item("command:recurring list", "command"),
  item("command:recurring add", "command"),
  item("command:recurring get", "command"),
  item("command:recurring edit", "command"),
  item("command:recurring delete", "command"),
  item("command:payments add", "command"),
  item("command:payments get", "command"),
  item("command:payments restore", "command"),
  item("command:groups", "command"),
  item("command:groups list", "command"),
  item("command:groups create", "command"),
  item("command:groups get", "command"),
  item("command:groups members", "command"),
  item("command:groups activities", "command"),
  item("command:friends", "command"),
  item("command:friends list", "command"),
  item("command:currencies", "command"),
  item("command:currencies list", "command"),
  item("command:me", "command"),
  item("command:doctor", "command"),
  item("command:version", "command"),
  item("alias:-v", "alias"),
  item("command:skill install", "command"),
  item("command:skill uninstall", "command"),
  item("command:login", "command", "manual"),
  item("command:logout", "command", "manual"),
  item("command:upgrade", "command", "manual"),
  item("alias:update", "alias", "manual"),
  item("command:uninstall", "command", "manual"),
  ...flags("root", ["--json", "--raw"]),
  item("root -v", "alias"),
  ...flags("expenses.list", [
    "--sort",
    "--direction",
    "--limit",
    "--cursor",
    "--recurring",
    "--no-recurring",
  ]),
  ...flags("expenses.add", [
    "--title",
    "--amount",
    "--currency",
    "--date",
    "--paid-by",
    "--group",
    "--description",
    "--notify-me",
    "--split-type",
    "--split",
  ]),
  ...flags("expenses.edit", [
    "--title",
    "--amount",
    "--currency",
    "--paid-by",
    "--date",
    "--description",
    "--group",
    "--no-group",
    "--split-type",
    "--split",
  ]),
  ...flags("recurring.list", ["--status", "--limit", "--cursor"]),
  ...flags("recurring.add", [
    "--title",
    "--amount",
    "--currency",
    "--frequency",
    "--start",
    "--split",
    "--interval",
    "--end",
    "--paid-by",
    "--group",
    "--description",
    "--split-type",
  ]),
  ...flags("recurring.edit", [
    "--title",
    "--amount",
    "--currency",
    "--frequency",
    "--interval",
    "--start",
    "--end",
    "--paid-by",
    "--group",
    "--no-group",
    "--description",
    "--split-type",
    "--split",
    "--active",
    "--inactive",
  ]),
  item("recurring.edit --no-end", "flag", "manual"),
  ...flags("payments.add", [
    "--amount",
    "--currency",
    "--from",
    "--to",
    "--date",
    "--group",
    "--description",
  ]),
  ...flags("groups.list", ["--search", "--limit", "--cursor", "--archived", "--sort"]),
  ...flags("groups.create", ["--name", "--currency", "--description", "--type", "--member"]),
  ...flags("groups.activities", [
    "--search",
    "--limit",
    "--cursor",
    "--type",
    "--sort",
    "--direction",
  ]),
  ...flags("friends.list", ["--search", "--limit", "--cursor", "--sort", "--filter"]),
  ...flags("currencies", ["--code", "--search"]),
  ...flags("skill.install", ["--agent", "--all", "--dir", "--force", "--list", "--print"]),
  ...flags("skill.uninstall", ["--agent", "--all", "--dir", "--force", "--list"]),
  ...flags("uninstall", ["--yes"], "manual"),
];

export function coverageById() {
  return new Map(COVERAGE.map((entry) => [entry.id, entry]));
}

/**
 * Flags named in OPTIONS or OUTPUT. Example lines also start with a flag when
 * a command is wrapped, and those are not a second copy of the option.
 */
export function flagsInHelp(pageId: string, help: string) {
  const found = new Set<string>();
  let capturing = false;
  for (const line of help.split("\n")) {
    if (line === "OPTIONS" || line === "OUTPUT") {
      capturing = true;
      continue;
    }
    if (capturing && /^[A-Z][A-Z ]+$/.test(line)) {
      capturing = false;
      continue;
    }
    if (!capturing) continue;
    const match = /^\s+(--[a-z0-9][a-z0-9-]*|-[a-z])(?:\s|$)/i.exec(line);
    if (!match?.[1]) continue;
    found.add(`${pageId} ${match[1]}`);
  }
  return [...found];
}

export const SMOKE_ARGV: string[][] = [
  ["me", "--json"],
  ["balance", "--json"],
  ["balances", "--json"],
  ["currencies", "--code", "EUR", "--json"],
  ["friends", "--limit", "5", "--json"],
  ["groups", "--limit", "5", "--json"],
  ["expenses", "list", "--limit", "5", "--json"],
  ["recurring", "list", "--limit", "5", "--status", "all", "--json"],
  ["version"],
  ["doctor", "--json"],
];

const SMOKE_WRITE =
  /^(?:add|create|edit|delete|restore|login|logout|uninstall|upgrade|update)$/;

export function smokeIsReadOnly(commands = SMOKE_ARGV) {
  return commands.every((args) => !args.some((arg) => SMOKE_WRITE.test(arg)));
}
