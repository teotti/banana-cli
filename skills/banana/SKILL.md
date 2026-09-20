---
name: banana
description: Use the BananaSplit CLI (`banana`) to set up the CLI, record and edit shared expenses, record payments, check balances, and browse groups, friends and activity. Applies when the user names BananaSplit or banana, or is working with a BananaSplit account.
---

# BananaSplit from the command line

`banana` wraps the BananaSplit HTTP API. Person, group and currency flags accept
names or codes, and `--json` gives a curated shape to parse. Expense and payment
detail commands still require their row ids.

## Set up the CLI when needed

Check whether `banana` is available with `banana --help`. If it is missing, install
it with the standalone installer for the current platform. It needs no Bun or
Node runtime, and is always the first thing to try.

macOS or Linux:

```sh
curl -fsSL https://github.com/teotti/banana-cli/releases/latest/download/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://github.com/teotti/banana-cli/releases/latest/download/install.ps1 | iex
```

Use the package install only as a fallback, when the installer above fails
(no `curl`, no release for the platform, a blocked download) and Bun is already
there:

```sh
bun install -g @bananasplitapp/cli
```

It installs the CLI as a TypeScript entry point that Bun runs, so Bun reads the
current directory's `tsconfig.json` on every command and may print warnings
about it around Banana's output. The standalone binary carries its own compiled
code and stays quiet.

Verify the installation with `banana --help`. If the shell cannot find the
standalone binary yet, use its full path: `~/.local/bin/banana` on macOS/Linux,
or `$env:LOCALAPPDATA\BananaSplit\bin\banana.exe` on Windows (unless
`BANANA_INSTALL_DIR` was set). Follow the installer's PATH guidance for future
shells. Do not reinstall repeatedly to fix PATH.

The skill is already loaded; there is no need to install it again through the CLI.
The installed CLI's help is authoritative if this skill describes a newer feature.

## Access

Before reading or changing account data, check authentication:

```sh
banana me --json
```

- Succeeds → you are signed in; that output has the user's id and name.
- Reports missing or expired login, or missing API permissions → ask the user to
  run `banana login`. It uses browser device approval that the user completes;
  there is no token environment variable to set. For other `config` errors, read
  the message: an invalid URL or credential-store failure needs a different fix.

## Four rules

**1. Parse `--json`, never the tables.** The default output is aligned human text
with colors and em-dashes for nulls. `--json` is the curated flat shape; `--raw` is
the untouched API response. Ask for `--json` on every command whose output you
intend to read.

**2. Pass names directly for people, groups and currencies.** `--currency EUR`,
`--group "Lisbon trip"`, `--group Lisbon` (a prefix works), `--paid-by me`,
`--split Ana=20`. Names match exact → prefix → substring, usernames and emails work
too, and an ambiguous name is reported rather than guessed. Ids still work if you
happen to have one. Avoid lookup sweeps just to obtain ids. If a name is ambiguous,
use the reported candidates to clarify it. Omitting `--paid-by` defaults to you.

**3. Writes affect a real, shared account.** An expense is visible to the group.
Act on the user's requested changes; ask only for missing or ambiguous details.
A payment records money already paid; it does not transfer money. Payments cannot
be deleted from the CLI, so establish the amount, currency, date, direction and
group (if any) before recording one. A clear request with those details supplies
authorization; a balance inquiry alone does not.

Deleting an expense is permanent and has no undo. It leaves the balances of
everyone it was split with, and they see it go. Delete only what the user asked
you to delete, by an id you confirmed with `banana expenses get` — never one
inferred from a description alone. If the user named an expense rather than an
id, show them the row you matched and let them confirm before deleting it.

**4. Report names and currency codes to the user.** Cleaned shapes have both
(`paidById` + `paidBy`, `groupId` + `group`, `userId` + `user`), and the id keys are
exactly the fields the write endpoints take. When you show results to the user,
show the names.

## The commands

| | |
|---|---|
| `banana balance` | aggregate: what you owe and are owed |
| `banana balances` | the same, per person (alias for `balance users`) |
| `banana expenses list` | `--limit N --cursor C --sort date\|amount --direction asc\|desc --recurring\|--no-recurring` |
| `banana expenses add` | `--title --amount --currency --date` required; `--paid-by --group --description --split-type --split` |
| `banana expenses get <expense-id>` | one expense with payer and splits |
| `banana expenses edit <expense-id>` | any subset of the add flags, plus `--no-group` |
| `banana expenses delete <expense-id>` | permanent, and changes everyone's balance — confirm with the user first |
| `banana recurring list` (or `banana expenses recurring list`) | `--status all\|active\|inactive` — the rules, not the expenses they make |
| `banana recurring add` | `--title --amount --currency --frequency --start --split` required; `--interval --end --paid-by --group --description --split-type` |
| `banana recurring get <rule-id>` | one rule, its splits, and the expenses it created |
| `banana recurring edit <rule-id>` | any subset of the add flags, plus `--no-group --no-end --active --inactive` |
| `banana recurring delete <rule-id>` | removes the rule itself |
| `banana payments add` | `--amount --currency --from --to --date` required; `--group --description` |
| `banana payments get <payment-id>` | |
| `banana groups [list]` | `--search TEXT --limit --cursor --archived --sort balance\|lastActivity` |
| `banana groups create` | `--name --currency` required; `--description --member --type vacation\|roommates\|couple\|travel\|party\|other` |
| `banana groups get\|members\|activities <group>` | activities takes `--search --limit --cursor --type all\|expenses\|payments\|recurring_expenses --sort date\|amount --direction asc\|desc` |
| `banana friends [list]` | `--search TEXT --limit --cursor --sort balance\|lastActivity --filter all\|guests` |
| `banana currencies [list]` | `--code EUR --search krona` — browsing only, writes take the code directly |
| `banana me` / `login` / `logout` / `version` / `upgrade` | `update` is an alias for `upgrade` |
| `banana doctor` | `--json` — version, PATH, API, login and skill freshness |
| `banana uninstall` | removes the CLI itself — ask the user first, and never run it unprompted |

`banana <command> --help` is authoritative and cheap. Read it before guessing a flag.

## Writing an expense correctly

- **Dates** are `YYYY-MM-DD` or `DD-MM-YYYY`, required when adding expenses or
  payments. An edit preserves the existing date unless supplied. Resolve relative
  dates from the user's context; the dates below are examples.
- **A time goes on `--date` after a `T`**: `--date 2026-09-16T21:20:00`, with
  optional seconds, milliseconds and an offset (`Z` or `+02:00`). With no time
  the row lands at midnight UTC, and with no offset the time is read as UTC.
  Pass one whenever the user gave a time — several expenses on one day
  otherwise all read as midnight.
- **Splits must add up to `--amount`.** Repeat the flag: `--split me=10 --split Ana=10`.
- **`--split-type` is `equal`, `custom`, `percentage` or `shares`.** It labels
  how the split was arrived at; `--split` values are amounts in every case, and
  still have to sum to `--amount`.
- **Without `--group`, at least one `--split` is required.** With a group, omitting
  splits lets the API split it across the group. When adding an expense, an explicit
  `--split-type` requires splits.
- **A group states its own default split.** `banana groups get` has
  `defaultSplitType` (`equal` or `percentage`) and `banana groups members` each
  member's `defaultSplitPercentage`. Read those before reconstructing a split
  from past expenses, and label a split that came from the group's percentages
  `percentage`, not `custom`.
- **Changing an amount:** an existing equal split is recomputed across its current
  participants if no splits are supplied. For other split types, supply matching
  `--split` values that sum to the new total.
- Only the fields you pass to `edit` change; everything else keeps its value.
- `--json` amounts are numbers (or null when unavailable). `--raw` may contain
  18-decimal strings such as `"8.100000000000000000"`; compare those numerically.
- Prefer flags to positional JSON bodies: names are resolved through flags, while
  JSON bodies use API fields and ids. A cleaned expense has `splits`, but it is
  not a write payload to send back wholesale.

```sh
# paid for dinner for the trip group
banana expenses add --title Dinner --amount 42 --currency EUR \
  --date 2026-09-09 --group "Lisbon trip" --json

# a taxi split with one friend, no group
banana expenses add --title Taxi --amount 20 --currency EUR \
  --date 2026-09-09 --split me=10 --split Ana=10 --json

# settle up: direction is always named explicitly
banana payments add --amount 20 --currency EUR \
  --from me --to Ana --date 2026-09-09 --json
```

Successful expense, single-payment and group creates, and expense edits, normally
read their detail back for `--json`. No extra `get` is needed. `--raw` skips that
read; a payment response containing multiple rows retains a thin array shape.

## Recurring expenses

A recurring expense is two things: a **rule** that says what to create and how
often, and the **expenses** it has created so far. `banana expenses add` writes
a one-off expense and can never make it recurring; the rule is its own row under
`banana recurring`, which `banana expenses recurring` also reaches.

- **`--frequency` is `daily`, `weekly`, `monthly` or `yearly`**, and `--interval N`
  makes it every N of those (`--frequency weekly --interval 2` is fortnightly).
- **`--start` and `--end` take the same dates `--date` does**, `YYYY-MM-DD` or
  `DD-MM-YYYY` with an optional time. `--start` is required; without `--end` the
  rule runs indefinitely.
- **`--split` is required, even with `--group`.** The splits are the template
  every occurrence is created from, and they must add up to `--amount`.
- **Pausing is not deleting.** `--inactive` stops a rule creating expenses and
  leaves the ones it already created; `banana recurring delete` removes the rule.
- A cleaned rule carries `nextOccurrence`, `lastGenerated` and `active`.
  `banana expenses list --recurring --json` lists the expenses a rule created;
  each one has `isRecurring`.

```sh
# rent, split with a flatmate, every month from October
banana recurring add --title Rent --amount 900 --currency EUR \
  --frequency monthly --start 2026-10-01 \
  --split me=450 --split Ana=450 --json

# stop it without losing the history
banana recurring edit <rule-id> --inactive --json
```

The create endpoint answers with no row, so the CLI finds the rule it just wrote
in the listing and reads it back. That is the one write whose `--json` shape can
be wrong if two rules with the same title and amount are created at once.

## Paging

Expenses, groups and friends listings default to 5 rows. For a paged `--json`
response `{items, hasMore, nextCursor}`, pass a non-null `nextCursor` back as
`--cursor` with the same filters and sorting. Raise `--limit` when useful, but
check `hasMore` before treating a page as complete. Per-person balances, group
members and currencies return arrays instead. Do not assume every collection supports cursors.

`--search` on groups and friends filters on the server. It matches names, while
the CLI also answers to usernames and emails, so a search that finds nothing is
worth retrying as a plain listing before concluding the person is not there.

## Failures

Usage errors in human mode include the command's help. In `--json`, failures
return an `error` object with `type` and `message`, plus optional `status` and
`body`. The type is `usage` | `config` | `network` | `api` | `cancelled`.

| exit | meaning |
|---|---|
| 2 | usage error — inspect the message and request the command's help |
| 1 | config, network or API error |
| 130 | cancelled |

A failed write may already have succeeded: the mutation can complete before a
network failure or a failed detail read. Do not blindly repeat it. Inspect the
relevant expense list or group activity, or use a known row id, to establish what
was saved. If the outcome remains unclear, report the uncertainty before retrying.

## Recipes

- **"What do I owe?"** → `banana balances --json`, then report per person by name.
- **"How much does Ana owe me?"** → `banana friends --search ana --json`, which
  carries her balance and its `currency`. `banana balances --json` has the same
  balance without a currency field.
- **"What's been spent on the trip?"** → `banana groups activities "Lisbon trip"
  --type expenses --sort amount --direction desc --json`.
- **"Log the dinner I paid for"** → establish amount, currency, date and participants,
  then one `expenses add`. If they named no group and no one else, ask who to split with.
- **"Settle up with Bruno"** → read `banana balances --json`, then establish the
  amount, currency, direction, date and group scope, and whether money was paid.
  Balance output has no currency field; inspect the matching friend's `currency`
  or clarify it with the user before recording a payment. Record one payment once the details are authorized.
