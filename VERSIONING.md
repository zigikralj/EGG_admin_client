# Versioning & Release Procedure

This project follows [Semantic Versioning (SemVer)](https://semver.org/) and implements automated version bumping, changelog generation, and tagging via GitHub Actions on Pull Request merges.

---

## 1. Semantic Versioning Format (`MAJOR.MINOR.PATCH`)

- **`MAJOR`** (`1.0.0` $\rightarrow$ `2.0.0`): Breaking changes, major redesigns, or backwards-incompatible API changes.
- **`MINOR`** (`1.0.0` $\rightarrow$ `1.1.0`): New features or substantial improvements that remain backwards-compatible.
- **`PATCH`** (`1.0.0` $\rightarrow$ `1.0.1`): Bug fixes, minor adjustments, performance tweaks, or maintenance tasks.

---

## 2. Automated PR-Driven Version Bumping on GitHub

Whenever a Pull Request is merged into the `main` branch, the **Bump Version on PR Merge** workflow automatically executes:

1. **Determines the version bump type** via PR labels or PR title:
   - **PR Labels (Explicit Override)**:
     - `release:major` or `major` $\rightarrow$ Major version bump.
     - `release:minor` or `minor` $\rightarrow$ Minor version bump.
     - `release:patch` or `patch` $\rightarrow$ Patch version bump.
     - `no-release` or `skip-release` $\rightarrow$ Skips version bumping (useful for docs-only PRs).
   - **PR Title & Conventional Commits (Default fallback)**:
     - Contains `BREAKING CHANGE` or `!:` $\rightarrow$ **Major** bump.
     - Starts with `feat:` or `feat(...):` $\rightarrow$ **Minor** bump.
     - Starts with `fix:`, `refactor:`, `perf:`, `chore:`, etc. $\rightarrow$ **Patch** bump.

2. **Automated Release Actions**:
   - Increments version in `package.json` and `package-lock.json`.
   - Prepends release notes to `CHANGELOG.md` with the PR title, PR number, and author.
   - Commits changes with `chore(release): vX.Y.Z`.
   - Creates and pushes Git tag `vX.Y.Z` to GitHub.
   - Publishes a GitHub Release with formatted release notes.
   - Triggers the **Deploy to GitHub Pages** workflow for the new version.

---

## 3. Code Traceability & Build Metadata

Every build automatically extracts and embeds Git and timestamp metadata:

- **`__APP_VERSION__`**: The current SemVer string (e.g., `1.0.1`).
- **`__COMMIT_HASH__`**: The exact short 7-character Git commit SHA that generated the bundle (e.g., `fdfec92`).
- **`__BUILD_TIME__`**: ISO timestamp of the build.

### Runtime `version.json`
The build generates a static `version.json` deployed to the root of the app:
```json
{
  "version": "1.0.1",
  "commit": "fdfec92",
  "buildTime": "2026-09-02T11:43:04.000Z"
}
```
The application's runtime version checker (`useVersionCheck`) polls `/version.json` at regular intervals to prompt users with a non-intrusive update banner whenever a new release is live.

---

## 4. UI Version Display

- **Sidebar Footer**: Displays `vX.Y.Z` chip with tooltip revealing the exact Git commit SHA and build date.
- **Settings Modal**: Displays full application version and commit reference.

---

## 5. Manual / Local Releases (Optional)

If you ever need to manually cut a release locally without a PR:

```bash
# In client/
npm run release:patch   # e.g., 1.0.0 -> 1.0.1
npm run release:minor   # e.g., 1.0.0 -> 1.1.0
npm run release:major   # e.g., 1.0.0 -> 2.0.0
```
Or trigger the GitHub Actions workflow manually via **Actions > Bump Version on PR Merge > Run workflow** and select the bump type.
