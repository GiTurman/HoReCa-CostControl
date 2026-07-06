# Phase 2 Backup Restore Hardening

## Purpose

Phase 2 makes backup and restore safer without changing the current working data model.

This first step adds validation helpers only. The restore screen will be connected to these helpers in a later commit after build validation passes.

## Current situation

The current Settings page reads a selected JSON file, parses it, and sends the parsed object to restoreData.

The current flow needs more checks before restoring data.

## Target safer flow

The safer restore flow should be:

1. Parse JSON.
2. Detect legacy backup or schema-versioned backup.
3. Check app name when a schema envelope is used.
4. Check schema version.
5. Check that data sections are arrays.
6. Stop restore before writing data when the file is invalid.
7. Keep old valid backups restorable.

## Added in this step

Added:

- utils/backupValidation.ts

This helper supports:

- schema-versioned backup envelopes;
- legacy direct backup objects;
- section validation for products, purchases, sales, dishes, inventory audits, and activity logs;
- clear validation errors;
- no data mutation by itself.

## Safety boundary

This step intentionally does not change:

- Settings page UI;
- restore button behavior;
- store persistence behavior;
- localStorage key;
- existing backup compatibility;
- main business screens.

## Next step

After build validation passes, the next commit can connect this helper to pages/SettingsPage.tsx and optionally use createBackupEnvelope for new backup exports.
