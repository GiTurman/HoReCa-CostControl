# Local, Desktop, and Network Plan

This plan keeps HoReCa CostControl usable as a free offline product while preparing the architecture for more advanced deployment options.

## Recommended product ladder

### 1. Free Local Browser

- Browser-only storage.
- Manual full backup and restore.
- Single user / one browser profile.
- No cloud cost.

### 2. Desktop Local License

- Installable desktop application.
- Local folder or local database storage.
- Better backup and restore control.
- No mandatory internet connection.

### 3. Local Network License

- One main computer runs a local server.
- Other users connect through local IP.
- Central local database, preferably SQLite.
- No cloud subscription required.

### 4. Cloud Pro

- Optional online version.
- Hosted database and authentication.
- Remote access.
- Multi-branch and multi-device support.
- Subscription or higher-tier license.

## Why not cloud-first?

Cloud-first architecture can be powerful, but it may create unnecessary cost and complexity for users who only need an offline or local-network tool.

The current backup/restore feature is a strength. It should remain part of the product identity.

## Why not shared JSON file first?

A shared folder with one `database.json` file sounds simple, but simultaneous writes from multiple devices can corrupt or overwrite data.

If a shared folder approach is ever used, it must include:

- Lock file.
- Conflict detection.
- Last writer/device metadata.
- Automatic pre-write backup.
- Restore path.

For serious multi-user local work, a local server and SQLite database is safer.

## Recommended Local Network architecture

```text
Client browser/device
  -> local network HTTP request
  -> main PC local server
  -> SQLite database
  -> backup/export folder
```

The main PC must be on for other devices to use the system.

## Desktop architecture concept

```text
Tauri desktop shell
  -> existing React UI
  -> storage adapter
  -> local file or SQLite database
  -> backup/export folder
```

## Storage adapter principle

The UI and business logic should not directly care where the data is stored.

```text
App UI
  -> Store / business services
  -> Storage adapter
  -> Local Browser / Desktop File / Local Network / Cloud
```

## Phase roadmap

### Phase 1: Foundation

- Add documentation.
- Add storage adapter types.
- Add Local Browser adapter wrapper.
- Add planned placeholder adapters.
- Add schema/migration foundation.
- Do not change current behavior.

### Phase 2: Local Browser hardening

- Backup validation.
- Restore validation.
- Schema version in backup payload.
- Safer error messages.
- Backup reminders.

### Phase 3: Desktop proof of concept

- Tauri wrapper.
- Local folder selection.
- Local file/database adapter.
- Manual backup path selection.

### Phase 4: Local Network proof of concept

- Small local server.
- SQLite database.
- API layer for reads/writes.
- Device/user identification.
- Backup endpoint.

### Phase 5: Optional Cloud mode

- Cloud database/auth decision.
- Tenant isolation.
- Migration wizard.
- Subscription-ready deployment model.

## Merge protection rule

Any future phase must keep Local Browser mode working unless the user explicitly approves a breaking migration.
