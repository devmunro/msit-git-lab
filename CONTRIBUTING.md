# Contributing to MSIT Git Lab

Thanks for helping improve Git Lab. Keep lessons hands-on, testable with a real Git repository, and available in both English and natural informal German.

## Local setup

Install Node.js 22, npm 11 and Git 2.39 or newer, then run:

```sh
npm ci
npm test
npm start
```

The app rebuilds its static lesson pages on startup. Practice labs create disposable repositories below the Documents folder; clear only those generated folders when testing resets.

## Branch workflow

- Create feature branches from `develop` and open pull requests back to `develop`.
- Keep `main` for reviewed production releases. Merge release candidates from `develop` to `main`.
- Keep dependency changes and `package-lock.json` in sync.
- Do not add tokens, signing certificates, private keys or student repository data to the repository.

## Checks

Before opening a pull request, run:

```sh
npm test
npm audit --audit-level=high
npm run build-all
```

GitHub Actions also validates pull requests to `main` and `develop`, and builds desktop packages after branch pushes.

## Lesson and UI changes

New practice material lives in `lib/curriculum.js`. Add English and German copy, keep German informal with **du**, define the real repository state in `lib/labs.js`, and cover creation, verification and reset in `tests/`. Put destructive history operations only in app-managed resettable labs. Keep multiple-choice checkpoints optional and include an explanation and retry path.

The original 11 lessons are in `resources/contents/en-US` and `resources/contents/de-DE`. Keep their Git-it attribution and license notices. The MSIT color tokens and reduced-motion rules live in `assets/css/msit.css`.

See [docs.md](docs.md) for the app architecture and [docs/release-process.md](docs/release-process.md) for release requirements.
