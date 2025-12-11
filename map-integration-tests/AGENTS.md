# AGENTS.md - Map Integration Tests

**Integration tests for the map package** - End-to-end tests validating map functionality.

## Context

**This directory is exclusively for internal contributors.**

- 🔵 **Internal Contributors** - Running and writing integration tests for the map package
- 🟢 **External Customers** - Not relevant; for SDK development only

## Overview

This directory contains integration tests for the `@tomtom-org/maps-sdk/map` package:
- End-to-end map functionality tests
- Browser-based testing with real map rendering
- Visual regression tests (if applicable)
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
pnpm test

# Run specific test
pnpm test -- <test-name>
```

### Writing Tests
1. Follow existing test patterns in the test files
2. Use the same test framework as existing tests
3. Ensure tests are isolated and repeatable
4. Document complex test scenarios

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

- **Browser environment required** - Tests need a browser or headless browser
- **Map package dependency** - Tests import from `../map`
- **Build first** - Build map package before running tests
- **Slower than unit tests** - Integration tests take longer to run
- **For CI/CD** - These tests run in the continuous integration pipeline

