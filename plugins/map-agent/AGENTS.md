# AGENTS.md — Map Agent Plugin

## Overview

Build a **headless conversational map agent** using [Vercel AI SDK v6](https://ai-sdk.dev/) that gives an LLM tool-based control over a `TomTomMap` instance and TomTom services. "Headless" means no UI ships with this package — consumers bring their own chat interface (a text input, a voice UI, whatever) and wire it to this agent.

**Scope for this implementation: client-side only.** The agent runs entirely in the browser using AI SDK's `DirectChatTransport` + `ToolLoopAgent`. The consumer provides their own LLM provider instance (OpenAI, Anthropic, etc.) — this package does NOT bundle or default to any provider.

---

## Architecture

```
Consumer App
├── Chat UI (BYO — text input, message list, anything)
│     │
│     ▼
├── MapAgent  (this package)
│   ├── AI SDK ToolLoopAgent
│   │     ├── System Prompt (SDK knowledge baked in)
│   │     └── Map ToolSet (Zod-validated tools)
│   │           ├── Data tools: geocode, search, route, reverseGeocode
│   │           └── Map tools: showPlaces, showRoute, flyTo, toggleTraffic, ...
│   ├── MapAgentState (retains full GeoJSON between tool calls)
│   └── Module cache (lazy PlacesModule, RoutingModule, etc.)
│
├── TomTomMap instance + maplibre-gl
└── LLM Provider (consumer-supplied, e.g. @ai-sdk/openai)
        │
        ▼
   LLM API (OpenAI, Anthropic, Google, etc.)
```

### Data flow for a typical interaction

1. User types: "Find coffee shops near the Eiffel Tower"
2. Consumer calls `sendMessage({ text: "..." })` via AI SDK's `useChat` / manual stream
3. AI SDK sends messages + tool definitions to LLM
4. LLM returns tool calls: `geocode({ query: "Eiffel Tower" })` → `searchPlaces({ query: "coffee", near: [2.2945, 48.8584] })` → `showPlaces({})` → `fitBounds({})`
5. Each tool executes against the live `TomTomMap` and services, returning summaries to the LLM
6. LLM produces a final text response: "I found 8 coffee shops near the Eiffel Tower. I've placed markers on the map."

---

## Package Structure

```
plugins/map-agent/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── AGENTS.md                    # This file
├── src/
│   ├── index.ts                 # Public API barrel export
│   ├── create-map-agent.ts      # Main factory function
│   ├── system-prompt.ts         # System prompt with SDK knowledge
│   ├── types.ts                 # MapAgentState, MapAgentOptions, etc.
│   ├── state.ts                 # State management helpers
│   ├── tools/
│   │   ├── index.ts             # createMapToolSet() barrel
│   │   ├── geocode.ts
│   │   ├── reverse-geocode.ts
│   │   ├── search-places.ts
│   │   ├── calculate-route.ts
│   │   ├── show-places.ts
│   │   ├── show-route.ts
│   │   ├── fly-to.ts
│   │   ├── fit-bounds.ts
│   │   ├── clear-map.ts
│   │   ├── toggle-traffic.ts
│   │   ├── toggle-pois.ts
│   │   ├── set-map-style.ts
│   │   ├── set-language.ts
│   │   ├── get-viewport.ts
│   │   └── toggle-layers.ts
│   └── utils/
│       └── summarize.ts         # Helpers to summarize GeoJSON for LLM (token-efficient)
└── tests/
    ├── tools/                   # Unit tests per tool
    ├── create-map-agent.test.ts
    └── system-prompt.test.ts
```

---

## Dependencies

```jsonc
{
  "name": "@tomtom-org/maps-sdk-ai-agent",
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "ai": "^6.0.0",        // Vercel AI SDK core
    "zod": "^3.23.0"       // Schema validation (AI SDK peer)
  },
  "peerDependencies": {
    "@tomtom-org/maps-sdk": "workspace:*",
    "maplibre-gl": "^4.0.0"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "@ai-sdk/openai": "^1.0.0"  // For tests only
  }
}
```

The consumer must install their own AI SDK provider package (e.g., `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`). This package never imports or bundles a provider.

---

## Public API

### `createMapAgent(map, options): MapAgent`

The sole entry point. Returns an agent object that can be connected to AI SDK's `useChat` via `DirectChatTransport`.

```typescript
import { ToolLoopAgent, type LanguageModel } from 'ai';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';

// --- Options ---

interface MapAgentOptions {
  /** AI SDK language model instance. REQUIRED — no default provider. */
  model: LanguageModel;

  /** Additional system prompt text appended to built-in prompt. */
  systemPromptSuffix?: string;

  /** Override individual tools or add custom ones. Merged with defaults. */
  tools?: Record<string, any>;

  /** Max multi-step tool loop iterations. Default: 10. */
  maxSteps?: number;
}

// --- Return type ---

interface MapAgent {
  /** The ToolLoopAgent instance — pass to DirectChatTransport. */
  readonly agent: ToolLoopAgent;

  /** The full tool set — useful for server-side or manual streamText usage. */
  readonly tools: MapToolSet;

  /** The composed system prompt string. */
  readonly systemPrompt: string;

  /** Live agent state (last results, module cache). Readonly externally. */
  readonly state: Readonly<MapAgentState>;

  /** Tear down: clears modules, resets state. */
  destroy(): void;
}
```

### Consumer usage

```typescript
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-ai-agent';
import { useChat } from '@ai-sdk/react';
import { DirectChatTransport } from 'ai';
import { openai } from '@ai-sdk/openai';

TomTomConfig.instance.put({ apiKey: TOMTOM_KEY });
const map = new TomTomMap({ mapLibre: { container: 'map', center: [4.9, 52.4], zoom: 10 } });

const mapAgent = createMapAgent(map, {
  model: openai('gpt-4o'),
});

// In a React component (or any AI SDK-compatible framework):
function ChatPanel() {
  const { messages, sendMessage, status } = useChat({
    transport: new DirectChatTransport({ agent: mapAgent.agent }),
  });

  return (
    <>
      {messages.map(m => (
        <div key={m.id}>
          {m.role}: {m.parts.filter(p => p.type === 'text').map(p => p.text).join('')}
        </div>
      ))}
      <form onSubmit={e => { e.preventDefault(); sendMessage({ text: input }); }}>
        <input ... />
      </form>
    </>
  );
}
```

---

## Agent State

```typescript
interface MapAgentState {
  /** Last search/geocode results — full GeoJSON retained for showPlaces(). */
  lastSearchResults?: Places;

  /** Last calculated routes — full GeoJSON retained for showRoute(). */
  lastRoutes?: Routes;

  /** Last geocoded/resolved waypoints. */
  lastWaypoints?: Place[];

  /** Last single geocode result. */
  lastGeocodeResult?: Place;

  /** Lazily-initialized module instances (cached across tool calls). */
  modules: {
    places?: PlacesModule;
    routing?: RoutingModule;
    trafficFlow?: TrafficFlowModule;
    trafficIncidents?: TrafficIncidentsModule;
    pois?: POIsModule;
    geometries?: GeometriesModule;
    baseMap?: BaseMapModule;
    hillshade?: HillshadeModule;
  };
}
```

State is managed internally. Tools read/write it via closure. The `destroy()` method clears all modules and resets state.

---

## Tool Definitions

Each tool is defined using AI SDK's `tool()` helper with Zod input schemas. Tools receive `TomTomMap` and `MapAgentState` via closure (injected by `createMapAgent`).

### Data Tools (call TomTom services, return data)

| Tool | LLM Description | Input Schema | Implementation |
|---|---|---|---|
| `geocode` | "Convert an address or place name to geographic coordinates" | `{ query: string }` | `geocodeOne(query)` → stores in `state.lastGeocodeResult`, returns `{ name, address, position: [lng, lat] }` |
| `reverseGeocode` | "Convert coordinates to a human-readable address" | `{ position: z.tuple([z.number(), z.number()]) }` | `reverseGeocode({ position })` → returns `{ address, position }` |
| `searchPlaces` | "Search for places, businesses, or points of interest" | `{ query: string, near?: [number, number], radius?: number, limit?: number, categories?: string[] }` | `search(params)` → stores in `state.lastSearchResults`, returns `{ count, places: [{ name, address, category, position }] }` (summarized, max ~10 items) |
| `calculateRoute` | "Calculate a driving route between locations" | `{ from: string, to: string, via?: string[], alternatives?: number }` | Geocodes each string → `calculateRoute({ locations, maxAlternatives })` → stores in `state.lastRoutes` + `state.lastWaypoints`, returns `{ routes: [{ distance, duration, summary }] }` |

### Map Tools (mutate the map display)

| Tool | LLM Description | Input Schema | Implementation |
|---|---|---|---|
| `showPlaces` | "Display the most recent search results as markers on the map" | `{}` (uses `state.lastSearchResults`) | Lazy-init `PlacesModule.get(map)` → `.show(state.lastSearchResults)` → fit bounds |
| `showRoute` | "Display the most recent calculated route on the map" | `{ routeIndex?: number }` | Lazy-init `RoutingModule.get(map)` → `.showRoutes(state.lastRoutes)` + `.showWaypoints(state.lastWaypoints)` → fit bounds |
| `clearMap` | "Remove displayed features from the map" | `{ layers?: ('places' \| 'routes' \| 'geometries')[] }` | Calls `.clear()` on specified modules (or all if omitted) |
| `flyTo` | "Move the map camera to a specific location" | `{ center: [number, number], zoom?: number }` | `map.mapLibreMap.flyTo({ center, zoom })` |
| `fitBounds` | "Fit the map camera to show all displayed data" | `{ padding?: number }` | `map.mapLibreMap.fitBounds(bboxFromGeoJSON(lastData), { padding })` |
| `toggleTraffic` | "Show or hide the real-time traffic flow layer" | `{ visible: boolean }` | Lazy-init `TrafficFlowModule.get(map)` → `.setVisible(visible)` |
| `togglePOIs` | "Show or hide built-in map POI icons" | `{ visible: boolean, categories?: string[] }` | Lazy-init `POIsModule.get(map)` → `.setVisible(visible)` / `.filterCategories(...)` |
| `setMapStyle` | "Change the map visual theme" | `{ style: z.enum(['standardLight', 'standardDark', 'drivingLight', 'drivingDark', 'monoLight', 'monoDark', 'satellite']) }` | `map.setStyle(style)` |
| `setLanguage` | "Change the language of map labels" | `{ language: string }` | `map.setLanguage(language)` |
| `getViewport` | "Get the current map viewport information" | `{}` | Returns `{ center, zoom, bbox: map.getBBox() }` |
| `toggleLayers` | "Show or hide specific base map layer groups" | `{ visible: boolean, layerGroups: string[] }` | Lazy-init `BaseMapModule.get(map)` → `.setVisible(visible, { layerGroups: { mode: 'include', names } })` |

### Tool result design principles

- **Token-efficient**: Return summarized JSON, not raw GeoJSON. E.g., `searchPlaces` returns `{ count: 8, places: [{ name: "Café de Flore", position: [2.33, 48.85] }] }` — not the full `Places` feature collection.
- **Full data in state**: The complete GeoJSON is stored in `MapAgentState` so map tools can render it.
- **Error as text**: If a service call fails, catch the error and return `{ error: "message" }` so the LLM can explain the failure to the user naturally.

---

## System Prompt

File: `src/system-prompt.ts`

The system prompt is critical — it teaches the LLM how to chain tools correctly. Key sections:

```
You are a helpful map assistant with access to a TomTom interactive map and location services.

CAPABILITIES:
- Search for places (restaurants, hotels, landmarks, etc.)
- Geocode addresses to coordinates
- Reverse geocode coordinates to addresses
- Calculate driving routes between locations
- Display search results and routes on the map
- Control map appearance (theme, language, traffic, POIs, layers)
- Navigate the map camera (fly to, fit bounds)

COORDINATE CONVENTION:
- All coordinates are [longitude, latitude] (GeoJSON standard)
- Example: Amsterdam = [4.9, 52.4], not [52.4, 4.9]

TOOL CHAINING:
- To show places on the map: first searchPlaces() → then showPlaces() → then fitBounds()
- To show a route: calculateRoute() → showRoute() (fitBounds is automatic)
- To show a specific location: geocode() → flyTo() with the result coordinates
- Always display results on the map after finding them, unless the user only asked for information

RESPONSE STYLE:
- Be concise — summarize what you found and what you did on the map
- Mention counts ("Found 5 restaurants") and key details (distance, duration for routes)
- If something fails, explain what went wrong simply
- Never expose raw JSON or coordinates unless the user asks for them

AVAILABLE MAP STYLES: standardLight, standardDark, drivingLight, drivingDark, monoLight, monoDark, satellite

AVAILABLE POI CATEGORIES: RESTAURANT, FOOD_DRINKS_GROUP, TRANSPORTATION_GROUP, SHOPPING_GROUP, HOTEL_MOTEL, HOSPITAL, PARKING_GARAGE, PETROL_STATION, ...

AVAILABLE LAYER GROUPS: water, land, borders, buildings2D, buildings3D, houseNumbers, roadLines, roadLabels, roadShields, placeLabels, smallerTownLabels, cityLabels, capitalLabels, stateLabels, countryLabels
```

---

## Implementation Steps

Execute in this order. Each step should be completed and tested before moving to the next.

### Step 1: Scaffold the package
- Create `plugins/map-agent/package.json` with dependencies listed above
- Create `tsconfig.json` extending `../../tsconfig.json`
- Create `vite.config.ts` (follow pattern from `../../map/vite.config.ts` or `../../services/vite.config.ts`)
- Create `vitest.config.ts`
- Create `src/index.ts` (empty barrel for now)
- Run `pnpm install` from repo root

### Step 2: Types and state
- Implement `src/types.ts` — `MapAgentState`, `MapAgentOptions`, `MapAgent` interface
- Implement `src/state.ts` — `createState()` factory, helper to get/lazy-init modules

### Step 3: Utility helpers
- Implement `src/utils/summarize.ts`:
  - `summarizePlace(place: Place)` → `{ name, address, category, position }`
  - `summarizePlaces(places: Places)` → `{ count, places: summarized[] }`
  - `summarizeRoute(route: Route)` → `{ distance, duration, summary }`
  - `summarizeRoutes(routes: Routes)` → `{ count, routes: summarized[] }`

### Step 4: Implement data tools
- `src/tools/geocode.ts` — wraps `geocodeOne()`
- `src/tools/reverse-geocode.ts` — wraps `reverseGeocode()`
- `src/tools/search-places.ts` — wraps `search()` / `fuzzySearch()`
- `src/tools/calculate-route.ts` — geocodes string inputs, then `calculateRoute()`
- Each tool: define with `tool()`, Zod schema, `execute` that reads/writes state
- Unit test each tool with mocked services

### Step 5: Implement map tools
- `src/tools/show-places.ts` — `PlacesModule.show()` + `fitBounds()`
- `src/tools/show-route.ts` — `RoutingModule.showRoutes()` + `showWaypoints()`
- `src/tools/clear-map.ts`
- `src/tools/fly-to.ts`
- `src/tools/fit-bounds.ts`
- `src/tools/toggle-traffic.ts`
- `src/tools/toggle-pois.ts`
- `src/tools/set-map-style.ts`
- `src/tools/set-language.ts`
- `src/tools/get-viewport.ts`
- `src/tools/toggle-layers.ts`
- Each tool: define with `tool()`, reads state/map, executes map operations
- Unit test each with mocked `TomTomMap`

### Step 6: Tool barrel export
- `src/tools/index.ts` — export `createMapToolSet(map, state)` that returns the full `Record<string, Tool>`

### Step 7: System prompt
- Implement `src/system-prompt.ts` — export `buildSystemPrompt(options?)` function
- Include all the context from the "System Prompt" section above
- Allow consumer to append via `systemPromptSuffix`

### Step 8: Main factory
- Implement `src/create-map-agent.ts`:
  - Creates `MapAgentState`
  - Calls `createMapToolSet(map, state)`
  - Builds system prompt
  - Instantiates `ToolLoopAgent` from AI SDK with `{ model, tools, instructions, maxSteps }`
  - Returns `MapAgent` object
- Implement `src/index.ts` barrel exports

### Step 9: Example
- Create `examples/map-chat-agent/` following the existing example pattern:
  - `src/index.ts` — creates map, creates agent, wires a minimal chat UI (vanilla DOM, no React)
  - `src/style.css`
  - `content/description.md`
  - `package.json`
- The example should use `@ai-sdk/openai` as the provider with an API key from env/config
- Demonstrate: search → show, route → show, style switching, traffic toggle

### Step 10: Integration test
- `tests/create-map-agent.test.ts` — test the full factory with mocked model and map

---

## TODOs (Out of Scope for Initial Implementation)

### TODO: React integration
- Add optional `src/react.ts` entrypoint exporting a `useMapChat(map, options)` hook
- Thin wrapper: calls `createMapAgent`, provides `useChat` + `DirectChatTransport` in one call
- Should be a separate package entrypoint (`@tomtom-org/maps-sdk-ai-agent/react`) to avoid forcing React as a dependency
- Consider also providing a `useMapAgent` hook that just returns the agent (no chat state)

### TODO: Server-side tool split
Split tools into two categories for server-side deployment:

- **Data tools** (server-safe): `geocode`, `reverseGeocode`, `searchPlaces`, `calculateRoute` — these call TomTom APIs and return data. They work in Node.js with no DOM/map dependency.
- **Map tools** (client-only): `showPlaces`, `showRoute`, `flyTo`, etc. — these require a live `TomTomMap` instance in the browser.

For server-side, the API route would use only data tools. The client receives tool call results via the AI SDK stream and applies them to the map. This requires:
1. A `createServerMapTools()` export with data tools only
2. Client-side handler that intercepts `tool-invocation` message parts and dispatches to map tools
3. Clear documentation on the split pattern

**Benefits of server-side integration:**
- **API key security**: The TomTom API key AND the LLM provider API key stay on the server, never exposed in client bundles. This is critical for production apps.
- **Rate limiting & auth**: Server can enforce per-user rate limits, authenticate requests, and audit usage before forwarding to the LLM.
- **Cost control**: Server can log token usage, enforce budgets, and swap models without client redeployment.
- **Prompt injection protection**: System prompt and tool definitions stay server-side, preventing users from inspecting or manipulating them via browser DevTools.
- **Longer conversations**: Server can implement conversation persistence (database-backed), summarization of long histories, and RAG augmentation with custom data sources.
- **Heavier processing**: Server-side tools could do things client-side can't — e.g., calling private APIs, running geospatial computations, or enriching results with internal datasets.

### TODO: Tool execution approval
For potentially expensive operations (e.g., `calculateRoute` with many alternatives, bulk searches), consider adding `needsApproval: true` on select tools so the consumer UI can show a confirmation before execution.

### TODO: Multi-modal support
Accept image attachments (e.g., photos of locations) and pass them to vision-capable models for context.

### TODO: Conversation persistence
Integrate with AI SDK's message persistence patterns for chat history across sessions.

---

## SDK API Quick Reference (for implementer)

This section summarizes the TomTom SDK APIs you'll be wrapping. Refer to the actual source for full signatures.

### Core (`@tomtom-org/maps-sdk/core`)
- `TomTomConfig.instance.put({ apiKey, language })` — global config
- `bboxFromGeoJSON(data)` → `BBox` — compute bounds from any GeoJSON
- `getPosition(place)` → `[lng, lat]` — extract coordinates from a Place
- Types: `Place`, `Places`, `Route`, `Routes`, `Waypoint`, `BBox`, `HasLngLat`, `Language`

### Services (`@tomtom-org/maps-sdk/services`)
- `geocodeOne(query: string)` → `Place`
- `reverseGeocode({ position: [lng, lat] })` → response with Place
- `search({ query, at?, radius?, limit?, categorySet? })` → `SearchResponse` (Places)
- `fuzzySearch({ query, at?, radius?, limit? })` → `FuzzySearchResponse`
- `calculateRoute({ locations, maxAlternatives?, costModel?, guidance? })` → `Routes`

### Map (`@tomtom-org/maps-sdk/map`)
- `new TomTomMap({ key?, style?, language?, mapLibre: { container, center, zoom, ... } })`
- `map.mapLibreMap` — underlying MapLibre GL JS `Map` (for `flyTo`, `fitBounds`, etc.)
- `map.setStyle(style)`, `map.setLanguage(lang)`, `map.getBBox()`

**Module pattern (all async):**
- `const mod = await PlacesModule.get(map, config?)` → `mod.show(places)`, `mod.clear()`
- `const mod = await RoutingModule.get(map, config?)` → `mod.showRoutes(routes)`, `mod.showWaypoints(waypoints)`, `mod.clearRoutes()`
- `const mod = await TrafficFlowModule.get(map, config?)` → `mod.setVisible(bool)`
- `const mod = await POIsModule.get(map, config?)` → `mod.setVisible(bool)`, `mod.filterCategories(...)`
- `const mod = await BaseMapModule.get(map, config?)` → `mod.setVisible(bool, { layerGroups })`
- `const mod = await GeometriesModule.get(map, config?)` → `mod.show(features)`, `mod.clear()`
- `const mod = await HillshadeModule.get(map, config?)` → `mod.setVisible(bool)`

### MapLibre direct access (via `map.mapLibreMap`)
- `map.mapLibreMap.flyTo({ center: [lng, lat], zoom: 14 })`
- `map.mapLibreMap.fitBounds(bbox, { padding: 50 })`
- `map.mapLibreMap.getCenter()`, `.getZoom()`

---

## Important Conventions

- **Coordinates**: Always `[longitude, latitude]` — GeoJSON standard. Never `[lat, lng]`.
- **Async modules**: All `Module.get(map)` calls are async. Cache the result in `state.modules`.
- **Error handling**: Every tool `execute` must be wrapped in try/catch. Return `{ error: string }` on failure, never throw.
- **Token efficiency**: Summarize results. Never return full GeoJSON to the LLM.
- **No provider bundled**: The `model` option is required. Fail fast with a clear error if not provided.
- **Monorepo imports**: Use workspace imports `@tomtom-org/maps-sdk/core`, `@tomtom-org/maps-sdk/map`, `@tomtom-org/maps-sdk/services`.
- **Build pattern**: Follow existing package patterns (Vite library mode, vitest for tests).
- **Biome**: This repo uses Biome for formatting/linting, not ESLint/Prettier. Run `pnpm lint` from root.
