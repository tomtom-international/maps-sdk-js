# AGENTS.md - Services Package

**@tomtom-org/maps-sdk/services** - Location APIs for search, routing, geocoding, and more. Works on web, Node.js, and React Native.

## For External Developers (Using the SDK)

**👉 If you're a customer/user of the SDK, please refer to official documentation:**

- **[Services Quick Start Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/quickstart)** - Getting started with services
- **[Services API Reference](https://docs.tomtom.com/maps-sdk-js/reference/)** - Complete API documentation
- **[Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples
- **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/introduction/overview)** - Full documentation

**Do not** use instructions from this repository for SDK usage - always refer to official docs above.

---

## For Contributors (Developing This Package)

This section is for developers working on the SDK codebase itself.

### Package Overview

This package provides API clients for TomTom Location Services:
- **Search** - Find places, addresses, POIs
- **Geocoding** - Convert addresses to coordinates
- **Reverse Geocoding** - Convert coordinates to addresses  
- **Routing** - Calculate routes between locations
- **Geometry Search** - Search within specific areas
- **EV Charging Stations** - Find charging stations
- **Traffic** - Traffic flow and incidents

**Platform Support**: All platforms (web browsers, Node.js, React Native)


### Development Setup

```bash
# From repo root
pnpm -F services build
```

**💡 Hot-rebuild while developing:**
```bash
# Run in a separate terminal to auto-rebuild on file changes
pnpm -F services build --watch
```
This watches for changes in the `services` package and automatically rebuilds. Useful when iterating on service APIs and testing changes in examples.

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
# Test with relevant examples (geocode, route, search, etc.)
```

### Contributor Workflows

**Adding a new service API:**
1. Create new service module in `src/`
2. Export from `index.ts`
3. Add tests
4. Build and test in examples
5. Update documentation

**Modifying existing API:**
1. Edit relevant files in `src/`
2. Run `pnpm test` for unit tests
3. Run `pnpm build` to rebuild
4. Test changes in examples directory

**Understanding architecture:**
- See [../documentation/development/](../documentation/development/)
- Check existing service modules in `src/` for patterns
- All services work on web, Node.js, and React Native

## Important Notes

- **No map dependency** - This package has no UI dependencies and works everywhere
- **API key required** - All services need a TomTom API key
- **Promise-based** - All APIs return Promises (use async/await)
- **GeoJSON format** - Results use standard GeoJSON format where applicable
- **Cross-platform** - Same API works in browser, Node.js, and React Native

