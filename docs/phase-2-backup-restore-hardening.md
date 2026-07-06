# Phase 2 Backup Restore Hardening

## Purpose

Phase 2 makes backup and restore safer without changing the current working data model or the main business screens.

## Current situation before Phase 2

The Settings page was reading a selected JSON file, parsing it, and sending the parsed object directly to restoreData.

That flow needed more checks before restoring data.

## Implemented safer flow

The safer restore flow is now:

1. Parse JSON.
2. Detect legacy backup or schema-versioned backup.
3. Check app name when a schema envelope is used.
4. Check schema version.
5. Check that data sections are arrays.
6. Stop restore before writing data when the file is invalid.
7. Keep old valid backups restorable.

## Changed files

Added:

- utils/backupValidation.ts

Updated:

- pages/SettingsPage.tsx

Documentation:

- docs/phase-2-backup-restore-hardening.md

## Backup export behavior

New backup exports are schema-versioned and contain:

- appName
- schemaVersion
- exportedAt
- data

## Restore behavior

Restore accepts:

- new schema-versioned backup files;
- old valid direct backup files.

Restore blocks:

- invalid JSON;
- backup files from another app;
- backup files with unsupported future schema versions;
- backup files where restorable sections are not arrays;
- backup files with no restorable sections.

## Safety boundary

This phase does not change:

- localStorage key;
- store persistence setup;
- product logic;
- purchase logic;
- menu logic;
- sales logic;
- inventory logic;
- login flow.

This phase does change the active Settings backup and restore flow, so it should be reviewed before merging.

## Validation

GitHub Actions build passed after connecting the validation helper to SettingsPage.
