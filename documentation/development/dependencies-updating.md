---
title: Updating dependencies
---

<a style="display: block; margin: 0; padding: 0;" name="_dependencies_updating"></a>

## Overview

It is important to keep a code base up to date. It brings security, performance, quality and feature changes. There are several ways of updating dependencies in the project - manual updates and automated via Dependabot.

## Manual Updates

For manual update of dependencies use the following commands:

```shell
# Update all dependencies in all workspaces
pnpm update --recursive

# Update dependencies for specific workspaces
pnpm update -F core
pnpm update -F map
pnpm update -F services
pnpm update -F map-integration-tests
pnpm update -F shared-configs
pnpm update -F './examples/*'

# Update to latest versions (be careful with breaking changes)
pnpm update --latest --recursive

# Check for outdated packages
pnpm outdated --recursive
```

## pnpm Catalog

The project uses pnpm's catalog feature to manage shared dependency versions across workspaces. Common dependencies and their versions are defined in `pnpm-workspace.yaml` under the `catalog` section.

To update catalog dependencies:

```shell
# Update catalog versions in pnpm-workspace.yaml, then run:
pnpm install --recursive
```

## Dependabot

Dependabot is configured to create GitHub PRs with dependency updates per package. The remaining job for developers is to review and merge successful ones to the main branch.

Dependabot configuration is typically found in `.github/dependabot.yml` and handles:
- Regular dependency updates
- Security updates
- Version compatibility checks

## Best Practices

1. **Test after updates**: Always run tests after updating dependencies
2. **Review breaking changes**: Check changelogs for major version updates  
3. **Update gradually**: Don't update all dependencies at once in production
4. **Use catalog**: Add frequently used dependencies to the pnpm catalog for consistency
