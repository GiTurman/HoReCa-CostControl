# HoReCa CostControl Revision Baseline

This document records the protected baseline for the first safe stabilization phase.

## Repository

- Repository: `GiTurman/HoReCa-CostControl`
- Protected branch: `main`
- Working branch: `refactor/storage-modes-foundation`
- Rule: do not modify working business flows directly in this phase.

## Current product position

The application is currently a frontend-first HoReCa cost-control MVP with local browser persistence and full JSON backup/restore. The current local/offline value must be preserved.

## Existing flows that must remain working

The following user-visible flows are treated as protected behavior during the first stabilization phase:

1. Login and first-password change flow.
2. Local browser persistence through the current Zustand/localStorage mechanism.
3. Full database backup and restore from Settings.
4. Purchases: manual entry, Excel import, grouping by date, editing, deleting, and export.
5. Products: generated products, minimum balance editing, search, and export.
6. Menu: dish creation, ingredient loss percentage, costing, editing, deleting, and export.
7. Sales: dish-based sales entry, grouped archive, editing, deleting, and export.
8. Inventory: expected balance calculation, actual balance entry, audit save, difference/status, and export.
9. Dashboard and analytics summaries based on the current local data model.
10. Hotel-related modules, if present in the working tree, including breakfast, housekeeping, technical/direct consumption, and debtor/creditor summaries.

## Phase 1 safety rules

1. Do not change the current UI behavior.
2. Do not change the persisted data shape used by existing users.
3. Do not remove or rename existing fields in stored data.
4. Do not replace local browser storage with cloud storage.
5. Do not add a mandatory backend.
6. Do not make the app dependent on paid services.
7. Add foundations in a way that allows future storage modes without breaking the free local version.

## Main technical risks identified

1. Current authentication is client-side only.
2. Current password handling is suitable for demo/local use, not production security.
3. Browser localStorage is convenient but tied to a browser profile and can be lost if browser data is cleared.
4. Several future deployment models are possible, so storage must be abstracted before any backend migration.
5. Shared-folder/network storage requires conflict protection and should not be implemented as unsafe simultaneous JSON writes.
6. Cloud mode should be optional, not required for the free/offline product.

## Stabilization direction

The first stabilization direction is to introduce a storage-mode foundation:

- Local Browser mode remains the default.
- Desktop Local Folder mode is planned for a future installable app.
- Local Network mode is planned for a future local-server/SQLite setup.
- Cloud mode is kept as an optional future mode.

## Validation checklist for every future phase

Before merging any later PR, manually verify at minimum:

1. Existing local data still loads.
2. Backup export still works.
3. Restore import still works.
4. Purchases can be added and exported.
5. Menu dish costing still matches the previous result for a simple test dish.
6. Sales still calculate revenue correctly.
7. Inventory expected balance still follows: opening balance + purchases - consumption.
8. No cloud/server dependency is required for the default local mode.

## Non-goals for Phase 1

- No UI redesign.
- No database migration.
- No Supabase/Firebase/Auth migration.
- No routing rewrite.
- No desktop installer implementation.
- No local network server implementation.
- No change to the current default data storage behavior.
