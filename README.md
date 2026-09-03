# BananaSplit CLI

Standalone access to the BananaSplit API for people and shell-enabled agents.

## Setup

Install [Bun](https://bun.sh), clone this repository, and install its
dependencies:

```sh
bun install
```

Set your BananaSplit session token:

```sh
export BANANASPLIT_TOKEN="your-bearer-session-token"
# Optional; defaults to production:
export BANANASPLIT_API_URL="http://localhost:8080"
```

## Usage

Run from the repository root with `bun run banana`:

```sh
bun run banana me
bun run banana balance
bun run banana balances
bun run banana currencies
bun run banana friends
bun run banana groups
bun run banana groups members GROUP_ID
bun run banana groups activities GROUP_ID --search dinner
bun run banana expenses list
bun run banana expenses get EXPENSE_ID
bun run banana payments get PAYMENT_ID
```

List expenses across the authenticated account, sorted by date or amount:

```sh
banana expenses list --sort amount --direction desc --limit 10
banana expenses list --recurring --sort date --direction asc
banana expenses list --no-recurring --json
```

Omit both recurring flags to include all expenses. In the interactive browser,
reaching the last item loads and appends the next page with the same sorting,
filtering, and page size. Outside the browser, use `--cursor CURSOR` with the
same options to retrieve the next page. JSON output includes `items`, `hasMore`, and
`nextCursor`. Each item includes `share`, the current user's share amount,
and `isRecurring`. Full splits are available through expense details.

Create groups, expenses, and payments with explicit API IDs:

```sh
banana groups create --name "Lisbon trip" --currency-id CURRENCY_ID \
  --type travel --member USER_ID

banana expenses add --title Dinner --amount 42 --currency-id CURRENCY_ID \
  --paid-by-id USER_ID --date 2026-09-01 --group-id GROUP_ID \
  --split-type custom --split USER_ID=22 --split FRIEND_ID=20

banana payments add --amount 20 --currency-id CURRENCY_ID \
  --from-user-id USER_ID --to-user-id FRIEND_ID --date 2026-09-01 \
  --description "Settle up"
```

Edit an expense in place. Only the fields you pass change; everything else
keeps its current value:

```sh
banana expenses edit EXPENSE_ID --title "Chinese dinner"
banana expenses edit EXPENSE_ID --group-id GROUP_ID
banana expenses edit EXPENSE_ID --amount 60 --split USER_ID=30 --split FRIEND_ID=30
banana expenses edit EXPENSE_ID '{"description":null}'
```

Moving an expense into a group with `--group-id` clears its direct friendship
link; `--no-group` does the reverse. Changing `--amount` on an equal split
redistributes the splits automatically; any other split type needs matching
`--split` values.

Each create command also accepts its API body as one quoted JSON object:

```sh
banana groups create '{"name":"Lisbon trip","currencyId":"CURRENCY_ID"}'
banana expenses add '{"title":"Dinner","amount":"42","currencyId":"CURRENCY_ID","paidById":"USER_ID","date":"2026-09-01","splits":[{"userId":"USER_ID","amount":"42"}]}'
banana payments add '{"amount":"20","currencyId":"CURRENCY_ID","fromUserId":"USER_ID","toUserId":"FRIEND_ID","date":"2026-09-01"}'
```

Direct expenses require at least one `--split USER_ID=AMOUNT`. Group expenses
may omit `--split` to use the group's configured default split.

Commands print a clean, human-readable summary by default. Use `--json` for
the same operational fields as compact JSON, or `--raw` for the complete API
response:

```sh
banana me
banana --json groups list --limit 10
banana groups get GROUP_ID --raw
```

The output flag may appear before or after the command. `--json` and `--raw`
cannot be used together.

In an interactive terminal, `balance users`, `friends list`, `groups list`, `expenses list`,
`groups members`, and `groups activities` open searchable browsers; type to
filter, use the arrow keys to select an item, press Enter to open its details,
Esc to return, and `q` to quit. In a non-interactive command card, friend and
group lists fall back to five items and print a copyable `Next page` cursor
command. Expense lists also default to five items outside the browser and show
the next cursor. In the browser they use the API's default page size and load
more as you reach the end. Search filters all loaded expenses; press ↓ at the
end (or when no items match) to load another page. If loading fails, press ↓
to retry. Use `--limit N` to choose a page size.

To expose `banana` on your path during local development:

```sh
bun link
banana --help
```

Configuration, network, API, and usage errors are written to stderr. Human
commands print `Error: MESSAGE`, `--json` prints a structured error object, and
`--raw` prints the API error body when available.
Session tokens currently expire after 90 days; interactive login and stored
credentials are not included in this first version.
