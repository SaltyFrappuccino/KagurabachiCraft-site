import { getGithubSourceConfig } from "../src/server/env";
import { HttpError } from "../src/server/errors";
import { parseReleaseFilters } from "../src/server/query";
import { listReleases } from "../src/server/release-service";
import { errorJson, json } from "./_lib/response";

export async function GET(request: Request): Promise<Response> {
  const source = getGithubSourceConfig();
  const fallbackUrl = source.releasesUrl;

  try {
    const url = new URL(request.url);
    const filters = parseReleaseFilters(url.searchParams, false);
    const data = await listReleases(source, filters);
    return json(data);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorJson(error.status, error.message, fallbackUrl, error.details);
    }

    return errorJson(503, "Сервис релизов временно недоступен", fallbackUrl);
  }
}
