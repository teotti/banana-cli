import { asRecord } from "../src/shared";
import type { CommandResult } from "./process";

export class Blocked extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Blocked";
  }
}

export function expectExit(result: CommandResult, code: number) {
  if (result.exitCode !== code) {
    throw new Error(
      `exit ${result.exitCode}, expected ${code}\n${result.stderr}\n${result.stdout}`,
    );
  }
}

export function expectJson(result: CommandResult) {
  expectExit(result, 0);
  try {
    return JSON.parse(result.stdout) as unknown;
  } catch {
    throw new Error(`expected JSON on stdout\n${result.stdout}`);
  }
}

export function expectError(result: CommandResult, code: number, type: string) {
  expectExit(result, code);
  let body: unknown;
  try {
    body = JSON.parse(result.stderr);
  } catch {
    throw new Error(`expected a JSON error on stderr\n${result.stderr}`);
  }
  const error = asRecord(asRecord(body).error);
  if (error.type !== type) {
    throw new Error(`expected error type ${type}, got ${String(error.type)}`);
  }
  return error;
}

export function readId(body: unknown) {
  if (Array.isArray(body)) {
    const ids = body
      .map((item) => asRecord(item).id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    return ids.length === 1 ? ids[0] : undefined;
  }
  const id = asRecord(body).id;
  return typeof id === "string" && id ? id : undefined;
}

export function asObject(body: unknown) {
  const record = asRecord(body);
  if (Array.isArray(body) || body === null || typeof body !== "object") {
    throw new Error("expected a JSON object");
  }
  return record;
}
