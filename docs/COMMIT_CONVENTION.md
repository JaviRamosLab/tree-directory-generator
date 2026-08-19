# Commit Convention

This repository follows the [Conventional Commits](https://www.conventionalcommits.org/) specification to ensure consistent commit messages that can be used to automatically generate changelogs and determine version numbers.

## Format

Each commit message consists of a **header**, **body**, and **footer**. The header has a special format that includes a **type**, **scope**, and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory, while the **scope** of the header is optional.

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope

The scope should be the name of the module affected (as perceived by the person reading the changelog generated from commit messages).

### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end

### Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit closes.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then the description of the change, justification, and migration notes.

## Examples

```
feat(cli): add --dir-only flag for directory-only tree generation

Add a new flag that allows users to generate directory-only trees
without showing files, similar to the Unix tree command's -d option.

Closes #123
```

```
fix(output): correct tree indentation spacing issue

The tree visualization was not properly indenting nested directories
due to incorrect spacing in the prefix calculation.

Fixes #456
```

```
docs(readme): update usage examples

Update the README with comprehensive examples of all available flags
and configuration options.

Closes #789
```

```
refactor(config): improve configuration hierarchy

Change the configuration loading mechanism to follow the priority:
CLI args > environment variables > config file > defaults

BREAKING CHANGE: The configuration loading order has changed,
which may affect users who relied on the previous behavior.
```

## Valid Types

| Type | Description | Release Impact |
|------|-------------|----------------|
| feat | New feature | Minor version |
| fix | Bug fix | Patch version |
| perf | Performance improvement | Patch version |
| docs | Documentation changes | Patch version |
| style | Code style changes | Patch version |
| refactor | Code refactoring | Patch version |
| test | Test improvements | Patch version |
| chore | Maintenance tasks | Patch version |
| build | Build system changes | Patch version |
| ci | CI configuration changes | Patch version |
| revert | Revert previous commit | Patch version |