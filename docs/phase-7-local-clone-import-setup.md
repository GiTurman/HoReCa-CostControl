# Phase 7 Local Clone Import Setup

## Purpose

Use the uploaded local HoReCa CostControl archive as the safe source for the fuller app clone.

## Safety rule

The old local program remains untouched.

All GitHub work continues through branches and pull requests.

## Current limitation

The available GitHub connector can change repository text files and workflows, but it cannot upload the binary ZIP archive directly into the repository.

## Required repository path

The archive should be placed in the repository at:

```text
local-clone/horeca-costcontrol-gt-main.zip
```

## Uploaded archive inspection result

The uploaded archive contains the fuller local version, including these additional modules:

- BreakfastPage
- ChefPage
- ClassifierPage
- DebtorPage
- GlobalInventoryPage
- HousekeepingPage
- InventoryArchivePage
- TechnicalPage

## Next step after the archive is present

Update the Pages workflow to build from the extracted archive instead of the current simplified root app.

## Acceptance criteria

- old local app remains untouched;
- full local clone is used as the GitHub Pages preview source;
- preview deploy succeeds;
- expected menus and modules appear in the browser.
