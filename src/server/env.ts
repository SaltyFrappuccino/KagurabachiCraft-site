import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface GithubSourceConfig {
  owner: string;
  repo: string;
  token?: string;
  releasesUrl: string;
}

const DEFAULT_GITHUB_OWNER = "SaltyFrappuccino";
const DEFAULT_GITHUB_REPO = "KagurabachiCraft";

type BunLike = {
  env?: Record<string, string | undefined>;
};

const stripWrappingQuotes = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const readDotEnvFile = (): Record<string, string> => {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return {};
  }

  const fileContent = readFileSync(envPath, "utf8");
  const entries = fileContent.split(/\r?\n/);
  const parsedValues: Record<string, string> = {};

  for (const line of entries) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    parsedValues[key] = stripWrappingQuotes(rawValue);
  }

  return parsedValues;
};

const readEnvValue = (key: string): string | undefined => {
  const processValue = process.env[key]?.trim();
  if (processValue) {
    return processValue;
  }

  const bunValue = ((globalThis as typeof globalThis & { Bun?: BunLike }).Bun?.env?.[key] ?? "").trim();
  if (bunValue) {
    return bunValue;
  }

  const fileValue = readDotEnvFile()[key]?.trim();
  if (fileValue) {
    return fileValue;
  }

  return undefined;
};

export const getGithubSourceConfig = (): GithubSourceConfig => {
  const owner = readEnvValue("GITHUB_OWNER") || DEFAULT_GITHUB_OWNER;
  const repo = readEnvValue("GITHUB_REPO") || DEFAULT_GITHUB_REPO;
  const token = readEnvValue("GITHUB_TOKEN");

  return {
    owner,
    repo,
    token: token && token.length > 0 ? token : undefined,
    releasesUrl: `https://github.com/${owner}/${repo}/releases`,
  };
};
