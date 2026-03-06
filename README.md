# KagurabachiCraft Download Site

Dark single-page download hub for `KagurabachiCraft`, built with `React + TypeScript + Bun`.

## What it does

- Pulls mod versions from GitHub Releases.
- Shows a version rail for choosing a specific release.
- Provides `latest` and per-release download routes through Bun API handlers.
- Displays release notes from GitHub in the detail panel.
- Targets a simple flow: one mod, one runtime, one clean download UX.

## API

- `GET /api/releases`
- `GET /api/download/latest`
- `GET /api/download/:tag`

Optional query filters still exist server-side, but the UI does not depend on them anymore.

## Expected asset naming

The release parser still expects mod files to match:

`kagurabachicraft-<mc-version>-<loader>.jar`

Example:

- `kagurabachicraft-1.21.1-neoforge.jar`

## Environment

```bash
GITHUB_OWNER=SaltyFrappuccino
GITHUB_REPO=KagurabachiCraft
GITHUB_TOKEN=
```

`GITHUB_TOKEN` is optional and only helps with GitHub API rate limits.

## Local run

```bash
bun install
bun run dev
```

## Checks

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bun run test:e2e
```

## Deploy

`vercel.json` is configured for Vercel with Bun runtime for `api/**/*.ts`.
