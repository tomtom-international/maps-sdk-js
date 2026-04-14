# AGENTS.md — Agent Toolkit Plugin

## Overview

A headless conversational agent toolkit using [Vercel AI SDK v6](https://ai-sdk.dev/) that gives an LLM tool-based control over a `TomTomMap` instance and TomTom services. No UI ships with this package — consumers bring their own chat interface.

**Scope: client-side only.** The consumer provides their own LLM provider instance — this package does NOT bundle or default to any provider.

> **Read this first:** [`ENGINEERING-GUIDELINES.md`](./ENGINEERING-GUIDELINES.md) defines how tools should be designed, what state management looks like, how system prompts should be structured, and the standards for tool contracts and context management. Everything in this plugin should conform to those guidelines.

---

## Architecture

```
Consumer App
├── Chat UI (BYO)
│     │
│     ▼
├── MapAgent  (this package)
│   ├── AI SDK ToolLoopAgent
│   │     ├── System Prompt
│   │     └── Map ToolSet (Zod-validated tools)
│   │           ├── Data tools: geocode, search, route, reverseGeocode
│   │           └── Map tools: showPlaces, showRoute, flyTo, toggleTraffic, ...
│   ├── MapAgentState (retains full GeoJSON between tool calls)
│   └── Module cache (lazy PlacesModule, RoutingModule, etc.)
│
├── TomTomMap instance + maplibre-gl
└── LLM Provider (consumer-supplied, e.g. @ai-sdk/openai)
```

---

## Key Conventions

- **Coordinates**: Always `[longitude, latitude]` — GeoJSON standard.
- **Async modules**: All `Module.get(map)` calls are async. Cache in `state.modules`.
- **Error handling**: Every tool `execute` must catch and return `{ error: string }`, never throw.
- **Token efficiency**: Summarize results. Never return full GeoJSON to the LLM.
- **No provider bundled**: `model` is required. Fail fast if not provided.
- **Monorepo imports**: Use `@tomtom-org/maps-sdk/core`, `/map`, `/services`.
- **Linting**: Biome, not ESLint/Prettier. Run `pnpm lint` from root.
