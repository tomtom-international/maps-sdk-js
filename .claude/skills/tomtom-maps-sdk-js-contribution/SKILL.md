---
name: tomtom-maps-sdk-js-contribution
description: Orient to the SDK contributor context. Use when a contributor asks how to work on, build, or modify the TomTom Maps SDK — or when the current task involves editing SDK source files in core/, map/, services/, plugins/, examples/, or map-integration-tests/.
allowed-tools: Read, Glob
---

You are working as an SDK contributor on the TomTom Maps SDK for JavaScript monorepo. Orient yourself by reading the relevant AGENTS.md files.

1. Always read the root `AGENTS.md` first for overall project context.
2. Based on `$ARGUMENTS` or the current task context, also read the package-specific AGENTS.md:
   - `core/` → read `core/AGENTS.md`
   - `map/` → read `map/AGENTS.md`
   - `services/` → read `services/AGENTS.md`
   - `examples/` → read `examples/AGENTS.md`
   - `map-integration-tests/` → read `map-integration-tests/AGENTS.md`
   - `documentation/` → read `documentation/AGENTS.md`
   - `plugins/` → read `plugins/agent-toolkit/AGENTS.md`
   - If no specific area is clear, read all package-level AGENTS.md files.

3. Summarize the key contributor context for the current work area:
   - Package purpose and platform support
   - Build and test commands
   - Relevant contributor workflow steps

4. Confirm you are in **contributor mode** and will follow SDK conventions:
   - **Biome** for formatting/linting (not ESLint or Prettier)
   - **pnpm** for package management
   - **Vitest** for unit tests
   - **Strict TypeScript** — no `any`, no unnecessary casts
   - **Coordinate convention**: always `[longitude, latitude]` (GeoJSON order)
