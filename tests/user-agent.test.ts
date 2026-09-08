import { describe, expect, it } from "bun:test";
import { runCli } from "../src/index";
import { isCI, userAgent } from "../src/shared";
import { harness } from "./helpers";

function sentUserAgent(init: RequestInit | undefined) {
  return (init?.headers as Record<string, string>)["user-agent"] as string;
}

describe("CI detection", () => {
  it("reads the generic and the provider-specific variables", () => {
    expect(isCI({})).toBe(false);
    expect(isCI({ CI: "true" })).toBe(true);
    expect(isCI({ CI: "1" })).toBe(true);
    expect(isCI({ GITHUB_ACTIONS: "true" })).toBe(true);
    expect(isCI({ BUILDKITE: "true" })).toBe(true);
    expect(isCI({ TF_BUILD: "True" })).toBe(true);
  });

  it("treats an empty or falsy value as not CI", () => {
    expect(isCI({ CI: "" })).toBe(false);
    expect(isCI({ CI: "0" })).toBe(false);
    expect(isCI({ CI: "false" })).toBe(false);
    expect(isCI({ GITHUB_ACTIONS: " " })).toBe(false);
  });
});

describe("user agent", () => {
  it("carries the version, platform and run context", () => {
    expect(userAgent({})).toMatch(
      /^bananasplit-cli\/\d+\.\d+\.\d+ \(\w+ \w+; bun [\d.]+; (ci|tty|pipe)\)$/,
    );
  });

  it("labels the run context so the API can tell the sources apart", () => {
    expect(userAgent({ CI: "true" })).toContain("; ci)");
    expect(userAgent({ GITHUB_ACTIONS: "true" })).toContain("; ci)");
    // Not a TTY under the test runner, so an uncontrolled env reads as a pipe.
    expect(userAgent({})).toContain("; pipe)");
  });

  it("reaches the API on every request", async () => {
    const { calls, runtime } = harness(Response.json([]));
    runtime.env = { ...runtime.env, CI: "true" };

    expect(await runCli(["friends"], runtime)).toBe(0);

    expect(sentUserAgent(calls[0]?.init)).toContain("bananasplit-cli/");
    expect(sentUserAgent(calls[0]?.init)).toContain("; ci)");
  });

  it("reaches the auth server too, so logins are labelled", async () => {
    const { calls, runtime } = harness((url) =>
      url.pathname.endsWith("/device/code")
        ? Response.json({
            device_code: "device",
            expires_in: 600,
            interval: 1,
            user_code: "CODE-1234",
            verification_uri: "https://api.example.test/activate",
            verification_uri_complete: "https://api.example.test/activate?c=1",
          })
        : Response.json({ error: "expired_token" }, { status: 400 }),
    );
    runtime.env = { ...runtime.env, CI: "true" };
    runtime.openUrl = async () => {};

    expect(await runCli(["login"], runtime)).toBe(1);

    expect(sentUserAgent(calls[0]?.init)).toContain("; ci)");
  });
});
