# MSIT Git Lab architecture

## App structure

- `main.js` owns the Electron main process, windows, dialogs, menus and IPC handlers.
- `preload.js` exposes a narrow `window.msitGitLab` API to the renderer.
- `lib/git-service.js` runs system Git through argument arrays with bounded output and timeouts.
- `lib/progress-store.js` migrates the original challenge progress and keeps new lab progress in the Electron user-data directory.
- `lib/labs.js` creates, resets and verifies generated repositories in `Documents/MSIT Git Lab`.
- `lib/legacy-verification.js` checks the original challenge work in a learner-selected repository.
- `lib/curriculum.js` defines bilingual lab instructions and optional knowledge checks.
- `lib/app-renderer.js`, `lib/legacy-renderer.js` and `lib/common-renderer.js` are browser-only scripts. They do not import Node APIs.
- `resources/contents/en-US` and `resources/contents/de-DE` hold the two supported languages. The build scripts render them into ignored `built/` pages.
- `forge.config.js` configures Electron Forge, the macOS DMG/ZIP makers and the Windows Squirrel installer.

## Renderer security

The window disables Node integration and enables context isolation and sandboxing. Content Security Policy blocks inline scripts and unapproved connections. The preload bridge validates each main-frame request. Git checks use `execFile` with an argument array, bounded output and a timeout; renderer text is inserted with `textContent`.

Only HTTPS links can be opened outside the app. Reset and history-recovery actions operate on the dedicated lab folder, not the repository selected for the original challenges.

## Student data

The original flat challenge status file and `saved-dir.json` are migrated into a versioned user-data file. Existing completion statuses and the saved repository path are retained. The clear-progress action leaves the saved repository selection in place.

## Commands

- `npm test` runs Node integration checks for lab creation, Git workflows, verification, reset, progress migration, checkpoints and reduced motion, then runs StandardJS.
- `npm run build-all` regenerates both language builds.
- `npm run package` packages the app without creating installers.
- `npm run make` packages the app and invokes the platform makers.
- `npm run set-dev-version` writes a unique `X.Y.Z-dev.RUN` version using `GITHUB_RUN_NUMBER`; a tagged development release passes its exact `X.Y.Z-dev.N` version as an argument.

For branch protection, signing secrets, tag procedures and installer output, see [the release process](docs/release-process.md).
