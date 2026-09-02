# BananaSplit CLI

Read-only access to the BananaSplit API for people and shell-enabled agents.

## Setup

```sh
export BANANASPLIT_TOKEN="your-bearer-session-token"
# Optional; defaults to production:
export BANANASPLIT_API_URL="http://localhost:8080"
```

Run from the repository root:

```sh
bun --filter @bananasplit/cli banana me
bun --filter @bananasplit/cli banana groups list --limit 10
bun --filter @bananasplit/cli banana groups members GROUP_ID
bun --filter @bananasplit/cli banana groups activities GROUP_ID --search dinner
```

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

In an interactive terminal, list commands (`groups list`, `groups members`,
`groups activities`, and `balance users`) open in `less` without leaving the
current terminal screen. The footer shows the arrow-key and `q` controls; `/`
searches. In a non-interactive command card, `groups list` falls back to five
groups and prints a copyable `Next page` cursor command. Use `--limit N` to
choose a page size.

To expose `banana` on your path during local development:

```sh
cd packages/cli
bun link
banana --help
```

Configuration, network, API, and usage errors remain JSON written to stderr.
Session tokens currently expire after 90 days; interactive login and stored
credentials are not included in this first version.
