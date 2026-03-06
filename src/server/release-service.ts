import { HttpError } from "./errors.js";
import type { GithubSourceConfig } from "./env.js";
import {
  fetchGithubReleases,
  type GithubRelease,
  type GithubReleaseAsset,
} from "./github-client.js";
import { doesAssetMatchFilters, parseModAssetName } from "./release-matcher.js";
import type { ModAsset, ReleaseEntry, ReleaseFilters, ReleasesApiResponse } from "../shared/releases.js";

const getPublishedAt = (release: GithubRelease): string => release.published_at || release.created_at;

const byPublishedDateDesc = (left: GithubRelease, right: GithubRelease): number =>
  new Date(getPublishedAt(right)).getTime() - new Date(getPublishedAt(left)).getTime();

const mapGithubAssetToModAsset = (asset: GithubReleaseAsset): ModAsset | null => {
  const parsedAsset = parseModAssetName(asset.name);
  if (!parsedAsset) {
    return null;
  }

  return {
    name: asset.name,
    downloadUrl: asset.browser_download_url,
    size: asset.size,
    loader: parsedAsset.loader,
    mcVersion: parsedAsset.mcVersion,
    updatedAt: asset.updated_at,
  };
};

const mapRelease = (release: GithubRelease, filters: ReleaseFilters): ReleaseEntry | null => {
  const modAssets = release.assets
    .map(mapGithubAssetToModAsset)
    .filter((asset): asset is ModAsset => asset !== null)
    .filter((asset) =>
      doesAssetMatchFilters(
        {
          loader: asset.loader,
          mcVersion: asset.mcVersion,
        },
        filters,
      ),
    );

  if (modAssets.length === 0) {
    return null;
  }

  return {
    tag: release.tag_name,
    title: release.name?.trim() || release.tag_name,
    publishedAt: getPublishedAt(release),
    prerelease: release.prerelease,
    htmlUrl: release.html_url,
    notes: release.body?.trim() || "",
    assets: modAssets,
  };
};

const normalizeReleases = (
  githubReleases: GithubRelease[],
  filters: ReleaseFilters,
): ReleaseEntry[] =>
  githubReleases
    .filter((release) => !release.draft)
    .sort(byPublishedDateDesc)
    .map((release) => mapRelease(release, filters))
    .filter((release): release is ReleaseEntry => release !== null);

export const listReleases = async (
  source: GithubSourceConfig,
  filters: ReleaseFilters,
  fetchImpl: typeof fetch = fetch,
): Promise<ReleasesApiResponse> => {
  const githubReleases = await fetchGithubReleases(source, fetchImpl);
  const releases = normalizeReleases(githubReleases, filters);

  return {
    generatedAt: new Date().toISOString(),
    source: {
      owner: source.owner,
      repo: source.repo,
      releasesUrl: source.releasesUrl,
    },
    releases,
  };
};

const findAssetFromRelease = (
  release: ReleaseEntry | undefined,
  filters: ReleaseFilters,
): ModAsset | null => {
  if (!release) {
    return null;
  }

  return (
    release.assets.find((asset) => doesAssetMatchFilters(assetToParsedAsset(asset), filters)) ?? null
  );
};

const assetToParsedAsset = (asset: ModAsset) => ({
  loader: asset.loader,
  mcVersion: asset.mcVersion,
});

export const getLatestDownloadTarget = async (
  source: GithubSourceConfig,
  filters: ReleaseFilters,
  fetchImpl: typeof fetch = fetch,
): Promise<{ release: ReleaseEntry; asset: ModAsset }> => {
  const releasesData = await listReleases(source, filters, fetchImpl);
  const latestRelease = releasesData.releases[0];
  const asset = findAssetFromRelease(latestRelease, filters);

  if (!latestRelease || !asset) {
    throw new HttpError(
      404,
      "Подходящий релиз не найден",
      "GitHub release найден, но в нем нет .jar файла с поддерживаемым именем.",
    );
  }

  return { release: latestRelease, asset };
};

export const getTaggedDownloadTarget = async (
  source: GithubSourceConfig,
  tag: string,
  filters: ReleaseFilters,
  fetchImpl: typeof fetch = fetch,
): Promise<{ release: ReleaseEntry; asset: ModAsset }> => {
  const releasesData = await listReleases(source, filters, fetchImpl);
  const release = releasesData.releases.find((item) => item.tag === tag);
  const asset = findAssetFromRelease(release, filters);

  if (!release || !asset) {
    throw new HttpError(
      404,
      "Версия не найдена",
      "Для выбранного тега нет подходящего .jar файла.",
    );
  }

  return { release, asset };
};
