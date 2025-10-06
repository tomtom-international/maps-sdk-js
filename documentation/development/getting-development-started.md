# 🚀 Getting development started

## 📋 Requirements

Install the following tools:

* Git latest
* NVM latest
* Node.js 22+ (LTS) - via NVM
* pnpm 10+ (see packageManager field in package.json) - installed globally or via corepack

## ⚙️ Setup Node.js/pnpm

```shell
nvm install 22
nvm use 22

# making 22nd version the default one (optional)
nvm alias default 22

# Enable corepack to use the project's specified pnpm version
corepack enable

# Or install pnpm globally
npm install -g pnpm@10+
```

## 📥 Check out

Check out the repository https://github.com/tomtom-international/maps-sdk-js:

```shell
git clone git@github.com:tomtom-international/maps-sdk-js.git
# or
git clone https://github.com/tomtom-international/maps-sdk-js.git
```

## 📦 Installation

The project uses pnpm workspaces. Install dependencies for all workspaces:

```shell
# Install dependencies for all workspaces (recommended)
pnpm install

# Alternative: install for specific workspaces
pnpm install -F core
pnpm install -F map
pnpm install -F services
pnpm install -F map-integration-tests
pnpm install -F shared-configs
pnpm install -F './examples/*'
```

The `node_modules` directory appears in each workspace as well as the root directory. This is the expected behavior with pnpm workspaces.

## Workspace Structure

The project is organized into the following workspaces:

- **core** - Core SDK functionality
- **services** - API services (geocoding, routing, etc.)
- **map** - Map rendering and interaction
- **map-integration-tests** - Integration tests for map functionality
- **shared-configs** - Shared configuration files (TypeScript, Vite)
- **examples/** - Example applications demonstrating SDK usage

## Quick Start Commands

After installation, you can use these commands to get started:

```shell
# Build all SDK workspaces
pnpm build

# Run tests for all SDK workspaces
pnpm test:sdk

# Run type checking
pnpm type-check:sdk

# Format code
pnpm format:fix

# Lint and fix code
pnpm lint:fix
```

## Development Workflow

1. Install dependencies: `pnpm install`
2. Build the project: `pnpm build`
3. Make your changes in the relevant workspace
4. Run tests: `pnpm test:sdk`
5. Format and lint: `pnpm format:fix && pnpm lint:fix`
6. Type check: `pnpm type-check:sdk`

## Next Steps

- Read the [Build Workspaces](./build-workspaces.md) guide for detailed build instructions
- Check the [Testing](./testing.md) guide for testing strategies
- Review the [Quality Control](./quality-control.md) guide for code quality standards
