import { stat } from "node:fs/promises";
import { BLUE, RESET } from "../src/colors";
import { supportsColor } from "../src/help";
import { asRecord } from "../src/shared";
import { expectJson } from "./assert";
import { cleanupJournal } from "./cleanup";
import { createClient } from "./client";
import {
  ConfigError,
  productionOrigin,
  resolveSmokeConfig,
  resolveStagingConfig,
  type SmokeConfig,
  type Target,
} from "./config";
import { bindCreates, type World } from "./creates";
import { SMOKE_ARGV } from "./coverage";
import { InjectedFailure, Interrupted, runScenarios } from "./execute";
import {
  createJournal,
  loadJournals,
  unfinishedFor,
  writeJournal,
  type Journal,
} from "./journal";
import { acquireAccountLock } from "./lock";
import { journalPath, reportPath } from "./paths";
import {
  childEnv,
  createCommandGate,
  repoRoot,
  runCommand,
  runCommandInherited,
} from "./process";
import { buildReport, formatReport, writeReport, type ScenarioResult } from "./report";
import { scenarios } from "./scenarios";

export type Invoke = {
  binary?: string;
  inject?: "failure" | "interrupt";
};

async function revision() {
  const child = Bun.spawn(["git", "rev-parse", "--short", "HEAD"], {
    cwd: repoRoot(),
    stdout: "pipe",
    stderr: "ignore",
  });
  const text = (await new Response(child.stdout).text()).trim();
  return (await child.exited) === 0 && text ? text : null;
}

async function requireBinary(path: string | undefined) {
  if (!path) return;
  try {
    const info = await stat(path);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    throw new ConfigError(`Compiled binary not found: ${path}`);
  }
}

function withBinary(target: Target, binary?: string): Target {
  return binary ? { ...target, binary } : target;
}

async function signedIn(target: Target) {
  const result = await runCommand(["me", "--json"], target);
  if (result.exitCode !== 0) {
    const production = target.origin === productionOrigin();
    throw new ConfigError(
      `Not signed in for ${target.origin}. Run bun run e2e login${
        production ? " --production" : ""
      }.\n${result.stderr.trim()}`,
    );
  }
  const me = asRecord(expectJson(result));
  if (typeof me.id !== "string") throw new ConfigError("banana me did not return an id.");
  return me.id;
}

async function recover(
  target: Target,
  accountId: string,
  journals: Journal[],
) {
  const client = createClient(target, childEnv(target));
  for (const journal of unfinishedFor(journals, accountId, target.origin)) {
    const file = journalPath(target.dataDir, journal.runId);
    const report = await cleanupJournal(journal, client, () =>
      writeJournal(file, journal),
    );
    if (!report.ok) {
      const ids = report.remaining
        .map((item) => `${item.kind} ${item.id} (${item.reason})`)
        .join("\n");
      throw new ConfigError(
        `Previous run ${journal.runId} still has resources. ` +
          `bun run e2e cleanup ${journal.runId}\n${ids}`,
      );
    }
  }
}

export function exitCode(input: {
  ok: boolean;
  interrupted: boolean;
  cleanupOk: boolean;
}) {
  if (!input.cleanupOk) return 1;
  if (input.interrupted) return 130;
  return input.ok ? 0 : 1;
}

export async function runSuite(env: NodeJS.ProcessEnv, invoke: Invoke = {}) {
  const config = resolveStagingConfig(env);
  const target = withBinary(config, invoke.binary ?? config.binary);
  await requireBinary(target.binary);
  const accountId = await signedIn(target);
  if (accountId !== config.accountId) {
    throw new ConfigError(
      `Signed in as ${accountId}, not the dedicated account ${config.accountId}.`,
    );
  }
  const release = await acquireAccountLock({
    dataDir: target.dataDir,
    accountId,
    origin: target.origin,
  });
  try {
    return await runLocked(target, config, accountId, invoke);
  } finally {
    await release();
  }
}

async function runLocked(
  target: Target,
  config: ReturnType<typeof resolveStagingConfig>,
  accountId: string,
  invoke: Invoke,
) {
  await recover(target, accountId, await loadJournals(target.dataDir));

  const commands = createCommandGate();
  const client = createClient(target, childEnv(target), commands);
  const balancesBefore = await client.balances();
  const journal = createJournal({
    accountId,
    apiOrigin: target.origin,
    execution: target.binary ? "binary" : "source",
    balancesBefore,
  });
  const file = journalPath(target.dataDir, journal.runId);
  const save = () => writeJournal(file, journal);
  await save();
  const reportLine = `E2E_REPORT ${reportPath(target.dataDir, journal.runId)}`;
  console.log(supportsColor() ? `${BLUE}${reportLine}${RESET}` : reportLine);

  const world: World = {};
  let markSignal: () => void = () => {};
  const firstSignal = new Promise<void>((resolve) => {
    markSignal = resolve;
  });
  const ctx = bindCreates({
    client,
    journal,
    config,
    world,
    save,
    noteCreated: async () => {
      if (invoke.inject !== "interrupt") return;
      const hasGroup = journal.entries.some(
        (entry) => entry.kind === "group" && entry.id,
      );
      const hasExpense = journal.entries.some(
        (entry) => entry.kind === "expense" && entry.id,
      );
      if (!hasGroup || !hasExpense) return;
      process.kill(process.pid, "SIGINT");
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("SIGINT was not delivered.")), 2000);
      });
      await Promise.race([firstSignal, timeout]);
      throw new Interrupted();
    },
  });

  const outcome = await runScenarios({
    scenarios,
    inject: invoke.inject,
    hasEntries: () => journal.entries.length > 0,
    run: (scenario) => scenario.run(ctx),
    cancel: () => commands.cancel(),
    onFirstSignal: () => markSignal(),
    cleanup: () => cleanupJournal(journal, client, save),
  });
  return finish(
    target,
    journal,
    outcome.results,
    outcome.cleanup,
    outcome.interrupted,
  );
}

async function finish(
  target: Target,
  journal: Journal,
  results: ScenarioResult[],
  cleanup: Awaited<ReturnType<typeof cleanupJournal>>,
  interrupted: boolean,
) {
  const report = buildReport({
    commit: await revision(),
    origin: target.origin,
    execution: journal.execution,
    ...(target.binary ? { binary: target.binary } : {}),
    runId: journal.runId,
    marker: journal.marker,
    startedAt: journal.startedAt,
    finishedAt: new Date().toISOString(),
    interrupted,
    scenarios: results,
    cleanup,
  });
  const file = reportPath(target.dataDir, journal.runId);
  const written = await writeReport(file, report, []);
  console.log(formatReport(written));
  console.error(`E2E_RESULT ${JSON.stringify({ runId: journal.runId, ok: written.ok, cleanup: written.cleanup.ok, interrupted, report: file })}`);
  return exitCode({
    ok: written.ok,
    interrupted,
    cleanupOk: written.cleanup.ok,
  });
}

export async function cleanupCommand(
  env: NodeJS.ProcessEnv,
  runId: string | undefined,
  binary?: string,
) {
  const config = resolveStagingConfig(env);
  const target = withBinary(config, binary ?? config.binary);
  await requireBinary(target.binary);
  const accountId = await signedIn(target);
  if (accountId !== config.accountId) {
    throw new ConfigError(
      `Signed in as ${accountId}, not the dedicated account ${config.accountId}.`,
    );
  }
  const release = await acquireAccountLock({
    dataDir: target.dataDir,
    accountId,
    origin: target.origin,
  });
  try {
    return await cleanupLocked(target, accountId, runId);
  } finally {
    await release();
  }
}

async function cleanupLocked(target: Target, accountId: string, runId: string | undefined) {
  const journals = await loadJournals(target.dataDir);
  const chosen = runId
    ? journals.filter((journal) => journal.runId === runId)
    : unfinishedFor(journals, accountId, target.origin);
  if (runId && chosen.length === 0) {
    throw new ConfigError(`No journal for run ${runId}.`);
  }
  if (chosen.length === 0) {
    console.log("Nothing to clean up.");
    return 0;
  }
  const client = createClient(target, childEnv(target));
  let failed = false;
  for (const journal of chosen) {
    if (journal.accountId !== accountId || journal.apiOrigin !== target.origin) {
      throw new ConfigError(
        `Run ${journal.runId} belongs to a different account or API.`,
      );
    }
    const report = await cleanupJournal(journal, client, () =>
      writeJournal(journalPath(target.dataDir, journal.runId), journal),
    );
    if (report.ok) {
      console.log(`cleanup ok ${journal.runId}`);
    } else {
      failed = true;
      console.error(`cleanup failed ${journal.runId}`);
      for (const remaining of report.remaining) {
        console.error(`remaining  ${remaining.kind}  ${remaining.id}  ${remaining.reason}`);
      }
      console.error(`bun run e2e cleanup ${journal.runId}`);
    }
  }
  return failed ? 1 : 0;
}

export async function loginCommand(env: NodeJS.ProcessEnv, production: boolean, binary?: string) {
  const target = production
    ? withBinary(resolveSmokeConfig(env), binary)
    : withBinary(resolveStagingConfig(env), binary);
  await requireBinary(target.binary);
  return runCommandInherited(["login"], target);
}

export async function productionSmoke(env: NodeJS.ProcessEnv, binary?: string) {
  const config: SmokeConfig = resolveSmokeConfig(env);
  const target = withBinary(config, binary ?? config.binary);
  await requireBinary(target.binary);
  const accountId = await signedIn(target);
  if (config.accountId && accountId !== config.accountId) {
    throw new ConfigError(
      `Production smoke is signed in as ${accountId}, not ${config.accountId}.`,
    );
  }
  for (const args of SMOKE_ARGV) {
    const result = await runCommand(args, target, childEnv(target));
    if (result.exitCode !== 0) {
      throw new ConfigError(
        `Production smoke failed: banana ${args.join(" ")}\n${result.stderr.trim()}`,
      );
    }
  }
  console.log(`production smoke ok ${target.origin} ${accountId}`);
  return 0;
}
