# 🧪 Testing the SDK

This guide covers the complete testing strategy for the TomTom Maps SDK for JavaScript, including unit tests, integration tests, and end-to-end tests.

## 🎯 Testing Philosophy

The SDK uses a comprehensive, multi-layered testing approach:

| Test Type | Purpose | Tools | Speed | Coverage |
|-----------|---------|-------|-------|----------|
| **Unit Tests** | Individual functions/components | Vitest | Fast (ms) | High |
| **Integration Tests** | Module interactions | Vitest | Medium (seconds) | Medium |
| **E2E Tests** | Complete workflows | Playwright | Slow (minutes) | Specific |
| **Example Tests** | Validate examples work | Playwright | Slow | Demo verification |

## 🚀 Quick Start

```shell
# Run all SDK tests
pnpm test:sdk

# Run tests with coverage
pnpm test:sdk:coverage

# Run E2E tests
pnpm e2e-test:sdk

# Run example tests
pnpm e2e-test:examples
```

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

## ✍️ Writing Tests

### Test File Structure

Place tests next to the code they test:
```
src/
  feature/
    index.ts
    index.test.ts        # Unit tests
    logic.ts
    logic.test.ts
  tests/
    integration.test.ts  # Integration tests
```

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { formatDistance } from './index';

describe('formatDistance', () => {
  it('should format meters to kilometers', () => {
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('should handle zero distance', () => {
    expect(formatDistance(0)).toBe('0 m');
  });

  it('should throw for negative values', () => {
    expect(() => formatDistance(-100)).toThrow();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocode } from './index';

describe('Geocode Integration', () => {
  beforeEach(() => {
    TomTomConfig.apiKey = 'test-key';
  });

  it('should geocode an address', async () => {
    const result = await geocode({ query: '1600 Amphitheatre Parkway' });
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toBeInstanceOf(Array);
  });
});
```

### Mocking Example

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock external module
vi.mock('external-api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' }))
}));

describe('Feature with External Dependency', () => {
  it('should handle external API calls', async () => {
    const result = await myFunction();
    expect(result).toBeDefined();
  });
});
```

## 🎨 Test Best Practices

### 1. Test Organization
```typescript
// ✅ Good - Clear structure
describe('UserService', () => {
  describe('register', () => {
    it('should create new user', () => { /* ... */ });
    it('should reject duplicate email', () => { /* ... */ });
  });

  describe('login', () => {
    it('should authenticate valid user', () => { /* ... */ });
    it('should reject invalid credentials', () => { /* ... */ });
  });
});

// ❌ Bad - Flat structure
it('user stuff', () => { /* ... */ });
it('more user stuff', () => { /* ... */ });
```

### 2. Test Naming
```typescript
// ✅ Good - Descriptive names
it('should return empty array when no results found', () => {});
it('should throw error when API key is missing', () => {});

// ❌ Bad - Vague names
it('works', () => {});
it('test 1', () => {});
```

### 3. Assertions
```typescript
// ✅ Good - Specific assertions
expect(result.features).toHaveLength(5);
expect(result.type).toBe('FeatureCollection');
expect(error.message).toContain('Invalid API key');

// ❌ Bad - Weak assertions
expect(result).toBeTruthy();
expect(error).toBeDefined();
```

### 4. Test Independence
```typescript
// ✅ Good - Each test is independent
describe('Calculator', () => {
  it('should add numbers', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });

  it('should multiply numbers', () => {
    const calc = new Calculator();
    expect(calc.multiply(2, 3)).toBe(6);
  });
});

// ❌ Bad - Tests depend on each other
let calc;
it('should create calculator', () => {
  calc = new Calculator();
});
it('should add numbers', () => {
  expect(calc.add(2, 3)).toBe(5); // Depends on previous test
});
```

### 5. Mock External Dependencies
```typescript
// ✅ Good - Mock external services
vi.mock('maplibre-gl', () => ({
  Map: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    addLayer: vi.fn()
  }))
}));

// ❌ Bad - Real external calls
// Don't make real API calls in unit tests
```

## 🐛 Troubleshooting Tests

### Issue: Tests Fail After SDK Changes

**Solution**:
```shell
# Rebuild SDK bundles
pnpm build:sdk

# Clear test cache
rm -rf node_modules/.vitest

# Rerun tests
pnpm test:sdk
```

### Issue: Flaky Tests

**Common Causes**:
1. Race conditions in async tests
2. Shared state between tests
3. Timing issues

**Solutions**:
```typescript
// Add proper waits
await waitFor(() => expect(element).toBeInTheDocument());

// Use beforeEach to reset state
beforeEach(() => {
  // Reset everything
});

// Increase timeout for slow operations
it('should load data', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### Issue: Coverage Not Generated

**Solution**:
```shell
# Ensure coverage plugin is installed
pnpm install -D @vitest/coverage-v8

# Run with coverage flag
pnpm test:sdk:coverage

# Check coverage output directory
ls -la core/coverage/
ls -la services/coverage/
ls -la map/coverage/
```

### Issue: Out of Memory in Tests

**Solution**:
```shell
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm test:sdk
```

## 📊 Coverage Analysis

### View Coverage Reports

```shell
# Generate coverage
pnpm test:sdk:coverage

# Open HTML reports
open core/coverage/index.html
open services/coverage/index.html
open map/coverage/index.html
```

### Coverage Goals
- **Critical paths**: 90%+ coverage
- **Public APIs**: 85%+ coverage
- **Utilities**: 80%+ coverage
- **Overall**: 75%+ coverage

### Exclude from Coverage
```javascript
// vitest.config.ts
export default {
  test: {
    coverage: {
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.d.ts'
      ]
    }
  }
}
```

## 🏃‍♂️ Running Specific Tests

```shell
# Run tests matching pattern
pnpm -F services test -- --grep "geocode"

# Run single test file
pnpm -F core test src/util/format.test.ts

# Run tests in watch mode
pnpm -F services test --watch

# Run tests with UI
pnpm -F services test --ui

# Run tests in specific workspace
pnpm -F map test
```

## 🎭 Test Modes

### Watch Mode
```shell
# Auto-rerun tests on file changes
pnpm -F services test --watch
```

### UI Mode
```shell
# Interactive test UI
pnpm -F core test --ui
```

### Debug Mode
```shell
# Run with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

## 📋 Pre-Commit Test Checklist

Before committing code:
- [ ] All tests pass: `pnpm test:sdk`
- [ ] Coverage maintained: `pnpm test:sdk:coverage`
- [ ] No console warnings/errors in tests
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Tests are well-organized and named

## 🔗 Related Documentation

- **[BUILD.md](./BUILD.md)** - Building the SDK
- **[QUALITY.md](./QUALITY.md)** - Code quality standards
- **[CI_CD.md](./CI_CD.md)** - CI/CD testing processes

## 📚 External Resources

- **Vitest Documentation**: https://vitest.dev/
- **Playwright Documentation**: https://playwright.dev/
- **Testing Best Practices**: https://testingjavascript.com/
- **Test Coverage**: https://istanbul.js.org/
