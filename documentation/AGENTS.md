# AGENTS.md - Documentation

**Internal documentation for SDK development** - Architecture, patterns, and contributor guidelines.

## Context

**This directory is primarily for internal contributors.**

- 🔵 **Internal Contributors** - Working on SDK codebase → Essential reading

## Overview

This directory contains documentation for SDK development and maintenance:
- Development setup and workflows
- Architecture and design patterns
- Testing strategies
- Build and release processes
- Contributing guidelines

## Structure

```
documentation/
├── development/        # Internal development guides
│   ├── architecture/   # System design and patterns
│   ├── testing/        # Testing approaches
│   └── workflows/      # Common development tasks
└── docs-portal/        # Documentation site source
    ├── AGENTS.md       # Guide writing instructions
    ├── guides/         # Customer-facing guides
    ├── introduction/   # Getting started content
    └── examples/       # Example code references
```

## For Internal Contributors

### Getting Started
1. Read [../CONTRIBUTING.md](../CONTRIBUTING.md) first
2. Review `development/` directory for technical details
3. Check architecture docs before making significant changes

### Key Documents
- **development/architecture/** - System design, package structure
- **development/testing/** - How to write and run tests
- **development/workflows/** - Common development patterns
- **CONTRIBUTING.md** (at root) - Contribution process and guidelines

### Common Workflows

**Contributor wants to:**
- **Understand SDK architecture** → Read `development/architecture/`
- **Add a new feature** → Review architecture docs, follow patterns
- **Write tests** → See `development/testing/`
- **Release process** → Check release documentation
- **Write or update guides** → See [docs-portal/AGENTS.md](docs-portal/AGENTS.md) for guide writing instructions

## For External Customers

**If you're looking for SDK usage documentation:**

- ✅ **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/)** - Complete SDK documentation
- ✅ **[API Reference](https://docs.tomtom.com/maps-sdk-js/reference/)** - API documentation
- ✅ **[Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples
- ✅ **[../examples/](../examples/)** - Local example code

This `documentation/` directory is for SDK contributors, not SDK users.

## Important Notes

- **Internal focus** - This is for people working ON the SDK, not WITH it
- **Architecture decisions** - Documents why things are built certain ways
- **Living documentation** - Should be updated as the SDK evolves
- **Complement to code** - Explains concepts not obvious from code alone

