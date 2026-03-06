// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLatestDownloadTarget, listReleases } from "../src/server/release-service";
import { clearGithubReleasesCache } from "../src/server/github-client";
import type { GithubSourceConfig } from "../src/server/env";
import { githubReleasesFixture } from "./fixtures/github-releases";

const source: GithubSourceConfig = {
  owner: "example",
  repo: "repo",
  releasesUrl: "https://github.com/example/repo/releases",
};

describe("release-service", () => {
  beforeEach(() => {
    clearGithubReleasesCache();
  });

  it("returns normalized releases for selected loader and MC", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(githubReleasesFixture, {
        status: 200,
      }),
    );

    const payload = await listReleases(source, { loader: "fabric", mc: "1.20.1" }, fetchMock);

    expect(payload.releases).toHaveLength(2);
    expect(payload.releases[0].tag).toBe("v1.1.0-beta");
    expect(payload.releases[0].prerelease).toBe(true);
    expect(payload.releases[0].notes).toContain("Preview build");
    expect(payload.releases[0].assets[0].name).toBe("kagurabachicraft-1.20.1-fabric.jar");
  });

  it("selects latest release by published date, including prerelease", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(githubReleasesFixture, {
        status: 200,
      }),
    );

    const latest = await getLatestDownloadTarget(source, { loader: "fabric", mc: "1.20.1" }, fetchMock);
    expect(latest.release.tag).toBe("v1.1.0-beta");
    expect(latest.asset.downloadUrl).toContain("v1.1.0-beta/fabric.jar");
  });
});
