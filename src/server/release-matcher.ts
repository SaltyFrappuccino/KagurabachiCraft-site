import type { ModLoader, ReleaseFilters } from "../shared/releases.js";

const DEFAULT_PROJECT_MC_VERSION = "1.21.1";

const ASSET_PATTERNS = [
  /^kagurabachicraft-(?<mc>\d+\.\d+(?:\.\d+)?)-(?<loader>fabric|forge|neoforge)\.jar$/i,
  /^kagurabachi[_-]?craft[_-]?(?<loader>fabric|forge|neoforge)-(?<modVersion>\d+\.\d+(?:\.\d+)*)\.jar$/i,
] as const;

export interface ParsedModAssetName {
  mcVersion: string;
  loader: ModLoader;
}

export const parseModAssetName = (assetName: string): ParsedModAssetName | null => {
  for (const pattern of ASSET_PATTERNS) {
    const match = pattern.exec(assetName);
    if (!match?.groups) {
      continue;
    }

    return {
      mcVersion: match.groups.mc ?? DEFAULT_PROJECT_MC_VERSION,
      loader: match.groups.loader.toLowerCase() as ModLoader,
    };
  }

  return null;
};

export const doesAssetMatchFilters = (
  parsedAsset: ParsedModAssetName,
  filters: ReleaseFilters,
): boolean => {
  if (filters.loader && parsedAsset.loader !== filters.loader) {
    return false;
  }

  if (filters.mc && parsedAsset.mcVersion !== filters.mc) {
    return false;
  }

  return true;
};

export const compareMcVersionsDesc = (a: string, b: string): number => {
  const aParts = a.split(".").map((part) => Number.parseInt(part, 10));
  const bParts = b.split(".").map((part) => Number.parseInt(part, 10));

  const maxLength = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const aValue = aParts[index] ?? 0;
    const bValue = bParts[index] ?? 0;
    if (aValue !== bValue) {
      return bValue - aValue;
    }
  }

  return 0;
};
