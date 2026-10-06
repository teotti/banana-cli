import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { version } from "../package.json";
import { BLUE, BOLD, DIM, GREEN, RED, RESET, YELLOW } from "../src/colors";
import { supportsColor } from "../src/help";
import { COVERAGE } from "./coverage";
import type { CleanupReport } from "./cleanup";
import { MANUAL_CHECKS } from "./manual";
import { redact } from "./redact";
import type { Scenario } from "./scenarios";

export type ScenarioStatus = "blocked" | "failed" | "passed";

export type ScenarioResult = {
  id: string;
  area: string;
  title: string;
  status: ScenarioStatus;
  covers: string[];
  durationMs: number;
  error?: string;
};

export type Report = {
  version: string;
  commit: string | null;
  target: {
    origin: string;
    execution: "source" | "binary";
    binary?: string;
  };
  runId: string;
  marker: string;
  startedAt: string;
  finishedAt: string;
  interrupted: boolean;
  scenarios: ScenarioResult[];
  manual: Array<{ id: string; title: string; status: "manual"; steps: string }>;
  coverage: Array<{ id: string; status: "blocked" | "failed" | "manual" | "passed" | "uncovered" }>;
  cleanup: CleanupReport;
  ok: boolean;
};

export function buildReport(input: {
  commit: string | null;
  origin: string;
  execution: "source" | "binary";
  binary?: string;
  runId: string;
  marker: string;
  startedAt: string;
  finishedAt: string;
  interrupted: boolean;
  scenarios: ScenarioResult[];
  cleanup: CleanupReport;
}): Report {
  const coverage = COVERAGE.map((item) => {
    if (item.disposition === "manual") {
      return { id: item.id, status: "manual" as const };
    }
    const related = input.scenarios.filter((scenario) =>
      scenario.covers.includes(item.id),
    );
    if (related.length === 0) return { id: item.id, status: "uncovered" as const };
    if (related.some((scenario) => scenario.status === "passed")) {
      return { id: item.id, status: "passed" as const };
    }
    if (related.some((scenario) => scenario.status === "blocked")) {
      return { id: item.id, status: "blocked" as const };
    }
    return { id: item.id, status: "failed" as const };
  });
  const uncovered = coverage.some((item) => item.status === "uncovered");
  const scenariosPassed = input.scenarios.every(
    (scenario) => scenario.status === "passed",
  );
  return {
    version,
    commit: input.commit,
    target: {
      origin: input.origin,
      execution: input.execution,
      ...(input.binary ? { binary: input.binary } : {}),
    },
    runId: input.runId,
    marker: input.marker,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    interrupted: input.interrupted,
    scenarios: input.scenarios,
    manual: MANUAL_CHECKS.map((check) => ({ ...check, status: "manual" as const })),
    coverage,
    cleanup: input.cleanup,
    ok:
      scenariosPassed &&
      input.cleanup.ok &&
      !uncovered &&
      !input.interrupted,
  };
}

function paint(text: string, color: string, enabled: boolean) {
  return enabled ? `${color}${text}${RESET}` : text;
}

function duration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  return seconds >= 10 ? `${Math.round(seconds)}s` : `${seconds.toFixed(1)}s`;
}

function statusColor(status: ScenarioStatus) {
  if (status === "passed") return GREEN;
  if (status === "failed") return RED;
  return YELLOW;
}

export function formatReport(report: Report, color = supportsColor()) {
  const counts = {
    passed: report.scenarios.filter((scenario) => scenario.status === "passed").length,
    failed: report.scenarios.filter((scenario) => scenario.status === "failed").length,
    blocked: report.scenarios.filter((scenario) => scenario.status === "blocked").length,
  };
  const summary = [
    `${paint("banana e2e", `${BOLD}${YELLOW}`, color)} ${report.version}${
      report.commit ? ` (${report.commit})` : ""
    }`,
    paint(
      `${report.target.origin}  ${report.target.execution}  run ${report.runId}`,
      DIM,
      color,
    ),
    [
      paint(`passed ${counts.passed}`, GREEN, color),
      paint(`failed ${counts.failed}`, counts.failed > 0 ? RED : DIM, color),
      paint(`blocked ${counts.blocked}`, counts.blocked > 0 ? YELLOW : DIM, color),
      paint(`manual ${report.manual.length}`, DIM, color),
    ].join("  "),
    report.cleanup.ok
      ? paint("cleanup ok", GREEN, color)
      : paint(`cleanup failed — bun run e2e cleanup ${report.runId}`, RED, color),
  ];
  if (!report.cleanup.ok) {
    for (const remaining of report.cleanup.remaining) {
      summary.push(`remaining  ${remaining.kind}  ${remaining.id}  ${remaining.reason}`);
    }
  }
  if (report.interrupted) summary.push("interrupted");

  const problems = report.scenarios.filter((scenario) => scenario.status !== "passed");
  const times = problems.map((scenario) => duration(scenario.durationMs));
  const statusWidth = Math.max(
    "Status".length,
    ...problems.map((scenario) => scenario.status.length),
    0,
  );
  const areaWidth = Math.max(
    "Area".length,
    ...problems.map((scenario) => scenario.area.length),
    0,
  );
  const timeWidth = Math.max("Time".length, ...times.map((value) => value.length), 0);
  const heading = [
    paint("Status".padEnd(statusWidth), `${BOLD}${BLUE}`, color),
    paint("Area".padEnd(areaWidth), `${BOLD}${BLUE}`, color),
    paint("Time".padStart(timeWidth), `${BOLD}${BLUE}`, color),
    paint("Scenario", `${BOLD}${BLUE}`, color),
  ].join("  ");
  const rows = problems.flatMap((scenario, index) => {
    const row = [
      paint(scenario.status.padEnd(statusWidth), statusColor(scenario.status), color),
      scenario.area.padEnd(areaWidth),
      times[index]!.padStart(timeWidth),
      scenario.title,
    ].join("  ");
    const detail = scenario.error?.split("\n")[0];
    if (!detail) return [row];
    const indent = " ".repeat(statusWidth + areaWidth + timeWidth + 6);
    return [row, paint(`${indent}${detail}`, DIM, color)];
  });

  const footnotes: string[] = [];
  const uncovered = report.coverage.filter((item) => item.status === "uncovered");
  if (uncovered.length > 0) {
    footnotes.push(
      `${uncovered.length} commands were not run. They are listed in the JSON report.`,
    );
  }
  footnotes.push(`${report.manual.length} manual checks are listed in the JSON report.`);
  const blocks = [summary.join("\n")];
  if (rows.length > 0) blocks.push([heading, ...rows].join("\n"));
  blocks.push(footnotes.join("\n"));
  return blocks.join("\n\n");
}

export async function writeReport(file: string, report: Report, secrets: string[]) {
  const redacted = redact(report, secrets) as Report;
  await mkdir(dirname(file), { mode: 0o700, recursive: true });
  await writeFile(file, JSON.stringify(redacted, null, 2), { mode: 0o600 });
  return redacted;
}

export function coversOf(scenarios: Scenario[]) {
  return new Set(scenarios.flatMap((scenario) => scenario.covers));
}
