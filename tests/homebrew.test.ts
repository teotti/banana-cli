import { describe, expect, it } from "bun:test";
import { homebrewFormula } from "../scripts/homebrew-formula";
import { homebrew } from "../src/shared";

const CHECKSUMS = [
  "aaa  banana-darwin-arm64.tar.gz",
  "bbb  banana-darwin-x64.tar.gz",
  "ccc  banana-linux-arm64.tar.gz",
  "ddd *banana-linux-x64.tar.gz",
  "eee  banana-windows-x64.zip",
  "",
].join("\n");

describe("Homebrew formula", () => {
  it("pins each platform's archive to its checksum", () => {
    const formula = homebrewFormula({ version: "1.2.3", checksums: CHECKSUMS });

    expect(formula).toContain(
      'url "https://github.com/teotti/banana-cli/releases/download/v1.2.3/banana-darwin-arm64.tar.gz"\n      sha256 "aaa"',
    );
    expect(formula).toContain('banana-darwin-x64.tar.gz"\n      sha256 "bbb"');
    expect(formula).toContain('banana-linux-arm64.tar.gz"\n      sha256 "ccc"');
    expect(formula).toContain('banana-linux-x64.tar.gz"\n      sha256 "ddd"');
    expect(formula).not.toContain("windows");
  });

  it("installs both names", () => {
    const formula = homebrewFormula({ version: "1.2.3", checksums: CHECKSUMS });

    expect(formula).toContain('bin.install "banana"');
    expect(formula).toContain('bin.install_symlink "banana" => "bananasplit"');
  });

  it("downloads from another base URL when given one", () => {
    const formula = homebrewFormula({
      version: "1.2.3",
      checksums: CHECKSUMS,
      baseUrl: "http://127.0.0.1:38123/v1.2.3/",
    });

    expect(formula).toContain(
      'url "http://127.0.0.1:38123/v1.2.3/banana-linux-x64.tar.gz"',
    );
  });

  it("refuses a release that is missing an archive or a version that is not one", () => {
    expect(() =>
      homebrewFormula({ version: "1.2.3", checksums: "aaa  banana-darwin-arm64.tar.gz" }),
    ).toThrow("No checksum for banana-darwin-x64.tar.gz");
    expect(() => homebrewFormula({ version: "v1.2.3", checksums: CHECKSUMS })).toThrow(
      "Not a release version: v1.2.3",
    );
  });
});

describe("Homebrew install detection", () => {
  it("finds the brew that owns a Cellar binary", () => {
    expect(homebrew("/opt/homebrew/Cellar/bananasplit/0.4.0/bin/banana")).toBe(
      "/opt/homebrew/bin/brew",
    );
    expect(homebrew("/usr/local/Cellar/bananasplit/0.4.0/bin/banana")).toBe(
      "/usr/local/bin/brew",
    );
  });

  it("leaves every other install alone", () => {
    expect(homebrew("/home/user/.local/bin/banana")).toBeUndefined();
    expect(homebrew("/opt/homebrew/Cellar/bun/1.4.0/bin/bun")).toBeUndefined();
  });
});
