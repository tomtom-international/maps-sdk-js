# 🏗️ Building the SDK

This guide covers building the TomTom Maps SDK for JavaScript from source.

> **Note**: Official SDK packages are published to npm. Building from source is useful for:
> - Understanding the SDK internals
> - Testing unreleased changes
> - Learning from the codebase
> - Running examples locally

## 📦 Workspace Architecture

The repository is organized as a **pnpm monorepo** with multiple independent workspaces. Each workspace can be built separately or together.

### Workspace Overview

| Workspace | Purpose | Output | Dependencies |
|-----------|---------|--------|--------------|
| **core** | Shared utilities, types, config | `core/dist/` | None (base) |
| **services** | API service clients | `services/dist/` | core |
| **map** | Map visualization | `map/dist/` | core, maplibre-gl (peer) |
| **map-integration-tests** | E2E tests | N/A (tests only) | core, services, map |
| **shared-configs** | Build configs | N/A (configs only) | None |
| **examples/** | Demo applications | `examples/dist/` | core, services, map |

### Dependency Graph
```
shared-configs (configs)
    ↓
   core (base)
    ↓         ↓
services      map
              ↓
    map-integration-tests
              ↓
          examples
```

**Important**: Build order matters! Core must be built before services/map.

**Note**: `map-integration-tests` depends on `core` and `map` only. `examples` consume the SDK packages but don't declare them as dependencies.

## 🔨 Build Commands

```shell
# Build all SDK workspaces (recommended)
pnpm build

# Build SDK workspaces explicitly
pnpm build:sdk

# Build specific workspaces using filters
pnpm -F core build
pnpm -F map build
pnpm -F services build

# Build examples
pnpm build:examples
```

After building, the following directories will appear:

- ./core/dist
- ./map/dist
- ./services/dist

Each `./dist` directory contains:

- **src/** - Type definition files for modules
- **index.d.ts** - Main type definitions
- **[workspace].js** - ES module bundle (minified)
- **[workspace].js.map** - Source map
- **THIRD_PARTY.txt** - Third-party licenses

## ⚙️ Additional Build Commands

```shell
# Clean build artifacts and cache
pnpm clean

# Clean specific workspace
pnpm -F core clean:dist

# Build API reference documentation
pnpm build:api-reference

# Type checking without building
pnpm type-check:sdk
pnpm type-check:examples

# Build with watch mode for hot-reloading (development)
pnpm -F core build:watch         # Auto-rebuild core on changes
pnpm -F services build:watch     # Auto-rebuild services on changes
pnpm -F map build:watch           # Auto-rebuild map on changes
```

## 🛠️ Build Tools and Configuration

### Build Stack
The project uses a modern build toolchain:
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe compilation
- **Rollup** - Bundling (via Vite)
- **vite-plugin-dts** - Type declaration generation
- **Biome** - Linting and formatting

### Configuration Files

Each workspace has its own configuration:

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript compiler options |
| `package.json` | Workspace metadata and scripts |
| `vitest.config.ts` | Test configuration (if present) |

Shared configurations are in the `shared-configs` workspace.

## 📊 Build Outputs

### SDK Bundles (core, services, map)

Each SDK workspace produces:
```
workspace/dist/
├── [workspace].es.js          # ES module bundle (minified)
├── [workspace].es.js.map      # Source map
├── index.d.ts                 # Root type definitions
├── src/                       # Module-specific type definitions
│   └── [module]/
│       └── index.d.ts
└── THIRD_PARTY.txt            # Third-party licenses
```

### Examples
```
examples/dist/
└── [example-name]/
    ├── index.html             # Entry HTML
    ├── assets/                # Bundled JS/CSS
    └── [other-assets]         # Images, fonts, etc.
```

## ⏱️ Watch Mode (Development)

For active development, use watch mode to automatically rebuild on file changes:

```shell
# Start watch mode for core (hot-rebuild on file changes)
pnpm -F core build:watch

# Start watch mode for services (hot-rebuild on file changes)
pnpm -F services build:watch

# Start watch mode for map (hot-rebuild on file changes)
pnpm -F map build:watch

# Run multiple watch modes in parallel (use separate terminals)
# Terminal 1 (if working on core):
pnpm -F core build:watch

# Terminal 2 (if working on services):
pnpm -F services build:watch

# Terminal 3 (if working on map):
pnpm -F map build:watch
```

**Available Watch Modes:**
- ✅ **core**: `pnpm -F core build:watch`
- ✅ **services**: `pnpm -F services build:watch`
- ✅ **map**: `pnpm -F map build:watch`

**Note**: When working on core, remember that services and map depend on it. You may need to run watch mode for dependent packages as well to see changes propagate.

## 🔍 Build Verification

After building, verify outputs:

```shell
# Check that dist directories exist
ls -la core/dist/
ls -la services/dist/
ls -la map/dist/

# Verify bundle sizes
du -sh */dist/

# Check type definitions
ls -la core/dist/index.d.ts
```

## 🐛 Troubleshooting Build Issues

### Issue: Build Fails with Type Errors

**Solution**:
```shell
# Rebuild core first (other workspaces depend on it)
pnpm -F core build

# Then rebuild all
pnpm build:sdk
```

### Issue: "Cannot find module" Errors

**Cause**: Missing dependencies or stale build cache

**Solution**:
```shell
# Clean and reinstall
pnpm clean
pnpm install
pnpm build:sdk
```

### Issue: Watch Mode Not Detecting Changes

**Cause**: File watcher limits on Linux/macOS

**Solution**:
```shell
# Check file descriptor limit
ulimit -n  # Should be at least 4096

# Increase if needed (macOS)
ulimit -n 10240

# For permanent fix, edit /etc/security/limits.conf (Linux)
```

### Issue: Out of Memory Errors

**Solution**:
```shell
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 pnpm build:sdk
```

### Issue: Slow Build Times

**Solutions**:
1. Use watch mode during development
2. Build only the workspace you're working on
3. Ensure SSD and sufficient RAM
4. Close resource-intensive applications

### Issue: Bundle Size Too Large

**Check**:
```shell
# View bundle stats (if available)
open */bundle-stats.html

# Or check file sizes
ls -lh */dist/*.js
```

## 🎯 Build Best Practices

### Development Workflow
1. **Incremental builds**: Build only what you're changing
2. **Watch mode**: Use for active development
3. **Verify before commit**: Always build and test before committing

### CI/CD Workflow
1. **Clean builds**: Always start from clean state in CI
2. **Cache dependencies**: Cache `node_modules` for faster CI
3. **Parallel builds**: Build independent workspaces in parallel
4. **Verify outputs**: Check that all expected files are generated

### Performance Tips
- Use `pnpm` instead of `npm` (faster, more efficient)
- Enable caching in Vite configuration
- Build only changed workspaces when possible
- Use multi-core builds (Vite does this automatically)

## 📋 Build Checklist

Before committing:
- [ ] Code builds successfully: `pnpm build:sdk`
- [ ] No type errors: `pnpm type-check:sdk`
- [ ] Code is formatted: `pnpm format:fix`
- [ ] Code is linted: `pnpm lint:fix`
- [ ] Tests pass: `pnpm test:sdk`
- [ ] Examples build: `pnpm build:examples`

## 🔗 Related Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Initial setup
- **[TESTING.md](./TESTING.md)** - Running tests
- **[QUALITY.md](./QUALITY.md)** - Code quality standards
- **[CI_CD.md](./CI_CD.md)** - CI/CD processes

## 📚 External Resources

- **pnpm Workspaces**: https://pnpm.io/workspaces
- **Vite Build**: https://vitejs.dev/guide/build.html
- **TypeScript Compiler**: https://www.typescriptlang.org/docs/handbook/compiler-options.html
- **Rollup Options**: https://rollupjs.org/configuration-options/
