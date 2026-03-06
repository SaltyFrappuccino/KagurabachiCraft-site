import { getGithubSourceConfig } from "../../src/server/env";
import { HttpError } from "../../src/server/errors";
import { parseReleaseFilters } from "../../src/server/query";
import { getLatestDownloadTarget } from "../../src/server/release-service";
import { errorJson, redirect } from "../_lib/response";

export async function GET(request: Request): Promise<Response> {
  const source = getGithubSourceConfig();
  const fallbackUrl = source.releasesUrl;

  try {
    const url = new URL(request.url);
    const filters = parseReleaseFilters(url.searchParams, false);
    const { asset } = await getLatestDownloadTarget(source, filters);
    return redirect(asset.downloadUrl);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorJson(error.status, error.message, fallbackUrl, error.details);
    }

    return errorJson(503, "Скачивание временно недоступно", fallbackUrl);
  }
}
