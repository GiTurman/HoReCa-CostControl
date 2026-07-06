# Phase 1 Build Validation

This document explains the validation step for Phase 1.

## Goal

Before merging the storage mode foundation, confirm that the project still builds.

## What is checked

The GitHub Actions workflow added in this phase installs dependencies and runs the existing project build script from package.json.

The current package.json build script is: vite build.

## What is not checked yet

There is currently no automated test script in package.json, so this phase does not run unit tests.

Future phases may add:

- unit tests for storage helpers
- backup validation tests
- costing calculation tests
- inventory calculation tests

## Non-technical interpretation

If GitHub shows the build check as green, it means the project compiles.

If GitHub shows the build check as red, do not merge. Ask for the error to be reviewed.

## Merge rule

Do not merge Phase 1 unless:

1. The PR still changes only new foundation and documentation files.
2. The build check passes, or a build issue is reviewed and clearly unrelated.
3. No existing app screen or store behavior was changed.
