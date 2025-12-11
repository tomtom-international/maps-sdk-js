# 🔧 Internal SDK Development Documentation

This directory contains documentation for **internal SDK development** - building, testing, and contributing to the TomTom Maps SDK for JavaScript codebase.

## 🎯 Who This Is For

- SDK contributors (TomTom team members)
- External contributors wanting to submit PRs
- Developers building the SDK from source
- Anyone needing to modify or test the SDK itself

## 📚 Available Documents

### Getting Started

#### **[GETTING_STARTED.md](./GETTING_STARTED.md)**
*Set up your local development environment*
- Requirements (Node.js, pnpm, etc.)
- Cloning the repository
- Installing dependencies
- Quick start commands
- Development workflow
- Troubleshooting setup issues

**Start here if you're new to SDK development**

---

### Building

#### **[BUILD.md](./BUILD.md)**
*Building the SDK workspaces*
- Workspace architecture and dependencies
- Build commands for each workspace
- Build outputs and artifacts
- Watch mode for development
- Build troubleshooting
- Performance tips

**Reference when building the SDK from source**

---

### Testing

#### **[TESTING.md](./TESTING.md)**
*Testing the SDK*
- Testing philosophy and strategy
- Test commands for all workspaces
- Writing unit and integration tests
- Running specific tests
- Coverage reports and analysis
- Test frameworks (Vitest, Playwright)
- Troubleshooting test issues

**Reference when writing or running tests**

---

### Code Quality

#### **[QUALITY.md](./QUALITY.md)**
*Maintaining code quality*
- Linting with Biome
- Formatting standards
- Code style configuration
- Running quality checks
- Pre-commit requirements
- Best practices

**Reference before committing code**

---

### CI/CD

#### **[CI_CD.md](./CI_CD.md)**
*Continuous integration and deployment*
- CI/CD pipeline overview
- GitHub Actions workflows
- Automated checks
- Quality gates
- Release process
- Deployment procedures

**Reference when setting up or troubleshooting CI/CD**

---

### Dependencies

#### **[DEPENDENCIES.md](./DEPENDENCIES.md)**
*Managing dependencies*
- Updating npm packages
- pnpm catalog management
- Adding/removing dependencies
- Dependency auditing
- Version synchronization
- Troubleshooting dependency issues

**Reference when updating dependencies**

---

### Documentation

#### **[DOCUMENTATION.md](./DOCUMENTATION.md)**
*Generating and maintaining documentation*
- Writing customer-facing documentation
- TypeDoc API reference generation
- Documentation structure
- Building documentation
- Publishing documentation
- Documentation standards

**Reference when updating API documentation**

---

## 🆚 Internal vs External Documentation

### Internal Development (This Directory)
**Purpose**: Building and contributing to the SDK itself
- Cloning repository
- Setting up development environment
- Building from source
- Running SDK tests
- Making code changes
- Submitting PRs

### External Usage ([../../.ai/](../../.ai/))
**Purpose**: Using the published SDK in customer applications
- Installing npm package
- Using SDK features
- Customer code examples
- Troubleshooting customer apps
- Understanding SDK capabilities

---

## 🚀 Quick Start for New Contributors

### 1. Environment Setup
```bash
# Follow GETTING_STARTED.md
nvm use 22
corepack enable
git clone https://github.com/tomtom-international/maps-sdk-js.git
cd maps-sdk-js
pnpm install
```

### 2. Build the SDK
```bash
# Follow BUILD.md
pnpm build:sdk
```

### 3. Run Tests
```bash
# Follow TESTING.md
pnpm test:sdk
```

### 4. Check Code Quality
```bash
# Follow QUALITY.md
pnpm lint:fix
pnpm format:fix
pnpm type-check:sdk
```

### 5. Make Changes
- Create a feature branch
- Make your changes
- Write/update tests
- Run all checks
- Submit PR (see [../../CONTRIBUTING.md](../../CONTRIBUTING.md))

---

## 📋 Pre-Commit Checklist

Before committing changes:
- [ ] Code builds successfully (`pnpm build:sdk`)
- [ ] All tests pass (`pnpm test:sdk`)
- [ ] Code is formatted (`pnpm format:fix`)
- [ ] Code is linted (`pnpm lint:fix`)
- [ ] Types are correct (`pnpm type-check:sdk`)
- [ ] New features have tests
- [ ] Breaking changes are documented

---

## 🔗 Related Documentation

- **[CONTRIBUTING.md](../../CONTRIBUTING.md)** - Contribution guidelines and PR process
- **[.ai/](../../.ai/)** - Customer-facing SDK usage documentation
- **[README.md](../../README.md)** - Project overview

---

## 💡 For AI Agents

When helping with:
- **Customer questions about using the SDK** → Direct to [../../.ai/](../../.ai/)
- **Contributing to SDK or building from source** → Use documents in this directory
- **Unclear which** → Ask if they want to use the SDK (external) or contribute to it (internal)

---

## 📊 Document Summary

| Document | Purpose | When to Use |
|----------|---------|-------------|
| GETTING_STARTED.md | Setup environment | First time setup |
| BUILD.md | Build SDK | Building from source |
| TESTING.md | Test SDK | Writing/running tests |
| QUALITY.md | Code quality | Before committing |
| CI_CD.md | CI/CD pipelines | Understanding automation |
| DEPENDENCIES.md | Update deps | Dependency management |
| DOCUMENTATION.md | Generate docs | API reference updates |

---

*For using the SDK in applications, see [../../.ai/](../../.ai/) instead!*

