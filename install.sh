#!/bin/sh

set -eu

REPOSITORY="teotti/banana-cli"
VERSION="${BANANA_VERSION:-latest}"
INSTALL_DIR="${BANANA_INSTALL_DIR:-${HOME}/.local/bin}"

case "$(uname -s)" in
  Darwin) OS="darwin" ;;
  Linux) OS="linux" ;;
  *) echo "Unsupported operating system: $(uname -s)" >&2; exit 1 ;;
esac

case "$(uname -m)" in
  arm64|aarch64) ARCH="arm64" ;;
  x86_64|amd64) ARCH="x64" ;;
  *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

if [ "$VERSION" = "latest" ]; then
  BASE_URL="https://github.com/${REPOSITORY}/releases/latest/download"
elif printf '%s\n' "$VERSION" | grep -Eq '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'; then
  BASE_URL="https://github.com/${REPOSITORY}/releases/download/${VERSION}"
else
  echo "BANANA_VERSION must be latest or a stable tag such as v0.1.0" >&2
  exit 1
fi

BASE_URL="${BANANA_RELEASE_BASE_URL:-$BASE_URL}"
ARCHIVE="banana-${OS}-${ARCH}.tar.gz"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT HUP INT TERM

curl -fsSL "${BASE_URL}/${ARCHIVE}" -o "${TEMP_DIR}/${ARCHIVE}"
curl -fsSL "${BASE_URL}/SHA256SUMS" -o "${TEMP_DIR}/SHA256SUMS"

EXPECTED="$(awk -v archive="$ARCHIVE" '$2 == archive { print $1 }' "${TEMP_DIR}/SHA256SUMS")"
[ -n "$EXPECTED" ] || { echo "No checksum found for ${ARCHIVE}" >&2; exit 1; }

if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL="$(sha256sum "${TEMP_DIR}/${ARCHIVE}" | awk '{ print $1 }')"
elif command -v shasum >/dev/null 2>&1; then
  ACTUAL="$(shasum -a 256 "${TEMP_DIR}/${ARCHIVE}" | awk '{ print $1 }')"
else
  echo "sha256sum or shasum is required" >&2
  exit 1
fi

[ "$EXPECTED" = "$ACTUAL" ] || { echo "Checksum verification failed for ${ARCHIVE}" >&2; exit 1; }

tar -xzf "${TEMP_DIR}/${ARCHIVE}" -C "$TEMP_DIR"
mkdir -p "$INSTALL_DIR"
install -m 755 "${TEMP_DIR}/banana" "${INSTALL_DIR}/banana"

echo "Installed banana to ${INSTALL_DIR}/banana"
case ":${PATH}:" in
  *":${INSTALL_DIR}:"*) ;;
  *) echo "Add ${INSTALL_DIR} to PATH to run banana from any shell." ;;
esac

# Only worth saying to someone who runs an agent, so look before offering.
for AGENT_HOME in \
  "${HOME}/.claude" \
  "${HOME}/.codex" \
  "${HOME}/.cursor" \
  "${HOME}/.gemini" \
  "${XDG_CONFIG_HOME:-${HOME}/.config}/opencode"; do
  if [ -d "$AGENT_HOME" ]; then
    echo "Run 'banana skill install' to teach your coding agents this CLI."
    break
  fi
done
