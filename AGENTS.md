# Working in this repo

A modular CLI wrapping the BananaSplit HTTP API. Read this
before reaching for tools — most of it is stuff that costs a detour to rediscover.

## Running it

```sh
bun run banana <command>          # from the repo root
bun run banana --help
```

Auth comes from `banana login`, keyed by API origin. `src/secrets.ts` picks the
backend: the macOS keychain, or a `0600` JSON file at
`${XDG_DATA_HOME:-~/.local/share}/banana/credentials.json` everywhere else.

- `BANANASPLIT_API_URL` — defaults to `https://api.bananasplit.net`.
- `BANANASPLIT_AUTH_URL` — optional complete `/api` auth base for split-origin
  or loopback development.
- `BANANASPLIT_NO_KEYCHAIN` — use the file store on macOS too.

**The keychain is reached by spawning `/usr/bin/security`, not `Bun.secrets`,
and that is load-bearing.** macOS grants keychain access per code signature and
records the caller in the item's ACL. `Bun.secrets` makes the CLI itself the
caller, so its signature lands in the ACL — and since `bun build --compile`
ad-hoc signs with the generic identifier `a.out`, the ACL falls back to the
binary's cdhash. Every `banana update` replaces the binary, changing that hash,
so the next authenticated command blocked on a GUI keychain prompt that no
agent or CI job can answer. `/usr/bin/security` is Apple-signed and never
changes, so the ACL stays valid across updates.

Measured on macOS 15: two ad-hoc builds with different cdhashes completed a
full write/read/delete cycle through `/usr/bin/security` with no prompt, while
an ad-hoc build calling `Bun.secrets` on an item it had not written blocked
until it was killed. Signing releases with a Developer ID would also fix it,
but costs $99/yr and is unnecessary. Don't reintroduce `Bun.secrets` here.

`security` is given the secret on stdin (`-w` with no argument, value twice)
rather than as an argument, which would expose it in the process list.

## API contract

The exported Elysia server type lives in `server.d.ts` at the repo root.
Consult this local contract snapshot for routes, params, request bodies and
response shapes.

Do not probe the live API to find out what exists.

**If you do probe the live API, use a real id.** A bogus UUID returns 404 for
both "route does not exist" and "row does not exist", so a 404 on a made-up id
proves nothing. This exact mistake produced a confident, wrong "the API has no
edit endpoint" conclusion.

## API conventions worth knowing

- **No `PATCH` anywhere.** Edits are `PUT`, and `PUT` is a *full replace* — send
  every field or they get cleared. The CLI's `expenses edit` handles this by
  `GET`ting the row and merging the flags over it before the `PUT`.
- **`PUT` responses are thin.** They return the flat DB row: no `shares`, no
  `paidByUser` / `group` / `currency` expansions. `GET` again if you need those
  for display.
- **An expense is group-scoped or friendship-scoped, never both.** Setting
  `groupId` requires nulling `friendshipId`, and vice versa.
- **Amounts are strings** with 18 decimal places (`"8.100000000000000000"`).
  Compare them numerically, not by string equality.
- **The write field is `splits`; the read field is `shares`.** Sending an
  expense uses `splits: [{userId, amount}]`; reading one back gives
  `shares: [{userId, amount, user: {...}}]`.
- Splits must sum to the amount, so changing an amount means recomputing them.
- List endpoints page with `p` / `l` query params and return
  `{items, hasMore, nextCursor}`.

## Code layout

`src/index.ts` is the executable entry point and re-exports the public API.
`src/cli.ts` coordinates this pipeline:

1. **Parse** — `parseCommand` dispatches to parsers in `src/commands/`,
   each returning a `ParsedCommand`: either `{kind: "help"}` or
   `{kind: "request", path, method?, body?, query?, presentation}`.
2. **Request** — `src/request.ts` handles auth, timeout, and error mapping.
3. **Present** — each command module exports presenters with `clean()` (the
   `--json` shape) and `format()` (the default output). `--raw` skips both.

To add a command: update help and the relevant parser/presenter in
`src/commands/`, and extend `Presentation` in `src/types.ts`. Register new
command modules in `src/cli.ts`. Multi-step commands are wired in `runCli` —
see `mergeExpenseBody` in `src/commands/expenses.ts` and the group members merge.
Reuse helpers from `src/shared.ts`; interactive browsing lives in `src/browser.ts`.
The browser keeps a stack of collections: a presenter's `browser.links` names the
collections an item's detail view can drill into (a group offers members,
expenses and activity; a friend offers those plus shared groups), `runCli`
fetches and cleans each one into a `BrowserLevel`, and Esc pops back to the
detail it was opened from. A linked collection needs no command of its own —
only a presentation with a presenter, like `friend-groups`.

Help pages are data, not strings: each command builds one with `helpText()`
from `src/help.ts` (`summary`, `usage`, `commands`, `options`, `notes`,
`examples`, `learnMore`), which lays the sections out and aligns every table on
the page to one column width. `colorizeHelp()` paints the section titles yellow
and the example lines blue on a TTY. Usage errors carry both: throw
`usageFailure(reason, HELP)` from `src/shared.ts` so the terminal shows a
one-line reason with that command's help under it, while `--json` still reports
the reason alone.

Conventions: two-space indent, no semicolon-free style, `display()` for
nullables (renders `—`), `humanAmount()` and `humanNumber()` for money,
`humanDate()` for timestamps. Human output is built from `src/render.ts`:
`table()` for listings (blue headings, ids in blue, one column per field),
`fields()` for detail blocks (`Label: value`, values aligned, ids last and
blue), plus `heading()`, `note()` and `section()`. Errors throw `CliFailure` with a type of
`usage` | `config` | `network` | `api`; usage errors exit 2, others 1.

Interactive TTYs get a searchable browser for list presentations; non-TTY falls
back to plain cards. Keep both paths working.

## Usage tracking

There is **no client-side telemetry** and no analytics SDK. Usage is measured on
the API side, from the request the CLI already makes. Do not add an event
capture, a PostHog key, or a phone-home to this repo.

What makes that work is the user-agent, built by `userAgent()` in
`src/shared.ts` and sent on every API request (`src/request.ts`) and every OAuth
request (`src/auth.ts`):

```
bananasplit-cli/0.2.1 (darwin arm64; bun 1.3.9; tty)
```

The last field is the run context: `ci` when `isCI()` matches (the generic `CI`
variable or a known provider's), `tty` for an interactive terminal, `pipe`
otherwise. **The API depends on this format** — changing it silently breaks the
backend's parsing, so treat it as a contract and update both sides together.

The blind spot is deliberate and worth remembering: anything that fails before a
request is invisible to the backend. Usage errors (exit 2), `--help`, and
offline or expired-login failures never reach the API at all.

## Testing

Ask elevated permission to run tests outside the sandbox (for example, `bun test`).

Tests are split by command, with CLI and browser coverage alongside them.
`tests/helpers.ts` provides a `harness()` that injects a fake
`fetch`, `env`, `stdout` and `stderr`. Assert on request URL/method/body and on
rendered output. No network in tests.

```sh
bun test
bun run typecheck
```

Both commands pass with Bun 1.4.0. TypeScript is a dev dependency. Bun 1.3.9
previously rejected `preload = []` in `bunfig.toml`; use the verified Bun version
if that error occurs. Don't report a green run you didn't get.

## Live data

There is no staging environment. Anything you run hits the real account, and
creates are visible to the other people in a group. Prefer reads. If you must
test a write, use a throwaway row you created, revert it, and confirm the
revert.
