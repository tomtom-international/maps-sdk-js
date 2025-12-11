# AGENTS.md

**TomTom Maps SDK for JavaScript** - A library for building applications with TomTom location maps and services. Supports web, Node.js, and React Native platforms.

## Project Overview

This is a monorepo containing three main packages:
- `@tomtom-org/maps-sdk/core` - Common configuration, types, and utilities
- `@tomtom-org/maps-sdk/services` - Location APIs (search, routing, geocoding) for all platforms
- `@tomtom-org/maps-sdk/map` - Interactive maps (web only, requires maplibre-gl peer dependency)

**Important**: This SDK is in Public Preview (0.x) - check [CHANGELOG.md](./CHANGELOG.md) for breaking changes between versions.

## For External Developers (Using the SDK)

**👉 If you're a customer/user of the SDK, please refer to official documentation:**

- **[Getting Started Guide](https://docs.tomtom.com/maps-sdk-js/getting-started/)** - Installation and setup
- **[Map Quick Start](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart)** - Getting started with maps
- **[Services Quick Start](https://docs.tomtom.com/maps-sdk-js/guides/services/quickstart)** - Getting started with services
- **[Core Quick Start](https://docs.tomtom.com/maps-sdk-js/guides/core/quickstart)** - Getting started with core utilities
- **[API Reference](https://docs.tomtom.com/maps-sdk-js/reference/)** - Complete API documentation
- **[Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples

**Do not** use instructions from this repository for SDK usage - always refer to official docs above.

---

## For Contributors (Developing the SDK)

**👉 If you're contributing to the SDK codebase:**

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to this project
- **[documentation/development/](./documentation/development/)** - Internal development guides
- Package-specific AGENTS.md files: [core/](./core/AGENTS.md), [map/](./map/AGENTS.md), [services/](./services/AGENTS.md), [examples/](./examples/AGENTS.md)

## Development Setup (Contributors Only)

```bash
# Clone and setup
pnpm install
pnpm build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [documentation/development/](./documentation/development/) for complete development guidelines.


## Important Notes

- **Platform compatibility**: `/services` works everywhere (web, Node.js, React Native); `/map` is web-only
- **Default assumption**: Users are asking about *using* the SDK → Direct them to official docs
- **For code examples**: Always reference [official documentation](https://docs.tomtom.com/maps-sdk-js/)
- **Version awareness**: 0.x = Public Preview with potential breaking changes

