#!/usr/bin/env bun

// The package's `bananasplit` bin. A package manager links each bin to its
// own file and runs it by that resolved path, so this file is the only way a
// package install can tell which name it was run as.
import { runCli } from "./cli";

process.exitCode = await runCli(process.argv.slice(2), {
  programName: "bananasplit",
});
