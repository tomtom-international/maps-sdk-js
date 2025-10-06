# 🏗️ Building Workspaces

## 📦 Workspaces

Repository is organised with multiple workspaces that have to be built independently. See the "[Working with workspaces](https://pnpm.io/workspaces)" article.

The project contains the following workspaces:
- **core** - Core SDK functionality
- **services** - API services (geocoding, routing, etc.)
- **map** - Map rendering and interaction
- **map-integration-tests** - Integration tests for map functionality
- **shared-configs** - Shared configuration files (TypeScript, Vite)
- **examples/** - Example applications demonstrating SDK usage

## 🔨 Build the workspaces

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
- **[workspace].cjs.js** - CommonJS bundle
- **[workspace].cjs.min.js** - Minified CommonJS bundle
- **[workspace].es.js** - ES module bundle
- **[workspace].es.min.js** - Minified ES module bundle
- Source maps for all bundles

## ⚙️ Additional Build Commands

```shell
# Clean build artifacts and cache
pnpm clean

# Build API reference documentation
pnpm build:api-reference

# Type checking without building
pnpm type-check:sdk
pnpm type-check:examples
```

## 🛠️ Build Tools

The project uses:
- **Vite** - Primary build tool and bundler
- **TypeScript** - Type checking and compilation
- **Rollup** - Bundling (via Vite)
- **Shared configs** - Common build configurations across workspaces
- **TypeDoc** - API reference documentation generation
