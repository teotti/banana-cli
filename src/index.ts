#!/usr/bin/env bun

import { runCli } from "./cli";
import { invokedName } from "./shared";

export { renderCollectionBrowser, renderGroupBrowser } from "./browser";
export { runCli } from "./cli";
export type { CliRuntime } from "./types";

if (import.meta.main) {
  process.exitCode = await runCli(process.argv.slice(2), {
    programName: invokedName(),
  });
}
