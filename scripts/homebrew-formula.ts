/**
 * Writes the Homebrew formula for one release, from that release's
 * SHA256SUMS. The release workflow runs it and pushes the result to
 * teotti/homebrew-bananasplit, so the formula is never edited by hand.
 *
 *   bun run scripts/homebrew-formula.ts <version> <SHA256SUMS> [base-url]
 *
 * `base-url` replaces the GitHub release download URL, which is how CI
 * installs the formula from the archives it just built. Homebrew reads the
 * version from the URL, so a base URL has to end in `/v<version>` too.
 */

const ARCHIVES = {
  "darwin-arm64": "banana-darwin-arm64.tar.gz",
  "darwin-x64": "banana-darwin-x64.tar.gz",
  "linux-arm64": "banana-linux-arm64.tar.gz",
  "linux-x64": "banana-linux-x64.tar.gz",
} as const;

type Platform = keyof typeof ARCHIVES;

const VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

/** `sha256sum` output, keyed by file name. */
export function parseChecksums(text: string) {
  const sums = new Map<string, string>();
  for (const line of text.split("\n")) {
    const [sum, name] = line.trim().split(/\s+\*?/);
    if (sum && name) sums.set(name, sum);
  }
  return sums;
}

export function homebrewFormula(options: {
  version: string;
  checksums: string;
  baseUrl?: string;
}) {
  if (!VERSION.test(options.version)) {
    throw new Error(`Not a release version: ${options.version}`);
  }
  const base = (
    options.baseUrl ??
    `https://github.com/teotti/banana-cli/releases/download/v${options.version}`
  ).replace(/\/$/, "");
  const sums = parseChecksums(options.checksums);

  const archive = (platform: Platform, indent: string) => {
    const name = ARCHIVES[platform];
    const sum = sums.get(name);
    if (!sum) throw new Error(`No checksum for ${name}`);
    return [
      `${indent}url "${base}/${name}"`,
      `${indent}sha256 "${sum}"`,
    ].join("\n");
  };

  return `class Bananasplit < Formula
  desc "Split expenses and settle balances on BananaSplit from the terminal"
  homepage "https://docs.bananasplit.net"
  license "MIT"

  on_macos do
    on_arm do
${archive("darwin-arm64", "      ")}
    end
    on_intel do
${archive("darwin-x64", "      ")}
    end
  end

  on_linux do
    on_arm do
${archive("linux-arm64", "      ")}
    end
    on_intel do
${archive("linux-x64", "      ")}
    end
  end

  def install
    bin.install "banana"
    bin.install_symlink "banana" => "bananasplit"
  end

  test do
    assert_match "banana <command>", shell_output("#{bin}/bananasplit --help")
  end
end
`;
}

if (import.meta.main) {
  const [version, checksumsPath, baseUrl] = Bun.argv.slice(2);
  if (!version || !checksumsPath) {
    console.error(
      "Usage: bun run scripts/homebrew-formula.ts <version> <SHA256SUMS> [base-url]",
    );
    process.exit(2);
  }
  process.stdout.write(
    homebrewFormula({
      version,
      checksums: await Bun.file(checksumsPath).text(),
      baseUrl,
    }),
  );
}
