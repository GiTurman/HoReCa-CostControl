# Phase 1 Non-Technical Validation Guide

This guide is written for the project owner. You do not need to be a developer to use it.

## Purpose

Phase 1 must be safe. It should prepare the project for future storage modes without damaging the working application.

## What this PR is allowed to change

Only these areas are allowed:

- New documentation files under `docs/`.
- New storage foundation files under `src/app/storage/`.
- New migration foundation file under `src/app/migrations/`.

## What this PR must not change

Do not merge this PR if you see changes in any of these areas unless they were explicitly approved later:

- `src/app/App.tsx`
- current pages/screens
- existing routes
- existing login flow
- existing `store.ts`
- purchases logic
- menu logic
- sales logic
- inventory logic
- dashboard logic
- current backup/restore UI

## Simple owner check

Open the PR and click `Files changed`.

You should only see newly added files such as:

```text
docs/...
src/app/storage/...
src/app/migrations/...
```

If you see existing business files changed, stop and ask for review before merging.

## Safe merge rule

This PR can be considered safe only if all of these are true:

1. It is a draft or reviewable PR, not direct changes to `main`.
2. It adds foundation files only.
3. It does not change the current UI.
4. It does not change the current data storage behavior.
5. It does not require a server.
6. It does not require cloud services.
7. The free Local Browser version remains the default.

## Manual app test after merging later

When this PR is eventually merged, test only the normal app actions:

1. Open the app.
2. Login as before.
3. Check that existing data appears.
4. Export a backup.
5. Restore a backup if you have a safe test backup.
6. Add one test purchase.
7. Add or open one menu item.
8. Add one test sale.
9. Check inventory page loads.
10. Confirm the app does not ask for cloud/server setup.

## If something looks wrong

Do not panic and do not delete data.

1. Do not merge additional PRs.
2. Export a backup if the app still opens.
3. Report the exact screen or error message.
4. Use the previous `main` branch version if rollback is needed.

## Important note

Phase 1 is not intended to activate Desktop, Local Network, or Cloud mode. It only prepares the code structure for those future options.
