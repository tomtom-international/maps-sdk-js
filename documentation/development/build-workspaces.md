---
title: Build workspaces
---

<a style="display: block; margin: 0; padding: 0;" name="_build_workspaces"></a>

## Workspaces

Repository is organised with multiple workspaces that have to be built independently. See the "[Working with workspaces](https://pnpm.io/workspaces)" article.

## Build the workspaces

```shell
# Build all SDK workspaces
pnpm build

# Build specific workspaces using filters
pnpm -F core build
pnpm -F map build
pnpm -F services build

# Build examples
pnpm build:examples

# Alternative: use the -F shorthand
pnpm -F core build
pnpm -F map build
pnpm -F services build
```

After building, the following directories will appear:

- ./core/dist
- ./map/dist
- ./services/dist

Each `./dist` directory contains:

- **src/** - Type definition files for modules
- **index.d.ts** - Main type definitions
- **[workspace].cjs.js** - CommonJS bundle
- **[workspace].cjs.min.js** - Minified CommonJS bundle
- **[workspace].es.js** - ES module bundle
- **[workspace].es.min.js** - Minified ES module bundle
- Source maps for all bundles

## Additional Build Commands

```shell
# Clean build artifacts
pnpm clean

# Build API reference documentation
pnpm build:api-reference

# Type checking without building
pnpm type-check:sdk
pnpm type-check:examples
```

## Build Tools

The project uses:
- **Vite** - Primary build tool and bundler
- **TypeScript** - Type checking and compilation
- **Rollup** - Bundling (via Vite)
- **Shared configs** - Common build configurations across workspaces
