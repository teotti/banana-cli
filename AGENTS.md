# Working in this repo

A single-file CLI (`src/index.ts`) wrapping the BananaSplit HTTP API. Read this
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

## `server.d.ts` is the API contract — read it first

The repo root has `server.d.ts` (~15k lines): the exported Elysia app type for
the **server**, listing every route with its params, query, body and per-status
response shape. It is the authoritative answer to "does endpoint X exist?".

Do not probe the live API to find out what exists. Extract the route map:

```sh
python3 - <<'PY'
import re
METHODS={"get","post","put","patch","delete","options","head"}
stack=[]; routes=[]
for line in open('server.d.ts'):
    m=re.match(r'^(\s*)("[^"]*"|[A-Za-z_$][\w$]*): \{\s*$', line.rstrip('\n'))
    if not m: continue
    indent=len(m.group(1)); key=m.group(2).strip('"')
    while stack and stack[-1][0]>=indent: stack.pop()
    if key in METHODS and stack:
        routes.append((key.upper(), '/'+'/'.join(k for _,k in stack)))
    else: stack.append((indent,key))
for r in sorted(set(routes), key=lambda r:(r[1],r[0])): print(f"{r[0]:7} {r[1]}")
PY
```

206 routes today; the CLI reaches roughly a dozen of them.

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

`src/index.ts` is ~2400 lines with a clear pipeline. Follow it rather than
inventing a new shape:

1. **Parse** — `parseCommand` dispatches to `parseGroups` / `parseExpenses` /
   etc., each returning a `ParsedCommand`: either `{kind: "help"}` or
   `{kind: "request", path, method?, body?, query?, presentation}`.
2. **Request** — one `request()` does auth, timeout, and error mapping.
3. **Present** — the `presentation` tag drives both `cleanResponse()` (the
   `--json` shape) and `formatHuman()` (the default output). `--raw` skips both.

To add a command: add a help constant, a branch in the relevant `parse*`, a
`Presentation` union member, a `clean*` function, a `cleanResponse` case, and a
`formatHuman` case. Multi-step commands (fetch-then-write, or fetch-then-enrich)
are wired in `runCli` — see `mergeExpense` and the `group` members merge.

Conventions: two-space indent, no semicolon-free style, `display()` for
nullables (renders `—`), `humanAmount()`, `namedEntity()` for `Name · id`,
`formatCard()` for numbered lists. Errors throw `CliFailure` with a type of
`usage` | `config` | `network` | `api`; usage errors exit 2, others 1.

Interactive TTYs get a searchable browser for list presentations; non-TTY falls
back to plain cards. Keep both paths working.

## Testing — and two broken scripts

`tests/cli.test.ts` has 50 tests using a `harness()` that injects a fake
`fetch`, `env`, `stdout` and `stderr`. Assert on request URL/method/body and on
rendered output. No network in tests.

**`bun test` does not run as checked in:**

```
error: Expected preload to be an array
    at bunfig.toml:2:11
```

`bunfig.toml` sets `preload = []`, which Bun 1.3.9 rejects. It dates to the
first commit. Workaround — move the file aside, run, put it back:

```sh
mv bunfig.toml /tmp/bf.bak && bun test; mv /tmp/bf.bak bunfig.toml
```

**`bun run typecheck` does not run either:** `tsc: command not found`.
TypeScript isn't in the dependencies. Also pre-existing.

Neither is fixed, so don't report a green run you didn't get — say which one
you worked around.

## Live data

There is no staging environment. Anything you run hits the real account, and
creates are visible to the other people in a group. Prefer reads. If you must
test a write, use a throwaway row you created, revert it, and confirm the
revert.
