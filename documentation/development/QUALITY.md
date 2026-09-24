# 🔍 Code Quality

The SDK maintains code quality through automated tools and standardized practices. This guide helps you understand and run quality checks when building from source.

The rules those checks cannot express — reuse, type precision, comment density, naming, structure — are in [CODING_GUIDELINES.md](../../CODING_GUIDELINES.md) at the repository root.

## 🎨 Linting and Formatting

The project uses **Biome** for both linting and formatting, providing fast and consistent code quality checks.

### 💅 Formatting Commands

```shell
# Check formatting
pnpm format

# Fix formatting issues
pnpm format:fix
```

### 🔧 Linting Commands

```shell
# Check for lint issues
pnpm lint

# Fix lint issues automatically
pnpm lint:fix
```

## ⚙️ Code Style Configuration

The project follows these formatting standards (configured in `biome.json`):

- **Indentation**: 4 spaces
- **Line width**: 120 characters
- **Quote style**: Single quotes
- **Semicolons**: Always required
- **Trailing commas**: Always required

## 🚦 Linting Rules

Biome's recommended set is off; `biome.json` enables an explicit list. Only the error-level rules fail CI — a warning is reported and passes, so treat warnings on lines you touched as yours to fix:

| Rule | Level |
|---|---|
| `noUnusedImports` | error |
| `useArrowFunction` | error |
| `noParameterAssign` | error |
| `useDefaultParameterLast` | error |
| `useEnumInitializers` | error |
| `useSelfClosingElements` | error |
| `useSingleVarDeclarator` | error |
| `noUnusedTemplateLiteral` | error |
| `useNumberNamespace` | error |
| `noRestrictedImports` (`services`↛`map`, `map`↛`services`) | error |
| `noUnusedVariables` | warn |
| `noNonNullAssertion` | warn |
| `useAsConstAssertion` | warn |
| `noInferrableTypes` | warn |
| `noExcessiveCognitiveComplexity` (max 25) | warn |
| `noExcessiveLinesPerFunction` (max 50, blank lines skipped; off in tests) | warn |
| `noExplicitAny` | warn |
| `useConsistentTypeDefinitions` (`type`, not `interface`) | warn |

`noExplicitAny`, `noExcessiveLinesPerFunction` and `useConsistentTypeDefinitions` each carry a backlog of existing
hits, so `pnpm lint` is noisy at the repository level. Read them per file rather than as a total.

`noExcessiveLinesPerFunction` is off under `**/tests/**`, `**/*.test.ts` and `**/e2e-tests/**`: a `describe` or
`test` body is a function to the rule, so every suite of any length counts as one over-long one.

## ✅ Type Checking

Ensure type safety across all workspaces:

```shell
# Type check all SDK workspaces
pnpm type-check:sdk

# Type check examples
pnpm type-check:examples

# Type check specific workspaces
pnpm -F core type-check
pnpm -F services type-check
pnpm -F map type-check
```

## 🏃‍♂️ Pre-commit Quality Checks

Before committing code, run the complete quality check suite:

```shell
# Full quality check workflow
pnpm lint:fix && pnpm format:fix && pnpm type-check:sdk && pnpm test:sdk
```

## 🚪 Quality Gates

The following quality gates must pass before merging:

1. **Linting** - No lint errors allowed
2. **Formatting** - Code must be properly formatted
3. **Type checking** - No type errors allowed
4. **Tests** - All tests must pass
5. **Coverage** - Maintain adequate test coverage

## 🛠️ Tools and Configuration

### 🎛️ Biome Configuration

The project uses Biome (configured in `biome.json`) for:
- Code formatting
- Linting JavaScript/TypeScript
- Import organization
- Code analysis

### 📋 TypeScript Configuration

Each workspace has its own `tsconfig.json` with shared base configurations from the `shared-configs` workspace.

### 🖥️ Editor Integration

For the best development experience:
- Install Biome extension for your editor
- Enable format-on-save
- Enable lint-on-type
- Configure your editor to show type hints
