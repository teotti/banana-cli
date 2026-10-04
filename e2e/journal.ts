import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { BalanceSnapshot } from "./money";
import { journalPath } from "./paths";

export type ResourceKind = "expense" | "group" | "payment" | "recurring";

export type Fingerprint = {
  /** Exact title or group name. Matching never uses a prefix of this. */
  title?: string;
  description?: string;
  amount?: number;
  groupId?: string | null;
};

export type EntryStatus =
  | "pending"
  | "active"
  | "deleted"
  | "absent"
  | "ambiguous";

export type JournalEntry = {
  localId: string;
  id: string | null;
  kind: ResourceKind;
  status: EntryStatus;
  source: "cli" | "generated";
  fingerprint: Fingerprint;
  groupId: string | null;
  ruleId: string | null;
  createdAt: string;
  /**
   * The create reached a definitive end: the origin refused it, or the CLI
   * rejected it before sending. Timeouts, gateway errors, and crashes leave
   * this unset.
   */
  responseSeen?: boolean;
};

export type JournalStatus = "running" | "cleaning" | "clean" | "failed";

export type Journal = {
  version: 1;
  runId: string;
  marker: string;
  accountId: string;
  apiOrigin: string;
  startedAt: string;
  status: JournalStatus;
  execution: "source" | "binary";
  balancesBefore: BalanceSnapshot | null;
  entries: JournalEntry[];
};

export function createJournal(input: {
  accountId: string;
  apiOrigin: string;
  execution: "source" | "binary";
  balancesBefore: BalanceSnapshot | null;
  now?: string;
}): Journal {
  const runId = randomUUID();
  return {
    version: 1,
    runId,
    marker: `e2e-${runId}`,
    accountId: input.accountId,
    apiOrigin: input.apiOrigin,
    startedAt: input.now ?? new Date().toISOString(),
    status: "running",
    execution: input.execution,
    balancesBefore: input.balancesBefore,
    entries: [],
  };
}

export function intend(
  journal: Journal,
  input: {
    kind: ResourceKind;
    fingerprint: Fingerprint;
    groupId?: string | null;
    ruleId?: string | null;
    source?: "cli" | "generated";
    now?: string;
  },
): JournalEntry {
  const entry: JournalEntry = {
    localId: randomUUID(),
    id: null,
    kind: input.kind,
    status: "pending",
    source: input.source ?? "cli",
    fingerprint: input.fingerprint,
    groupId: input.groupId ?? input.fingerprint.groupId ?? null,
    ruleId: input.ruleId ?? null,
    createdAt: input.now ?? new Date().toISOString(),
  };
  journal.entries.push(entry);
  return entry;
}

export function commit(entry: JournalEntry, id: string) {
  entry.id = id;
  entry.status = "active";
}

export async function writeJournal(file: string, journal: Journal) {
  await mkdir(dirname(file), { mode: 0o700, recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(journal), { mode: 0o600 });
  await rename(temporary, file);
}

export async function readJournal(file: string): Promise<Journal> {
  const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${file} is not a journal.`);
  }
  const journal = parsed as Journal;
  if (journal.version !== 1 || typeof journal.runId !== "string") {
    throw new Error(`${file} is not a version 1 journal.`);
  }
  return journal;
}

export async function listJournalFiles(directory: string) {
  try {
    const names = await readdir(directory);
    return names.filter((name) => name.endsWith(".json")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function loadJournals(dataDir: string) {
  const directory = journalPath(dataDir, "placeholder");
  const folder = dirname(directory);
  const files = await listJournalFiles(folder);
  const journals: Journal[] = [];
  for (const name of files) {
    journals.push(await readJournal(join(folder, name)));
  }
  return journals;
}

export function unfinishedFor(
  journals: Journal[],
  accountId: string,
  origin: string,
) {
  return journals.filter(
    (journal) =>
      journal.status !== "clean" &&
      journal.accountId === accountId &&
      journal.apiOrigin === origin,
  );
}
