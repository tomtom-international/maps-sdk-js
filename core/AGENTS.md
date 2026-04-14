# AGENTS.md — Core Package

**@tomtom-org/maps-sdk/core** — Shared core functionality, types, and utilities used by both map and services packages.

## For External Developers (Using the SDK)

**👉 If you're a customer/user of the SDK, please refer to official documentation:**

- **[Core Quick Start Guide](https://docs.tomtom.com/maps-sdk-js/guides/core/quickstart)** - Getting started with core utilities
- **[Core API Reference](https://docs.tomtom.com/maps-sdk-js/reference/)** - Complete API documentation
- **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/)** - Full documentation

**Note**: Most customers don't import from `/core` directly - it's automatically included when you use `/map` or `/services`.

**Do not** use instructions from this repository for SDK usage - always refer to official docs above.

---

## For Contributors (Developing This Package)

This section is for developers working on the SDK codebase itself.

### Package Overview

This package provides shared infrastructure:

- Common TypeScript types and interfaces
- Shared configuration utilities
- GeoJSON type definitions
- Common helper functions used across the SDK

**Peer Dependencies** (versions from `catalog:` in `pnpm-workspace.yaml`):
- `lodash-es` — Utility functions

**Installation Note**: npm (v7+) and Yarn install peer dependencies automatically. For pnpm, enable automatic installation by adding `auto-install-peers=true` to `.npmrc`, or manually install with: `pnpm install lodash-es`

**Note**: This is internal infrastructure - most SDK users never import it directly. Changes here affect both `map` and `services` packages.

### Development Setup

```bash
# From repo root
pnpm -F core build
```

**💡 Hot-rebuild while developing:**

```bash
# Run in a separate terminal to auto-rebuild on file changes
pnpm -F core build --watch
```

This watches for changes in the `core` package and automatically rebuilds. Useful when making frequent changes to core types/utilities that are used by `map` or `services` packages.

See [../CONTRIBUTING.md](../CONTRIBUTING.md) and [../documentation/development/](../documentation/development/) for detailed setup.

### Common Tasks

**Building:**
```bash
pnpm build             # Build the package
pnpm build:full        # Type check + build
pnpm type-check        # Type checking only
```

**Testing:**
```bash
pnpm test              # Run tests
pnpm test:coverage     # Run with coverage
pnpm test:dist         # Validate built distribution
```

### Contributor Workflows

**Adding a new shared type:**
1. Add type definition in `src/`
2. Export from `index.ts`
3. Run `pnpm build` to regenerate type definitions
4. Update dependent packages (`map` or `services`) as needed

**Making changes:**
1. Edit source files in `src/`
2. Run `pnpm type-check` to verify TypeScript
3. Run `pnpm build` to create distribution
4. Test changes in dependent packages

**Understanding architecture:**
- See [../documentation/development/](../documentation/development/)
- This package is shared infrastructure — changes affect both `map` and `services` packages

## Source Structure Conventions

### Barrel files (`index.ts`)

Each directory exposes its public surface through an `index.ts` barrel. Because the package entry point re-exports these barrels wholesale, anything in a directory barrel becomes part of the public API — so keep them selective.

Internal symbols are not added to `index.ts` and are imported directly from their source file:

```typescript
// Internal cross-directory import — go directly to the source file
import { internalHelper } from './util/internalHelper';
```

### `types/` subdirectories — public API types only

`types/` subdirectories contain only types that are part of the public API reference. Internal helpers belong in the source file that uses them.

```
src/types/          ← public SDK types (Place, Route, BBox, …)
src/types/place/    ← place-specific type groupings
src/types/route/    ← route-specific type groupings
src/types/traffic/  ← traffic-specific type groupings
```

### `tests/` subdirectories

Test files live in a `tests/` subdirectory alongside the source files they cover:

```
src/config/tests/    ← tests for src/config/
src/util/tests/      ← tests for src/util/
```

---

## Important Notes

- Keep dependencies minimal — this is shared code used across packages
- Changes here have wide-reaching impact on `map` and `services`
- Always test in dependent packages after changes
