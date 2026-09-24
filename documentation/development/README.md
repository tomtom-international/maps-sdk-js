# 🔧 SDK Development Documentation

This directory contains documentation for building and testing the TomTom Maps SDK for JavaScript from source.

## 🎯 Who This Is For

- Developers building the SDK from source
- Anyone wanting to understand the SDK's internals
- Contributors providing feedback through issues and discussions

> [!IMPORTANT]
> We are not currently accepting pull requests. However, we greatly value feedback from the community through issues and discussions.

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

### Architecture

#### **[EVENTS.md](./EVENTS.md)**
*User-event subsystem internals*
- How click / hover / long-hover flow from MapLibre to a module handler
- The single shared `EventsProxy`, the interactive-layer pool, and the source-keyed registry
- Hover state machine and `eventState` data-driven styling
- Feature substitution and the `allEventFeatures` contract (scoped + de-duplicated)
- Design decisions, invariants, and gotchas

**Reference when working on map events, modules, or interaction**

---

### Code Quality

#### **[CODING_GUIDELINES.md](../../CODING_GUIDELINES.md)**
*The rules every change is held to*
- Reuse before adding, and where a shared helper belongs
- Types that make illegal states unrepresentable
- Comment and TSDoc density
- Barrels, import paths, naming, test placement

**Read before writing code**

#### **[QUALITY.md](./QUALITY.md)**
*The automated half*
- Linting and formatting with Biome
- Which lint rules fail CI and which only warn
- Type-check commands and quality gates

**Reference before committing code**

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

##  Related Documentation

- **[CONTRIBUTING.md](../../CONTRIBUTING.md)** - Contribution guidelines and PR process
- **[README.md](../../README.md)** - Project overview
