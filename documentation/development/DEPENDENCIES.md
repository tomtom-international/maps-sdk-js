# 📦 Dependencies

## 🔧 Dependency Management

The project uses **pnpm** with workspaces to manage dependencies across multiple packages. This guide covers how to update, add, and maintain dependencies.

## 🔄 Updating Dependencies

### 🔄 Update All Dependencies

```shell
# Update all dependencies across all workspaces
pnpm update

# Update with interactive mode to choose which to update
pnpm update --interactive

# Update to latest versions (be careful with breaking changes)
pnpm update --latest
```

### 🎯 Update Specific Dependencies

```shell
# Update a specific dependency in all workspaces where it exists
pnpm update <package-name>

# Update a dependency in a specific workspace
pnpm -F core update <package-name>
pnpm -F services update <package-name>
pnpm -F map update <package-name>
```

### 🔍 Check for Outdated Dependencies

```shell
# Check which dependencies are outdated
pnpm outdated

# Check outdated dependencies in a specific workspace
pnpm -F core outdated
```

## ➕ Adding Dependencies

### 🏭 Production Dependencies

```shell
# Add to a specific workspace
pnpm -F core add <package-name>
pnpm -F services add <package-name>
pnpm -F map add <package-name>

# Add to root (for workspace-wide tooling)
pnpm add -w <package-name>
```

### 🛠️ Development Dependencies

```shell
# Add dev dependency to specific workspace
pnpm -F core add -D <package-name>

# Add dev dependency to root (for shared tooling)
pnpm add -Dw <package-name>
```

### 📦 Peer Dependencies

```shell
# Add peer dependency (usually for library packages)
pnpm -F core add -P <package-name>
```

## ➖ Removing Dependencies

```shell
# Remove from specific workspace
pnpm -F core remove <package-name>

# Remove from root
pnpm remove -w <package-name>
```

## 🔄 Version Synchronization

### Package Version Updates

The project includes scripts to keep versions synchronized:

```shell
# Sync SDK version across documentation
pnpm sync-docs-package-version

# Sync SDK version across examples
pnpm sync-examples-package-version
```

### Workspace Dependencies

When workspaces depend on each other, use workspace protocol:

```json
{
  "dependencies": {
    "@tomtom-org/maps-core": "workspace:*",
    "@tomtom-org/maps-services": "workspace:*"
  }
}
```

## 🔒 Dependency Audit and Security

### Security Audits

```shell
# Run security audit
pnpm audit

# Fix security issues automatically
pnpm audit --fix
```

### License Checking

Review licenses of new dependencies to ensure compliance with project requirements.

## Best Practices

### Version Management

1. **Use exact versions** for critical dependencies
2. **Pin dev tool versions** to ensure consistent builds
3. **Regular updates** - Schedule regular dependency updates
4. **Test thoroughly** after major version updates

### Adding New Dependencies

1. **Evaluate necessity** - Only add dependencies that provide significant value
2. **Check bundle size impact** - Consider the size impact on final bundles
3. **Review maintenance status** - Prefer actively maintained packages
4. **Check compatibility** - Ensure compatibility with existing dependencies

### Workspace-Specific Dependencies

- **Core workspace** - Minimal dependencies, focus on core functionality
- **Services workspace** - HTTP clients, API-related utilities
- **Map workspace** - Rendering libraries, DOM manipulation
- **Examples** - Can include UI frameworks and demo-specific dependencies

## Common Commands

```shell
# Install all dependencies
pnpm install

# Clean and reinstall
pnpm clean && pnpm install

# Install dependencies for specific workspace
pnpm -F core install

# Add dependency to multiple workspaces
pnpm -F core -F services add <package-name>

# Update lockfile only
pnpm install --lockfile-only
```

## Troubleshooting

### Common Issues

1. **Version conflicts** - Use `pnpm why <package>` to understand dependency trees
2. **Missing dependencies** - Check if dependencies are properly declared
3. **Workspace issues** - Verify workspace configuration in `pnpm-workspace.yaml`

### Resolution Strategies

```shell
# Clear node_modules and reinstall
rm -rf node_modules/
rm -rf */node_modules/
pnpm install

# Update pnpm lockfile
pnpm install --no-frozen-lockfile

# Force resolution of specific version
# Add to package.json:
{
  "pnpm": {
    "overrides": {
      "package-name": "^1.0.0"
    }
  }
}
```

## Dependency Categories

### Core Dependencies
- TypeScript and type definitions
- Build tools (Vite, Rollup)
- Testing frameworks (Vitest, Playwright)

### Quality Tools
- Biome (linting and formatting)
- TypeDoc (documentation generation)
- Size limit checking tools

### Runtime Dependencies
- Keep minimal for better bundle sizes
- Focus on essential functionality
- Consider tree-shaking support
