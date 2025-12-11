# 🔍 Quality Control

## 🎯 Code Quality Standards

The project maintains high code quality through automated tools and standardized practices.

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

Key linting rules enforced:

- **No unused variables** - Error level
- **No parameter reassignment** - Error level
- **Use const assertions** - Warning level
- **Use default parameter last** - Error level
- **Use enum initializers** - Error level
- **Self-closing elements** - Error level

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

## 📂 Code Organization

### 📁 File Structure Standards

- Use descriptive file and directory names
- Group related functionality together
- Keep files focused on a single responsibility
- Use consistent naming conventions

### 📦 Import/Export Standards

- Use named exports over default exports when possible
- Group imports logically (external dependencies, internal modules, types)
- Use absolute imports from workspace roots when possible

## 📚 Documentation Standards

### 📝 Code Comments

- Use JSDoc for public APIs
- Explain complex business logic
- Document non-obvious behavior
- Keep comments up-to-date with code changes

### 🔤 Type Definitions

- Use descriptive type names
- Document complex types with comments
- Prefer interfaces over type aliases for object shapes
- Use generic types appropriately

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

## 💡 Best Practices

1. **Run quality checks early and often**
2. **Fix issues as soon as they're detected**
3. **Use consistent naming conventions**
4. **Write self-documenting code**
5. **Keep functions small and focused**
6. **Use meaningful variable names**
7. **Follow the established patterns in the codebase**
