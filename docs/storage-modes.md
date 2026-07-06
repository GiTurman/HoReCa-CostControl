# Storage Modes Strategy

HoReCa CostControl should preserve the free local/offline product while allowing stronger paid or professional modes later.

## Goal

Introduce a storage-mode foundation before any cloud/backend migration.

The application should eventually support:

1. Local Browser mode.
2. Desktop Local Folder mode.
3. Local Network mode.
4. Optional Cloud mode.

The default mode remains Local Browser until a later phase explicitly changes it.

## Mode 1: Local Browser

### Description

Data is stored in the browser profile, currently through localStorage/Zustand persistence.

### Intended product tier

Free/offline MVP.

### Advantages

- No server cost.
- No cloud dependency.
- Works offline.
- Fast to use.
- Backup/restore JSON remains simple.

### Risks

- Data is tied to one browser profile.
- Clearing browser data can delete the working database.
- Multi-user work on one shared database is not supported.
- Security is limited because everything is client-side.

### Required protections

- Full manual backup.
- Restore validation.
- Backup reminders.
- Schema versioning.
- Clear user messaging about where data is stored.

## Mode 2: Desktop Local Folder

### Description

The application is packaged as an installable desktop app. Data is stored in a selected local folder or application data directory.

Possible future storage examples:

- `database.json`
- `horeca.db`
- `backup/`
- `exports/`
- `logs/`

### Recommended technology

Tauri is preferred over Electron for a lightweight installable app, unless Electron-specific capabilities become necessary later.

### Advantages

- No recurring cloud cost.
- Better user trust: data is visibly stored on the user's computer.
- Better backup control than browser-only storage.
- Suitable for a paid offline desktop license.

### Risks

- Requires installer/build pipeline.
- Updates must be planned.
- Multi-device work is not solved automatically.
- Shared file writes need locking/conflict protection.

## Mode 3: Local Network

### Recommended model

Use a local server and SQLite database on one main computer, not direct simultaneous writes to one shared JSON file.

Example:

- Main PC runs the local server.
- Other devices connect through the local IP address.
- Database is stored on the main PC.
- Backup is performed centrally.

### Advantages

- No cloud subscription required.
- Multiple users can work on the same local database.
- Better conflict control than a shared folder JSON database.
- Good fit for one restaurant, one hotel, or one local network.

### Risks

- Main PC/server must stay on.
- Firewall and local network setup are required.
- Remote access outside the local network needs VPN or cloud mode.
- Server maintenance/support may be needed.

## Mode 4: Cloud

### Description

Online multi-user storage through a hosted backend such as Supabase, Firebase, or a custom server.

### Intended product tier

Optional future Pro/Premium mode.

### Advantages

- Remote access.
- Centralized user management.
- Better security model.
- Multi-branch/multi-device readiness.
- Automated cloud backups.

### Risks

- May create recurring hosting/database costs.
- Requires stronger security, auth, tenancy, and support.
- Should not be mandatory for the free/offline product.

## Storage mode selection principle

The app should eventually expose a setting such as:

```text
Settings -> Data Storage Mode
```

Available options should depend on build type and readiness:

- Browser build: Local Browser.
- Desktop build: Local Browser import + Desktop Local Folder.
- Local Network build: Local Network server mode.
- Cloud build: Cloud mode.

## Migration principle

Changing storage mode must never silently discard data.

A future migration wizard should support:

1. Export current full backup.
2. Validate current data.
3. Import into the target storage mode.
4. Verify record counts.
5. Allow rollback to the backup.

## Phase 1 implementation boundary

Phase 1 only adds the foundation and documentation. It does not activate Desktop, Local Network, or Cloud mode.

Local Browser remains the only active mode in this phase.
