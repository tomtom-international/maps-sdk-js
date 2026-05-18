---
name: tomtom-maps-sdk-js-contribution
description: Orient to the SDK contributor context. Use when a contributor asks how to work on, build, or modify the TomTom Maps SDK — or when the current task involves editing SDK source files in core/, map/, services/, plugins/, examples/, or map-integration-tests/.
allowed-tools: Read, Glob
---

You are working as an SDK contributor on the TomTom Maps SDK for JavaScript monorepo.

`AGENTS.md` files are the cross-tool source of truth for contributor guidance in this repo (architecture, commands, conventions, workflows). This skill orients you to them — **do not restate or duplicate their content here.**

## Orientation steps

1. **Always** read the root `AGENTS.md` first for architecture, build order, dev commands, conventions, and key files.

2. Read the package-specific `AGENTS.md` for the area you're touching:

   | If the task touches… | Read |
   |---|---|
   | `core/` | `core/AGENTS.md` |
   | `map/` | `map/AGENTS.md` |
   | `services/` | `services/AGENTS.md` |
   | `examples/` | `examples/AGENTS.md` (and `examples/E2E_TESTING.md` for test work) |
   | `map-integration-tests/` | `map-integration-tests/AGENTS.md` |
   | `plugins/` (any) | `plugins/AGENTS.md` |
   | `plugins/agent-toolkit/` | `plugins/agent-toolkit/AGENTS.md` + `plugins/agent-toolkit/ENGINEERING-GUIDELINES.md` |
   | `plugins/viewport-places/` | `plugins/AGENTS.md` (no dedicated AGENTS.md; see `src/viewportPlaces.ts`) |
   | `shared-configs/` | `shared-configs/AGENTS.md` |
   | `documentation/` | `documentation/AGENTS.md` |
   | `documentation/docs-portal/` | `documentation/docs-portal/AGENTS.md` (guide writing with `SDKGuideLiveCodingExample`) |

   If the area is unclear, read all package-level `AGENTS.md` files before acting.

3. Before you write code, silently confirm you're in **contributor mode** with these easy-to-violate rules top-of-mind:

   - **Biome** for formatting/linting (not ESLint or Prettier). Run `pnpm lint` from root.
   - **pnpm** for package management; shared version pins live in `pnpm-workspace.yaml` under `catalog:`.
   - **Vitest** for unit tests; place tests in `tests/` subdirectories next to source.
   - **Strict TypeScript** — no `any`, no unnecessary casts.
   - **Coordinates**: always `[longitude, latitude]` (GeoJSON order) — easy to get wrong.
   - **Full variable names** — `response` not `res`, `parameters` not `params`, `error` not `err`, `configuration` not `config`, etc. (full list in root `AGENTS.md`).
   - **Arrow functions** over `function` declarations; omit braces/`return` for single-expression one-liners.
   - **No re-exports** — import directly from canonical source, never barrel-forward.
   - **Blank line after single-line `if`** — Biome does not enforce; apply manually.
   - **Map modules**: get instances via `await SomeModule.get(map)`, never `new SomeModule()`.
   - **Tool `execute`** in plugins must catch and return `{ error: string }`, never throw.
   - **Build order is strict**: `core` → `services` + `map`. Never import `map` from `services` or vice versa.
   - **Example E2E tests need `dist/`**: every `pnpm test:e2e[:update-snapshots]` (per-example *or* via `pnpm e2e-test:examples:update-snapshot <name>` / `pnpm generate-thumbnails:examples <name>` from root) requires `pnpm -F map build` + `pnpm -F @examples/<name> build` first — the Playwright server serves `dist/`, not the dev server. Skipping the build silently uses stale assets.
   - **New examples** must ship both `e2e-tests/snapshots/upon-load.png` (from `pnpm test:e2e:update-snapshots`) and `content/thumbnail.png` (derived via `pnpm generate-thumbnails:examples <name>`). Commit both.

## After every change

Always run both of these from the repo root after editing any source file, before reporting the task as complete:

```sh
pnpm lint:fix
pnpm format:fix
```

`lint:fix` runs Biome's check+lint with `--write`; `format:fix` runs Biome's formatter with `--write`. If `lint:fix` exits non-zero, fix the reported errors (warnings about pre-existing complexity/non-null-assertions in unrelated files are not blocking — only address what your change introduced or what Biome flags as an error).

## When to branch off this skill

- Building an SDK *consumer* app (not editing SDK source) → use the `tomtom-maps-sdk-js` skill instead.
- Writing or editing customer-facing guides → follow `documentation/docs-portal/AGENTS.md`.
- Working on the agent-toolkit plugin → `ENGINEERING-GUIDELINES.md` is required reading before touching tools, state, or system prompts.
