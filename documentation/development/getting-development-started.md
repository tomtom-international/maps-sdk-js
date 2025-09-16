---
title: Getting development started
---

<a style="display: block; margin: 0; padding: 0;" name="_getting_development_started"></a>

## Requirements

Install the following tools:

* Git latest
* NVM latest
* Node.js 22+ (LTS) - via NVM
* pnpm 10+ (see packageManager field in package.json) - installed globally or via corepack

## Setup Node.js/pnpm

```shell
nvm install 22
nvm use 22

# making 22nd version the default one (optional)
nvm alias default 22

# Enable corepack to use the project's specified pnpm version
corepack enable

# Or install pnpm globally
npm install -g pnpm@10.15.1
```

## Check out

Check out the repository https://github.com/tomtom-international/maps-sdk-js:

```shell
git clone git@github.com:tomtom-international/maps-sdk-js.git
# or
git clone https://github.com/tomtom-international/maps-sdk-js.git
```

## Installation

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
