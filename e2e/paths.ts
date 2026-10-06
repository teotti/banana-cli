import { join } from "node:path";

/** Journals and reports sit beside the isolated credential file, not inside it. */
export function e2ePaths(dataDir: string) {
  const root = join(dataDir, "banana", "e2e");
  return {
    root,
    journals: join(root, "journals"),
    reports: join(root, "reports"),
  };
}

export function journalPath(dataDir: string, runId: string) {
  return join(e2ePaths(dataDir).journals, `${runId}.json`);
}

export function reportPath(dataDir: string, runId: string) {
  return join(e2ePaths(dataDir).reports, `${runId}.json`);
}

/** One clock for every API call in a run, including calls inside `banana`. */
export function requestPacePath(dataDir: string) {
  return join(e2ePaths(dataDir).root, "request-pace.json");
}
