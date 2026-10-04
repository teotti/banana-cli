import { spawnSync } from "node:child_process";
import { REQUEST_PACE_MS } from "../src/request";
import { ConfigError } from "./config";
import { enableCommandLog } from "./process";
import {
  cleanupCommand,
  loginCommand,
  productionSmoke,
  runSuite,
  type Invoke,
} from "./run";

const USAGE = `Usage:
  bun run e2e login [--production] [--binary <path>]
  bun run e2e run [--binary <path>] [--inject failure|interrupt]
  bun run e2e cleanup [run-id] [--binary <path>]
  bun run e2e production-smoke [--binary <path>]
  bun run e2e accept [--binary <path>]

Staging writes require the variables in e2e/README.md. Ordinary bun test stays offline.`;

function take(args: string[], name: string) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new ConfigError(`${name} needs a value.`);
  }
  args.splice(index, 2);
  return value;
}

function parse(args: string[]): { invoke: Invoke; production: boolean; positionals: string[] } {
  const rest = [...args];
  const binary = take(rest, "--binary");
  const inject = take(rest, "--inject");
  const production = rest.includes("--production");
  if (production) rest.splice(rest.indexOf("--production"), 1);
  if (inject !== undefined && inject !== "failure" && inject !== "interrupt") {
    throw new ConfigError("--inject must be failure or interrupt.");
  }
  const unknown = rest.find((arg) => arg.startsWith("--"));
  if (unknown) throw new ConfigError(`Unknown flag: ${unknown}`);
  return {
    invoke: {
      ...(binary ? { binary } : {}),
      ...(inject ? { inject } : {}),
    },
    production,
    positionals: rest,
  };
}

function spawnE2E(args: string[]) {
  return spawnSync(process.execPath, [import.meta.path, ...args], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });
}

function resultLine(stderr: string) {
  const line = stderr.split("\n").find((entry) => entry.startsWith("E2E_RESULT "));
  if (!line) return undefined;
  return JSON.parse(line.slice("E2E_RESULT ".length)) as {
    cleanup?: boolean;
    runId?: string;
  };
}

async function accept(binary?: string) {
  const steps: Array<{ args: string[]; expect: number }> = [
    { args: ["run"], expect: 0 },
    { args: ["run"], expect: 0 },
    { args: ["run", "--inject", "failure"], expect: 1 },
    { args: ["run", "--inject", "interrupt"], expect: 130 },
  ];
  if (binary) steps.push({ args: ["run", "--binary", binary], expect: 0 });
  for (const step of steps) {
    const args = step.args;
    const child = spawnE2E(args);
    process.stdout.write(child.stdout ?? "");
    process.stderr.write(child.stderr ?? "");
    if (child.status !== step.expect) {
      throw new ConfigError(
        `bun run e2e ${args.join(" ")} exited ${child.status}, expected ${step.expect}.`,
      );
    }
    const result = resultLine(child.stderr ?? "");
    if (!result || result.cleanup !== true || typeof result.runId !== "string") {
      throw new ConfigError(`Cleanup did not finish after ${args.join(" ")}.`);
    }
    for (let time = 0; time < 2; time++) {
      const again = spawnE2E([
        "cleanup",
        result.runId,
        ...(args.includes("--binary") && binary ? ["--binary", binary] : []),
      ]);
      process.stdout.write(again.stdout ?? "");
      process.stderr.write(again.stderr ?? "");
      if (again.status !== 0) {
        throw new ConfigError(`Repeating cleanup ${result.runId} failed.`);
      }
    }
  }
  console.log("acceptance ok");
  return 0;
}

async function main() {
  const [action, ...rest] = process.argv.slice(2);
  if (!action || action === "--help" || action === "-h") {
    console.log(USAGE);
    return action ? 0 : 2;
  }
  enableCommandLog();
  process.env.BANANASPLIT_REQUEST_GAP_MS ??= String(REQUEST_PACE_MS);
  const { invoke, production, positionals } = parse(rest);
  if (action === "login") {
    if (positionals.length !== 0) throw new ConfigError("login takes no arguments.");
    return loginCommand(process.env, production, invoke.binary);
  }
  if (production) throw new ConfigError("--production is only valid with login.");
  if (action === "run") {
    if (positionals.length !== 0) throw new ConfigError("run takes no arguments.");
    return runSuite(process.env, invoke);
  }
  if (action === "cleanup") {
    if (positionals.length > 1) throw new ConfigError("cleanup takes at most one run id.");
    return cleanupCommand(process.env, positionals[0], invoke.binary);
  }
  if (action === "production-smoke") {
    if (invoke.inject) throw new ConfigError("production-smoke does not take --inject.");
    if (positionals.length !== 0) {
      throw new ConfigError("production-smoke takes no arguments.");
    }
    return productionSmoke(process.env, invoke.binary);
  }
  if (action === "accept") {
    if (invoke.inject) throw new ConfigError("accept does not take --inject.");
    if (positionals.length !== 0) throw new ConfigError("accept takes no arguments.");
    return accept(invoke.binary);
  }
  console.error(USAGE);
  return 2;
}

if (import.meta.main) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = error instanceof ConfigError ? 2 : 1;
  }
}
