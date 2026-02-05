# 🚀 Getting Started with SDK Development

This guide helps you set up your local development environment to build and test the TomTom Maps SDK for JavaScript from source.

> [!IMPORTANT]
> **This guide is for SDK source development** (building the SDK itself from source).
> 
> **If you want to use the SDK in your application**, see the official documentation:  
> 👉 **[Project Setup Guide](https://docs.tomtom.com/maps-sdk-js/introduction/project-setup)**

## 📋 Prerequisites

Before you begin, ensure you have the following tools installed:

### Required Tools
- **Git** - Latest version for version control
- **NVM** (Node Version Manager) - Latest version for Node.js management
- **Node.js 24+** (LTS) - Installed via NVM
- **pnpm 10+** - Package manager (see `packageManager` field in root `package.json`)

### Optional but Recommended
- **Visual Studio Code** or **JetBrains IDE** - With recommended extensions
- **Terminal with zsh/bash** - For running commands

## ⚙️ Setup Node.js/pnpm

```shell
nvm install 24
nvm use 24

# Enable corepack to use the project's specified pnpm version
corepack enable

# Or install pnpm globally
npm install -g pnpm@10+
```

## 📥 Clone the Repository

Clone the repository:

```shell
git clone https://github.com/tomtom-international/maps-sdk-js.git
cd maps-sdk-js
```

## 📦 Installation

The project uses pnpm workspaces. Install dependencies for all workspaces:

```shell
# Install dependencies for all workspaces (recommended)
pnpm install
```

The `node_modules` directory appears in each workspace as well as the root directory. This is the expected behavior with pnpm workspaces.

## 🔑 Environment Variables Setup

The SDK requires API keys for running examples and tests. You need to create `.env` files in two locations:

### 1. Examples API Key

For running example applications:

```shell
# Copy the template
cp examples/.env.example examples/.env

# Edit and add your API key
# examples/.env
API_KEY_EXAMPLES=your_api_key_here
```

### 2. Tests API Key

For running integration tests:

```shell
# Copy the template
cp shared-configs/.env.example shared-configs/.env

# Edit and add your API key
# shared-configs/.env
API_KEY_TESTS=your_api_key_here
```

> [!TIP]
> You can obtain a TomTom API key from [MyTomTom](https://my.tomtom.com/).

> [!NOTE]
> `.env` files are git-ignored for security. Never commit them to the repository.

## Workspace Structure

The project is organized into the following workspaces:

- **core** - Core SDK functionality
- **services** - API services (geocoding, routing, etc.)
- **map** - Map rendering and interaction
- **plugins/** - Optional plugins that extend SDK functionality
- **map-integration-tests** - Integration tests for map functionality
- **shared-configs** - Shared configuration files (TypeScript, Vite)
- **examples/** - Example applications demonstrating SDK usage

## Quick Start Commands

After installation, you can use these commands to get started:

```shell
# Build all SDK workspaces (REQUIRED before running examples)
pnpm build

# Build plugins (optional)
pnpm build:plugins

# Run tests for all SDK workspaces
pnpm test:sdk

# Run type checking
pnpm type-check:sdk

# Lint and fix code
pnpm lint:fix

# Format code
pnpm format:fix
```

> [!IMPORTANT]
> **You must build the SDK first** (`pnpm build`) before running examples.
> Examples depend on the built SDK packages in `core/dist`, `services/dist`, and `map/dist`.

## Development Workflow

1. Install dependencies: `pnpm install`
2. Build the SDK: `pnpm build` (required before running examples)
3. Make your changes in the relevant workspace
4. Run tests: `pnpm test:sdk`
5. Format and lint: `pnpm format:fix && pnpm lint:fix`
6. Type check: `pnpm type-check:sdk`

### Running Examples Locally

To run an example in development mode:

```shell
# First, ensure the SDK is built
pnpm build:sdk

# Then run an example (e.g., default-map)
pnpm -F @examples/default-map develop

# The development server will start at http://localhost:5173/
```

You can also change to an example directory and run directly:

```shell
cd examples/default-map
pnpm develop
```

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
node --version  # Should be 24.x.x or higher

# If wrong version, switch with NVM
nvm use 24
nvm alias default 24
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

- Check [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines
- Open an [issue on GitHub](https://github.com/tomtom-international/maps-sdk-js/issues) for problems or questions
- Start a [GitHub Discussion](https://github.com/tomtom-international/maps-sdk-js/discussions) for general questions

## 📚 Additional Resources

- **pnpm Workspaces**: https://pnpm.io/workspaces
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Documentation**: https://vitejs.dev/
- **Vitest Documentation**: https://vitest.dev/
- **Biome Documentation**: https://biomejs.dev/
