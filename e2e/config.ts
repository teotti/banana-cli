import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_API_URL } from "../src/auth";
import type { Environment } from "../src/types";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export type Target = {
  apiUrl: string;
  origin: string;
  authUrl?: string;
  dataDir: string;
  binary?: string;
};

export type StagingConfig = Target & {
  accountId: string;
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  partnerEmail?: string;
  partnerPrefix: string;
  partnerSubstring: string;
  currency: string;
};

export type SmokeConfig = Target & {
  accountId?: string;
};

function required(env: Environment, name: string) {
  const value = env[name]?.trim();
  if (!value) {
    throw new ConfigError(`${name} is required. See e2e/README.md.`);
  }
  return value;
}

function httpsUrl(raw: string, name: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ConfigError(`${name} must be an absolute URL.`);
  }
  if (url.protocol !== "https:") {
    throw new ConfigError(`${name} must use HTTPS.`);
  }
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

export function productionOrigin() {
  return new URL(DEFAULT_API_URL).origin;
}

export function assertMacOS(platform = process.platform) {
  if (platform !== "darwin") {
    throw new ConfigError(
      "The staging end-to-end suite runs on macOS. This machine is " +
        platform +
        ".",
    );
  }
}

function isolatedHome(env: Environment, name: string, fallback: string) {
  const value = env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function rejectProduction(url: URL) {
  if (url.origin === productionOrigin()) {
    throw new ConfigError(
      "Refusing to run writes against production. Point BANANASPLIT_E2E_API_URL at staging.",
    );
  }
}

function optionalAuth(env: Environment) {
  const raw = env.BANANASPLIT_E2E_AUTH_URL?.trim();
  if (!raw) return undefined;
  const url = httpsUrl(raw, "BANANASPLIT_E2E_AUTH_URL");
  url.pathname = url.pathname.replace(/\/+$/, "");
  if (!url.pathname.endsWith("/api")) {
    throw new ConfigError(
      "BANANASPLIT_E2E_AUTH_URL must be the complete auth base ending in /api.",
    );
  }
  return url.toString();
}

function uuid(value: string, name: string) {
  if (!UUID.test(value)) throw new ConfigError(`${name} must be a UUID.`);
  return value.toLowerCase();
}

function person(value: string, name: string) {
  if (value.includes("=")) {
    throw new ConfigError(`${name} cannot contain '='.`);
  }
  return value;
}

function optionalEmail(env: Environment) {
  const raw = env.BANANASPLIT_E2E_PARTNER_EMAIL?.trim();
  if (!raw) return {};
  const checked = person(raw, "BANANASPLIT_E2E_PARTNER_EMAIL");
  if (!checked.includes("@")) {
    throw new ConfigError("BANANASPLIT_E2E_PARTNER_EMAIL must contain '@'.");
  }
  return { partnerEmail: checked };
}

export function defaultStagingHome(env: Environment = process.env) {
  return join(
    env.HOME || homedir(),
    ".local",
    "share",
    "banana-e2e",
  );
}

export function defaultProductionHome(env: Environment = process.env) {
  return join(
    env.HOME || homedir(),
    ".local",
    "share",
    "banana-e2e-production",
  );
}

export function resolveStagingConfig(
  env: Environment,
  platform = process.platform,
): StagingConfig {
  assertMacOS(platform);
  const url = httpsUrl(
    required(env, "BANANASPLIT_E2E_API_URL"),
    "BANANASPLIT_E2E_API_URL",
  );
  rejectProduction(url);
  const dataDir = isolatedHome(
    env,
    "BANANASPLIT_E2E_HOME",
    defaultStagingHome(env),
  );
  const productionHome = isolatedHome(
    env,
    "BANANASPLIT_E2E_PRODUCTION_HOME",
    defaultProductionHome(env),
  );
  if (dataDir === productionHome) {
    throw new ConfigError(
      "Staging and production credential directories must be different.",
    );
  }
  const binary = env.BANANASPLIT_E2E_BINARY?.trim();
  const authUrl = optionalAuth(env);
  return {
    apiUrl: url.toString(),
    origin: url.origin,
    ...(authUrl === undefined ? {} : { authUrl }),
    dataDir,
    ...(binary ? { binary } : {}),
    accountId: uuid(
      required(env, "BANANASPLIT_E2E_ACCOUNT_ID"),
      "BANANASPLIT_E2E_ACCOUNT_ID",
    ),
    partnerId: uuid(
      required(env, "BANANASPLIT_E2E_PARTNER_ID"),
      "BANANASPLIT_E2E_PARTNER_ID",
    ),
    partnerName: person(
      required(env, "BANANASPLIT_E2E_PARTNER_NAME"),
      "BANANASPLIT_E2E_PARTNER_NAME",
    ),
    partnerUsername: person(
      required(env, "BANANASPLIT_E2E_PARTNER_USERNAME"),
      "BANANASPLIT_E2E_PARTNER_USERNAME",
    ),
    ...optionalEmail(env),
    partnerPrefix: person(
      required(env, "BANANASPLIT_E2E_PARTNER_PREFIX"),
      "BANANASPLIT_E2E_PARTNER_PREFIX",
    ),
    partnerSubstring: person(
      required(env, "BANANASPLIT_E2E_PARTNER_SUBSTRING"),
      "BANANASPLIT_E2E_PARTNER_SUBSTRING",
    ),
    currency: required(env, "BANANASPLIT_E2E_CURRENCY"),
  };
}

export function resolveSmokeConfig(
  env: Environment,
  platform = process.platform,
): SmokeConfig {
  assertMacOS(platform);
  const url = httpsUrl(DEFAULT_API_URL, "production API");
  const dataDir = isolatedHome(
    env,
    "BANANASPLIT_E2E_PRODUCTION_HOME",
    defaultProductionHome(env),
  );
  const stagingHome = isolatedHome(
    env,
    "BANANASPLIT_E2E_HOME",
    defaultStagingHome(env),
  );
  if (dataDir === stagingHome) {
    throw new ConfigError(
      "Production smoke credentials must live in a different directory from staging.",
    );
  }
  const account = env.BANANASPLIT_E2E_PRODUCTION_ACCOUNT_ID?.trim();
  const binary = env.BANANASPLIT_E2E_BINARY?.trim();
  return {
    apiUrl: url.toString(),
    origin: url.origin,
    dataDir,
    ...(binary ? { binary } : {}),
    ...(account
      ? {
          accountId: uuid(account, "BANANASPLIT_E2E_PRODUCTION_ACCOUNT_ID"),
        }
      : {}),
  };
}
