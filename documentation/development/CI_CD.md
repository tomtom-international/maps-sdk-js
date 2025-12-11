# 🚀 CI/CD

## 🔄 Continuous Integration and Deployment

This guide covers the CI/CD pipeline, automated testing, and deployment processes for the Maps SDK JavaScript project.

## 🔨 Build Pipeline

The project uses automated build processes that run on every commit and pull request.

### 📋 Build Steps

1. **Environment Setup**
   - Node.js 22+ installation
   - pnpm installation and caching
   - Dependency installation

2. **Quality Checks**
   - Code formatting verification (`pnpm format`)
   - Linting checks (`pnpm lint`)
   - Type checking (`pnpm type-check:sdk`)

3. **Testing**
   - Unit tests (`pnpm test:sdk`)
   - Coverage reporting (`pnpm test:sdk:coverage`)
   - Integration tests (`pnpm e2e-test:sdk`)
   - Example tests (`pnpm e2e-test:examples`)

4. **Build**
   - SDK compilation (`pnpm build:sdk`)
   - Example builds (`pnpm build:examples`)
   - Documentation generation (`pnpm build:api-reference`)

## 🚪 Quality Gates

All changes must pass these automated quality gates:

### 🎨 Code Quality
- ✅ Biome linting passes
- ✅ Code formatting is correct
- ✅ TypeScript compilation succeeds
- ✅ No type errors

### 🧪 Testing
- ✅ All unit tests pass
- ✅ Integration tests pass
- ✅ Example applications work correctly
- ✅ Test coverage meets minimum thresholds

### ✅ Build Verification
- ✅ All workspaces build successfully
- ✅ Bundle size limits are respected
- ✅ Documentation generates without errors

## Branch Protection

### Main Branch
- Requires pull request reviews
- Requires status checks to pass
- No direct pushes allowed
- Requires up-to-date branches

### Pull Request Workflow
1. Create feature branch from `main`
2. Make changes and commit
3. Push branch and create pull request
4. Automated checks run
5. Code review required
6. Merge after approval and passing checks

## Automated Checks

### Pre-commit Hooks
```shell
# Recommended pre-commit workflow
pnpm lint:fix && pnpm format:fix && pnpm type-check:sdk && pnpm test:sdk
```

### Status Checks
- **Build** - All workspaces must build successfully
- **Lint** - Code must pass linting rules
- **Format** - Code must be properly formatted
- **Type Check** - No TypeScript errors allowed
- **Tests** - All tests must pass
- **Coverage** - Maintain test coverage thresholds

## Deployment Process

### Package Publishing
The project publishes to TomTom's internal npm registry:
- Registry: `https://artifactory.tomtom.com/artifactory/api/npm/maps-sdk-js-npm-local/`
- Automated version bumping
- Changelog generation
- Release notes creation

### Documentation Deployment
- API reference documentation is automatically built and deployed
- Examples are deployed for testing and demonstration
- Documentation portal is updated with latest changes

## Environment Variables

### Build Environment
- `NODE_ENV` - Environment setting (development/production)
- `CI` - Indicates CI environment
- Custom environment variables for API keys and configuration

### Security
- API keys and secrets managed through secure environment variables
- No sensitive information in source code
- Dependency vulnerability scanning

## Monitoring and Alerts

### Build Monitoring
- Build status notifications
- Performance regression detection
- Bundle size monitoring
- Dependency vulnerability alerts

### Quality Metrics
- Test coverage tracking
- Code quality metrics
- Performance benchmarks
- Bundle size trends

## Local CI Simulation

To simulate CI checks locally:

```shell
# Full CI-like check sequence
pnpm clean
pnpm install
pnpm lint
pnpm format
pnpm type-check:sdk
pnpm type-check:examples
pnpm build
pnpm test:sdk:coverage
pnpm e2e-test:sdk
pnpm e2e-test:examples
```

## Troubleshooting CI Issues

### Common CI Failures

1. **Lint Failures**
   ```shell
   pnpm lint:fix
   ```

2. **Format Failures**
   ```shell
   pnpm format:fix
   ```

3. **Type Errors**
   ```shell
   pnpm type-check:sdk
   # Fix reported type errors
   ```

4. **Test Failures**
   ```shell
   pnpm test:sdk
   # Investigate and fix failing tests
   ```

5. **Build Failures**
   ```shell
   pnpm build:sdk
   # Check for compilation errors
   ```

### Cache Issues
- Clear pnpm cache: `pnpm store prune`
- Clear workspace caches: `pnpm clean`
- Reinstall dependencies: `pnpm install --no-frozen-lockfile`

## Best Practices

### Commit Messages
- Use conventional commit format
- Include scope when relevant (core, services, map)
- Clear and descriptive messages

### Pull Request Guidelines
- Keep PRs focused and reasonably sized
- Include tests for new functionality
- Update documentation when needed
- Ensure all CI checks pass before requesting review

### Release Process
- Follow semantic versioning
- Update changelog
- Tag releases appropriately
- Test releases before publishing
