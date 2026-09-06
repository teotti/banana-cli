# BananaSplit CLI

Standalone access to the BananaSplit API for people and shell-enabled agents.

## Install

macOS and Linux (no Bun or Node required):

```sh
curl -fsSL https://github.com/teotti/banana-cli/releases/latest/download/install.sh | sh
```

Windows PowerShell (no Bun or Node required):

```powershell
irm https://github.com/teotti/banana-cli/releases/latest/download/install.ps1 | iex
```

Or install the TypeScript package with [Bun](https://bun.sh):

```sh
bun install -g @bananasplitapp/cli
```

Set `BANANA_INSTALL_DIR` to choose a different destination. To install a
specific standalone release instead of the latest:

```sh
curl -fsSL https://github.com/teotti/banana-cli/releases/latest/download/install.sh \
  | BANANA_VERSION=v0.1.0 sh
```

```powershell
$env:BANANA_VERSION = "v0.1.0"
irm https://github.com/teotti/banana-cli/releases/latest/download/install.ps1 | iex
```

Release downloads are verified against the published SHA-256 checksums before
an existing installation is replaced.

## Setup

Sign in through BananaSplit's device approval page:

```sh
banana login
```

The CLI prints a short code and verification URL, then tries to open that URL
in your browser. On SSH or a headless machine, open the printed URL on another
device and confirm that the browser shows the same code. Credentials are stored
only in the operating system credential store through `Bun.secrets`; there is
no plaintext or environment-token fallback.

To use a local loopback deployment:

```sh
export BANANASPLIT_API_URL="http://localhost:8080"
# Optional when auth runs at a separate origin; include the complete /api base:
export BANANASPLIT_AUTH_URL="http://localhost:8081/api"
banana login
```

Non-loopback API, auth, and verification URLs must use HTTPS. Automated
environments need a supported OS credential store populated through the same
`banana login` flow.

## Usage

Run `banana` from any directory:

```sh
banana login
banana me
banana balance
banana balances
banana currencies
banana friends
banana groups
banana groups members GROUP_ID
banana groups activities GROUP_ID --search dinner
banana expenses list
banana expenses get EXPENSE_ID
banana payments get PAYMENT_ID
banana logout
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

## Development

Install Bun, clone this repository, then install dependencies and expose
`banana` on your path:

```sh
bun install
bun link
banana --help
```

Run the checks with:

```sh
bun test
bun run typecheck
```

## Releasing

The repository must be public and the `@bananasplitapp` npm organization must
exist before the first release. Store a temporary granular npm publishing
token with bypass 2FA as the `NPM_TOKEN` repository secret, update the version
in `package.json`, then push its matching stable tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The tag workflow tests all targets, publishes the GitHub release, and publishes
the npm package. After the first npm release, configure `release.yml` as the
package's trusted GitHub Actions publisher and remove `NPM_TOKEN`; subsequent
publishes use OIDC automatically.

Configuration, network, API, and usage errors are written to stderr. Human
commands print `Error: MESSAGE`, `--json` prints a structured error object, and
`--raw` prints the API error body when available.

`banana logout` revokes the stored refresh token before deleting the local
credential. The last access token may remain valid server-side for up to 15
minutes, but it is removed locally and cannot be refreshed.
