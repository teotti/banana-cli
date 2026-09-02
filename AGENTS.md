# Working in this repo

A modular CLI wrapping the BananaSplit HTTP API. Read this
before reaching for tools — most of it is stuff that costs a detour to rediscover.

## Running it

```sh
bun run banana <command>          # from the repo root
bun run banana --help
```

Auth comes from the environment, never from a stored credential:

- `BANANASPLIT_TOKEN` — bearer session token, required. Expires after 90 days.
- `BANANASPLIT_API_URL` — defaults to `https://api.bananasplit.net`.

There is no login flow. `.env` is gitignored and holds the real token.

## API contract

The exported Elysia server type previously lived in `server.d.ts`; the modular
refactor removed that snapshot. Consult the backend contract for current routes,
params, bodies and response shapes. The historical snapshot remains available:

```sh
git show 0cf8de2^:server.d.ts
```

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

Conventions: two-space indent, no semicolon-free style, `display()` for
nullables (renders `—`), `humanAmount()`, `namedEntity()` for `Name · id`,
`formatCard()` for numbered lists. Errors throw `CliFailure` with a type of
`usage` | `config` | `network` | `api`; usage errors exit 2, others 1.

Interactive TTYs get a searchable browser for list presentations; non-TTY falls
back to plain cards. Keep both paths working.

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
