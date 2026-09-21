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
binary's cdhash. Every `banana upgrade` replaces the binary, changing that hash,
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

Do not probe the live API to find out what exists. **Read the snapshot
properly instead** — a route missing a parameter you want often means the
parameter lives on a sibling route. `/groups/search` and `/friends/search` sit
right next to the listings they search. Reading only the list routes produced a
confident, wrong "the API cannot filter by name", and a commit that searched on
the wrong route for it.

### Refreshing the snapshot

Staging publishes the export; production does not. So there is one command,
and it is the only way the file should ever change — never hand-edit it:

```sh
bun run contract:download   # curl -fsS -o server.d.ts <staging>/public/server.d.ts
```

**Staging runs ahead of production, and the CLI talks to production.** A route
that is in the snapshot is not necessarily one a released binary can call. An
unknown query parameter is ignored rather than rejected, so calling ahead of
production does not fail — it silently returns unfiltered rows, which is the
failure to watch for: a filter that is not there yet looks like a filter that
matched everything.

`--search` sends `q` to `/groups` and `/friends`, which was staging-only for a
while. Production honours it as of 2026-09-18, so that gate is lifted and the
flag filters for real.

The snapshot cannot tell you what production has shipped. Before a release,
check anything new against production directly — run the command against a
real account (the CLI defaults to production) rather than trusting the types.

**If you do probe the live API, use a real id.** A bogus UUID returns 404 for
both "route does not exist" and "row does not exist", so a 404 on a made-up id
proves nothing. This exact mistake produced a confident, wrong "the API has no
edit endpoint" conclusion.

## API conventions worth knowing

- **No `PATCH` anywhere.** Edits are `PUT`, and `PUT` is a *full replace* — send
  every field or they get cleared. The CLI's `expenses edit` and `recurring
  edit` handle this by `GET`ting the row and merging the flags over it before
  the `PUT` (`merge` on a `RequestCommand` names the path and which merger).
- **Write responses are thin.** `POST` and `PUT` return the flat DB row: no
  `shares`, no `paidByUser` / `group` / `currency` expansions. `GET` again if
  you need those for display — the CLI does this for you, see below.
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
- **Searching is a separate route, not a parameter** (in production; staging
  also takes `q` on the listings). `/groups/search`, `/friends/search` and
  `/groups/:id/activities/search` take `q`, and they do not behave alike.
  `/groups/search` and `/friends/search` page with `p`, take no `cursor` or
  `sort`, and return a bare array; `/groups/:id/activities/search` is a normal
  page, taking `cursor`, `sort`, `direction` and `type` and returning
  `{items, hasMore, nextCursor}`.
  Only the activities one is wired up: `groups activities --search` switches to
  it (`src/commands/groups.ts`), which is why that search works against
  production. `groups --search` and `friends --search` instead send `q` to the
  plain listing, so they stay staging-only until the API ships it.
- **A recurring rule is its own row, not a flag on an expense.** The rules live
  under `/expenses/recurring` (`GET` with `status=all|active|inactive`, `POST`,
  and `GET`/`PUT`/`DELETE` on `/:id`); the expenses a rule generates are normal
  `/expenses` rows carrying `recurringExpenseRuleId`, which is what
  `expenses list --recurring` filters on. Three things about that endpoint set
  it apart from every other write in this repo:
  - **The collection needs a trailing slash and the sub-routes must not have
    one.** `GET`/`POST` go to `/expenses/recurring/`; `GET`/`PUT`/`DELETE` go to
    `/expenses/recurring/:id`. Without the slash the server matches
    `/expenses/:id` first and looks an expense up by the literal id
    `"recurring"`, which answers **500**, not 404 — so the failure reads like a
    server fault rather than a wrong path. That cost a filed backend issue
    before the cause was found. `RECURRING_COLLECTION` and `RECURRING_PATH` in
    `src/commands/recurring.ts` keep the two apart; use the first for the
    collection and the second to build `/:id` paths.
  - **`POST /expenses/recurring` answers `201 Created` with no row and no id.**
    Everything the CLI does after a write — read the row back, print names —
    needs an id, so `findCreatedRecurring` takes the newest rule in the listing
    that matches what was sent. It is the one write whose read-back can pick the
    wrong row, and only if two matching rules are created at the same moment.
  - **Rule rows carry ids where every other row carries expansions**: a
    `currencyId` with no `currency`, a `paidById` with no `paidByUser`, a
    `groupId` with no `group`. `nameRecurring` fills those in — first from the
    occurrences on the detail route (`related`, which is the expenses the rule
    created, each fully expanded), then from one wide page per kind
    (`/currencies`, `/groups`, `/current-user` + `/friends`), fetched only when
    a rule still needs it. A lookup that fails costs the name, not the command,
    so the ids still print.
  - `splits` is **required** on the create, unlike a plain expense, which a
    group can split on the API's side. `recurring add` insists on `--split`
    rather than guessing what an occurrence would be split into.
- **`DELETE` exists here and nowhere else the CLI calls.** `recurring delete` is
  the only command that sends one; a payment still cannot be deleted.
- **Undeleting is a `POST` to a sub-route.** `POST /expenses/:id/restore` and
  `POST /payments/:id/restore` take no body and answer with the full detail —
  expansions and shares included — which makes `expenses restore` and `payments
  restore` the only writes that skip the read-back every other write needs. They
  are idempotent (`200` for a row that is already active) and answer `403`,
  `404` or `409` otherwise, which `request.ts` already surfaces unretried. There
  is no endpoint listing deleted rows, so the id has to come from an activity
  feed.
- **`/currencies` takes no query params at all**, so `banana currencies
  --code`/`--search` fetches the one list and narrows it in the CLI.

## Code layout

`src/index.ts` is the executable entry point and re-exports the public API.
`src/cli.ts` coordinates this pipeline:

1. **Parse** — `parseCommand` dispatches to parsers in `src/commands/`,
   each returning a `ParsedCommand`: either `{kind: "help"}` or
   `{kind: "request", path, method?, body?, query?, presentation}`.
2. **Resolve** — `src/resolve.ts` turns the human identifiers on a command
   into ids before anything is sent.
3. **Request** — `src/request.ts` handles auth, timeout, and error mapping.
4. **Present** — each command module exports presenters with `clean()` (the
   `--json` shape) and `format()` (the default output). `--raw` skips both.

## Naming things instead of looking ids up

Every flag that used to take an id (`--currency-id`, `--paid-by-id`,
`--group-id`, `--from-user-id`) now takes a code, a name, a prefix of one, or
an id: `--currency EUR`, `--group "Lisbon trip"`, `--paid-by me`,
`--split Ana=20`. A `<group>` argument works the same way.

A parser stays pure: it emits `references`, each naming the body field to fill
(a dotted path like `splits.0.userId`, or `path` for the `:ref` placeholder in
the request path), the flag it came from, and what kind of row to look in.
`runCli` resolves them before the request. A value that is already a UUID costs
no lookup at all. Otherwise one name of a kind is asked for by name (`q` on the
plain listing, `l=25` — not the `/search` route, which nothing calls), while
several of a kind — `--split Ana=20 --split Bruno=10` — fetch one wide
page (`l=100`) instead of one request each; either way the rows are matched
exact → prefix → substring, and an ambiguous name is reported rather than
guessed. Because `q` searches names and the CLI also answers to usernames and
emails, a `q` search that finds nothing falls back to one wide sweep before
failing. That sweep carried name resolution on its own while production still
ignored `q`, and is now what catches a username or an email. A `--paid-by` with
no value at all resolves to the signed-in user, which is why adding an expense
needs no `banana me` first.

Two conventions keep the output cheap to read:

- **Writes read their row back.** A `POST` answers with the flat DB row —
  currency ids, no names, no shares — so `runCli` re-`GET`s the created
  expense, payment or group (`CREATED_COLLECTIONS`) before presenting it. One
  command shows the whole created object, in codes and names, with no
  follow-up `get`.
- **Ids live in `--json`, names in the terminal.** Cleaned shapes are flat and
  carry both (`paidById` + `paidBy`, `groupId` + `group`, `userId` + `user`),
  and the id keys match the field names the write endpoints take. Human tables
  print the names; only an entity's own id is worth a row in a detail block.

`postFilter` on a command narrows a response before `clean()` sees it, which
`/currencies` is the only listing still to need.

To add a command: update help and the relevant parser/presenter in
`src/commands/`, and extend `Presentation` in `src/types.ts`. Register new
command modules in `src/cli.ts`. Multi-step commands are wired in `runCli` —
see `mergeExpenseBody` in `src/commands/expenses.ts`, the group members merge,
and the create-lookup and name-filling that `recurring` needs.
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

## The agent skill

`skills/banana/SKILL.md` is the skill `banana skill install` writes into an
agent's skills directory, and `banana skill uninstall` takes back out. `src/skill.ts` imports it with `with { type: "text" }`,
so the markdown is embedded at build time and a standalone binary installs the
skill it was built from — there is no second copy to keep in sync, but
`package.json` `files` has to keep listing `skills` or the npm package installs
a skill it cannot read.

It documents the CLI's surface as agents meet it: the `banana me --json` auth
check, naming instead of ids, `--json` over the tables, and the rules that bite
(splits summing to the amount, a payment that cannot be deleted).

**A command or flag change is not finished until the skill matches it.** Two
tests in `tests/skill.test.ts` enforce that rather than trusting it: one runs
every `banana …` line in the skill through the CLI and fails on exit 2, the
other collects every `--flag` the skill names and fails if one is missing from
the help pages. Both were checked by breaking the skill on purpose.

`AGENTS` in `src/skill.ts` is the table of agents and their home directories:
Claude Code, Codex, Cursor, Gemini CLI and opencode all read the same
`<home>/skills/<name>/SKILL.md` layout, so adding one is a row, not a code
path. With no flags the command installs for the agents whose home directory
is actually on the machine — **detection is a directory stat, because
`Bun.file().exists()` answers false for a directory**, which made a first
version report every agent as missing. The unit tests stub that call, so they
cannot catch it; check `banana skill install --list` against a real machine.

## The doctor

`banana doctor` (`src/doctor.ts`) is the one non-request command with a `--json`
shape, because it has data of its own rather than an API response to reshape.
Each check returns `ok`, `warn` or `fail`, and `overall()` reduces them: exit 1
only on a `fail`, so a missing login — a warning — does not fail a CI job that
only wanted to know the CLI works.

The distinction worth keeping is who can act. Not being signed in is a `warn`
with `banana login` attached; an unreachable API is a `fail` with no fix,
because it is not the user's to fix.

The skill check exists because the skill is embedded per binary: an upgrade
leaves every installed copy behind, and a stale skill still loads and still
describes the CLI you no longer have. Nothing else would tell you.

## Uninstalling

`banana uninstall` (`src/uninstall.ts`) removes the CLI and the login it
stored. Two things it deliberately does not do: edit a shell profile, and
remove the agent skill. The POSIX installer never writes to a profile — it
only prints PATH advice — so there is nothing there to undo; Windows does set
the user Path, and that entry is named rather than removed. The skill belongs
to other tools' directories, so `banana skill uninstall` owns it.

Order matters: revoking the login needs the network, so it happens *before*
the binary goes. A failed revoke aborts with the CLI still installed, rather
than stranding a live credential with no command left to revoke it.

A running binary deleting itself is fine on POSIX and impossible on Windows,
which defers to a detached `Wait-Process` — the same shape `upgrade` uses. A
package install is removed by its package manager, never by deleting
`execPath`, which there is Bun itself.

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
