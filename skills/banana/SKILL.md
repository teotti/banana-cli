---
name: banana
description: Drive the BananaSplit CLI (`banana`) to split expenses, record payments, and read balances from the terminal. Use when someone wants to log a shared expense or a dinner they paid for, check what they owe or are owed, settle up with a person, list or search groups and friends, or read a group's activity — anything involving BananaSplit, Splitwise-style expense splitting, or the `banana` command.
---

# BananaSplit from the command line

`banana` wraps the BananaSplit HTTP API. It is built for agents: every flag that
could take an id takes a **name** instead, and `--json` gives a flat, stable shape
to parse. You never need to look an id up first.

## Before anything else

```sh
banana me --json
```

- Succeeds → you are signed in; that output has the user's id and name.
- Fails with `{"error":{"type":"config",...}}` → **ask the user to run `banana login`
  themselves.** It is a browser device-approval flow: it prints a code, waits for a
  human to confirm it, and there is no token env var to set. Don't try to automate it.
- `command not found` → install per the repo README (`curl -fsSL
  https://github.com/teotti/banana-cli/releases/latest/download/install.sh | sh`, or
  `bun install -g @bananasplitapp/cli`).

## Four rules

**1. Parse `--json`, never the tables.** The default output is aligned human text
with colors and em-dashes for nulls. `--json` is the curated flat shape; `--raw` is
the untouched API response. Ask for `--json` on every command whose output you
intend to read.

**2. Name people, groups and currencies — don't resolve ids.** `--currency EUR`,
`--group "Lisbon trip"`, `--group Lisbon` (a prefix works), `--paid-by me`,
`--split Ana=20`. Names match exact → prefix → substring, usernames and emails work
too, and an ambiguous name is reported rather than guessed. Ids still work if you
happen to have one. So: no `banana friends` sweep before adding an expense, and no
`banana currencies` before naming a currency.

**3. Reads are free; writes hit a real, shared account.** There is no staging.
An expense you create is visible to everyone in the group. `expenses edit` can undo
an expense mistake, **but a payment cannot be deleted from the CLI** — confirm with
the user before `payments add`.

**4. `--json` carries ids, the terminal carries names.** Cleaned shapes have both
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
| `banana payments add` | `--amount --currency --from --to --date` required; `--group --description` |
| `banana payments get <payment-id>` | |
| `banana groups [list]` | `--search TEXT --limit --cursor --archived --sort balance\|lastActivity` |
| `banana groups create` | `--name --currency` required; `--description --type --member` |
| `banana groups get\|members\|activities <group>` | activities takes `--search --type all\|expenses\|payments\|recurring_expenses --sort --direction` |
| `banana friends [list]` | `--search TEXT --sort balance\|lastActivity --filter all\|guests` |
| `banana currencies [list]` | `--code EUR --search krona` — browsing only, writes take the code directly |
| `banana me` / `login` / `logout` / `update` | |

`banana <command> --help` is authoritative and cheap. Read it before guessing a flag.

## Writing an expense correctly

- **Dates** are `YYYY-MM-DD` or `DD-MM-YYYY`. Required on every write.
- **Splits must add up to `--amount`.** Repeat the flag: `--split me=10 --split Ana=10`.
- **Without `--group`, at least one `--split` is required.** With a group, omitting
  splits splits it across the group.
- **Changing an amount means re-sending splits** that sum to the new total.
- Only the fields you pass to `edit` change; everything else keeps its value.
- Amounts come back as 18-decimal strings (`"8.100000000000000000"`) — compare them
  numerically, never by string equality.

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

A write prints the **whole created row** — currency codes, names, shares — because
the CLI re-reads it for you. Don't follow a create with a `get`.

## Paging

List commands default to 5 rows. `--json` returns `{items, hasMore, nextCursor}`;
pass `nextCursor` back as `--cursor` **with the same other flags** to continue. Raise
`--limit` rather than walking pages when you just need more.

## Failures

Human mode prints a one-line reason plus that command's help. `--json` prints
`{"error":{"type","status?","message","body?"}}` where type is
`usage` | `config` | `network` | `api`.

| exit | meaning |
|---|---|
| 2 | usage error — you got a flag wrong; read the help it printed |
| 1 | config, network or API error |
| 130 | cancelled |

`config` almost always means the login expired: ask the user to run `banana login`.

## Recipes

- **"What do I owe?"** → `banana balances --json`, then report per person by name.
- **"How much does Ana owe me?"** → `banana friends --search ana --json`.
- **"What's been spent on the trip?"** → `banana groups activities "Lisbon trip"
  --type expenses --sort amount --direction desc --json`.
- **"Log the dinner I paid for"** → confirm amount, currency, date and who's in it,
  then one `expenses add`. If they named no group and no one else, ask who to split with.
- **"Settle up with Bruno"** → read `banana balances --json` for the exact figure,
  confirm the number and direction with the user, then one `payments add`.
