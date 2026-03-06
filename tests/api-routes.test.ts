// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as latestDownloadRoute from "../api/download/latest";
import * as releasesRoute from "../api/releases";
import { clearGithubReleasesCache } from "../src/server/github-client";
import { githubReleasesFixture } from "./fixtures/github-releases";

describe("api routes", () => {
  beforeEach(() => {
    process.env.GITHUB_OWNER = "example";
    process.env.GITHUB_REPO = "repo";
    delete process.env.GITHUB_TOKEN;
    clearGithubReleasesCache();
  });

  it("returns releases list without requiring loader filters", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => Response.json(githubReleasesFixture));

    const response = await releasesRoute.GET(new Request("http://localhost/api/releases"));
    const payload = (await response.json()) as { releases: Array<{ tag: string; notes: string }> };

    expect(response.status).toBe(200);
    expect(payload.releases[0].tag).toBe("v1.1.0-beta");
    expect(payload.releases[0].notes).toContain("Preview build");
    fetchMock.mockRestore();
  });

  it("redirects latest download without query params", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => Response.json(githubReleasesFixture));

    const response = await latestDownloadRoute.GET(
      new Request("http://localhost/api/download/latest"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("v1.1.0-beta");
    fetchMock.mockRestore();
  });

  it("returns degraded error when GitHub API rate limit is hit", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const headers = new Headers();
      headers.set("x-ratelimit-remaining", "0");
      return new Response("{}", {
        status: 403,
        headers,
      });
    });

    const response = await releasesRoute.GET(new Request("http://localhost/api/releases"));
    const payload = (await response.json()) as { error: string; fallbackUrl: string };

    expect(response.status).toBe(503);
    expect(payload.error).toContain("GitHub API");
    expect(payload.fallbackUrl).toContain("/releases");
    fetchMock.mockRestore();
  });
});
