# AGENTS.md - Core Package

**@tomtom-org/maps-sdk/core** - Shared core functionality, types, and utilities used by both map and services packages.

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
- This package is shared infrastructure
- Changes affect both `map` and `services` packages

## Important Notes

- Keep dependencies minimal - this is shared code used across packages
- Changes here have wide-reaching impact on `map` and `services`
- Always test in dependent packages after changes

