import { HttpError } from "./errors";
import type { GithubSourceConfig } from "./env";

export interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  updated_at: string;
}

export interface GithubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  created_at: string;
  assets: GithubReleaseAsset[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;

const releasesCache = new Map<
  string,
  {
    expiresAt: number;
    value: GithubRelease[];
  }
>();

const getCacheKey = (source: GithubSourceConfig): string => `${source.owner}/${source.repo}`;

export const clearGithubReleasesCache = (): void => {
  releasesCache.clear();
};

const buildHeaders = (source: GithubSourceConfig): HeadersInit => {
  let headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "kagurabachicraft-site",
  };

  if (source.token) {
    headers = {
      ...headers,
      Authorization: `Bearer ${source.token}`,
    };
  }

  return headers;
};

export const fetchGithubReleases = async (
  source: GithubSourceConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<GithubRelease[]> => {
  const cacheKey = getCacheKey(source);
  const now = Date.now();
  const fromCache = releasesCache.get(cacheKey);
  if (fromCache && fromCache.expiresAt > now) {
    return fromCache.value;
  }

  const apiUrl = new URL(
    `https://api.github.com/repos/${source.owner}/${source.repo}/releases`,
  );
  apiUrl.searchParams.set("per_page", "100");

  let response: Response;
  try {
    response = await fetchImpl(apiUrl, {
      headers: buildHeaders(source),
    });
  } catch (error) {
    throw new HttpError(
      503,
      "GitHub API недоступен",
      error instanceof Error ? error.message : "Ошибка сети",
    );
  }

  if (!response.ok) {
    const isRateLimited =
      response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";

    if (isRateLimited) {
      throw new HttpError(503, "Превышен лимит GitHub API", "Попробуйте обновить страницу позже.");
    }

    if (response.status === 404) {
      throw new HttpError(
        404,
        "Репозиторий с релизами не найден",
        "Проверь, что в .env указан репозиторий, где опубликованы Releases с файлами мода.",
      );
    }

    throw new HttpError(
      503,
      "Не удалось получить релизы из GitHub",
      `GitHub вернул статус ${response.status}.`,
    );
  }

  const body = (await response.json()) as unknown;
  if (!Array.isArray(body)) {
    throw new HttpError(503, "Некорректный ответ GitHub API");
  }

  const releases = body.filter((release): release is GithubRelease => {
    if (!release || typeof release !== "object") {
      return false;
    }

    const item = release as Partial<GithubRelease>;
    return Boolean(
      item.tag_name &&
        item.html_url &&
        (typeof item.body === "string" || item.body === null || item.body === undefined) &&
        typeof item.prerelease === "boolean" &&
        Array.isArray(item.assets),
    );
  });

  releasesCache.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    value: releases,
  });

  return releases;
};
