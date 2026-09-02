import type { CliRuntime } from "../src/index";

export const TOKEN = "secret-session-token";

export function harness(
  response: Response | ((url: URL, init?: RequestInit) => Response) =
    Response.json({ ok: true }),
) {
  const calls: Array<{ init?: RequestInit; url: URL }> = [];
  const stdout: string[] = [];
  const stderr: string[] = [];
  const runtime: CliRuntime = {
    env: {
      BANANASPLIT_API_URL: "https://api.example.test/base",
      BANANASPLIT_TOKEN: TOKEN,
    },
    fetch: async (input, init) => {
      const url = new URL(String(input));
      calls.push({ init, url });
      return typeof response === "function"
        ? response(url, init)
        : response.clone();
    },
    stderr: (value) => stderr.push(value),
    stdout: (value) => stdout.push(value),
  };

  return { calls, runtime, stderr, stdout };
}
