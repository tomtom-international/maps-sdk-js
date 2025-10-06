# 🧪 Testing your changes

## 🎯 Testing Strategy

The project uses a comprehensive testing strategy across all workspaces:

- **Unit Tests** - For individual functions and components
- **Integration Tests** - For testing interactions between modules
- **End-to-End Tests** - For testing complete user workflows
- **Example Tests** - For validating example applications

## 🚀 Test Commands

### 🔬 SDK Testing

```shell
# Run all SDK tests (unit + integration)
pnpm test:sdk

# Run tests with coverage reports
pnpm test:sdk:coverage

# Run tests for specific workspaces
pnpm -F core test
pnpm -F services test
pnpm -F map test
```

### 🌐 End-to-End Testing

```shell
# Run integration tests for SDK
pnpm e2e-test:sdk

# Run tests for example applications
pnpm e2e-test:examples
```

### 📋 Individual Workspace Testing

```shell
# Test core functionality
pnpm -F core test
pnpm -F core test:coverage

# Test services (geocoding, routing, etc.)
pnpm -F services test
pnpm -F services test:coverage

# Test map functionality
pnpm -F map test
pnpm -F map test:coverage

# Test map integration
pnpm -F map-integration-tests test
```

## Test Framework

The project uses:
- **Vitest** - Primary testing framework for unit and integration tests
- **Playwright** - For end-to-end browser testing
- **Coverage reporting** - Built into Vitest for code coverage analysis

## Writing Tests

### Unit Tests

Place unit tests next to the code they test with `.test.ts` or `.spec.ts` extension:

```
src/
  utils/
    math.ts
    math.test.ts
  components/
    map.ts
    map.test.ts
```

### Integration Tests

Integration tests are located in the `map-integration-tests` workspace and test the complete SDK functionality in a browser environment.

### Example Tests

Each example application in the `examples/` directory has its own test suite to ensure examples work correctly.

## Coverage Reports

After running tests with coverage, reports are generated in each workspace's `coverage/` directory:

- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON coverage data
- `coverage/clover.xml` - XML coverage data for CI/CD

## Test Configuration

Each workspace has its own test configuration:
- `vitest.config.ts` - Vitest configuration for unit tests
- `playwright.config.ts` - Playwright configuration for E2E tests

## Best Practices

1. **Write tests first** - Follow TDD when possible
2. **Test public APIs** - Focus on testing the public interface
3. **Mock external dependencies** - Use mocks for external services
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive names** - Test names should explain what they verify
6. **Maintain coverage** - Aim for high coverage on critical paths
