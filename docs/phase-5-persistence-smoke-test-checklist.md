# Phase 5 Persistence Smoke Test Checklist

## Purpose

Phase 5 documents the minimum manual smoke tests required after Phase 4B changed the active Zustand persistence wiring to use the Local Browser storage bridge.

This phase does not change application code.

## Scope

Test only the current Local Browser storage mode.

Focus on confirming that the app still persists data with the same storage key:

- cost-control-storage

## Pre-check

Before testing:

1. Open the app in a browser.
2. Confirm the app loads without a blank screen.
3. Confirm the login page or main app appears normally.
4. Open browser DevTools if available.
5. Go to Application or Storage tab.
6. Confirm localStorage is available for the app origin.

## Test 1: Login still works

Steps:

1. Open the app.
2. Enter the current password.
3. Click login.

Expected result:

- login succeeds;
- app opens normally;
- no console error blocks the app.

Pass criteria:

- user can reach the main app screen.

## Test 2: Data save persists after refresh

Steps:

1. Add or edit a small safe test record.
2. Refresh the browser page.
3. Return to the same screen.

Expected result:

- the test record remains visible after refresh.

Pass criteria:

- data persists after page reload.

## Test 3: Local storage key remains unchanged

Steps:

1. Open browser DevTools.
2. Go to Application or Storage.
3. Open localStorage for the app origin.
4. Check the stored keys.

Expected result:

The existing storage key is still used:

- cost-control-storage

Pass criteria:

- the app does not create an unexpected replacement key;
- data continues to live under cost-control-storage.

## Test 4: Reopen browser session

Steps:

1. Add or confirm a small safe record exists.
2. Close the browser tab.
3. Reopen the app.
4. Log in again if required.

Expected result:

- previously saved data is still available.

Pass criteria:

- local browser persistence survives tab close and reopen.

## Test 5: Backup export still works

Steps:

1. Open Settings.
2. Click Backup.
3. Save the generated JSON file.
4. Open the JSON file in a text editor.

Expected result:

Backup JSON is generated and includes:

- appName
- schemaVersion
- exportedAt
- data

Pass criteria:

- backup file downloads successfully;
- backup JSON is valid.

## Test 6: Backup restore still works

Steps:

1. Use a valid backup file.
2. Open Settings.
3. Click Restore.
4. Select the valid backup file.
5. Confirm restore.

Expected result:

- restore confirmation appears;
- restore succeeds;
- restored data is visible.

Pass criteria:

- valid backup restore works after persistence wiring.

## Test 7: Invalid backup is still blocked

Steps:

1. Prepare a broken JSON file or a JSON file with an invalid backup shape.
2. Open Settings.
3. Try to restore that file.

Expected result:

- restore is blocked;
- existing data is not overwritten.

Pass criteria:

- invalid backup cannot replace current app data.

## Test 8: Clear data behavior still works

Steps:

1. Use the app's clear or wipe function only if safe.
2. Confirm the action.
3. Refresh the page.

Expected result:

- cleared data remains cleared after refresh;
- app does not crash.

Pass criteria:

- clearing data updates persisted state correctly.

## Final acceptance checklist

Phase 5 can be accepted when:

- login works;
- data saves successfully;
- data remains after page refresh;
- data remains after tab close and reopen;
- localStorage key remains cost-control-storage;
- backup export works;
- valid backup restore works;
- invalid backup restore is blocked;
- clear data behavior still persists correctly;
- no blank screen appears;
- no blocking console error appears.

## Notes

This checklist validates the Phase 4B persistence wiring at the browser behavior level.

If any test fails, do not proceed to future storage-mode work until the persistence issue is fixed.
