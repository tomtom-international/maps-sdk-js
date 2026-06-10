# AGENTS.md — Documentation

**Internal documentation for SDK development** — Architecture, patterns, and contributor guidelines.

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
├── development/                # Internal development guides
│   ├── README.md               # Index of development docs
│   ├── GETTING_STARTED.md      # Local environment setup
│   ├── BUILD.md                # Building the SDK workspaces
│   ├── TESTING.md              # Testing philosophy and commands
│   ├── QUALITY.md              # Linting/formatting with Biome
│   ├── DEPENDENCIES.md         # Managing dependencies (pnpm catalog)
│   ├── DOCUMENTATION.md        # Generating/maintaining docs
│   ├── DESIGN_PRINCIPLES.md    # SDK design principles & strategy
│   └── internal/               # TomTom-internal-only docs
│       ├── CI_CD.md
│       ├── CREATING_EXAMPLES.md
│       ├── INTERNAL_DEMOS.md
│       └── releasing.md
├── docs-portal/                # Documentation site source
│   ├── AGENTS.md               # Guide writing instructions
│   ├── introduction/           # Getting started content
│   ├── guides/                 # Customer-facing guides (core, map, services, plugins, migration)
│   ├── examples/               # Example code references
│   ├── reference/              # API reference landing page
│   └── api-reference/          # Generated TypeDoc output
└── scripts/                    # Doc maintenance scripts
```

## For Internal Contributors

### Getting Started
1. Read [../CONTRIBUTING.md](../CONTRIBUTING.md) first
2. Start with [development/GETTING_STARTED.md](development/GETTING_STARTED.md) to set up your environment
3. Read [development/DESIGN_PRINCIPLES.md](development/DESIGN_PRINCIPLES.md) before making significant changes

### Key Documents
- **[development/README.md](development/README.md)** - Index of all development docs
- **[development/GETTING_STARTED.md](development/GETTING_STARTED.md)** - Local environment setup
- **[development/BUILD.md](development/BUILD.md)** - Building the SDK workspaces
- **[development/TESTING.md](development/TESTING.md)** - Testing philosophy and commands
- **[development/QUALITY.md](development/QUALITY.md)** - Linting and formatting with Biome
- **[development/DESIGN_PRINCIPLES.md](development/DESIGN_PRINCIPLES.md)** - The "why" behind the conventions
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** (at root) - Contribution process and guidelines

### Common Workflows

**Contributor wants to:**
- **Set up the environment** → [development/GETTING_STARTED.md](development/GETTING_STARTED.md)
- **Build the SDK** → [development/BUILD.md](development/BUILD.md)
- **Understand design rationale** → [development/DESIGN_PRINCIPLES.md](development/DESIGN_PRINCIPLES.md)
- **Write or run tests** → [development/TESTING.md](development/TESTING.md)
- **Check code quality before committing** → [development/QUALITY.md](development/QUALITY.md)
- **Manage dependencies** → [development/DEPENDENCIES.md](development/DEPENDENCIES.md)
- **Release process** → [development/internal/releasing.md](development/internal/releasing.md)
- **Write or update guides** → [docs-portal/AGENTS.md](docs-portal/AGENTS.md) for guide writing instructions

## For External Customers

**If you're looking for SDK usage documentation:**

- ✅ **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/)** - Complete SDK documentation
- ✅ **[API Reference](https://docs.tomtom.com/maps-sdk-js/reference/)** - API documentation
- ✅ **[Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples
- ✅ **[../examples/](../examples/)** - Local example code

This `documentation/` directory is for SDK contributors, not SDK users.

## Important Notes

- **Internal focus** — This is for people working ON the SDK, not WITH it
- **Architecture decisions** — Documents why things are built certain ways
- **Living documentation** — Should be updated as the SDK evolves
- **Complement to code** — Explains concepts not obvious from code alone
