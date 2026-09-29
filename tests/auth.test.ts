import { createHash } from "node:crypto";
import { mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import {
  credential,
  harness,
  NOW,
  REFRESH_TOKEN,
  TOKEN,
} from "./helpers";

const DEVICE_CODE = "private-device-code";
const USER_CODE = "ABCDEFGH";
const ACCESS_TOKEN = "new-access-token";
const NEW_REFRESH_TOKEN = "new-refresh-token";

function deviceResponse(overrides: Record<string, unknown> = {}) {
  return Response.json({
    device_code: DEVICE_CODE,
    user_code: USER_CODE,
    verification_uri: "https://app.example.test/device",
    verification_uri_complete:
      `https://app.example.test/device?user_code=${USER_CODE}`,
    expires_in: 900,
    interval: 5,
    ...overrides,
  });
}

function tokenResponse(overrides: Record<string, unknown> = {}) {
  return Response.json({
    access_token: ACCESS_TOKEN,
    refresh_token: NEW_REFRESH_TOKEN,
    token_type: "Bearer",
    expires_in: 900,
    scope: "api:read api:write offline_access",
    ...overrides,
  });
}

function form(init?: RequestInit) {
  return new URLSearchParams(String(init?.body));
}

function freshLogin(
  response: (url: URL, init?: RequestInit) => Response | Promise<Response>,
) {
  const result = harness(response);
  result.values.clear();
  let now = NOW;
  result.runtime.now = () => now;
  result.runtime.sleep = async (milliseconds, signal) => {
    signal.throwIfAborted();
    now += milliseconds;
  };
  return result;
}

describe("OAuth authentication", () => {
  it("logs in through the device flow and persists only secure credentials", async () => {
    const opened: string[] = [];
    const result = freshLogin((url) =>
      url.pathname.endsWith("/device/code")
        ? deviceResponse()
        : tokenResponse()
    );
    result.runtime.openUrl = async (url) => {
      opened.push(url);
    };

    expect(await runCli(["login"], result.runtime)).toBe(0);
    expect(result.calls.map(({ url }) => url.pathname)).toEqual([
      "/api/device/code",
      "/api/oauth2/token",
    ]);
    expect(Object.fromEntries(form(result.calls[0].init))).toEqual({
      client_id: "bananasplit-cli",
      resource: "https://api.example.test",
      scope: "api:read api:write offline_access",
    });
    expect(Object.fromEntries(form(result.calls[1].init))).toEqual({
      client_id: "bananasplit-cli",
      device_code: DEVICE_CODE,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });
    for (const { init } of result.calls) {
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBeNull();
      expect(headers.get("cookie")).toBeNull();
      expect(form(init).has("client_secret")).toBe(false);
    }
    expect(opened).toEqual([
      `https://app.example.test/device?user_code=${USER_CODE}`,
    ]);
    expect(result.stdout).toEqual([
      `Code: ${USER_CODE}`,
      "Verify at: https://app.example.test/device",
      "Confirm that the browser shows the same code before approving.",
      "Logged in.",
    ]);
    const stored = JSON.parse(
      result.values.get("banana\0https://api.example.test")!,
    );
    expect(stored).toEqual({
      accessToken: ACCESS_TOKEN,
      accessTokenExpiresAt: NOW + 5_000 + 900_000,
      authBaseUrl: "https://api.example.test/api/",
      refreshToken: NEW_REFRESH_TOKEN,
      scope: "api:read api:write offline_access",
    });
    expect([...result.stdout, ...result.stderr].join(" ")).not.toContain(
      DEVICE_CODE,
    );
    expect([...result.stdout, ...result.stderr].join(" ")).not.toContain(
      ACCESS_TOKEN,
    );
    expect([...result.stdout, ...result.stderr].join(" ")).not.toContain(
      NEW_REFRESH_TOKEN,
    );
  });

  it("honors pending, slowdown, Retry-After, and transient poll failures", async () => {
    const waits: number[] = [];
    let poll = 0;
    const result = freshLogin((url) => {
      if (url.pathname.endsWith("/device/code")) {
        return deviceResponse({ expires_in: 1000 });
      }
      if (url.pathname.endsWith("/oauth2/revoke")) return new Response(null);
      poll += 1;
      if (poll === 1) {
        return Response.json({ error: "authorization_pending" }, { status: 400 });
      }
      if (poll === 2) {
        return Response.json({ error: "slow_down" }, { status: 400 });
      }
      if (poll === 3) {
        return new Response(null, {
          status: 429,
          headers: { "retry-after": "12" },
        });
      }
      if (poll === 4) throw new Error(`do not print ${DEVICE_CODE}`);
      if (poll === 5) return new Response(null, { status: 503 });
      return tokenResponse();
    });
    let now = NOW;
    result.runtime.now = () => now;
    result.runtime.sleep = async (milliseconds, signal) => {
      signal.throwIfAborted();
      waits.push(milliseconds);
      now += milliseconds;
    };
    result.runtime.openUrl = async () => {};

    expect(await runCli(["login"], result.runtime)).toBe(0);
    expect(waits).toEqual([5_000, 5_000, 10_000, 12_000, 10_000, 10_000]);
    expect(result.stderr.join(" ")).not.toContain(DEVICE_CODE);
  });

  it("fails safely for denied, expired, and malformed responses", async () => {
    for (const [body, message] of [
      [{ error: "access_denied" }, "Login denied."],
      [{ error: "expired_token" }, "Login expired. Run banana login again."],
      [{ unexpected: true }, "Authentication server returned an invalid response."],
    ] as const) {
      const result = freshLogin((url) =>
        url.pathname.endsWith("/device/code")
          ? deviceResponse()
          : Response.json(body, { status: 400 })
      );
      result.runtime.openUrl = async () => {};
      expect(await runCli(["login"], result.runtime)).toBe(1);
      expect(result.stderr[0]).toBe(`Error: ${message}`);
      expect(result.values.size).toBe(0);
    }

    const malformed = freshLogin((url) => {
      if (url.pathname.endsWith("/device/code")) return deviceResponse();
      if (url.pathname.endsWith("/oauth2/revoke")) return new Response(null);
      return tokenResponse({ token_type: "DPoP" });
    });
    malformed.runtime.openUrl = async () => {};
    expect(await runCli(["login"], malformed.runtime)).toBe(1);
    expect(malformed.calls.at(-1)?.url.pathname).toBe("/api/oauth2/revoke");
    expect(malformed.stderr.join(" ")).not.toContain(NEW_REFRESH_TOKEN);
  });

  it("keeps browser failures non-fatal and handles cancellation", async () => {
    const browserFailure = freshLogin((url) =>
      url.pathname.endsWith("/device/code")
        ? deviceResponse()
        : tokenResponse()
    );
    browserFailure.runtime.openUrl = async () => {
      throw new Error("headless");
    };
    expect(await runCli(["login"], browserFailure.runtime)).toBe(0);

    const cancelled = freshLogin((url) => deviceResponse());
    cancelled.runtime.openUrl = async () => {};
    cancelled.runtime.sleep = async () => {
      throw new DOMException("Aborted", "AbortError");
    };
    expect(await runCli(["login"], cancelled.runtime)).toBe(130);
    expect(cancelled.stderr).toEqual(["Error: Login cancelled."]);
    expect(cancelled.values.size).toBe(0);

    const timedOut = freshLogin(() =>
      deviceResponse({ expires_in: 5, interval: 5 })
    );
    timedOut.runtime.openUrl = async () => {};
    expect(await runCli(["login"], timedOut.runtime)).toBe(1);
    expect(timedOut.calls).toHaveLength(1);
    expect(timedOut.stderr).toEqual([
      "Error: Login timed out. Run banana login again.",
    ]);
  });

  it("revokes newly issued credentials when secure persistence fails", async () => {
    const result = freshLogin((url) =>
      url.pathname.endsWith("/device/code")
        ? deviceResponse()
        : url.pathname.endsWith("/oauth2/token")
          ? tokenResponse()
          : new Response(null)
    );
    result.runtime.openUrl = async () => {};
    result.runtime.secrets = {
      ...result.runtime.secrets!,
      set: async () => {
        throw new Error(`storage rejected ${NEW_REFRESH_TOKEN}`);
      },
    };

    expect(await runCli(["login"], result.runtime)).toBe(1);
    const revokeCall = result.calls.at(-1)!;
    expect(revokeCall.url.pathname).toBe("/api/oauth2/revoke");
    expect(Object.fromEntries(form(revokeCall.init))).toEqual({
      client_id: "bananasplit-cli",
      token: NEW_REFRESH_TOKEN,
      token_type_hint: "refresh_token",
    });
    expect(result.stderr[0]).toBe("Error: Could not save credentials securely.");
    expect(result.stderr[0]).not.toContain(NEW_REFRESH_TOKEN);
  });

  it("checks secure storage before login network activity", async () => {
    const result = freshLogin(() => deviceResponse());
    result.runtime.secrets = {
      ...result.runtime.secrets!,
      get: async () => {
        throw new Error("no keyring");
      },
    };
    expect(await runCli(["login"], result.runtime)).toBe(1);
    expect(result.calls).toHaveLength(0);
    expect(result.stderr).toEqual([
      "Error: Secure credential storage is unavailable on this system.",
    ]);
  });

  it("rejects malformed device fields and non-loopback HTTP URLs", async () => {
    for (const response of [
      deviceResponse({ interval: 0 }),
      deviceResponse({ expires_in: -1 }),
      deviceResponse({ verification_uri: "http://example.test/device" }),
      Response.json({ user_code: USER_CODE }),
    ]) {
      const result = freshLogin(() => response);
      expect(await runCli(["login"], result.runtime)).toBe(1);
      expect(result.calls).toHaveLength(1);
      expect(result.stderr[0]).toBe(
        "Error: Authentication server returned an invalid response.",
      );
    }
  });

  it("uses an explicit loopback auth base and repairs a previous login", async () => {
    const result = harness((url) =>
      url.pathname.endsWith("/device/code")
        ? deviceResponse({
            verification_uri: "http://localhost:3000/device",
            verification_uri_complete:
              `http://localhost:3000/device?user_code=${USER_CODE}`,
          })
        : url.pathname.endsWith("/oauth2/token")
          ? tokenResponse()
          : new Response(null, { status: 503 })
    );
    result.runtime.env = {
      BANANASPLIT_API_URL: "http://127.0.0.1:8080/base",
      BANANASPLIT_AUTH_URL: "http://localhost:8081/api",
    };
    result.values.clear();
    result.values.set(
      "banana\0http://127.0.0.1:8080",
      JSON.stringify(credential({
        authBaseUrl: "http://localhost:8081/api/",
      })),
    );
    let now = NOW;
    result.runtime.now = () => now;
    result.runtime.sleep = async (milliseconds) => {
      now += milliseconds;
    };
    result.runtime.openUrl = async () => {};

    expect(await runCli(["login"], result.runtime)).toBe(0);
    expect(result.calls[0].url.toString()).toBe(
      "http://localhost:8081/api/device/code",
    );
    expect(form(result.calls[0].init).get("resource")).toBe(
      "http://127.0.0.1:8080",
    );
    expect(form(result.calls.at(-1)?.init).get("token")).toBe(REFRESH_TOKEN);
    expect(result.stderr).toEqual([
      "Warning: Previous login could not be revoked.",
    ]);
  });

  it("reuses valid access tokens and refreshes expiring credentials", async () => {
    const reused = harness(Response.json({ id: "user-1", name: "Ada" }));
    expect(await runCli(["me"], reused.runtime)).toBe(0);
    expect(reused.calls).toHaveLength(1);
    expect(new Headers(reused.calls[0].init?.headers).get("authorization")).toBe(
      `Bearer ${TOKEN}`,
    );

    const refreshed = harness((url) =>
      url.pathname.endsWith("/oauth2/token")
        ? tokenResponse()
        : Response.json({ id: "user-1", name: "Ada" })
    );
    refreshed.values.set(
      "banana\0https://api.example.test",
      JSON.stringify(credential({ accessTokenExpiresAt: NOW + 30_000 })),
    );
    expect(await runCli(["me"], refreshed.runtime)).toBe(0);
    expect(refreshed.calls.map(({ url }) => url.pathname)).toEqual([
      "/api/oauth2/token",
      "/base/current-user",
    ]);
    expect(form(refreshed.calls[0].init).get("refresh_token")).toBe(
      REFRESH_TOKEN,
    );
    expect(new Headers(refreshed.calls[1].init?.headers).get("authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    );
  });

  it("cleans up after refresh persistence failure and invalid grants", async () => {
    const storageFailure = harness((url) =>
      url.pathname.endsWith("/oauth2/token")
        ? tokenResponse()
        : new Response(null)
    );
    storageFailure.values.set(
      "banana\0https://api.example.test",
      JSON.stringify(credential({ accessTokenExpiresAt: NOW })),
    );
    storageFailure.runtime.secrets = {
      ...storageFailure.runtime.secrets!,
      set: async () => {
        throw new Error(`cannot save ${NEW_REFRESH_TOKEN}`);
      },
    };
    expect(await runCli(["me"], storageFailure.runtime)).toBe(1);
    expect(storageFailure.calls.at(-1)?.url.pathname).toBe(
      "/api/oauth2/revoke",
    );
    expect(storageFailure.values.size).toBe(0);
    expect(storageFailure.stderr.join(" ")).not.toContain(NEW_REFRESH_TOKEN);

    const invalid = harness((url) =>
      url.pathname.endsWith("/oauth2/token")
        ? Response.json({ error: "invalid_grant" }, { status: 400 })
        : Response.json({ ok: true })
    );
    invalid.values.set(
      "banana\0https://api.example.test",
      JSON.stringify(credential({ accessTokenExpiresAt: NOW })),
    );
    expect(await runCli(["me"], invalid.runtime)).toBe(1);
    expect(invalid.values.size).toBe(0);
    expect(invalid.stderr).toEqual([
      "Error: Login expired. Run banana login again.",
    ]);
  });

  it("refreshes and replays one 401, but never retries a 403", async () => {
    let apiCalls = 0;
    const retry = harness((url) => {
      if (url.pathname.endsWith("/oauth2/token")) return tokenResponse();
      apiCalls += 1;
      return apiCalls === 1
        ? new Response(null, { status: 401 })
        : Response.json({ id: "user-1", name: "Ada" });
    });
    expect(await runCli(["me"], retry.runtime)).toBe(0);
    expect(retry.calls.map(({ url }) => url.pathname)).toEqual([
      "/base/current-user",
      "/api/oauth2/token",
      "/base/current-user",
    ]);

    const forbidden = harness(
      Response.json(
        { code: "INSUFFICIENT_SCOPE", message: "OAuth token requires api:read" },
        { status: 403 },
      ),
    );
    expect(await runCli(["me"], forbidden.runtime)).toBe(1);
    expect(forbidden.calls).toHaveLength(1);
    expect(forbidden.stderr[0]).toBe(
      "Error: Login is missing required API permissions. Run banana login.",
    );
  });

  it("clears credentials after a second 401", async () => {
    const result = harness((url) =>
      url.pathname.endsWith("/oauth2/token")
        ? tokenResponse()
        : url.pathname.endsWith("/oauth2/revoke")
          ? new Response(null)
          : new Response(null, { status: 401 })
    );
    expect(await runCli(["me"], result.runtime)).toBe(1);
    expect(
      result.calls.filter(({ url }) => url.pathname === "/base/current-user"),
    ).toHaveLength(2);
    expect(result.calls.at(-1)?.url.pathname).toBe("/api/oauth2/revoke");
    expect(result.values.size).toBe(0);
    expect(result.stderr[0]).toBe("Error: Login expired. Run banana login again.");
  });

  it("revokes before deleting on logout and preserves ambiguous failures", async () => {
    const events: string[] = [];
    const success = harness((url) => {
      events.push(`fetch:${url.pathname}`);
      return new Response(null);
    });
    const originalDelete = success.runtime.secrets!.delete;
    success.runtime.secrets = {
      ...success.runtime.secrets!,
      delete: async (options) => {
        events.push("delete");
        return originalDelete(options);
      },
    };
    expect(await runCli(["logout"], success.runtime)).toBe(0);
    expect(events).toEqual(["fetch:/api/oauth2/revoke", "delete"]);
    expect(success.stdout).toEqual(["Logged out."]);

    const failure = harness(async () => {
      throw new Error(`offline ${REFRESH_TOKEN}`);
    });
    expect(await runCli(["logout"], failure.runtime)).toBe(1);
    expect(failure.values.size).toBe(1);
    expect(failure.stderr[0]).not.toContain(REFRESH_TOKEN);

    const alreadyInvalid = harness(
      Response.json({ error: "invalid_token" }, { status: 400 }),
    );
    expect(await runCli(["logout"], alreadyInvalid.runtime)).toBe(0);
    expect(alreadyInvalid.values.size).toBe(0);

    const missing = harness();
    missing.values.clear();
    expect(await runCli(["logout"], missing.runtime)).toBe(0);
    expect(missing.stdout).toEqual(["Already logged out."]);
  });

  it("redacts credentials and sensitive keys from API errors", async () => {
    const result = harness(
      Response.json(
        {
          access_token: TOKEN,
          deviceCode: DEVICE_CODE,
          message: `failed for ${TOKEN}`,
          nested: { refreshToken: REFRESH_TOKEN },
        },
        { status: 500 },
      ),
    );
    expect(await runCli(["me", "--raw"], result.runtime)).toBe(1);
    expect(result.stderr[0]).not.toContain(TOKEN);
    expect(result.stderr[0]).not.toContain(REFRESH_TOKEN);
    expect(result.stderr[0]).not.toContain(DEVICE_CODE);
    expect(JSON.parse(result.stderr[0])).toEqual({
      access_token: "[redacted]",
      deviceCode: "[redacted]",
      message: "failed for [redacted]",
      nested: { refreshToken: "[redacted]" },
    });
  });

  it("deduplicates concurrent refreshes and recovers a stale lock", async () => {
    let refreshes = 0;
    const concurrentOrigin = "https://concurrent.example.test";
    const concurrent = harness(async (url) => {
      if (url.pathname.endsWith("/oauth2/token")) {
        refreshes += 1;
        await Bun.sleep(10);
        return tokenResponse();
      }
      return Response.json({ id: "user-1", name: "Ada" });
    });
    concurrent.runtime.env = {
      BANANASPLIT_API_URL: `${concurrentOrigin}/base`,
    };
    concurrent.values.clear();
    concurrent.values.set(
      `banana\0${concurrentOrigin}`,
      JSON.stringify(credential({
        accessTokenExpiresAt: NOW,
        authBaseUrl: `${concurrentOrigin}/api/`,
      })),
    );
    concurrent.runtime.sleep = async () => {
      await Bun.sleep(1);
    };
    expect(
      await Promise.all([
        runCli(["me"], concurrent.runtime),
        runCli(["me"], concurrent.runtime),
      ]),
    ).toEqual([0, 0]);
    expect(refreshes).toBe(1);

    const origin = "https://stale.example.test";
    const user = typeof process.getuid === "function" ? process.getuid() : "user";
    const path = join(
      tmpdir(),
      `bananasplit-cli-${user}`,
      createHash("sha256").update(origin).digest("hex"),
    );
    await rm(path, { force: true, recursive: true });
    await mkdir(path, { recursive: true });
    await writeFile(join(path, "owner"), "crashed");
    const staleTime = new Date(Date.now() - 61_000);
    await utimes(path, staleTime, staleTime);

    const stale = harness((url) =>
      url.pathname.endsWith("/oauth2/token")
        ? tokenResponse()
        : Response.json({ id: "user-1", name: "Ada" })
    );
    stale.runtime.env = { BANANASPLIT_API_URL: `${origin}/base` };
    stale.values.clear();
    stale.values.set(
      `banana\0${origin}`,
      JSON.stringify(credential({
        accessTokenExpiresAt: NOW,
        authBaseUrl: `${origin}/api/`,
      })),
    );
    expect(await runCli(["me"], stale.runtime)).toBe(0);
  });

  it("rejects auth output flags without starting login", async () => {
    for (const args of [["login", "--json"], ["--raw", "logout"]]) {
      const result = harness();
      expect(await runCli(args, result.runtime)).toBe(2);
      expect(result.calls).toHaveLength(0);
    }
  });
});
