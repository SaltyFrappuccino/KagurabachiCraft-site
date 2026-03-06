import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import type { ReleasesApiResponse } from "../src/shared/releases";

const createPayload = (releasesCount: number): ReleasesApiResponse => ({
  generatedAt: "2026-03-05T00:00:00Z",
  source: {
    owner: "example",
    repo: "repo",
    releasesUrl: "https://github.com/example/repo/releases",
  },
  releases: Array.from({ length: releasesCount }).map((_, index) => ({
    tag: `v1.${index}.0`,
    title: `v1.${index}.0`,
    publishedAt: `2026-02-${20 - index}T10:00:00Z`,
    prerelease: index === 0,
    htmlUrl: `https://github.com/example/repo/releases/tag/v1.${index}.0`,
    notes: `Release notes for v1.${index}.0`,
    assets: [
      {
        name: "kagurabachicraft-1.21.1-neoforge.jar",
        downloadUrl: `https://cdn.example.com/v1.${index}.0.jar`,
        size: 1024 * 1024 * 7,
        mcVersion: "1.21.1",
        loader: "neoforge",
        updatedAt: "2026-02-20T10:00:00Z",
      },
    ],
  })),
});

describe("App", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/releases")) {
        return Response.json(createPayload(2), { status: 200 });
      }
      return Response.json({ error: "Unknown endpoint" }, { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders hero and version list", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /kagurabachicraft/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Скачать последнюю версию" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Версии" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /v1\.0\.0/i })).toBeInTheDocument();
    });
  });

  it("shows empty state when no releases are returned", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json(createPayload(0), { status: 200 }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Подходящих релизов пока нет.")).toBeInTheDocument();
    });
  });
});
