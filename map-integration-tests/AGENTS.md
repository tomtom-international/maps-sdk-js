# AGENTS.md — Map Integration Tests

**Integration tests for the map package** — End-to-end tests validating map functionality in a real browser against a local HTTPS server at `https://localhost:9001`.

## Context

**This directory is exclusively for internal contributors.**

- 🔵 **Internal Contributors** - Running and writing integration tests for the map package
- 🟢 **External Customers** - Not relevant; for SDK development only

## Overview

This directory contains integration tests for the `@tomtom-org/maps-sdk/map` package:
- End-to-end map functionality tests
- Browser-based testing with real map rendering
- Visual regression tests, with committed screenshot baselines
- Performance tests

These tests verify the SDK works correctly in a real browser environment with actual map rendering.

## For Internal Contributors

### Running Tests
```bash
# From repo root
cd map-integration-tests

# Install dependencies (if needed)
pnpm install

# Run integration tests
pnpm test:e2e

# Run specific test
pnpm test:e2e -- <test-name>
```

### Writing Tests
1. Follow existing test patterns in the test files
2. Use the same test framework as existing tests
3. Ensure tests are isolated and repeatable
4. Document complex test scenarios

### Visual Tests

`RouteSectionVisuals.test.ts` asserts what the route and its sections **look like**, with baselines in
`src/tests/snapshots/<feature>/` — the shot is taken by that path (`'routing/tunnel-halo.png'`), so a
feature's baselines stay together. No platform in the name: the tests force SwiftShader, which rasterises
the same everywhere.

`util/VisualScene.ts` is the whole mechanism, and any data-owned module can be tested the same way:
`emptyScene(page)` hides the base map and the POIs, `frameFeatures(page, geoJSON)` fits the features the
test is about, and `expectSceneShot(page, ['<feature>', '<state>.png'])` settles the map and compares.

- **The scene is deliberately empty** — so a shot changes only when the module under test draws
  differently, never because the map style, a POI icon or a label moved.
- **Frame what the test is about, and draw it boldly** — a section at `width: 'l'` on a framed stretch of
  its own puts the states far apart: the regression these were written for moves 2% of the shot against a
  1% tolerance, while repeated runs come out pixel-identical.
- **Regenerate after an intentional styling change** — delete the affected PNGs and run the test; Playwright
  writes the missing baselines. Review the new images before committing them, since a baseline records
  whatever the code drew.

### Test Structure
```
map-integration-tests/
├── src/              # Test source files
├── package.json      # Test dependencies
└── tsconfig.json     # TypeScript config for tests
```

## Common Workflows

**Contributor wants to:**
- **Verify map changes** → Run integration tests after modifying map package
- **Add test coverage** → Write new integration test for new feature
- **Debug test failure** → Run specific test, check console output
- **CI/CD validation** → Tests run automatically on pull requests

## Important Notes

- **API key** — Set `API_KEY_TESTS` in the environment before running; tests read it via `process.env.API_KEY_TESTS`
- **Browser auto-installed** — `pnpm test:e2e` runs `playwright install --with-deps chromium` automatically
- **Build first** — Build the `map` package before running tests (`pnpm -F map build`)
- **Slower than unit tests** — Integration tests take longer to run
