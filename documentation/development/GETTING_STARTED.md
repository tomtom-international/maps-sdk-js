# 🚀 Getting Started with SDK Development

This guide helps you set up your local development environment to build, test, and contribute to the TomTom Maps SDK for JavaScript.

## 📋 Prerequisites

Before you begin, ensure you have the following tools installed:

### Required Tools
- **Git** - Latest version for version control
- **NVM** (Node Version Manager) - Latest version for Node.js management
- **Node.js 22+** (LTS) - Installed via NVM
- **pnpm 10+** - Package manager (see `packageManager` field in root `package.json`)

### Optional but Recommended
- **Visual Studio Code** or **JetBrains IDE** - With recommended extensions
- **Terminal with zsh/bash** - For running commands

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

- Read **[BUILD.md](./BUILD.md)** for detailed build instructions
- Check **[TESTING.md](./TESTING.md)** for testing strategies
- Review **[QUALITY.md](./QUALITY.md)** for code quality standards
- See **[CI_CD.md](./CI_CD.md)** for CI/CD processes
- Reference **[DEPENDENCIES.md](./DEPENDENCIES.md)** for dependency management
- Check **[DOCUMENTATION.md](./DOCUMENTATION.md)** for documentation guidelines

## 🔧 Troubleshooting

### Node.js Version Issues
```shell
# Verify Node.js version
node --version  # Should be 22.x.x or higher

# If wrong version, switch with NVM
nvm use 22
nvm alias default 22
```

### pnpm Issues
```shell
# Verify pnpm version
pnpm --version  # Should be 10.x.x or higher

# Reinstall pnpm if needed
corepack disable
corepack enable
corepack prepare pnpm@latest --activate
```

### Installation Failures
```shell
# Clear caches and reinstall
rm -rf node_modules
rm -rf pnpm-lock.yaml
pnpm store prune
pnpm install
```

### Build Failures
```shell
# Ensure dependencies are installed
pnpm install

# Clean and rebuild
pnpm clean
pnpm build:sdk
```

### Permission Errors
```shell
# If you encounter permission errors with pnpm
# Don't use sudo - instead fix npm/pnpm permissions
```

## 🆘 Getting Help

- Check **[TROUBLESHOOTING.md](../../.ai/TROUBLESHOOTING.md)** for common issues
- Review **[CONTRIBUTING.md](../../CONTRIBUTING.md)** for contribution guidelines
- Open an issue on GitHub for SDK-specific problems
- Contact the team via internal channels for support

## 📚 Additional Resources

- **pnpm Workspaces**: https://pnpm.io/workspaces
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Documentation**: https://vitejs.dev/
- **Vitest Documentation**: https://vitest.dev/
- **Biome Documentation**: https://biomejs.dev/
