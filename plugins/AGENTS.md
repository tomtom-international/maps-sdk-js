# AGENTS.md — Plugins

**TomTom Maps SDK Plugins** — Optional add-ons extending the core SDK with higher-level features. Web browsers only.

## For External Developers (Using Plugins)

**👉 If you're a customer/user, refer to official documentation:**

- **[Getting Started Guide](https://docs.tomtom.com/maps-sdk-js/getting-started/)** - Installation and setup
- **[API Reference](https://docs.tomtom.com/maps-sdk-js/reference/)** - Complete API documentation
- **[Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples

**Do not** use instructions from this repository for SDK usage - always refer to official docs above.

---

## For Contributors (Developing This Package)

### Available Plugins

| Plugin | Package | Description |
|--------|---------|-------------|
| `viewport-places` | `@tomtom-org/maps-sdk-plugin-viewport-places` | Continuously shows POIs in the visible map viewport, refreshing as the map moves |
| `agent-toolkit` | `@tomtom-org/maps-sdk-plugin-agent-toolkit` | Headless conversational agent toolkit — gives an LLM tool-based control over a `TomTomMap` via [Vercel AI SDK v6](https://ai-sdk.dev/) |

Each plugin has its own `AGENTS.md` with detailed architecture and implementation notes:
- [viewport-places/](./viewport-places/) — no AGENTS.md yet; see `src/viewportPlaces.ts`
- [agent-toolkit/AGENTS.md](./agent-toolkit/AGENTS.md) — full architecture, tools, state, system prompt

### Shared Build Infrastructure

All plugins share:
- `plugin-vite-config.ts` — common Vite library-mode config (used by each plugin's `vite build --config ../plugin-vite-config.ts`)
- `tsconfig.json` — root TypeScript config for the plugins workspace
- `package.json` — workspace-level scripts to build/test all plugins in parallel

### Development Setup

```bash
# From repo root
pnpm install
pnpm -F plugins build
```

### Common Tasks

**Building:**
```bash
# From plugins/ directory
pnpm build             # Build all plugins in parallel
pnpm type-check        # Type-check all plugins in parallel

# Or target a single plugin from repo root
pnpm -F viewport-places build
pnpm -F agent-toolkit build
pnpm -F agent-toolkit build:watch   # Auto-rebuild on changes
```

**Testing:**
```bash
pnpm test              # Run unit tests (vitest)
pnpm test:e2e          # Run Playwright e2e tests (installs Chromium automatically)
pnpm test:e2e:ui       # Run e2e tests with Playwright UI
```

### Contributor Workflows

**Adding a new plugin:**
1. Create `plugins/<name>/` with `package.json`, `tsconfig.json`, `src/index.ts`
2. Set `"build": "vite build --config ../plugin-vite-config.ts"` in the plugin's `package.json`
3. Export the plugin's public API from `plugins/index.ts`
4. Add an `AGENTS.md` in the plugin directory
5. Register the plugin in `pnpm-workspace.yaml` if needed
6. Run `pnpm install` from repo root

**Modifying an existing plugin:**
1. Edit files in `plugins/<name>/src/`
2. Run `pnpm -F <name> build` to rebuild
3. Test changes in examples: `cd ../examples && pnpm dev`

### Important Notes

- **Web only** — All plugins target browser environments; they depend on `@tomtom-org/maps-sdk/map` which requires MapLibre GL JS
- **Peer dependency pattern** — Plugins declare `@tomtom-org/maps-sdk` as a peer dependency, never bundling it
- **Biome** — This repo uses Biome for formatting/linting, not ESLint/Prettier. Run `pnpm lint` from root
- **Public Preview** — Plugins are 0.x; check individual `CHANGELOG.md` files for breaking changes
