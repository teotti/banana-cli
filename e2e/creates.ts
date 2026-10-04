import { asRecord, numeric } from "../src/shared";
import { asObject, expectExit, expectJson, readId } from "./assert";
import type { StagingConfig } from "./config";
import { readBalances, type LiveClient } from "./client";
import { commit, intend, type Journal, type JournalEntry, type ResourceKind } from "./journal";
import { matchesFingerprint } from "./match";
import { close, type BalanceSnapshot } from "./money";
import { logLine, rateLimitDelay, type CommandResult } from "./process";
import type { Environment } from "../src/types";

/**
 * The server has finished with this create, or the CLI never sent it. A
 * timeout, a dropped connection, a 5xx gateway or server error, or a signal
 * means the commit may still land.
 */
export function commandSettled(result: CommandResult) {
  if (result.exitCode === 0) {
    try {
      const body: unknown = JSON.parse(result.stdout);
      return body !== null && typeof body === "object";
    } catch {
      return false;
    }
  }
  let error: { type?: unknown; status?: unknown } | undefined;
  try {
    const parsed: unknown = JSON.parse(result.stderr);
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      const record = (parsed as { error?: unknown }).error;
      if (record && typeof record === "object") {
        error = record as { type?: unknown; status?: unknown };
      }
    }
  } catch {
    error = undefined;
  }
  if (result.exitCode === 2) return error?.type === "usage";
  if (result.exitCode !== 1 || typeof error?.type !== "string") return false;
  if (error.type === "network" || error.type === "cancelled") return false;
  if (error.type === "usage" || error.type === "config") return true;
  // A 429 can arrive after the row was saved, so it stays uncertain. Any other
  // 4xx means the origin finished and refused the create. A 5xx can be a
  // gateway that answered while the upstream server is still committing.
  if (error.type === "api" && error.status === 429) return false;
  return (
    error.type === "api" &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  );
}

export type World = {
  meName?: string;
  currencyId?: string;
  currencyName?: string;
  groupId?: string;
  groupName?: string;
  groupIds?: string[];
  expenseTitle?: string;
  expenseId?: string;
  expenseIds?: string[];
  groupExpenseIds?: string[];
  paymentIds?: string[];
  oneOffId?: string;
  recurringExpenseId?: string;
};

export type ScenarioContext = {
  marker: string;
  config: StagingConfig;
  world: World;
  banana: (args: string[], extra?: Environment) => Promise<CommandResult>;
  balances: () => Promise<BalanceSnapshot>;
  noteCreated: () => Promise<void>;
  createGroup: (input: {
    label: string;
    type?: string;
    member?: boolean;
    description?: string;
    json?: Record<string, unknown>;
    /** Full name. It must contain the run marker and is used instead of the label. */
    name?: string;
  }) => Promise<{ id: string; name: string }>;
  createExpense: (input: {
    label: string;
    amount: string;
    splits?: Array<[string, string]>;
    group?: boolean;
    date?: string;
    description?: string;
    splitType?: string;
    paidBy?: string;
    notify?: boolean;
    json?: Record<string, unknown>;
  }) => Promise<{ id: string; body: Record<string, unknown> }>;
  createPayment: (input: {
    label: string;
    amount: string;
    from: string;
    to: string;
    json?: Record<string, unknown>;
  }) => Promise<{ id: string; body: Record<string, unknown> }>;
  createRule: (input: {
    label: string;
    amount: string;
    start: string;
    frequency?: string;
    interval?: string;
    end?: string;
    group?: boolean;
    splitType?: string;
    json?: Record<string, unknown>;
  }) => Promise<{ id: string; body: Record<string, unknown> }>;
  /** Deletes a payment through the API without dropping it from the journal. */
  hidePayment: (id: string) => Promise<void>;
};

export function bindCreates(input: {
  client: LiveClient;
  journal: Journal;
  config: StagingConfig;
  world: World;
  save: () => Promise<void>;
  noteCreated: () => Promise<void>;
}): ScenarioContext {
  const { client, journal, config, world, save, noteCreated } = input;
  world.groupIds ??= [];
  world.expenseIds ??= [];
  world.groupExpenseIds ??= [];
  world.paymentIds ??= [];

  async function tracked(options: {
    kind: ResourceKind;
    args: string[];
    title?: string;
    description?: string;
    amount?: number;
    groupId?: string | null;
    confirm: (body: Record<string, unknown>) => boolean;
  }) {
    const entry = intend(journal, {
      kind: options.kind,
      fingerprint: {
        ...(options.title === undefined ? {} : { title: options.title }),
        ...(options.description === undefined
          ? {}
          : { description: options.description }),
        ...(options.amount === undefined ? {} : { amount: options.amount }),
        ...(options.groupId === undefined ? {} : { groupId: options.groupId }),
      },
      ...(options.groupId === undefined ? {} : { groupId: options.groupId }),
    });
    await save();
    const result = await sendCreate(client, journal.marker, entry, options);
    if (commandSettled(result)) {
      entry.responseSeen = true;
      await save();
    }
    if (result.exitCode !== 0) {
      throw new Error(
        `${options.kind} create failed\n${result.stderr}\n${result.stdout}`,
      );
    }
    const body = asObject(expectJson(result));
    const id = readId(body);
    if (!id) throw new Error(`${options.kind} create did not return an id`);
    const confirmed = await client.banana(confirmArgs(options.kind, id));
    expectExit(confirmed, 0);
    const readBack = asObject(expectJson(confirmed));
    if (!options.confirm(readBack)) {
      throw new Error(
        `${options.kind} ${id} did not match the journaled fingerprint`,
      );
    }
    commit(entry, id);
    await save();
    await noteCreated();
    return { id, body: readBack };
  }

  return {
    marker: journal.marker,
    config,
    world,
    banana: (args, extra) => client.banana(args, extra),
    balances: () => readBalances((args) => client.banana(args)),
    noteCreated,
    hidePayment: (id) => client.deletePayment(id),

    async createGroup({ label, type, member, description, json, name: explicit }) {
      const name = explicit ?? `${journal.marker} ${label}`;
      if (!name.includes(journal.marker)) {
        throw new Error("A group name must contain the run marker.");
      }
      const described = description ?? journal.marker;
      const created = await tracked({
        kind: "group",
        title: name,
        args: json
          ? [
              "groups",
              "create",
              JSON.stringify({ ...json, name, description: described }),
            ]
          : [
              "groups",
              "create",
              "--name",
              name,
              "--currency",
              config.currency,
              "--description",
              described,
              ...(type ? ["--type", type] : []),
              ...(member ? ["--member", config.partnerName] : []),
            ],
        confirm: (body) => body.name === name,
      });
      world.groupIds?.push(created.id);
      return { id: created.id, name };
    },

    async createExpense(expense) {
      const title = `${journal.marker} ${expense.label}`;
      const description = expense.description ?? journal.marker;
      if (expense.group && !world.groupName) {
        throw new Error("Create a group before a group expense.");
      }
      const groupId = expense.group ? (world.groupId ?? null) : null;
      const splits = expense.splits ?? [];
      const created = expense.json
        ? await tracked({
            kind: "expense",
            title,
            amount: numeric(expense.amount) ?? undefined,
            groupId,
            args: [
              "expenses",
              "add",
              JSON.stringify({ ...expense.json, title, description }),
            ],
            confirm: (body) => body.title === title,
          })
        : await tracked({
        kind: "expense",
        title,
        amount: numeric(expense.amount) ?? undefined,
        groupId,
        args: [
          "expenses",
          "add",
          "--title",
          title,
          "--amount",
          expense.amount,
          "--currency",
          config.currency,
          "--date",
          expense.date ?? "2020-01-15",
          "--description",
          description,
          ...(expense.paidBy ? ["--paid-by", expense.paidBy] : []),
          ...(expense.group && world.groupName
            ? ["--group", world.groupName]
            : []),
          ...(expense.splitType ? ["--split-type", expense.splitType] : []),
          ...(expense.notify ? ["--notify-me"] : []),
          ...splits.flatMap(([who, amount]) => ["--split", `${who}=${amount}`]),
        ],
        confirm: (body) =>
          body.title === title && close(body.amount, expense.amount),
      });
      world.expenseIds?.push(created.id);
      if (expense.group) world.groupExpenseIds?.push(created.id);
      return created;
    },

    async createPayment(payment) {
      if (!world.groupName || !world.groupId) {
        throw new Error("Create a group before a payment.");
      }
      const description = `${journal.marker} ${payment.label}`;
      const groupId = world.groupId;
      const created = payment.json
        ? await tracked({
            kind: "payment",
            description,
            amount: numeric(payment.amount) ?? undefined,
            groupId,
            args: [
              "payments",
              "add",
              JSON.stringify({ ...payment.json, description }),
            ],
            confirm: (body) => body.description === description,
          })
        : await tracked({
            kind: "payment",
            description,
            amount: numeric(payment.amount) ?? undefined,
            groupId,
            args: [
              "payments",
              "add",
              "--amount",
              payment.amount,
              "--currency",
              config.currency,
              "--from",
              payment.from,
              "--to",
              payment.to,
              "--date",
              "2020-01-15",
              "--description",
              description,
              ...(world.groupName ? ["--group", world.groupName] : []),
            ],
            confirm: (body) =>
              body.description === description &&
              close(body.amount, payment.amount),
          });
      world.paymentIds?.push(created.id);
      return created;
    },

    async createRule(rule) {
      const title = `${journal.marker} ${rule.label}`;
      const description = journal.marker;
      const groupId = rule.group === false ? null : (world.groupId ?? null);
      if (rule.json) {
        return tracked({
          kind: "recurring",
          title,
          amount: numeric(rule.amount) ?? undefined,
          groupId,
          args: [
            "recurring",
            "add",
            JSON.stringify({ ...rule.json, title, description }),
          ],
          confirm: (body) => body.title === title,
        });
      }
      const half = (Number(rule.amount) / 2).toFixed(2);
      return tracked({
        kind: "recurring",
        title,
        amount: numeric(rule.amount) ?? undefined,
        groupId,
        args: [
          "recurring",
          "add",
          "--title",
          title,
          "--amount",
          rule.amount,
          "--currency",
          config.currency,
          "--frequency",
          rule.frequency ?? "monthly",
          "--start",
          rule.start,
          "--description",
          description,
          "--paid-by",
          "me",
          "--split",
          `me=${half}`,
          "--split",
          `${config.partnerName}=${half}`,
          ...(rule.interval ? ["--interval", rule.interval] : []),
          ...(rule.end ? ["--end", rule.end] : []),
          ...(rule.splitType ? ["--split-type", rule.splitType] : []),
          ...(rule.group === false || !world.groupName
            ? []
            : ["--group", world.groupName]),
        ],
        confirm: (body) => body.title === title && close(body.amount, rule.amount),
      });
    },
  };
}

async function landedId(
  client: LiveClient,
  marker: string,
  entry: JournalEntry,
  groupId: string | null | undefined,
) {
  const rows =
    entry.kind === "payment" && groupId
      ? await client.listGroupPayments(groupId)
      : await client.search(entry.kind);
  const found = rows.filter((row) => matchesFingerprint(marker, entry.fingerprint, row));
  if (found.length > 1) {
    throw new Error(
      `${entry.kind} create matched ${found.length} rows after a rate limit`,
    );
  }
  const id = found.length === 1 ? asRecord(found[0]).id : undefined;
  return typeof id === "string" && id ? id : undefined;
}

/**
 * A 429 on a create may mean the row was saved and the response was refused.
 * Look for that row, and send the create again only when it is absent.
 */
async function sendCreate(
  client: LiveClient,
  marker: string,
  entry: JournalEntry,
  options: { args: string[]; groupId?: string | null },
) {
  let result = await client.banana([...options.args, "--json"]);
  for (let attempt = 0; attempt < 8; attempt++) {
    const delay = rateLimitDelay(result);
    if (delay === undefined) return result;
    logLine(`rate limited, waiting ${delay}s`);
    await Bun.sleep(delay * 1000);
    const id = await landedId(client, marker, entry, options.groupId);
    if (id) return client.banana(confirmArgs(entry.kind, id));
    result = await client.banana([...options.args, "--json"]);
  }
  return result;
}

function confirmArgs(kind: ResourceKind, id: string) {
  if (kind === "group") return ["groups", "get", id, "--json"];
  if (kind === "payment") return ["payments", "get", id, "--json"];
  if (kind === "recurring") return ["recurring", "get", id, "--json"];
  return ["expenses", "get", id, "--json"];
}
