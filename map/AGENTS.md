# AGENTS.md - Map Package

**@tomtom-org/maps-sdk/map** - Interactive maps with TomTom styling and features. Web browsers only.

## For External Developers (Using the SDK)

**👉 If you're a customer/user of the SDK, please refer to official documentation:**

- **[Map Quick Start Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart)** - Getting started with maps
- **[Map API Reference](https://docs.tomtom.com/maps-sdk-js/reference/)** - Complete API documentation
- **[Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples
- **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/)** - Full documentation

**Do not** use instructions from this repository for SDK usage - always refer to official docs above.

---

## For Contributors (Developing This Package)

This section is for developers working on the SDK codebase itself.

### Package Overview

- **Purpose**: Interactive map visualization built on MapLibre GL JS
- **Platform**: Web browsers only
- **Peer Dependency**: `maplibre-gl` v4.x required
- **Entry Point**: `index.ts`
- **Key Modules**: `base`, `geometry`, `hillshade`, `init`, `places`, `pois`, `routing`, `traffic`, `TomTomMap`

### Development Setup

```bash
# From repo root
pnpm -F map build
```

**💡 Hot-rebuild while developing:**
```bash
# Run in a separate terminal to auto-rebuild on file changes
pnpm -F map build --watch
```
This watches for changes in the `map` package and automatically rebuilds. Useful when developing map features and testing changes in examples with live reload.

See [../CONTRIBUTING.md](../CONTRIBUTING.md) and [../documentation/development/](../documentation/development/) for detailed setup.

### Common Tasks

**Building:**
```bash
pnpm build             # Build the package
pnpm build:watch       # Build and watch for changes
pnpm build:full        # Type check + build
pnpm type-check        # Type checking only
```

**Testing:**
```bash
pnpm test              # Run tests
pnpm test:coverage     # Run with coverage
pnpm test:dist         # Validate built distribution
```

**Testing in Examples:**
```bash
# After building this package
cd ../examples
pnpm dev
# Open browser to test your changes
```

### Contributor Workflows

**Adding a new map feature:**
1. Create feature module in `src/`
2. Export from `index.ts`
3. Add tests
4. Build and test in examples
5. Update documentation

**Modifying layer rendering:**
1. Edit relevant layer module in `src/`
2. Run `pnpm build`
3. Test changes in examples directory
4. Use browser DevTools for debugging

**Understanding architecture:**
- See [../documentation/development/](../documentation/development/)
- Check existing modules in `src/` for patterns
- Review MapLibre GL JS documentation for underlying library

## Important Notes

- **Web only** - This package uses MapLibre GL JS which requires a browser environment
- **Peer dependency** - Always install `maplibre-gl` alongside this package
- **CSS required** - Must import `maplibre-gl/dist/maplibre-gl.css`
- **API key required** - Need TomTom API key for map tiles and services
- **MapLibre compatibility** - Built on MapLibre GL JS v4.x
- **For Node.js/backend** - Use `@tomtom-org/maps-sdk/services` instead

