# GestionHuilerie Desktop (Electron + Next.js)

This project packages the existing Next.js v16 + TypeScript application into a Windows desktop application using Electron while keeping the UI design and all business logic unchanged.

## Overview
- Renderer: Original Next.js application (no UI changes required).
- Main Process: Electron `electron/main.ts` creates a secure `BrowserWindow`.
- Preload: `electron/preload.ts` exposes minimal, secure IPC API (database path, export/import, dialogs).
- Database: SQLite (`better-sqlite3`). In development uses project `data/huilerie.db`; in production desktop uses `%APPDATA%/GestionHuilerie/huilerie.db` via `HUILERIE_DB_PATH`.
- Packaging: `electron-builder` produces a Windows installer (`.exe`).

## Development (Web Only)
```bash
pnpm install
pnpm dev
```
Visit http://localhost:3000

## Development (Desktop Electron + Next.js)
Two processes are needed: Next.js dev server and Electron. A convenience script starts both:
```bash
pnpm dev:desktop
```
Electron window loads http://localhost:3000.

## Production Build (Desktop)
1. Build Next.js in standalone mode:
```bash
pnpm build:desktop
```
This runs `next build` producing `.next/standalone` and `.next/static`.
2. Package for Windows (from Linux cross-build):
```bash
pnpm package:win
```
Generates installer in `dist/` (NSIS). For cross-building on Linux ensure required build dependencies: `wine`, `mono`, `nsis` (electron-builder will attempt downloads). If native module rebuild issues occur for `better-sqlite3`, use:
```bash
pnpm exec electron-builder install-app-deps
```

## Cross-Platform Notes
- Building Windows binaries on Linux requires Wine. Install:
```bash
sudo apt update
sudo apt install -y wine nsis
```
- If cross-build fails, alternative: run build in a Windows VM or CI (GitHub Actions) with a Windows runner.

## Runtime Behavior (Production Desktop)
- Electron spawns Next.js standalone `server.js` on port 3000 using `ELECTRON_RUN_AS_NODE`.
- Environment variable `HUILERIE_DB_PATH` passed to renderer process logic so shared DB module points to user data directory.
- All DB exports/imports performed through IPC handlers (`export-database`, `import-database`).

## IPC API (Preload)
`window.electronAPI` exposes:
- `getDatabasePath(): Promise<string>`
- `getAppVersion(): Promise<string>`
- `showSaveDialog(options)` / `showOpenDialog(options)`
- `exportDatabase(filePath?)` returns `{ success, path?, error? }`
- `importDatabase(filePath)`
- `platform` / `isElectron`

## QA Checklist
Perform after building desktop installer:
1. Launch app (installer -> start). Window appears with identical UI (theme, layout, navigation components unchanged).
2. Employees Module: Create, edit, delete an employee. Verify persistence after restart.
3. Suppliers Module: CRUD supplier entries.
4. Purchases (Olive Purchases): Add purchase with supplier link. Remaining balance computed.
5. Pressing Operations: Log operation; verify rendement calculation if present.
6. Tanks: Create tank, update volume, deactivate/reactivate.
7. Tank Movements: Record transfer between tanks; verify source/target volumes adjust correctly.
8. Sales (Oil Sales): Record sale referencing tank; total amount calculation correct.
9. Pomace (Grignons): Add collection entry, update status, optional sale data.
10. Payroll: Add salary payment & advance; verify foreign key relations and deletion cascade if employee removed.
11. Maintenance Fees: Add expense; ensure it lists correctly.
12. Settings: Change a setting; restart app; value persists.
13. Backup Export: Use UI export. File created on Desktop (or chosen path). Verify file size > 0.
14. Backup Import: Modify DB (add record), import previous backup, record disappears (state restored).
15. Automatic WAL handling: After heavy operations, close app; relaunch; no data loss.
16. App Close & Reopen: All modules load without errors. Console free of DB path errors.
17. Version Check: `getAppVersion()` matches package version.
18. Security: Renderer cannot access Node APIs directly (`process` not exposed; test in DevTools console).
19. Performance: Navigation between modules responsive (no noticeable slowdown vs web).
20. Cross-Platform Path: Confirm DB located at `%APPDATA%/GestionHuilerie/huilerie.db` on Windows (log path from `getDatabasePath()`).

## Web vs Desktop Differences
| Aspect | Web | Desktop |
|--------|-----|---------|
| DB Path | `./data/huilerie.db` | `%APPDATA%/GestionHuilerie/huilerie.db` |
| Server Start | `next dev/start` | Electron spawns standalone server.js |
| Backup Flow | Direct file ops | IPC + main process file ops |
| Access to FS | Node in API routes | Restricted through IPC |

## Future Improvements
- Add automated end-to-end tests (Playwright) for desktop.
- Integrate auto-update (electron-builder publish + GitHub Releases).
- Add crash reporting and logging to a file in user data directory.

## Troubleshooting
- `better-sqlite3` build errors: Ensure Python 3, build-essential (`sudo apt install build-essential python3`). Then `pnpm rebuild better-sqlite3` or `pnpm exec electron-builder install-app-deps`.
- Port 3000 conflicts: Set `PORT=3333 pnpm dev:desktop` and adjust load URL; update Electron main accordingly.
- White window in production: Confirm `.next/standalone/server.js` exists and no start errors in console.

## License
Proprietary – Internal client delivery.
