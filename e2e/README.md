# End-to-end staging suite

Opt-in checks that run the real CLI against staging. `bun test` does not run
them and does not touch the network. There is no scheduler and no telemetry.

The suite is macOS-only. It talks to staging through a subprocess, so a
compiled binary and `bun run ./src/index.ts` are exercised the same way.

## Configure

Set the variables in [`env.example`](env.example). Staging has to be explicit:
`BANANASPLIT_E2E_API_URL` pointing at `https://api.bananasplit.net` is refused.
The account id is the dedicated test user, and the partner is a non-guest
friend of that user. Leave the partner email empty when that account has
none. A guest friend lets `--filter guests` check that guests
are included and the partner is not; without one, that check is skipped and
the run continues. At least two friends are needed for `friends list --cursor`.
A missing partner or currency blocks the run before any create.

Credentials are stored apart from your normal login. The suite sets
`BANANASPLIT_NO_KEYCHAIN=1` and `XDG_DATA_HOME` to
`~/.local/share/banana-e2e` (or `BANANASPLIT_E2E_HOME`). It does not inherit
`BANANASPLIT_AUTH_URL` from the shell; set `BANANASPLIT_E2E_AUTH_URL` when
auth is not the API origin's `/api`. Production smoke uses
`~/.local/share/banana-e2e-production`.

```sh
bun run e2e login
bun run e2e login --production
```

`login` is the normal browser approval. Approve the device code it prints.
Ctrl-C before approval cancels it; that path is one of the manual checks.

## Run

```sh
bun run e2e run
bun run e2e run --binary dist/banana
bun run e2e production-smoke
bun run e2e accept
bun run e2e accept --binary dist/banana
```

Build a compiled binary with:

```sh
bun build --compile ./src/index.ts --outfile dist/banana
```

`run` executes every automated scenario: reads, searches and pagination,
name resolution, expenses (including every split type, edit, delete and
restore), groups and payments, recurring rules, output modes, and local
commands. `doctor`, `version` and skill install/removal run against a
throwaway directory. `upgrade`, `update`, `uninstall` and `logout` are not
run here; they are manual, and only against a disposable install.

`accept` runs the suite twice, then once with a failure injected after the
first create, then once interrupted after a group and an expense exist. Each
of those must leave no active rows, and cleanup is repeated afterwards. Pass
`--binary` to add a compiled run.

`production-smoke` only reads (`me`, balances, currencies, friends, groups,
expenses, recurring rules, `version`, `doctor`). It refuses to call a write
command.

A scenario that is missing a fixture is **blocked**, not passed. Blocked,
failed, and leftover rows all fail the run.

## Cleanup

Every create is written to a journal before the command runs, then updated
with the id immediately after. The journal is
`$BANANASPLIT_E2E_HOME/banana/e2e/journals/<run-id>.json`. A crash leaves it
in place. A run holds an exclusive lock for the staging account until its
own cleanup finishes. Another `run` or `cleanup` refuses to touch that
account while the lock's process is alive. A dead process is an abandoned
run: the next one takes the lock and cleans the journal first, and refuses
to start if that cleanup fails.

Each `banana` command and each cleanup request is printed on stdout. The suite
shares one clock and sends at most 24 API requests a minute, under staging's
limit of 30. A 429 waits for the server's `retryAfterSeconds` and tries the
same read, delete, or edit again. A create looks for the row first and sends
it again only when that row is absent.

A create whose process was killed, timed out, lost the connection, or got a
gateway or server error stays pending until a search finds the row. Cleanup
looks more than once, and a still-missing create fails the run instead of
being forgotten. A usage error or a client error from the API that left no
row is absent. Ctrl-C stops the command in flight and waits for that process
to exit before cleanup. The first signal still writes the report and
`E2E_RESULT`, then exits 130. A second signal stops the process immediately.
A failing scenario uses the same cleanup. Order is recurring rules, then
payments and expenses. Payment listings are checked while their groups still
exist; a later cleanup treats a missing group as having no active payments.
Groups go last. Expenses go through
`banana expenses delete`, including expenses that a scenario restored.
Groups use `DELETE /groups/:id` and payments use `DELETE /payments/:id`.
Those calls are fixture management; the suite still tests the CLI's own
delete and restore commands. Rules use `banana recurring delete`. Expenses
created by a test rule are journaled and removed too. Lifecycle rules use a
start date in 2099. One rule starts yesterday so `--recurring` has a generated
expense to find, and cleanup removes that expense too.

A create whose response was lost is matched by the full run marker (a uuid),
the account, and the recorded title, amount and group. A name prefix is not
enough, and two matching rows are left in place rather than guessed. Cleanup
does not delete a row whose text lacks the marker, so pre-existing fixtures
and other people's data stay.

Afterwards the run checks that its rows are gone from active listings and
that balances match the snapshot taken before the first write. Soft-deleted
rows may still exist inside the database; they must not show up as active.
If anything remains, the run fails and prints:

```sh
bun run e2e cleanup <run-id>
```

That command is safe to repeat.

Reports are written next to the journals, with the CLI version, git commit,
target, each scenario, and the cleanup result. Tokens are redacted. Manual
checks are listed there and are never marked passed by the suite:

- browser login, and cancelling it
- refresh after the access token expires
- macOS keychain access after the binary is replaced
- terminal search, navigation and pagination
- delivery of the `--notify-me` push the suite sends
- `upgrade` / `update` and `uninstall` in a disposable install with its own credentials
- `logout` of a disposable user, not the staging account

## Coverage

`e2e/coverage.ts` lists every command, alias and documented flag. A unit
test fails when a scenario stops exercising one, or when a help page grows a
flag the matrix does not name. Manual commands stay in the matrix so a
missing `logout` or `uninstall` is visible rather than silently dropped.
