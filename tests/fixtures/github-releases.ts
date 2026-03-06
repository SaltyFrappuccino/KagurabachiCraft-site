import type { GithubRelease } from "../../src/server/github-client";

export const githubReleasesFixture: GithubRelease[] = [
  {
    tag_name: "v1.1.0-beta",
    name: "v1.1.0 Beta",
    body: "Preview build for NeoForge 1.21.1",
    html_url: "https://github.com/example/repo/releases/tag/v1.1.0-beta",
    draft: false,
    prerelease: true,
    published_at: "2026-02-20T12:00:00Z",
    created_at: "2026-02-19T12:00:00Z",
    assets: [
      {
        name: "kagurabachicraft-1.20.1-fabric.jar",
        browser_download_url: "https://cdn.example.com/v1.1.0-beta/fabric.jar",
        size: 7340032,
        updated_at: "2026-02-20T12:00:00Z",
      },
      {
        name: "kagurabachicraft-1.20.1-neoforge.jar",
        browser_download_url: "https://cdn.example.com/v1.1.0-beta/neoforge.jar",
        size: 8126464,
        updated_at: "2026-02-20T12:00:00Z",
      },
      {
        name: "release-notes.zip",
        browser_download_url: "https://cdn.example.com/v1.1.0-beta/release-notes.zip",
        size: 2048,
        updated_at: "2026-02-20T12:00:00Z",
      },
    ],
  },
  {
    tag_name: "v1.0.0",
    name: "v1.0.0",
    body: "Stable release",
    html_url: "https://github.com/example/repo/releases/tag/v1.0.0",
    draft: false,
    prerelease: false,
    published_at: "2026-01-05T12:00:00Z",
    created_at: "2026-01-04T12:00:00Z",
    assets: [
      {
        name: "kagurabachicraft-1.20.1-fabric.jar",
        browser_download_url: "https://cdn.example.com/v1.0.0/fabric.jar",
        size: 6291456,
        updated_at: "2026-01-05T12:00:00Z",
      },
      {
        name: "kagurabachicraft-1.20.1-forge.jar",
        browser_download_url: "https://cdn.example.com/v1.0.0/forge.jar",
        size: 6815744,
        updated_at: "2026-01-05T12:00:00Z",
      },
    ],
  },
];
