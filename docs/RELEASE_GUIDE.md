# Release Guide

This document explains how to create releases for the Directory Tree Generator using semantic versioning and automated release processes.

## Overview

The project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate the release process. The tool analyzes commit history to determine the next version number, generates changelogs, and publishes releases to both GitHub and npm.

## Commit Message Format

To ensure proper release automation, all commits must follow the [Conventional Commits](./COMMIT_CONVENTION.md) specification:

```
<type>(<scope>): <subject>
```

Where `<type>` determines the version bump:

- `feat` → **Minor version** (1.0.0 → 1.1.0)
- `fix` → **Patch version** (1.0.0 → 1.0.1)
- `perf` → **Patch version** (1.0.0 → 1.0.1)
- `BREAKING CHANGE` → **Major version** (1.0.0 → 2.0.0)

## Release Process

### Automatic Releases

The release process is fully automated through GitHub Actions:

1. Push commits to the `main` or `master` branch
2. GitHub Actions workflow triggers on push
3. semantic-release analyzes commits since the last release
4. Determines the next version based on commit types
5. Updates `package.json` version
6. Generates changelog entries
7. Creates Git tag
8. Publishes to npm
9. Creates GitHub release with assets

### Dry Run Testing

Before making actual releases, you can test the process locally:

```bash
# Install dependencies
npm install

# Run a dry run to see what would be released
npm run release:dry-run
```

This will simulate the release process without publishing anything.

## Versioning Strategy

The project follows [Semantic Versioning (SemVer)](https://semver.org/) principles:

- **MAJOR.MINOR.PATCH** (e.g., 2.1.4)
- **MAJOR** version: Breaking changes that may affect backward compatibility
- **MINOR** version: New features that are backward compatible
- **PATCH** version: Bug fixes that are backward compatible

## Configuration

The release process is configured through:

1. [.releaserc](../.releaserc) - Core semantic-release configuration
2. [.github/workflows/release.yml](../.github/workflows/release.yml) - GitHub Actions workflow
3. [package.json](../package.json) - Dependencies and scripts

### Plugins Used

- `@semantic-release/commit-analyzer` - Analyzes commits to determine version bump
- `@semantic-release/github` - Creates GitHub releases and manages assets
- `@semantic-release/npm` - Publishes to npm registry

## Requirements

### GitHub Secrets

The following secrets must be configured in the GitHub repository settings:

- `GITHUB_TOKEN` - Auto-provided by GitHub Actions
- `NPM_TOKEN` - Token to publish to npm registry

### npm Token Setup

1. Log in to npm and create an automation token:
   ```bash
   npm login
   # Then go to https://www.npmjs.com/settings/your-username/tokens
   # Create a new automation token with publish permissions
   ```

2. Add the token to GitHub repository secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Add new secret with name `NPM_TOKEN` and value as the token from npm

## Release Assets

The GitHub release will include the following assets:

- Source code
- Package files
- Documentation
- Configuration files

Excluded from the npm package:
- Test files
- Documentation files
- CI/CD configuration
- Development scripts
- Environment files

## Manual Override

In rare cases where manual release is needed:

```bash
# Install semantic-release globally
npm install -g semantic-release

# Run release manually (use with caution)
npx semantic-release
```

## Troubleshooting

### Release Not Triggering

Check that:
- Commits follow conventional commit format
- Push is to the correct branch (`main` or `master`)
- GitHub Actions are enabled for the repository
- Required secrets are configured

### Version Calculation Issues

If the version is not calculated correctly:
- Ensure commit messages follow the conventional format
- Check that commit analyzer configuration is correct
- Verify the release dry run to see what would be published

### Publishing Failures

If publishing to npm fails:
- Verify the `NPM_TOKEN` is valid and has publish permissions
- Check npm account status and package ownership
- Ensure the package name is available and not taken

## Verification

After each release, verify:

1. New version appears on [npm](https://npmjs.com/package/directory-tree-generator)
2. GitHub release exists with correct tag
3. Changelog is updated with recent changes
4. Package.json version is updated
5. All release assets are included

## Rollback

If a release needs to be rolled back:

1. Contact npm support to unpublish the problematic version (only possible shortly after publishing)
2. Tag the previous good commit as the latest
3. Create a hotfix PR with the necessary corrections
4. Merge and let the automated release process create a new version