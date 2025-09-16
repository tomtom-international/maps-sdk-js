---
title: Quality control
---

<a style="display: block; margin: 0; padding: 0;" name="_quality_control"></a>

## Approach

We use multiple tools to measure and control our code quality and enforce consistent "Pull request" practices. These tools eliminate trivial issues like "unused vars" and infinite discussions like "spaces vs tabs", "formatting", "lines per function", "loop nesting levels" in PRs. Those escalate pretty quickly, so let's just automate that and focus on what matters :)

## Linting and Formatting

We use **Biome** for both formatting and linting. Biome is a fast, all-in-one toolchain that replaces ESLint and Prettier:

```shell
# Lint all files
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix

# Format all files (check only)
pnpm format

# Format and auto-fix all files
pnpm format:fix
```

## Code Quality Tools

### Biome Configuration

Biome configuration is defined in `biome.json` at the root level. It provides:
- **Fast linting** - Much faster than ESLint
- **Formatting** - Compatible with Prettier
- **Import sorting** - Automatic import organization
- **TypeScript support** - Native TypeScript support

### CSpell (Spell Checking)

We use CSpell to catch typos in code and documentation:

```shell
# Run spell checking (part of CI/CD)
npx cspell "**/*"
```

Configuration is in `cspell.json` at the root level.

## SonarQube

SonarQube scan workflow executes static quality control analysis and publishes results to the SonarCube service of TomTom. See [this SonarQube project](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc).

SonarQube integration supports PR comments, so when the SonarQube workflow executes it notifies about new issues immediately.

Configuration is defined in `sonar-project.properties`.

## Size Limits

The project monitors bundle sizes using size-limit:

```shell
# Check bundle sizes (part of CI/CD)
npx size-limit
```

Size limits are configured in the root `package.json` under the `size-limit` section.
