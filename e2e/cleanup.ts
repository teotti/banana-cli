import { asRecord } from "../src/shared";
import { CliFailure } from "../src/types";
import type { Journal, JournalEntry, ResourceKind } from "./journal";
import {
  deletionOrder,
  idsIn,
  isInactive,
  markedRows,
  matchesFingerprint,
  ownsRow,
  reconcileEntry,
} from "./match";
import { balancesMatch, type BalanceSnapshot } from "./money";

export type DeleteResult = "deleted" | "absent";

export type GeneratedExpense = {
  id: string;
  ruleId: string;
  title: string | null;
  description: string | null;
};

export type CleanupClient = {
  get(kind: ResourceKind, id: string): Promise<{ status: number; body: unknown }>;
  remove(kind: ResourceKind, id: string): Promise<DeleteResult>;
  listActive(kind: Exclude<ResourceKind, "payment">): Promise<unknown[]>;
  listGroupPayments(groupId: string): Promise<unknown[]>;
  /** Rows that might be the lost create, scanned for this account only. */
  search(kind: ResourceKind): Promise<unknown[]>;
  discoverGenerated(ruleIds: string[]): Promise<GeneratedExpense[]>;
  balances(): Promise<BalanceSnapshot>;
};

export type Remaining = { kind: ResourceKind; id: string; reason: string };

export type CleanupReport = {
  ok: boolean;
  remaining: Remaining[];
  balancesRestored: boolean;
  deleted: string[];
};

export type CleanupOptions = {
  /** Searches for a create whose process never answered. Default 4. */
  reconcileAttempts?: number;
  reconcileDelayMs?: number;
  wait?: (ms: number) => Promise<void>;
};

function ruleIdsOf(journal: Journal) {
  return new Set(
    journal.entries
      .filter((entry) => entry.kind === "recurring" && entry.id)
      .map((entry) => entry.id as string),
  );
}

function groupIdsOf(journal: Journal) {
  const ids = new Set<string>();
  for (const entry of journal.entries) {
    if (entry.kind === "group" && entry.id) ids.add(entry.id);
    if (entry.groupId) ids.add(entry.groupId);
  }
  return [...ids];
}

async function adoptGenerated(
  journal: Journal,
  found: GeneratedExpense[],
  save: () => Promise<void>,
) {
  let changed = false;
  for (const expense of found) {
    if (journal.entries.some((entry) => entry.id === expense.id)) continue;
    journal.entries.push({
      localId: expense.id,
      id: expense.id,
      kind: "expense",
      status: "active",
      source: "generated",
      fingerprint: {
        ...(expense.title ? { title: expense.title } : {}),
        ...(expense.description ? { description: expense.description } : {}),
      },
      groupId: null,
      ruleId: expense.ruleId,
      createdAt: new Date().toISOString(),
    });
    changed = true;
  }
  if (changed) await save();
}

function uncertainCreates(journal: Journal) {
  return journal.entries.filter(
    (entry) => entry.status === "pending" && entry.responseSeen !== true,
  );
}

async function settleUncertainCreates(
  journal: Journal,
  client: CleanupClient,
  save: () => Promise<void>,
  options: CleanupOptions,
) {
  const attempts = options.reconcileAttempts ?? 4;
  const delayMs = options.reconcileDelayMs ?? 200;
  const wait = options.wait ?? ((ms: number) => Bun.sleep(ms));
  for (let attempt = 0; attempt < attempts; attempt++) {
    await reconcileAll(journal, client, save);
    if (uncertainCreates(journal).length === 0) break;
    if (attempt < attempts - 1) await wait(delayMs);
  }
}

function noteUncertain(journal: Journal, remaining: Remaining[]) {
  for (const entry of uncertainCreates(journal)) {
    remaining.push({
      kind: entry.kind,
      id: entry.localId,
      reason: "create was not confirmed; it may still land",
    });
  }
}

async function reconcileAll(
  journal: Journal,
  client: CleanupClient,
  save: () => Promise<void>,
) {
  const pending = journal.entries.some((entry) => entry.status === "pending");
  if (!pending) return;
  const rows = new Map<ResourceKind, unknown[]>();
  for (const kind of ["recurring", "payment", "expense", "group"] as const) {
    if (journal.entries.some((entry) => entry.kind === kind && entry.status === "pending")) {
      rows.set(kind, await client.search(kind));
    }
  }
  for (const entry of journal.entries) {
    if (entry.status !== "pending") continue;
    reconcileEntry(journal.marker, entry, rows.get(entry.kind) ?? []);
  }
  await save();
}

async function deleteEntry(
  journal: Journal,
  entry: JournalEntry,
  client: CleanupClient,
  remaining: Remaining[],
  deleted: string[],
  save: () => Promise<void>,
) {
  if (!entry.id) return;
  const loaded = await client.get(entry.kind, entry.id);
  if (loaded.status === 404 || isInactive(loaded.body)) {
    entry.status = "deleted";
    await save();
    return;
  }
  const rules = ruleIdsOf(journal);
  if (!ownsRow(journal.marker, entry, loaded.body, rules)) {
    remaining.push({
      kind: entry.kind,
      id: entry.id,
      reason: "row does not carry this run's marker",
    });
    return;
  }
  const result = await client.remove(entry.kind, entry.id);
  entry.status = "deleted";
  if (result === "deleted" || result === "absent") deleted.push(entry.id);
  await save();
}

function parentDenied(error: unknown) {
  return (
    error instanceof CliFailure && (error.status === 404 || error.status === 403)
  );
}

async function activePaymentIds(client: CleanupClient, groupId: string) {
  try {
    return idsIn(await client.listGroupPayments(groupId));
  } catch (error) {
    if (!parentDenied(error)) throw error;
    const parent = await client.get("group", groupId);
    if (parent.status === 404 || isInactive(parent.body)) return new Set<string>();
    throw error;
  }
}

export async function cleanupJournal(
  journal: Journal,
  client: CleanupClient,
  save: () => Promise<void> = async () => {},
  options: CleanupOptions = {},
): Promise<CleanupReport> {
  const remaining: Remaining[] = [];
  const deleted: string[] = [];
  let balancesRestored = journal.balancesBefore === null;
  journal.status = "cleaning";
  await save();
  try {
    await removeJournal(
      journal,
      client,
      remaining,
      deleted,
      save,
      (value) => {
        balancesRestored = value;
      },
      options,
    );
  } catch (error) {
    remaining.push({
      kind: "expense",
      id: journal.runId,
      reason: error instanceof Error ? error.message : String(error),
    });
    balancesRestored = false;
  }
  const ok = remaining.length === 0 && balancesRestored;
  journal.status = ok ? "clean" : "failed";
  await save();
  return { ok, remaining, balancesRestored, deleted };
}

async function removeJournal(
  journal: Journal,
  client: CleanupClient,
  remaining: Remaining[],
  deleted: string[],
  save: () => Promise<void>,
  setBalances: (restored: boolean) => void,
  options: CleanupOptions,
) {
  await settleUncertainCreates(journal, client, save, options);
  for (const kind of ["recurring", "payment", "expense", "group"] as const) {
    const rows = await client.search(kind);
    let changed = false;
    for (const marked of markedRows(journal.marker, rows)) {
      if (journal.entries.some((entry) => entry.id === marked.id)) continue;
      const row = rows.find((candidate) => asRecord(candidate).id === marked.id);
      const tied = journal.entries.some(
        (entry) =>
          entry.kind === kind &&
          entry.status === "ambiguous" &&
          matchesFingerprint(journal.marker, entry.fingerprint, row),
      );
      if (tied) continue;
      journal.entries.push({
        localId: marked.id,
        id: marked.id,
        kind,
        status: "active",
        source: kind === "expense" ? "generated" : "cli",
        fingerprint: {
          ...(marked.title ? { title: marked.title } : {}),
          ...(marked.description ? { description: marked.description } : {}),
        },
        groupId: null,
        ruleId: null,
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }
    if (changed) await save();
  }
  await reconcileAll(journal, client, save);
  noteUncertain(journal, remaining);
  for (const entry of journal.entries) {
    if (entry.status === "ambiguous") {
      remaining.push({
        kind: entry.kind,
        id: entry.localId,
        reason: "more than one row matched this create; nothing was deleted",
      });
    }
  }

  const rules = [...ruleIdsOf(journal)];
  await adoptGenerated(journal, await client.discoverGenerated(rules), save);

  const removeKinds = async (kinds: ReadonlySet<ResourceKind>) => {
    for (const entry of deletionOrder(journal.entries)) {
      if (!kinds.has(entry.kind)) continue;
      try {
        await deleteEntry(journal, entry, client, remaining, deleted, save);
      } catch (error) {
        remaining.push({
          kind: entry.kind,
          id: entry.id ?? entry.localId,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  await removeKinds(new Set(["recurring"]));
  // A rule can emit an expense between the first scan and its deletion.
  await adoptGenerated(journal, await client.discoverGenerated(rules), save);
  await removeKinds(new Set(["payment", "expense"]));

  const payments = new Set<string>();
  for (const groupId of groupIdsOf(journal)) {
    for (const id of await activePaymentIds(client, groupId)) payments.add(id);
  }
  noteListed(journal, remaining, new Map([["payment", payments]]));

  await removeKinds(new Set(["group"]));

  const active = new Map<ResourceKind, Set<string>>();
  for (const kind of ["expense", "group", "recurring"] as const) {
    active.set(kind, idsIn(await client.listActive(kind)));
  }
  noteListed(journal, remaining, active);

  if (journal.balancesBefore) {
    const after = await client.balances();
    const balancesRestored = balancesMatch(journal.balancesBefore, after);
    setBalances(balancesRestored);
    if (!balancesRestored) {
      remaining.push({
        kind: "expense",
        id: journal.runId,
        reason: "balances did not return to their pre-run values",
      });
    }
  }
}

function noteListed(
  journal: Journal,
  remaining: Remaining[],
  active: Map<ResourceKind, Set<string>>,
) {
  for (const entry of journal.entries) {
    if (!entry.id || entry.status === "absent" || entry.status === "ambiguous") {
      continue;
    }
    const listed = active.get(entry.kind);
    if (!listed?.has(entry.id)) continue;
    if (remaining.some((item) => item.kind === entry.kind && item.id === entry.id)) {
      continue;
    }
    remaining.push({
      kind: entry.kind,
      id: entry.id,
      reason: "still in an active listing",
    });
  }
}
