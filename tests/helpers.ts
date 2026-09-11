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

export const CURRENCIES = [
  {
    id: "currency-eur",
    name: "Euro",
    code: "EUR",
    symbol: "€",
    type: "fiat",
    decimals: 2,
    exchangeRateToBase: "1",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
];
export const ME = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Leonardo",
  email: "leo@example.test",
  username: "leo",
};
export const ANA = { id: "22222222-2222-4222-8222-222222222222", name: "Ana" };
export const GROUP = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Lisbon trip",
};

/**
 * Answers the name lookups a write makes on its way to an id, so a test only
 * has to describe the request it is actually about.
 */
export function lookup(url: URL, init?: RequestInit) {
  if (init?.method !== undefined) return undefined;
  if (url.pathname.endsWith("/currencies")) return Response.json(CURRENCIES);
  if (url.pathname.endsWith("/current-user")) return Response.json(ME);
  // The search routes answer with a bare array; the listings with `{items}`.
  if (url.pathname.endsWith("/friends/search")) {
    return Response.json([{ id: "friendship-1", user: ANA }]);
  }
  if (url.pathname.endsWith("/groups/search")) return Response.json([GROUP]);
  if (url.pathname.endsWith("/friends")) {
    return Response.json({ items: [{ id: "friendship-1", user: ANA }] });
  }
  if (url.pathname.endsWith("/groups")) {
    return Response.json({ items: [GROUP] });
  }
  return undefined;
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
    ["banana\0https://api.example.test", JSON.stringify(credential())],
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
