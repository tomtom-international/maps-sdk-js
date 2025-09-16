---
title: CI/CD
---

<a style="display: block; margin: 0; padding: 0;" name="_ci_cd"></a>

## Approach

CI/CD of this project follows feature branches approach. It builds SDK versions for all branches and release tags. It also releases those to a NPM repository under npm "tags" (aliases). Alias names correspond to branch/tag names.

## Releasing branches

In order to have your branch tested, our CI/CD builds and releases a package with aliases, so its version looks like this:

```shell
# Incremental builds based on the same 0.9.3 version. Those versions below are basically release candidates for 0.9.4:
0.9.4-my-fix.0
0.9.4-my-fix.1
0.9.4-my-fix.2
# After the base version update to 0.10.0 the aliased versions will be re-calculated:
0.10.1-my-fix.0
0.10.1-my-fix.1
0.10.1-my-fix.2
```

After publishing such package in the NPM repository it can be installed:

```shell
# Installation using the alias "my-fix"
pnpm add @cet/maps-sdk-js@my-fix

# Installation using the exact version of alias "my-fix"
pnpm add @cet/maps-sdk-js@0.9.4-my-fix.1
```

Basically, all you need to do is push your code to branches. Everything else happens automatically.

## Package Registry

The project publishes to TomTom's internal Artifactory registry:
```
https://artifactory.tomtom.com/artifactory/api/npm/maps-sdk-js-npm-local/
```

This is configured in the `publishConfig` section of `package.json`.

## CI/CD Tools and Processes

### Quality Gates

Before any release, the CI/CD pipeline runs:
- **Biome linting and formatting checks**
- **TypeScript compilation** for all workspaces
- **Unit tests** with Vitest
- **Integration tests** with Playwright
- **Bundle size checks** with size-limit
- **SonarQube analysis** for code quality

### Build Process

The CI/CD system:
1. Installs dependencies using `pnpm install`
2. Builds all workspaces using `pnpm build`
3. Runs the complete test suite
4. Generates API documentation
5. Creates distribution packages
6. Publishes to the registry with appropriate tags

### Conventional Commits

The project follows conventional commits for automated versioning and changelog generation. See [conventionalcommits.org](https://www.conventionalcommits.org) for the specification.

CHANGELOG.md is maintained manually or through automated tools based on conventional commit messages.
