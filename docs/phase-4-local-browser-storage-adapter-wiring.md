# Phase 4 Local Browser Storage Adapter Wiring

## Purpose

Phase 4 prepares the current Zustand localStorage persistence for safer storage-mode wiring.

The goal is to preserve the current free offline browser behavior while creating a small bridge that can later be used by the active store persistence setup.

## Why this phase is cautious

The current app uses Zustand persist with synchronous browser localStorage.

The Phase 1 storage adapter uses an asynchronous interface. Directly replacing Zustand persistence with the asynchronous adapter would be risky because Zustand storage expects synchronous getItem, setItem, and removeItem behavior in the current setup.

## Added in this phase

Added:

- src/app/storage/zustandLocalBrowserStorage.ts

Updated:

- src/app/storage/index.ts

## What the bridge does

The new bridge exposes a small synchronous browser storage wrapper with:

- getItem
- setItem
- removeItem
- storageKey

It keeps the default key aligned with the existing application storage key:

- cost-control-storage

## What did not change

This phase does not change:

- active Zustand store persistence;
- localStorage key;
- persisted data shape;
- login flow;
- backup and restore flow;
- products, purchases, sales, dishes, inventory, or dashboard logic;
- cloud, backend, or network behavior.

## Current status

The bridge is added and exported, but active store persistence is intentionally not switched yet.

This keeps the app safe while making the next step smaller and easier to review.

## Next safe step

A later PR can change store.ts minimally to use:

- DEFAULT_STORAGE_KEY instead of the hardcoded key;
- zustandLocalBrowserStorage instead of direct localStorage access.

That future change should be reviewed carefully because it touches active persistence.

## Acceptance criteria for this phase

This phase can be accepted if:

- the app builds successfully;
- only storage bridge files and documentation are changed;
- no active app behavior changes;
- the default storage key remains cost-control-storage;
- no backend, cloud, or network dependency is introduced.
