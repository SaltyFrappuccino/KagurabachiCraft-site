import { getGithubSourceConfig } from "../../src/server/env.js";
import { HttpError } from "../../src/server/errors.js";
import { parseReleaseFilters } from "../../src/server/query.js";
import { getTaggedDownloadTarget } from "../../src/server/release-service.js";
import { errorJson, redirect } from "../_lib/response.js";

const readTagFromPath = (request: Request): string | null => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const rawTag = pathParts[pathParts.length - 1];
  if (!rawTag) {
    return null;
  }

  return decodeURIComponent(rawTag);
};

export async function GET(request: Request): Promise<Response> {
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
