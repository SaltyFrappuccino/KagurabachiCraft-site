import { getGithubSourceConfig } from "../../src/server/env";
import { HttpError } from "../../src/server/errors";
import { parseReleaseFilters } from "../../src/server/query";
import { getTaggedDownloadTarget } from "../../src/server/release-service";
import { errorJson, redirect } from "../_lib/response";

const readTagFromPath = (request: Request): string | null => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const rawTag = pathParts[pathParts.length - 1];
  if (!rawTag) {
    return null;
  }
  return decodeURIComponent(rawTag);
};

export default async function handler(request: Request): Promise<Response> {
  const source = getGithubSourceConfig();
  const fallbackUrl = source.releasesUrl;

  try {
    const tag = readTagFromPath(request);
    if (!tag) {
      throw new HttpError(400, "Не указан тег релиза");
    }

    const url = new URL(request.url);
    const filters = parseReleaseFilters(url.searchParams, false);
    const { asset } = await getTaggedDownloadTarget(source, tag, filters);
    return redirect(asset.downloadUrl);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorJson(error.status, error.message, fallbackUrl, error.details);
    }

    return errorJson(503, "Скачивание версии временно недоступно", fallbackUrl);
  }
}
