import { createAuthRuntime } from "../src/auth";
import { request } from "../src/request";
import { asArray, asRecord, numeric } from "../src/shared";
import { CliFailure, type Environment, type Presentation } from "../src/types";
import type { Target } from "./config";
import type { DeleteResult, GeneratedExpense } from "./cleanup";
import type { ResourceKind } from "./journal";
import { pageItems } from "./match";
import type { BalanceSnapshot } from "./money";
import {
  CommandsCancelled,
  directRunner,
  logLine,
  retryAfterSeconds,
  runCommand,
  type CommandResult,
  type CommandRunner,
} from "./process";

function runtime(env: Environment) {
  return createAuthRuntime({ env });
}

export async function readBalances(
  run: (args: string[]) => Promise<CommandResult>,
): Promise<BalanceSnapshot> {
  const aggregate = await run(["balance", "--json"]);
  const users = await run(["balances", "--json"]);
  if (aggregate.exitCode !== 0) {
    throw new Error(aggregate.stderr || aggregate.stdout);
  }
  if (users.exitCode !== 0) throw new Error(users.stderr || users.stdout);
  const totals = asRecord(JSON.parse(aggregate.stdout));
  return {
    balance: numeric(totals.balance),
    totalOwed: numeric(totals.totalOwed),
    totalOwing: numeric(totals.totalOwing),
    users: asArray(JSON.parse(users.stdout)).flatMap((value) => {
      const entry = asRecord(value);
      return typeof entry.userId === "string"
        ? [{ userId: entry.userId, balance: numeric(entry.balance) }]
        : [];
    }),
  };
}

export function createClient(
  target: Target,
  env: Environment,
  commands: CommandRunner = directRunner,
) {
  const auth = runtime(env);

  async function api(
    method: "DELETE" | "GET",
    path: string,
    query?: URLSearchParams,
  ) {
    const shown = query ? `${path}?${query}` : path;
    for (let attempt = 0; attempt < 8; attempt++) {
      logLine(`$ ${method} ${shown}`);
      try {
        return await request(
          {
            kind: "request",
            method: method === "GET" ? undefined : method,
            path,
            presentation: "user" satisfies Presentation,
            ...(query ? { query } : {}),
          },
          auth,
          env,
        );
      } catch (error) {
        const delay =
          error instanceof CliFailure && error.status === 429
            ? retryAfterSeconds(error.body)
            : undefined;
        if (delay === undefined || attempt === 7) throw error;
        logLine(`rate limited, waiting ${delay}s`);
        await Bun.sleep(delay * 1000);
      }
    }
    throw new Error("rate limit retry ended without a result");
  }

  async function every(path: string, query: Record<string, string> = {}) {
    const items: unknown[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 30; page++) {
      const params = new URLSearchParams({ l: "100", ...query });
      if (cursor) params.set("cursor", cursor);
      const body = await api("GET", path, params);
      items.push(...pageItems(body));
      const record = asRecord(body);
      if (
        record.hasMore !== true ||
        typeof record.nextCursor !== "string" ||
        record.nextCursor.length === 0
      ) {
        return items;
      }
      cursor = record.nextCursor;
    }
    throw new Error(
      `Listing ${path} did not finish; refusing to guess which rows exist.`,
    );
  }

  async function cliDelete(args: string[]): Promise<DeleteResult> {
    const result = await runCommand(args, target, env);
    if (result.exitCode === 0) return "deleted";
    const text = `${result.stderr}\n${result.stdout}`;
    if (result.exitCode === 1 && /\b404\b|not found/i.test(text)) return "absent";
    throw new Error(text.trim());
  }

  return {
    banana(args: string[], extra: Environment = {}): Promise<CommandResult> {
      return commands.run(args, target, { ...env, ...extra });
    },

    async get(kind: ResourceKind, id: string) {
      const path =
        kind === "recurring"
          ? `/expenses/recurring/${encodeURIComponent(id)}`
          : `/${kind === "expense" ? "expenses" : kind === "group" ? "groups" : "payments"}/${encodeURIComponent(id)}`;
      try {
        return { status: 200, body: await api("GET", path) };
      } catch (error) {
        if (error instanceof CliFailure && error.status === 404) {
          return { status: 404, body: null };
        }
        throw error;
      }
    },

    async remove(kind: ResourceKind, id: string): Promise<DeleteResult> {
      if (kind === "expense") return cliDelete(["expenses", "delete", id, "--json"]);
      if (kind === "recurring") {
        return cliDelete(["recurring", "delete", id, "--json"]);
      }
      const path =
        kind === "group"
          ? `/groups/${encodeURIComponent(id)}`
          : `/payments/${encodeURIComponent(id)}`;
      try {
        await api("DELETE", path);
        return "deleted";
      } catch (error) {
        if (error instanceof CliFailure && error.status === 404) return "absent";
        throw error;
      }
    },

    listActive(kind: Exclude<ResourceKind, "payment">) {
      if (kind === "recurring") {
        return every("/expenses/recurring/", { status: "all" });
      }
      if (kind === "group") return every("/groups");
      return every("/expenses");
    },

    listGroupPayments(groupId: string) {
      return every(`/groups/${encodeURIComponent(groupId)}/activities`, {
        type: "payments",
      });
    },

    async search(kind: ResourceKind) {
      if (kind === "payment") {
        const groups = await every("/groups");
        const rows: unknown[] = [];
        for (const group of groups) {
          const groupId = asRecord(group).id;
          if (typeof groupId !== "string") continue;
          const activities = await every(
            `/groups/${encodeURIComponent(groupId)}/activities`,
            { type: "payments" },
          );
          for (const activity of activities) {
            const record = asRecord(activity);
            rows.push({ ...record, groupId: record.groupId ?? groupId });
          }
        }
        return rows;
      }
      if (kind === "recurring") return every("/expenses/recurring/", { status: "all" });
      if (kind === "group") return every("/groups");
      return every("/expenses");
    },

    async discoverGenerated(ruleIds: string[]): Promise<GeneratedExpense[]> {
      const found = new Map<string, GeneratedExpense>();
      const remember = (id: unknown, ruleId: string, row: Record<string, unknown>) => {
        if (typeof id !== "string" || !id) return;
        found.set(id, {
          id,
          ruleId,
          title: typeof row.title === "string" ? row.title : null,
          description: typeof row.description === "string" ? row.description : null,
        });
      };
      for (const ruleId of ruleIds) {
        try {
          const body = await api(
            "GET",
            `/expenses/recurring/${encodeURIComponent(ruleId)}`,
          );
          for (const value of asArray(asRecord(body).related)) {
            const row = asRecord(value);
            remember(row.id, ruleId, row);
          }
        } catch (error) {
          if (!(error instanceof CliFailure) || error.status !== 404) throw error;
        }
      }
      const expenses = await every("/expenses");
      for (const value of expenses) {
        const row = asRecord(value);
        const ruleId = row.recurringExpenseRuleId;
        if (typeof ruleId === "string" && ruleIds.includes(ruleId)) {
          remember(row.id, ruleId, row);
        }
      }
      return [...found.values()];
    },

    balances() {
      // Cleanup reads balances after scenario commands have been cancelled.
      return readBalances((args) => runCommand(args, target, env));
    },

    async deletePayment(id: string) {
      if (commands.stopped()) throw new CommandsCancelled();
      await api("DELETE", `/payments/${encodeURIComponent(id)}`);
    },
  };
}

export type LiveClient = ReturnType<typeof createClient>;
