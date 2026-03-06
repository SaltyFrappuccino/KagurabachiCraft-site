import type { ModLoader, ReleaseFilters } from "../shared/releases";

const MOD_ASSET_REGEX =
  /^kagurabachicraft-(?<mc>\d+\.\d+(?:\.\d+)?)-(?<loader>fabric|forge|neoforge)\.jar$/i;

export interface ParsedModAssetName {
  mcVersion: string;
  loader: ModLoader;
}

export const parseModAssetName = (assetName: string): ParsedModAssetName | null => {
  const match = MOD_ASSET_REGEX.exec(assetName);
  if (!match?.groups) {
    return null;
  }

  return {
    mcVersion: match.groups.mc,
    loader: match.groups.loader.toLowerCase() as ModLoader,
  };
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
