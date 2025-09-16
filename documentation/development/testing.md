---
title: Testing your changes
---

<a style="display: block; margin: 0; padding: 0;" name="_testing"></a>

## Unit Testing

The project uses Vitest for unit testing. Some modules depend on others, so those should be built first with type definitions generation.

```shell
# Run tests for all SDK workspaces
pnpm test:sdk

# Run tests for specific workspaces
pnpm -F core test
pnpm -F map test
pnpm -F services test

# Run integration tests
pnpm -F map-integration-tests test

# Run tests for examples
pnpm test:examples
```

## Test Coverage

Generate test coverage reports:

```shell
# Coverage for all SDK workspaces
pnpm test:sdk:coverage

# Coverage for specific workspaces
pnpm -F core test:coverage 
pnpm -F map test:coverage
pnpm -F services test:coverage
```

Coverage reports appear in workspace directories:

- ./core/coverage
- ./map/coverage
- ./services/coverage

Generated formats:

- **HTML** - Interactive coverage report
- **LCOV** - For CI/CD integration
- **JSON** - Machine-readable format
- **CLOVER** - XML format for some tools

## End-to-End Testing

The project includes integration tests using Playwright:

```shell
# Run end-to-end tests for SDK
pnpm e2e-test:sdk

# Run end-to-end tests for examples
pnpm e2e-test:examples
```

## Testing Tools

The project uses:
- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing
- **@vitest/coverage-v8** - Coverage reporting
- **Testing Library** - DOM testing utilities (where applicable)

## Test Configuration

Test configurations are shared across workspaces using the shared-configs package, ensuring consistent testing setup across all workspaces.
