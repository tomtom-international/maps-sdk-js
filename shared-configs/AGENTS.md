# AGENTS.md - Shared Configs

**Shared configuration files for the monorepo** - Reusable configs for TypeScript, build tools, and linters.

## Context

**This directory is exclusively for internal contributors.**

- 🔵 **Internal Contributors** - Managing shared tooling configurations
- 🟢 **External Customers** - Not relevant; internal build infrastructure only

## Overview

This directory contains shared configuration files used across the monorepo:
- TypeScript configurations (tsconfig)
- Build tool configs (Vite, Rollup)
- Linter/formatter configs (Biome, ESLint)
- Test configurations (Vitest)

These configs are imported and extended by individual packages to ensure consistency.

## Structure

```
shared-configs/
├── tsconfig.base.json       # Base TypeScript config
├── vite.config.base.ts      # Base Vite build config
├── vitest.config.base.ts    # Base Vitest test config
└── ...                      # Other shared configs
```

## For Internal Contributors

### Using Shared Configs

**In package tsconfig.json:**
```json
{
  "extends": "../shared-configs/tsconfig.base.json",
  "compilerOptions": {
    // Package-specific overrides
  }
}
```

**In package vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import baseConfig from '../shared-configs/vite.config.base';

export default defineConfig({
  ...baseConfig,
  // Package-specific overrides
});
```

### Modifying Shared Configs

**⚠️ Warning**: Changes here affect ALL packages!

1. Understand impact on all packages
2. Test changes across packages
3. Update documentation if behavior changes
4. Consider backward compatibility

### Common Workflows

**Contributor wants to:**
- **Update TypeScript settings** → Modify `tsconfig.base.json`
- **Change build configuration** → Edit `vite.config.base.ts`
- **Adjust linting rules** → Update linter configs
- **Add new shared config** → Create new base config file
- **Package-specific config** → Override in package's config file

## Important Notes

- **Monorepo consistency** - Ensures all packages use same tooling versions and settings
- **Breaking changes** - Config changes can break builds across packages
- **Test thoroughly** - Run builds for all packages after config changes
- **Documentation** - Keep configs well-commented for maintainability
- **Extends pattern** - Packages extend these configs, can override as needed

## Testing Config Changes

```bash
# From repo root, test all packages
pnpm build

# Test specific package
cd core && pnpm build
cd ../map && pnpm build
cd ../services && pnpm build

# Run all tests
pnpm test
```

