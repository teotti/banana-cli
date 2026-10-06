import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { paceStamp, requestGapMs, REQUEST_PACE_MS } from "../src/request";
import { CliFailure } from "../src/types";
import { Blocked } from "../e2e/assert";
import { cleanupJournal, type CleanupClient } from "../e2e/cleanup";
import { commandSettled } from "../e2e/creates";
import { ConfigError, resolveSmokeConfig, resolveStagingConfig } from "../e2e/config";
import { COVERAGE, flagsInHelp, HELP_PAGES, smokeIsReadOnly } from "../e2e/coverage";
import { Interrupted, runScenarios } from "../e2e/execute";
import {
  commit,
  createJournal,
  intend,
  readJournal,
  unfinishedFor,
  writeJournal,
  type ResourceKind,
} from "../e2e/journal";
import {
  deletionOrder,
  markedRows,
  matchesFingerprint,
  ownsRow,
  reconcileEntry,
} from "../e2e/match";
import { balancesMatch, type BalanceSnapshot } from "../e2e/money";
import { accountLockPath, acquireAccountLock, processAlive } from "../e2e/lock";
import { walkPages } from "../e2e/pages";
import {
  childEnv,
  CommandsCancelled,
  createCommandGate,
  rateLimitDelay,
  runCommand,
} from "../e2e/process";
import { redact } from "../e2e/redact";
import { buildReport, formatReport } from "../e2e/report";
import { exitCode } from "../e2e/run";
import { scenarios, uniqueAffix } from "../e2e/scenarios";

const ACCOUNT = "11111111-1111-4111-8111-111111111111";
const PARTNER = "22222222-2222-4222-8222-222222222222";
const MARKER = "e2e-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function stagingEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    HOME: "/tmp/banana-e2e-home",
    BANANASPLIT_E2E_API_URL: "https://staging.example.test/",
    BANANASPLIT_E2E_ACCOUNT_ID: ACCOUNT,
    BANANASPLIT_E2E_PARTNER_ID: PARTNER,
    BANANASPLIT_E2E_PARTNER_NAME: "Ana Example",
    BANANASPLIT_E2E_PARTNER_USERNAME: "ana",
    BANANASPLIT_E2E_PARTNER_EMAIL: "ana@example.test",
    BANANASPLIT_E2E_PARTNER_PREFIX: "Ana",
    BANANASPLIT_E2E_PARTNER_SUBSTRING: "Example",
    BANANASPLIT_E2E_CURRENCY: "EUR",
    ...overrides,
  };
}

function zeroBalance(): BalanceSnapshot {
  return { balance: 0, totalOwed: 0, totalOwing: 0, users: [] };
}

describe("currency affixes", () => {
  const eur = { labels: ["eur", "euro"] };
  const usd = { labels: ["usd", "us dollar"] };

  test("counts a code and a name as one currency", () => {
    expect(uniqueAffix([eur, usd], ["EUR", "Euro"], "prefix")).toBe("e");
    expect(uniqueAffix([eur, usd], ["EUR", "Euro"], "substring")).toBe("ur");
  });

  test("rejects a prefix shared with another currency", () => {
    expect(
      uniqueAffix([eur, { labels: ["etb", "ethiopian birr"] }], ["EUR", "Euro"], "prefix"),
    ).toBe("eu");
  });
});

describe("staging config", () => {
  test("requires darwin, staging, and the dedicated account", () => {
    expect(resolveStagingConfig(stagingEnv(), "darwin").accountId).toBe(ACCOUNT);
    expect(() =>
      resolveStagingConfig(
        stagingEnv({ BANANASPLIT_E2E_API_URL: "https://api.bananasplit.net/" }),
        "darwin",
      ),
    ).toThrow(/production/);
    expect(() =>
      resolveStagingConfig(stagingEnv({ BANANASPLIT_E2E_ACCOUNT_ID: "" }), "darwin"),
    ).toThrow(/BANANASPLIT_E2E_ACCOUNT_ID/);
    expect(() =>
      resolveStagingConfig(
        stagingEnv({ BANANASPLIT_E2E_PARTNER_EMAIL: "not-an-email" }),
        "darwin",
      ),
    ).toThrow(/@/);
    expect(
      resolveStagingConfig(
        stagingEnv({ BANANASPLIT_E2E_PARTNER_EMAIL: "" }),
        "darwin",
      ).partnerEmail,
    ).toBeUndefined();
  });

  test("refuses to run on other platforms", () => {
    expect(() => resolveStagingConfig(stagingEnv(), "linux")).toThrow(/macOS/);
    expect(() => resolveSmokeConfig(stagingEnv(), "linux")).toThrow(/macOS/);
  });

  test("keeps production credentials in a different directory", () => {
    const home = "/tmp/banana-e2e-same";
    expect(() =>
      resolveSmokeConfig(
        stagingEnv({
          BANANASPLIT_E2E_HOME: home,
          BANANASPLIT_E2E_PRODUCTION_HOME: home,
        }),
        "darwin",
      ),
    ).toThrow(/different/);
  });
});

describe("journal", () => {
  test("round-trips and leaves another account's run alone", async () => {
    const dir = await mkdtemp(join(tmpdir(), "banana-e2e-journal-"));
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    const entry = intend(journal, {
      kind: "group",
      fingerprint: { title: `${journal.marker} group` },
    });
    const file = join(dir, `${journal.runId}.json`);
    await writeJournal(file, journal);
    const loaded = await readJournal(file);
    expect(loaded.entries[0]?.localId).toBe(entry.localId);
    loaded.status = "clean";
    const other = createJournal({
      accountId: PARTNER,
      apiOrigin: loaded.apiOrigin,
      execution: "source",
      balancesBefore: null,
    });
    expect(unfinishedFor([loaded, other], ACCOUNT, loaded.apiOrigin)).toEqual([]);
    expect(unfinishedFor([loaded, other], PARTNER, loaded.apiOrigin)).toEqual([other]);
  });
});

describe("matching", () => {
  test("adopts one exact row and refuses a prefix or a tie", () => {
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: null,
    });
    journal.marker = MARKER;
    const pending = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} dinner`, amount: 2, groupId: "group-1" },
    });
    expect(
      matchesFingerprint(MARKER, pending.fingerprint, {
        title: "e2e-dinner",
        amount: "2.000000000000000000",
        groupId: "group-1",
      }),
    ).toBe(false);
    expect(
      reconcileEntry(MARKER, pending, [
        { id: "expense-1", title: `${MARKER} dinner`, amount: "2.0", groupId: "group-1" },
        { id: "expense-2", title: `${MARKER} dinner`, amount: "2.0", groupId: "group-1" },
      ]),
    ).toBe("ambiguous");
    expect(pending.id).toBeNull();

    const alone = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} taxi`, amount: 2 },
    });
    expect(
      reconcileEntry(MARKER, alone, [
        { id: "expense-3", title: `${MARKER} taxi`, amount: "2.000000000000000000" },
      ]),
    ).toBe("active");
    expect(alone.id).toBe("expense-3");

    const missing = intend(journal, {
      kind: "group",
      fingerprint: { title: `${MARKER} missing` },
    });
    expect(reconcileEntry(MARKER, missing, [])).toBe("pending");
    expect(missing.status).toBe("pending");
    missing.responseSeen = true;
    expect(reconcileEntry(MARKER, missing, [])).toBe("absent");
    expect(markedRows(MARKER, [{ id: "x", name: "e2e-notes" }])).toEqual([]);
    expect(markedRows(MARKER, [{ id: "y", name: `${MARKER} group` }])).toEqual([
      { id: "y", title: `${MARKER} group`, description: null },
    ]);
  });

  test("deletes rules, then payments and expenses, then groups", () => {
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: null,
    });
    for (const kind of ["group", "expense", "payment", "recurring"] as const) {
      const entry = intend(journal, { kind, fingerprint: { title: "x" } });
      commit(entry, kind);
    }
    expect(deletionOrder(journal.entries).map((entry) => entry.kind)).toEqual([
      "recurring",
      "payment",
      "expense",
      "group",
    ]);
  });

  test("refuses a row that is not this run's", () => {
    const entry = {
      localId: "local",
      id: "expense-1",
      kind: "expense" as const,
      status: "active" as const,
      source: "cli" as const,
      fingerprint: { title: `${MARKER} dinner` },
      groupId: null,
      ruleId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(ownsRow(MARKER, entry, { id: "expense-1", title: "Rent" }, new Set())).toBe(
      false,
    );
    expect(
      ownsRow(MARKER, entry, { id: "expense-1", title: `${MARKER} dinner` }, new Set()),
    ).toBe(true);
    expect(
      ownsRow(
        MARKER,
        { ...entry, source: "generated", ruleId: "rule-1" },
        { id: "expense-1", title: "generated" },
        new Set(["rule-1"]),
      ),
    ).toBe(true);
  });
});

describe("cleanup", () => {
  test("removes only this run, including a restored expense, and can run twice", async () => {
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    journal.marker = MARKER;
    const rule = intend(journal, {
      kind: "recurring",
      fingerprint: { title: `${MARKER} rent` },
    });
    commit(rule, "rule-1");
    const payment = intend(journal, {
      kind: "payment",
      fingerprint: { description: `${MARKER} pay` },
    });
    commit(payment, "payment-1");
    const expense = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} dinner` },
    });
    commit(expense, "expense-1");
    expense.status = "deleted";
    const group = intend(journal, {
      kind: "group",
      fingerprint: { title: `${MARKER} group` },
    });
    commit(group, "group-1");

    const rows = new Map<string, { kind: ResourceKind; body: Record<string, unknown> }>([
      ["rule-1", { kind: "recurring", body: { id: "rule-1", title: `${MARKER} rent` } }],
      [
        "payment-1",
        { kind: "payment", body: { id: "payment-1", description: `${MARKER} pay` } },
      ],
      [
        "expense-1",
        { kind: "expense", body: { id: "expense-1", title: `${MARKER} dinner` } },
      ],
      ["group-1", { kind: "group", body: { id: "group-1", name: `${MARKER} group` } }],
      ["fixture-1", { kind: "expense", body: { id: "fixture-1", title: "Rent" } }],
      ["prefix-1", { kind: "group", body: { id: "prefix-1", name: "e2e-notes" } }],
    ]);
    const removed: string[] = [];
    const client: CleanupClient = {
      async get(_kind, id) {
        const row = rows.get(id);
        return row ? { status: 200, body: row.body } : { status: 404, body: null };
      },
      async remove(kind, id) {
        removed.push(`${kind}:${id}`);
        rows.delete(id);
        return "deleted";
      },
      async listActive(kind) {
        return [...rows.values()]
          .filter((row) => row.kind === kind)
          .map((row) => row.body);
      },
      async listGroupPayments() {
        const payment = rows.get("payment-1");
        return payment ? [payment.body] : [];
      },
      async search(kind) {
        return [...rows.values()]
          .filter((row) => row.kind === kind)
          .map((row) => row.body);
      },
      async discoverGenerated() {
        return [];
      },
      async balances() {
        return zeroBalance();
      },
    };

    const first = await cleanupJournal(journal, client);
    expect(first.ok).toBe(true);
    expect(removed).toEqual([
      "recurring:rule-1",
      "payment:payment-1",
      "expense:expense-1",
      "group:group-1",
    ]);
    expect(rows.has("fixture-1")).toBe(true);
    expect(rows.has("prefix-1")).toBe(true);

    const second = await cleanupJournal(journal, client);
    expect(second.ok).toBe(true);
    expect(removed).toHaveLength(4);
  });

  test("stops when a balance does not return and when two rows match", async () => {
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    journal.marker = MARKER;
    const pending = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} dinner` },
    });
    const removed: string[] = [];
    const client: CleanupClient = {
      async get() {
        return { status: 404, body: null };
      },
      async remove(_kind, id) {
        removed.push(id);
        return "deleted";
      },
      async listActive() {
        return [];
      },
      async listGroupPayments() {
        return [];
      },
      async search() {
        return [
          { id: "a", title: `${MARKER} dinner` },
          { id: "b", title: `${MARKER} dinner` },
        ];
      },
      async discoverGenerated() {
        return [];
      },
      async balances() {
        return { balance: 1, totalOwed: 1, totalOwing: 0, users: [] };
      },
    };
    const report = await cleanupJournal(journal, client);
    expect(report.ok).toBe(false);
    expect(pending.status).toBe("ambiguous");
    expect(removed).toEqual([]);
    expect(report.balancesRestored).toBe(false);
  });

  test("checks payments before deleting groups and tolerates a deleted parent", async () => {
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    journal.marker = MARKER;
    const payment = intend(journal, {
      kind: "payment",
      fingerprint: { description: `${MARKER} pay` },
      groupId: "group-1",
    });
    commit(payment, "payment-1");
    const group = intend(journal, {
      kind: "group",
      fingerprint: { title: `${MARKER} group` },
    });
    commit(group, "group-1");
    const calls: string[] = [];
    let groupGone = false;
    const client: CleanupClient = {
      async get(kind, id) {
        if (kind === "group" && groupGone) return { status: 404, body: null };
        if (kind === "payment" && calls.includes("remove-payment")) {
          return { status: 404, body: null };
        }
        const body =
          kind === "group"
            ? { id, name: `${MARKER} group` }
            : { id, description: `${MARKER} pay`, groupId: "group-1" };
        return { status: 200, body };
      },
      async remove(kind) {
        calls.push(`remove-${kind}`);
        if (kind === "group") groupGone = true;
        return "deleted";
      },
      async listActive() {
        return [];
      },
      async listGroupPayments() {
        calls.push("list-payments");
        if (groupGone) throw new CliFailure("api", "group is gone", 404);
        return [];
      },
      async search() {
        return [];
      },
      async discoverGenerated() {
        return [];
      },
      async balances() {
        return zeroBalance();
      },
    };

    const first = await cleanupJournal(journal, client);
    expect(first.ok).toBe(true);
    expect(calls.indexOf("list-payments")).toBeGreaterThan(calls.indexOf("remove-payment"));
    expect(calls.indexOf("list-payments")).toBeLessThan(calls.indexOf("remove-group"));

    const second = await cleanupJournal(journal, client);
    expect(second.ok).toBe(true);
    expect(journal.status).toBe("clean");

    const broken = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    broken.marker = MARKER;
    const again = intend(broken, {
      kind: "payment",
      fingerprint: { description: `${MARKER} pay` },
      groupId: "group-1",
    });
    commit(again, "payment-1");
    const parent = intend(broken, {
      kind: "group",
      fingerprint: { title: `${MARKER} group` },
    });
    commit(parent, "group-1");
    const refused: CleanupClient = {
      ...client,
      async get() {
        return { status: 404, body: null };
      },
      async listGroupPayments() {
        throw new CliFailure("api", "unavailable", 500);
      },
    };
    const failed = await cleanupJournal(broken, refused);
    expect(failed.ok).toBe(false);
    expect(broken.status).toBe("failed");
  });

  test("keeps an unconfirmed create pending until the server commit appears", async () => {
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    journal.marker = MARKER;
    const pending = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} dinner` },
    });
    const row = { id: "late-1", title: `${MARKER} dinner` };
    let visible = false;
    const removed: string[] = [];
    const fast = { reconcileAttempts: 2, wait: async () => {} };
    const client: CleanupClient = {
      async get(_kind, id) {
        return visible && id === "late-1"
          ? { status: 200, body: row }
          : { status: 404, body: null };
      },
      async remove(_kind, id) {
        removed.push(id);
        visible = false;
        return "deleted";
      },
      async listActive() {
        return visible ? [row] : [];
      },
      async listGroupPayments() {
        return [];
      },
      async search(kind) {
        return kind === "expense" && visible ? [row] : [];
      },
      async discoverGenerated() {
        return [];
      },
      async balances() {
        return zeroBalance();
      },
    };

    const early = await cleanupJournal(journal, client, async () => {}, fast);
    expect(early.ok).toBe(false);
    expect(pending.status).toBe("pending");
    expect(pending.id).toBeNull();
    expect(journal.status).toBe("failed");
    expect(removed).toEqual([]);

    visible = true;
    const late = await cleanupJournal(journal, client, async () => {}, fast);
    expect(late.ok).toBe(true);
    expect(removed).toEqual(["late-1"]);
    expect(journal.status).toBe("clean");
  });

  test("finds a commit that lands between reconciliation attempts", async () => {
    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    journal.marker = MARKER;
    const pending = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} dinner` },
    });
    const row = { id: "late-2", title: `${MARKER} dinner` };
    let searches = 0;
    const removed: string[] = [];
    const client: CleanupClient = {
      async get() {
        return { status: 200, body: row };
      },
      async remove(_kind, id) {
        removed.push(id);
        return "deleted";
      },
      async listActive() {
        return removed.includes("late-2") ? [] : [row];
      },
      async listGroupPayments() {
        return [];
      },
      async search(kind) {
        if (kind !== "expense") return [];
        searches += 1;
        return searches >= 2 ? [row] : [];
      },
      async discoverGenerated() {
        return [];
      },
      async balances() {
        return zeroBalance();
      },
    };
    const report = await cleanupJournal(journal, client, async () => {}, {
      reconcileAttempts: 3,
      wait: async () => {},
    });
    expect(report.ok).toBe(true);
    expect(pending.id).toBe("late-2");
    expect(pending.status).not.toBe("absent");
    expect(removed).toContain("late-2");
  });

  test("a timeout stays uncertain so a later commit is still deleted", async () => {
    const timeout = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "network", message: "Request timed out after 10000ms" },
      }),
    };
    const reset = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "network", message: "The socket connection was closed unexpectedly" },
      }),
    };
    const crashed = { exitCode: 137, stdout: "", stderr: "" };
    const rejected = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 422, message: "invalid" },
      }),
    };
    const limited = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 429, message: "Too many requests" },
      }),
    };
    expect(commandSettled(timeout)).toBe(false);
    expect(commandSettled(reset)).toBe(false);
    expect(commandSettled(crashed)).toBe(false);
    expect(commandSettled(limited)).toBe(false);
    expect(commandSettled(rejected)).toBe(true);

    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    journal.marker = MARKER;
    const pending = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} dinner` },
    });
    if (commandSettled(timeout)) pending.responseSeen = true;
    expect(pending.responseSeen).not.toBe(true);

    const row = { id: "late-timeout", title: `${MARKER} dinner` };
    let visible = false;
    const removed: string[] = [];
    const fast = { reconcileAttempts: 2, wait: async () => {} };
    const client: CleanupClient = {
      async get(_kind, id) {
        return visible && id === "late-timeout"
          ? { status: 200, body: row }
          : { status: 404, body: null };
      },
      async remove(_kind, id) {
        removed.push(id);
        visible = false;
        return "deleted";
      },
      async listActive() {
        return visible ? [row] : [];
      },
      async listGroupPayments() {
        return [];
      },
      async search(kind) {
        return kind === "expense" && visible ? [row] : [];
      },
      async discoverGenerated() {
        return [];
      },
      async balances() {
        return zeroBalance();
      },
    };

    const early = await cleanupJournal(journal, client, async () => {}, fast);
    expect(early.ok).toBe(false);
    expect(pending.status).toBe("pending");
    expect(pending.status).not.toBe("absent");
    expect(journal.status).toBe("failed");
    expect(removed).toEqual([]);

    visible = true;
    const late = await cleanupJournal(journal, client, async () => {}, fast);
    expect(late.ok).toBe(true);
    expect(removed).toEqual(["late-timeout"]);
    expect(journal.status).toBe("clean");
  });

  test("a gateway timeout stays uncertain so a later commit is still deleted", async () => {
    const gateway = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 504, message: "Gateway Timeout" },
      }),
    };
    const unavailable = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 503, message: "unavailable" },
      }),
    };
    const badGateway = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 502, message: "bad gateway" },
      }),
    };
    const server = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 500, message: "internal" },
      }),
    };
    const rejected = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 422, message: "invalid" },
      }),
    };
    expect(commandSettled(gateway)).toBe(false);
    expect(commandSettled(unavailable)).toBe(false);
    expect(commandSettled(badGateway)).toBe(false);
    expect(commandSettled(server)).toBe(false);
    expect(commandSettled(rejected)).toBe(true);

    const journal = createJournal({
      accountId: ACCOUNT,
      apiOrigin: "https://staging.example.test",
      execution: "source",
      balancesBefore: zeroBalance(),
    });
    journal.marker = MARKER;
    const pending = intend(journal, {
      kind: "expense",
      fingerprint: { title: `${MARKER} dinner` },
    });
    if (commandSettled(gateway)) pending.responseSeen = true;
    expect(pending.responseSeen).not.toBe(true);

    const row = { id: "late-504", title: `${MARKER} dinner` };
    let visible = false;
    const removed: string[] = [];
    const fast = { reconcileAttempts: 2, wait: async () => {} };
    const client: CleanupClient = {
      async get(_kind, id) {
        return visible && id === "late-504"
          ? { status: 200, body: row }
          : { status: 404, body: null };
      },
      async remove(_kind, id) {
        removed.push(id);
        visible = false;
        return "deleted";
      },
      async listActive() {
        return visible ? [row] : [];
      },
      async listGroupPayments() {
        return [];
      },
      async search(kind) {
        return kind === "expense" && visible ? [row] : [];
      },
      async discoverGenerated() {
        return [];
      },
      async balances() {
        return zeroBalance();
      },
    };

    const early = await cleanupJournal(journal, client, async () => {}, fast);
    expect(early.ok).toBe(false);
    expect(pending.status).toBe("pending");
    expect(journal.status).toBe("failed");
    expect(removed).toEqual([]);

    visible = true;
    const late = await cleanupJournal(journal, client, async () => {}, fast);
    expect(late.ok).toBe(true);
    expect(removed).toEqual(["late-504"]);
    expect(pending.status).not.toBe("absent");
    expect(journal.status).toBe("clean");
  });
});

describe("runner", () => {
  test("cleans up after an injected failure and a handled interrupt", async () => {
    let cleanups = 0;
    const cleanup = async () => {
      cleanups += 1;
      return { ok: true, remaining: [], balancesRestored: true, deleted: [] };
    };
    const created = { value: false };
    const failed = await runScenarios({
      handleSignals: false,
      inject: "failure",
      hasEntries: () => created.value,
      scenarios: [
        {
          id: "create",
          area: "Expenses",
          title: "create",
          covers: [],
          run: async () => {
            created.value = true;
          },
        },
        {
          id: "later",
          area: "Expenses",
          title: "later",
          covers: [],
          run: async () => {
            throw new Error("should not run");
          },
        },
      ],
      run: (scenario) => scenario.run({} as never),
      cleanup,
    });
    expect(failed.results.map((result) => result.status)).toEqual(["failed"]);
    expect(failed.results[0]?.error).toContain("Injected");
    expect(cleanups).toBe(1);

    const interrupted = await runScenarios({
      handleSignals: false,
      hasEntries: () => false,
      scenarios: [
        {
          id: "stop",
          area: "Groups/payments",
          title: "stop",
          covers: [],
          run: async () => {
            throw new Interrupted();
          },
        },
      ],
      run: (scenario) => scenario.run({} as never),
      cleanup,
    });
    expect(interrupted.interrupted).toBe(true);
    expect(interrupted.results).toEqual([]);
    expect(cleanups).toBe(2);
  });

  test("does not keep writing when a fixture is missing", async () => {
    const ran: string[] = [];
    await runScenarios({
      handleSignals: false,
      hasEntries: () => false,
      scenarios: [
        {
          id: "reads",
          area: "Reads",
          title: "reads",
          covers: [],
          run: async () => {
            ran.push("reads");
            throw new Blocked("missing partner");
          },
        },
        {
          id: "groups",
          area: "Groups/payments",
          title: "groups",
          covers: [],
          run: async () => {
            ran.push("groups");
          },
        },
      ],
      run: (scenario) => scenario.run({} as never),
      cleanup: async () => ({
        ok: true,
        remaining: [],
        balancesRestored: true,
        deleted: [],
      }),
    });
    expect(ran).toEqual(["reads"]);
  });

  test("settles the in-flight command before cleanup and still returns", async () => {
    const order: string[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const outcome = runScenarios({
      handleSignals: false,
      hasEntries: () => true,
      scenarios: [
        {
          id: "stop",
          area: "Groups/payments",
          title: "stop",
          covers: [],
          run: async () => {
            throw new Interrupted();
          },
        },
        {
          id: "later",
          area: "Expenses",
          title: "later",
          covers: [],
          run: async () => {
            throw new Error("should not run");
          },
        },
      ],
      run: (scenario) => scenario.run({} as never),
      cancel: () => {
        order.push("cancel");
        return gate.then(() => {
          order.push("cancelled");
        });
      },
      cleanup: async () => {
        order.push("cleanup");
        return { ok: true, remaining: [], balancesRestored: true, deleted: [] };
      },
    });
    await Bun.sleep(20);
    expect(order).toEqual(["cancel"]);
    release();
    const result = await outcome;
    expect(order).toEqual(["cancel", "cancelled", "cleanup"]);
    expect(result.interrupted).toBe(true);
    expect(result.cleanup.ok).toBe(true);
    expect(result.results).toEqual([]);
  });
});

describe("command gate", () => {
  test("kills a running command and refuses the next one", async () => {
    const gate = createCommandGate();
    const target = {
      apiUrl: "https://staging.example.test/",
      origin: "https://staging.example.test",
      dataDir: "/tmp/banana-e2e-gate",
      binary: process.execPath,
    };
    const running = gate.run(["-e", "await Bun.sleep(30_000)"], target);
    await Bun.sleep(50);
    await gate.cancel();
    await expect(running).rejects.toBeInstanceOf(CommandsCancelled);
    await expect(gate.run(["-e", "process.exit(0)"], target)).rejects.toBeInstanceOf(
      CommandsCancelled,
    );
  });

  test("process.kill delivers the first signal without aborting cleanup", async () => {
    const exit = process.exit;
    const exits: number[] = [];
    process.exit = ((code?: number) => {
      exits.push(code ?? 0);
    }) as typeof process.exit;
    let cancelled = false;
    try {
      const outcome = runScenarios({
        hasEntries: () => true,
        scenarios: [
          {
            id: "create",
            area: "Expenses",
            title: "create",
            covers: [],
            run: async () => {
              process.kill(process.pid, "SIGINT");
              for (let attempt = 0; attempt < 40 && !cancelled; attempt++) {
                await Bun.sleep(5);
              }
              if (!cancelled) throw new Error("SIGINT was not delivered");
            },
          },
        ],
        run: (scenario) => scenario.run({} as never),
        cancel: async () => {
          cancelled = true;
        },
        cleanup: async () => {
          process.kill(process.pid, "SIGINT");
          for (let attempt = 0; attempt < 40 && exits.length === 0; attempt++) {
            await Bun.sleep(5);
          }
          return { ok: true, remaining: [], balancesRestored: true, deleted: [] };
        },
      });
      const result = await outcome;
      expect(cancelled).toBe(true);
      expect(result.interrupted).toBe(true);
      expect(result.cleanup.ok).toBe(true);
      expect(exits).toEqual([130]);
    } finally {
      process.exit = exit;
    }
  });

  test("a SIGINT that arrives during cleanup does not skip the report", async () => {
    const exit = process.exit;
    const exits: number[] = [];
    process.exit = ((code?: number) => {
      exits.push(code ?? 0);
    }) as typeof process.exit;
    try {
      const outcome = runScenarios({
        hasEntries: () => true,
        scenarios: [
          {
            id: "create",
            area: "Expenses",
            title: "create",
            covers: [],
            run: async () => {
              process.kill(process.pid, "SIGINT");
              throw new Interrupted();
            },
          },
        ],
        run: (scenario) => scenario.run({} as never),
        cancel: async () => {},
        cleanup: async () => {
          await Bun.sleep(40);
          return { ok: true, remaining: [], balancesRestored: true, deleted: [] };
        },
      });
      const result = await outcome;
      expect(result.cleanup.ok).toBe(true);
      expect(result.interrupted).toBe(true);
      expect(exits).toEqual([]);
    } finally {
      process.exit = exit;
    }
  });
});

describe("account lock", () => {
  test("a live run blocks recovery and a dead pid does not", async () => {
    const dir = await mkdtemp(join(tmpdir(), "banana-e2e-lock-"));
    const origin = "https://staging.example.test";
    const release = await acquireAccountLock({
      dataDir: dir,
      accountId: ACCOUNT,
      origin,
    });
    await expect(
      acquireAccountLock({ dataDir: dir, accountId: ACCOUNT, origin }),
    ).rejects.toThrow(/active/);
    await release();
    const again = await acquireAccountLock({
      dataDir: dir,
      accountId: ACCOUNT,
      origin,
    });
    await again();

    const child = Bun.spawn([process.execPath, "-e", "process.exit(0)"]);
    const dead = child.pid;
    await child.exited;
    expect(processAlive(process.pid)).toBe(true);
    expect(processAlive(dead)).toBe(false);
    const file = accountLockPath(dir, ACCOUNT, origin);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(
      file,
      JSON.stringify({ pid: dead, accountId: ACCOUNT, origin }),
    );
    const recovered = await acquireAccountLock({
      dataDir: dir,
      accountId: ACCOUNT,
      origin,
    });
    await recovered();
  });

  test("two processes cannot both take one stale lock", async () => {
    const dir = await mkdtemp(join(tmpdir(), "banana-e2e-lock-race-"));
    const origin = "https://staging.example.test";
    const child = Bun.spawn([process.execPath, "-e", "process.exit(0)"]);
    const dead = child.pid;
    await child.exited;
    const file = accountLockPath(dir, ACCOUNT, origin);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(
      file,
      JSON.stringify({ pid: dead, accountId: ACCOUNT, origin }),
    );
    const script = join(dir, "contender.ts");
    await writeFile(
      script,
      `
        import { acquireAccountLock } from ${JSON.stringify(join(import.meta.dir, "../e2e/lock.ts"))};
        const [dataDir, accountId, origin] = process.argv.slice(2);
        try {
          const release = await acquireAccountLock({ dataDir, accountId, origin });
          console.log("acquired " + process.pid);
          await Bun.sleep(1500);
          await release();
        } catch (error) {
          console.log("blocked");
          console.log(error instanceof Error ? error.message : String(error));
        }
      `,
    );
    const spawn = () =>
      Bun.spawn([process.execPath, script, dir, ACCOUNT, origin], {
        stdout: "pipe",
        stderr: "pipe",
      });
    const first = spawn();
    const second = spawn();
    const text = (stream: ReadableStream | number | undefined) => {
      if (typeof stream === "number" || stream === undefined) {
        throw new Error("subprocess stream was not piped");
      }
      return new Response(stream).text();
    };
    const output = async (proc: ReturnType<typeof spawn>) => {
      const [stdout, stderr, code] = await Promise.all([
        text(proc.stdout),
        text(proc.stderr),
        proc.exited,
      ]);
      return { stdout, stderr, code };
    };
    const [left, right] = await Promise.all([output(first), output(second)]);
    const lines = `${left.stdout}\n${right.stdout}\n${left.stderr}\n${right.stderr}`;
    const acquired = lines.split("\n").filter((line) => line.startsWith("acquired "));
    expect(acquired, lines).toHaveLength(1);
    expect(lines).toContain("blocked");
    expect(left.code).toBe(0);
    expect(right.code).toBe(0);
  }, 10000);

  test("a third process cannot take the lock while a stale owner is being replaced", async () => {
    const dir = await mkdtemp(join(tmpdir(), "banana-e2e-lock-window-"));
    const origin = "https://staging.example.test";
    const child = Bun.spawn([process.execPath, "-e", "process.exit(0)"]);
    const dead = child.pid;
    await child.exited;
    const file = accountLockPath(dir, ACCOUNT, origin);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify({ pid: dead, accountId: ACCOUNT, origin }));
    const holding = join(dir, "holding");
    const go = join(dir, "go");
    const published = join(dir, "published");
    const releaseFile = join(dir, "release");
    const script = join(dir, "contender.ts");
    await writeFile(
      script,
      `
        import { acquireAccountLock } from ${JSON.stringify(join(import.meta.dir, "../e2e/lock.ts"))};
        const [role, dataDir, accountId, origin, holding, go, published, releaseFile] = process.argv.slice(2);
        const input = { dataDir, accountId, origin };
        if (role === "recover") {
          const release = await acquireAccountLock(input, {
            afterStaleObserved: async () => {
              await Bun.write(holding, String(process.pid));
              while (!(await Bun.file(go).exists())) await Bun.sleep(10);
            },
          });
          await Bun.write(published, String(process.pid));
          while (!(await Bun.file(releaseFile).exists())) await Bun.sleep(10);
          await release();
          console.log("released");
        } else try {
          const release = await acquireAccountLock(input);
          console.log("acquired " + process.pid);
          await release();
        } catch (error) {
          console.log("blocked");
          console.log(error instanceof Error ? error.message : String(error));
        }
      `,
    );
    const text = (stream: ReadableStream | number | undefined) => {
      if (typeof stream === "number" || stream === undefined) {
        throw new Error("subprocess stream was not piped");
      }
      return new Response(stream).text();
    };
    const output = async (proc: ReturnType<typeof Bun.spawn>) => {
      const [stdout, stderr, code] = await Promise.all([
        text(proc.stdout),
        text(proc.stderr),
        proc.exited,
      ]);
      return { stdout, stderr, code };
    };
    const waitFor = async (path: string) => {
      const started = Date.now();
      while (Date.now() - started < 3000) {
        if (await Bun.file(path).exists()) return;
        await Bun.sleep(10);
      }
      throw new Error(`timed out waiting for ${path}`);
    };
    const spawn = (role: string) =>
      Bun.spawn(
        [process.execPath, script, role, dir, ACCOUNT, origin, holding, go, published, releaseFile],
        { stdout: "pipe", stderr: "pipe" },
      );
    const recover = spawn("recover");
    try {
      await waitFor(holding);
      const second = spawn("contender");
      const third = spawn("contender");
      const [left, right] = await Promise.all([output(second), output(third)]);
      const lines = `${left.stdout}\n${right.stdout}\n${left.stderr}\n${right.stderr}`;
      expect(lines, lines).not.toContain("acquired ");
      expect(left.stdout).toContain("blocked");
      expect(right.stdout).toContain("blocked");
      expect(left.stdout).toContain("active");
      expect(right.stdout).toContain("active");
      const during = JSON.parse(await Bun.file(file).text()) as { pid: number };
      expect(during.pid).toBe(dead);
      await writeFile(go, "1");
      await waitFor(published);
      const after = JSON.parse(await Bun.file(file).text()) as { pid: number };
      expect(after.pid).toBe(recover.pid);
      expect(after.pid).not.toBe(second.pid);
      expect(after.pid).not.toBe(third.pid);
      await writeFile(releaseFile, "1");
      const finished = await output(recover);
      expect(finished.code, `${finished.stdout}\n${finished.stderr}`).toBe(0);
    } finally {
      try {
        recover.kill();
      } catch {
        // The recover process has already exited.
      }
    }
  }, 10000);
});

describe("rate limit", () => {
  test("waits out a 429 and leaves other errors alone", () => {
    const limited = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: {
          type: "api",
          status: 429,
          message: "Too many requests. Please try again later.",
          body: { retryAfterSeconds: 12 },
        },
      }),
    };
    const rejected = {
      exitCode: 1,
      stdout: "",
      stderr: JSON.stringify({
        error: { type: "api", status: 400, message: "no" },
      }),
    };
    expect(rateLimitDelay(limited)).toBe(13);
    expect(rateLimitDelay(rejected)).toBeUndefined();
    expect(rateLimitDelay({ exitCode: 0, stdout: "{}", stderr: "" })).toBeUndefined();
  });
});

describe("child environment", () => {
  test("drops an inherited auth URL unless the suite sets one", () => {
    const previous = process.env.BANANASPLIT_AUTH_URL;
    process.env.BANANASPLIT_AUTH_URL = "https://loopback.example/api";
    const target = {
      apiUrl: "https://staging.example.test/",
      origin: "https://staging.example.test",
      dataDir: "/tmp/banana-e2e-env",
    };
    try {
      expect(childEnv(target).BANANASPLIT_AUTH_URL).toBeUndefined();
      expect(childEnv(target).BANANASPLIT_REQUEST_GAP_MS).toBe(String(REQUEST_PACE_MS));
      expect(childEnv(target).BANANASPLIT_REQUEST_PACE_FILE).toBe(
        "/tmp/banana-e2e-env/banana/e2e/request-pace.json",
      );
      expect(requestGapMs({})).toBe(0);
      expect(paceStamp(0, 1_000, 2_500)).toEqual({ waitMs: 0, nextAt: 3_500 });
      expect(paceStamp(5_000, 1_000, 2_500)).toEqual({ waitMs: 4_000, nextAt: 7_500 });
      expect(requestGapMs({ BANANASPLIT_REQUEST_GAP_MS: "3000" })).toBe(3000);
      expect(requestGapMs({ BANANASPLIT_REQUEST_GAP_MS: "nope" })).toBe(0);
      expect(requestGapMs({ BANANASPLIT_REQUEST_GAP_MS: "99999" })).toBe(10_000);
      expect(
        childEnv({ ...target, authUrl: "https://staging.example.test/api" })
          .BANANASPLIT_AUTH_URL,
      ).toBe("https://staging.example.test/api");
      expect(
        childEnv(target, { BANANASPLIT_AUTH_URL: "https://override.example/api" })
          .BANANASPLIT_AUTH_URL,
      ).toBe("https://override.example/api");
    } finally {
      if (previous === undefined) delete process.env.BANANASPLIT_AUTH_URL;
      else process.env.BANANASPLIT_AUTH_URL = previous;
    }
  });
});

describe("pages", () => {
  test("keeps the cursor, rejects repeats, and requires every fixture", async () => {
    const cursors: Array<string | undefined> = [];
    const walked = await walkPages({
      label: "expenses",
      expected: ["a", "b"],
      paginate: true,
      order: { field: "amount", direction: "asc" },
      fetch: async (cursor) => {
        cursors.push(cursor);
        if (!cursor) {
          return {
            items: [{ id: "a", amount: 1 }],
            hasMore: true,
            nextCursor: "page-2",
          };
        }
        return {
          items: [{ id: "b", amount: 2 }],
          hasMore: false,
          nextCursor: null,
        };
      },
    });
    expect(cursors).toEqual([undefined, "page-2"]);
    expect([...walked.ids]).toEqual(["a", "b"]);

    await expect(
      walkPages({
        label: "expenses",
        fetch: async () => ({
          items: [
            { id: "a", amount: 2 },
            { id: "a", amount: 1 },
          ],
          hasMore: false,
        }),
      }),
    ).rejects.toThrow(/repeated/);

    await expect(
      walkPages({
        label: "expenses",
        expected: ["missing"],
        fetch: async () => ({ items: [{ id: "a", amount: 1 }], hasMore: false }),
      }),
    ).rejects.toThrow(/never returned/);

    await expect(
      walkPages({
        label: "expenses",
        order: { field: "amount", direction: "asc" },
        fetch: async (cursor) =>
          cursor
            ? { items: [{ id: "b", amount: 1 }], hasMore: false }
            : {
                items: [{ id: "a", amount: 5 }],
                hasMore: true,
                nextCursor: "next",
              },
      }),
    ).rejects.toThrow(/not ordered/);
  });
});

describe("reports", () => {
  test("redacts credentials and fails closed when cleanup fails", () => {
    const report = buildReport({
      commit: "abc",
      origin: "https://staging.example.test",
      execution: "source",
      runId: "run-1",
      marker: MARKER,
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:01:00.000Z",
      interrupted: false,
      scenarios: [
        {
          id: "x",
          area: "Reads",
          title: "x",
          status: "failed",
          covers: [],
          durationMs: 1,
          error: "Authorization: Bearer secret-token",
        },
        {
          id: "y",
          area: "Local",
          title: "doctor stayed out of the table",
          status: "passed",
          covers: [],
          durationMs: 1,
        },
      ],
      cleanup: {
        ok: false,
        remaining: [{ kind: "group", id: "group-1", reason: "still there" }],
        balancesRestored: false,
        deleted: [],
      },
    });
    const redacted = redact(report, ["secret-token"]) as {
      scenarios: Array<{ error?: string }>;
    };
    expect(redacted.scenarios[0]?.error).not.toContain("secret-token");
    const text = formatReport(report, false);
    expect(text).toContain("bun run e2e cleanup run-1");
    expect(text).toContain("commands were not run");
    expect(text).toContain("Status  Area   Time  Scenario");
    expect(text).toContain("failed  Reads   1ms  x");
    expect(text).not.toContain("doctor stayed out of the table");
    expect(text).not.toContain("\x1b");
    expect(text).not.toContain("uncovered  command:");
    const colored = formatReport(report, true);
    expect(colored).toContain("\x1b[38;2;208;72;72mfailed");
    expect(colored).toContain("\x1b[38;2;42;122;62mpassed 1");
    expect(colored).toContain("bun run e2e cleanup run-1");
    expect(exitCode({ ok: false, interrupted: true, cleanupOk: false })).toBe(1);
    expect(exitCode({ ok: false, interrupted: true, cleanupOk: true })).toBe(130);
    expect(exitCode({ ok: true, interrupted: false, cleanupOk: true })).toBe(0);
  });

  test("treats a missing user balance of zero as unchanged", () => {
    expect(
      balancesMatch(
        {
          balance: 1,
          totalOwed: 2,
          totalOwing: 1,
          users: [{ userId: PARTNER, balance: 0 }],
        },
        { balance: 1, totalOwed: 2, totalOwing: 1, users: [] },
      ),
    ).toBe(true);
  });
});

describe("coverage", () => {
  test("every automatic command and flag is exercised by a scenario", () => {
    const covered = new Set(scenarios.flatMap((scenario) => scenario.covers));
    const missing = COVERAGE.filter(
      (item) => item.disposition === "auto" && !covered.has(item.id),
    ).map((item) => item.id);
    const unknown = [...covered].filter(
      (id) => !COVERAGE.some((item) => item.id === id),
    );
    expect(missing).toEqual([]);
    expect(unknown).toEqual([]);
    expect(smokeIsReadOnly()).toBe(true);
  });

  test("help pages only name flags the matrix tracks", async () => {
    const target = {
      apiUrl: "https://staging.example.test/",
      origin: "https://staging.example.test",
      dataDir: await mkdtemp(join(tmpdir(), "banana-e2e-help-")),
    };
    const found = new Set<string>();
    await Promise.all(
      HELP_PAGES.map(async (page) => {
        const result = await runCommand(page.args, target);
        expect(result.exitCode).toBe(0);
        for (const flag of flagsInHelp(page.id, result.stdout)) found.add(flag);
      }),
    );
    const untracked = [...found].filter(
      (flag) => !COVERAGE.some((item) => item.id === flag),
    );
    expect(untracked).toEqual([]);
  });
});
