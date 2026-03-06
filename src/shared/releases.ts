export const MOD_LOADERS = ["fabric", "forge", "neoforge"] as const;

export type ModLoader = (typeof MOD_LOADERS)[number];

export interface ModAsset {
  name: string;
  downloadUrl: string;
  size: number;
  mcVersion: string;
  loader: ModLoader;
  updatedAt: string;
}

export interface ReleaseEntry {
  tag: string;
  title: string;
  publishedAt: string;
  prerelease: boolean;
  htmlUrl: string;
  notes: string;
  assets: ModAsset[];
}

export interface ReleasesSource {
  owner: string;
  repo: string;
  releasesUrl: string;
}

export interface ReleasesApiResponse {
  generatedAt: string;
  source: ReleasesSource;
  releases: ReleaseEntry[];
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
  fallbackUrl: string;
}

export interface ReleaseFilters {
  loader?: ModLoader;
  mc?: string;
}

export const isModLoader = (value: string): value is ModLoader =>
  MOD_LOADERS.includes(value as ModLoader);
