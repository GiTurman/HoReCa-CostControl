# Phase 6 GitHub Pages Preview Setup

## Purpose

Phase 6 adds a GitHub Pages deployment workflow so the app can be opened in a browser URL and Phase 5 smoke tests can be executed against a real preview environment.

## Expected preview URL

After this PR is merged and GitHub Pages is enabled, the expected app URL should be similar to:

```text
https://giturman.github.io/HoReCa-CostControl/
```

## What changed

Added:

- .github/workflows/deploy-pages.yml

Updated:

- vite.config.ts

## Build behavior

Local development remains unchanged:

```bash
npm run dev
```

Local builds still use root base path unless GitHub Pages mode is explicitly enabled.

GitHub Pages deployment builds with:

```text
GITHUB_PAGES=true
```

When that environment variable is enabled, Vite uses this base path:

```text
/HoReCa-CostControl/
```

## GitHub repository settings required

GitHub Pages may need to be enabled in repository settings:

1. Open repository Settings.
2. Go to Pages.
3. Set source to GitHub Actions.
4. Save.
5. Re-run the Deploy Preview to GitHub Pages workflow if needed.

## GitHub Pages source status

Status on 2026-07-06:

- Source was set to GitHub Actions in repository Settings > Pages.
- A follow-up main-branch push may be needed to trigger the new Pages workflow after the setting was saved.

## After deployment

Open the preview URL and execute:

- docs/phase-5-persistence-smoke-test-checklist.md

Focus on:

- login;
- data save;
- refresh persistence;
- tab close/reopen persistence;
- localStorage key: cost-control-storage;
- backup export;
- backup restore;
- invalid backup blocking.

## Safety

This phase does not change business logic, data shape, backup validation, or store behavior.

It only adds deployment configuration and a GitHub Pages base path for production preview builds.
