import { expect, test } from "@playwright/test";
import type { ReleasesApiResponse } from "../../src/shared/releases";

const releasesPayload: ReleasesApiResponse = {
  generatedAt: "2026-03-05T12:00:00Z",
  source: {
    owner: "example",
    repo: "repo",
    releasesUrl: "https://github.com/example/repo/releases",
  },
  releases: [
    {
      tag: "v1.1.0-beta",
      title: "v1.1.0 Beta",
      publishedAt: "2026-02-20T12:00:00Z",
      prerelease: true,
      htmlUrl: "https://github.com/example/repo/releases/tag/v1.1.0-beta",
      notes: "Preview build for NeoForge 1.21.1",
      assets: [
        {
          name: "kagurabachicraft-1.21.1-neoforge.jar",
          downloadUrl: "https://cdn.example.com/v1.1.0-beta/neoforge.jar",
          size: 7_340_032,
          loader: "neoforge",
          mcVersion: "1.21.1",
          updatedAt: "2026-02-20T12:00:00Z",
        },
      ],
    },
    {
      tag: "v1.0.0",
      title: "v1.0.0",
      publishedAt: "2026-01-20T12:00:00Z",
      prerelease: false,
      htmlUrl: "https://github.com/example/repo/releases/tag/v1.0.0",
      notes: "Stable release",
      assets: [
        {
          name: "kagurabachicraft-1.21.1-neoforge.jar",
          downloadUrl: "https://cdn.example.com/v1.0.0/neoforge.jar",
          size: 6_291_456,
          loader: "neoforge",
          mcVersion: "1.21.1",
          updatedAt: "2026-01-20T12:00:00Z",
        },
      ],
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/releases**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(releasesPayload),
    });
  });

  await page.route("**/api/download/latest**", async (route) => {
    await route.fulfill({
      status: 302,
      headers: { location: "/downloads/latest.jar" },
    });
  });

  await page.route("**/api/download/**", async (route) => {
    if (route.request().url().includes("/api/download/latest")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 302,
      headers: { location: "/downloads/tagged.jar" },
    });
  });

  await page.route("**/downloads/*.jar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/java-archive",
      body: "fake-jar",
    });
  });
});

test("renders landing layout and releases", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /kagurabachi craft/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Версии" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Установка" })).toBeVisible();
  await expect(page.getByRole("button", { name: /v1\.1\.0 beta/i })).toBeVisible();
});

test("latest download button performs redirect flow", async ({ page }) => {
  await page.goto("/");

  await Promise.all([
    page.waitForURL("**/downloads/latest.jar"),
    page.getByRole("link", { name: "Скачать последнюю версию" }).click(),
  ]);

  expect(page.url()).toContain("/downloads/latest.jar");
});

test("version-specific download leads to tagged file", async ({ page }) => {
  await page.goto("/");

  await Promise.all([
    page.waitForURL("**/downloads/tagged.jar"),
    page.getByRole("link", { name: "Скачать релиз" }).click(),
  ]);

  expect(page.url()).toContain("/downloads/tagged.jar");
});

test("switches selected release in the detail panel", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /v1\.0\.0/i }).click();

  await expect(page.getByRole("heading", { name: "v1.0.0" })).toBeVisible();
  await expect(page.getByText("Stable release")).toBeVisible();
});

test("shows error state when releases endpoint fails", async ({ page }) => {
  await page.route("**/api/releases**", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Превышен лимит GitHub API",
        fallbackUrl: "https://github.com/example/repo/releases",
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByText("Превышен лимит GitHub API")).toBeVisible();
});

test("shows empty state when no matching releases found", async ({ page }) => {
  await page.route("**/api/releases**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...releasesPayload,
        releases: [],
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByText("Подходящих релизов пока нет.")).toBeVisible();
});
