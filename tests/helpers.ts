import type { CliRuntime } from "../src/index";

export const TOKEN = "secret-session-token";
export const REFRESH_TOKEN = "secret-refresh-token";
export const NOW = 2_000_000_000_000;

export function credential(
  overrides: Partial<{
    accessToken: string;
    accessTokenExpiresAt: number;
    authBaseUrl: string;
    refreshToken: string;
    scope: string;
  }> = {},
) {
  return {
    accessToken: TOKEN,
    accessTokenExpiresAt: NOW + 60 * 60 * 1000,
    authBaseUrl: "https://api.example.test/api/",
    refreshToken: REFRESH_TOKEN,
    scope: "api:read api:write offline_access",
    ...overrides,
  };
}

export function harness(
  response:
    | Response
    | ((url: URL, init?: RequestInit) => Response | Promise<Response>) =
    Response.json({ ok: true }),
) {
  const calls: Array<{ init?: RequestInit; url: URL }> = [];
  const secretCalls: Array<{ action: "delete" | "get" | "set"; value?: string }> = [];
  const values = new Map([
    ["bananasplit-cli\0https://api.example.test", JSON.stringify(credential())],
  ]);
  const stdout: string[] = [];
  const stderr: string[] = [];
  const runtime: CliRuntime = {
    env: {
      BANANASPLIT_API_URL: "https://api.example.test/base",
    },
    fetch: async (input, init) => {
      const url = new URL(String(input));
      calls.push({ init, url });
      return typeof response === "function"
        ? await response(url, init)
        : response.clone();
    },
    now: () => NOW,
    secrets: {
      delete: async ({ service, name }) => {
        secretCalls.push({ action: "delete" });
        return values.delete(`${service}\0${name}`);
      },
      get: async ({ service, name }) => {
        secretCalls.push({ action: "get" });
        return values.get(`${service}\0${name}`) ?? null;
      },
      set: async ({ service, name, value }) => {
        secretCalls.push({ action: "set", value });
        values.set(`${service}\0${name}`, value);
      },
    },
    stderr: (value) => stderr.push(value),
    stdout: (value) => stdout.push(value),
  };

  return { calls, runtime, secretCalls, stderr, stdout, values };
}
