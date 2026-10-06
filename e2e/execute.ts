import { Blocked } from "./assert";
import type { CleanupReport } from "./cleanup";
import { CommandsCancelled } from "./process";
import type { ScenarioResult } from "./report";
import type { Scenario } from "./scenarios";

export class Interrupted extends Error {
  constructor() {
    super("Interrupted.");
    this.name = "Interrupted";
  }
}

export class InjectedFailure extends Error {
  constructor() {
    super("Injected scenario failure after creation.");
    this.name = "InjectedFailure";
  }
}

export async function runScenarios(options: {
  scenarios: Scenario[];
  run: (scenario: Scenario) => Promise<void>;
  inject?: "failure" | "interrupt";
  hasEntries: () => boolean;
  cleanup: () => Promise<CleanupReport>;
  /** Kill and settle scenario commands before cleanup starts. */
  cancel?: () => Promise<void>;
  /** Fires once the first SIGINT or SIGTERM has been counted. */
  onFirstSignal?: () => void;
  handleSignals?: boolean;
}): Promise<{
  results: ScenarioResult[];
  cleanup: CleanupReport;
  interrupted: boolean;
}> {
  let settled: Promise<CleanupReport> | undefined;
  const settle = () => {
    settled ??= options.cleanup();
    return settled;
  };
  const results: ScenarioResult[] = [];
  let interrupted = false;
  let cancelling: Promise<void> | undefined;
  let signals = 0;
  const onSignal = () => {
    signals += 1;
    if (signals > 1) {
      process.exit(130);
      return;
    }
    interrupted = true;
    cancelling ??= options.cancel?.() ?? Promise.resolve();
    options.onFirstSignal?.();
  };
  if (options.handleSignals !== false) {
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
  }

  let cleanupReport: CleanupReport | undefined;
  try {
    for (const scenario of options.scenarios) {
      if (interrupted) break;
      const started = Date.now();
      try {
        await options.run(scenario);
        if (interrupted) break;
        if (options.inject === "failure" && options.hasEntries()) {
          throw new InjectedFailure();
        }
        results.push({
          id: scenario.id,
          area: scenario.area,
          title: scenario.title,
          status: "passed",
          covers: scenario.covers,
          durationMs: Date.now() - started,
        });
      } catch (error) {
        if (
          error instanceof Interrupted ||
          error instanceof CommandsCancelled ||
          interrupted
        ) {
          interrupted = true;
          break;
        }
        const blocked = error instanceof Blocked;
        results.push({
          id: scenario.id,
          area: scenario.area,
          title: scenario.title,
          status: blocked ? "blocked" : "failed",
          covers: scenario.covers,
          durationMs: Date.now() - started,
          error: error instanceof Error ? error.message : String(error),
        });
        if (error instanceof InjectedFailure) break;
        // A missing fixture before any create must not go on to write.
        if (blocked && !options.hasEntries()) break;
      }
    }
  } finally {
    try {
      if (interrupted) {
        cancelling ??= options.cancel?.() ?? Promise.resolve();
        await cancelling;
      }
      cleanupReport = await settle();
    } catch (error) {
      cleanupReport = {
        ok: false,
        remaining: [
          {
            kind: "expense",
            id: "cleanup",
            reason: error instanceof Error ? error.message : String(error),
          },
        ],
        balancesRestored: false,
        deleted: [],
      };
    }
    if (options.handleSignals !== false) {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
    }
  }
  return {
    results,
    cleanup: cleanupReport ?? {
      ok: false,
      remaining: [],
      balancesRestored: false,
      deleted: [],
    },
    interrupted,
  };
}
