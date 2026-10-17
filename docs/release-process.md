# Release process

## Branches

- `develop` is the integration branch. Feature branches start here and merge back through pull requests.
- `main` is production. Merge reviewed release candidates from `develop` to `main` through a pull request.
- CI validates pull requests to both branches and builds macOS and Windows packages after pushes to either branch. Pushes to `develop` receive unique `X.Y.Z-dev.RUN` build versions and downloadable CI artifacts.

After the branches are pushed to GitHub, enable branch protection for `main`: require pull requests, require the `checks` CI job, require at least one review, dismiss stale approvals after new commits, and disallow force pushes and branch deletion. Protect `develop` with pull requests and the required CI check as well. These repository settings cannot be committed in this source tree and must be applied by a repository administrator.

## Development prerelease

From a commit on `develop`, create a unique tag such as `v5.0.0-dev.42` and push it. The release workflow confirms that the tagged commit is contained in `develop`, tests and audits the dependencies, builds both platforms, and publishes a GitHub prerelease with the Windows installer and macOS DMG/ZIP.

The `N` suffix must be unique. GitHub Actions uses an immutable tag as the release identity, so do not reuse or move a published tag.

## Stable release

1. Merge the reviewed release candidate into `main`.
2. Confirm the package version in `package.json` is the intended stable semantic version, for example `5.0.0`.
3. Create and push the matching tag `v5.0.0` on `main`.
4. The workflow verifies the tag is on `main`, checks that the tag matches `package.json`, runs the tests and high-severity audit, builds both platforms, and publishes the release.

Tagged releases are published even if signing credentials have not been configured. Unsigned macOS and Windows builds may show operating-system security warnings. Configure the signing secrets below to publish trusted installers; macOS notarization requires the Apple credentials.

## GitHub Actions secrets

Add these repository or organization secrets before publishing signed releases:

- macOS: `APPLE_CERTIFICATE_BASE64` (Developer ID Application `.p12`), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_DEVELOPER_IDENTITY`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.
- Windows: `WINDOWS_CERTIFICATE_BASE64` (base64-encoded code-signing `.pfx`) and `WINDOWS_CERTIFICATE_PASSWORD`.

The workflow imports the macOS certificate into a temporary keychain, signs and notarizes the universal app, and passes the Windows certificate file to the Squirrel maker. Keep certificate contents and passwords in GitHub Actions secrets only. Rotate credentials if they are exposed.

## Local outputs

Run `npm ci`, `npm test`, `npm run build-all`, then `npm run make` on the target operating system. Electron Forge writes packages under `out/make/`. macOS builds are universal and include a `.zip`; `scripts/make-dmg.js` uses the macOS `hdiutil` command to make a drag-to-Applications `.dmg`. Windows builds include a Squirrel `Setup.exe`.
