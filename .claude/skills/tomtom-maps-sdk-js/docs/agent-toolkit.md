# Agent Toolkit Plugin Reference

Headless conversational agent that gives any LLM tool-based control over a `TomTomMap` and TomTom services. Built on [Vercel AI SDK](https://ai-sdk.dev/) v6 (`ToolLoopAgent`, `DirectChatTransport`). No UI is bundled — bring your own chat. No LLM provider is bundled — bring any AI SDK-compatible model.

> Public preview — package is `@tomtom-org/maps-sdk-plugin-agent-toolkit`.

## Imports

```ts
import {
    createMapAgent,
    createDefaultClassifier,
    DEFAULT_TOOLS,
    BASE_SYSTEM_PROMPT,
    type ToolEntry,
    type ToolState,
    type StateSlice,
    type MapAgentOptions,
    type MapAgentInstance,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
```

## Installation

```bash
npm i @tomtom-org/maps-sdk @tomtom-org/maps-sdk-plugin-agent-toolkit ai zod
# Plus one Vercel AI SDK provider, e.g.:
npm i @ai-sdk/openai
```

Peer deps: `@tomtom-org/maps-sdk`, `ai@^6`, `zod`, `maplibre-gl`, `@turf/turf`, `chart.js`, `h3-js`.

---

## Quick start

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { openai } from '@ai-sdk/openai';

TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });

const map = new TomTomMap({ mapLibre: { container: 'map' } });
const agent = createMapAgent(map, { model: openai('gpt-4o') });

// One-shot generate:
const { text } = await agent.generate({
    messages: [{ role: 'user', content: 'Find coffee shops near Dam Square' }],
});

// Or stream into a chat UI via DirectChatTransport (the returned agent is a real ToolLoopAgent).
```

`createMapAgent` returns a `ToolLoopAgent` augmented with two extras:

```ts
agent.state;     // live ToolState (typed as the generic ToolState parameter, e.g. `MyState`, when custom slices are provided)
agent.destroy(); // resets every state slice that implements StateSlice.reset()
```

---

## How a turn runs

Two phases per user message:

1. **Intent classification** — a lightweight pre-pass picks the minimal subset of tools relevant to the turn from each tool's `classificationPrompt`. Reduces noise and token cost.
2. **Tool loop** — the LLM calls tools (geocode, search, route, show on map, …) sequentially or in parallel. Tools return compact summaries, never raw GeoJSON. Full data lives in `state` for follow-up tools.

State persists across turns — *"add a stop after the first one"* and *"what were those restaurants again?"* both work because the agent recalls from internal stores via dedicated recall tools.

---

## `MapAgentOptions`

```ts
const agent = createMapAgent(map, {
    // REQUIRED
    model: openai('gpt-4o'),

    // System prompt (optional)
    systemPromptSuffix: 'Always respond in Spanish.',          // appended to BASE_SYSTEM_PROMPT
    // systemPrompt: BASE_SYSTEM_PROMPT + '\n\n…',             // full replacement

    // Tools (optional — merged with DEFAULT_TOOLS)
    tools: {
        getFleetVehicle,                 // add a custom tool
        setLanguage: false,              // remove a default tool
        locatePlace: myCustomLocate,     // replace a default tool (full ToolEntry)
    },
    includeDefaultTools: true,           // false → start blank, add only what you list

    // Classifier (optional)
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),  // cheaper model
    // classifier: false,                                                    // disable
    onClassify: (result) => console.log(result?.activeToolNames),

    // Custom state (optional)
    state: { fleet: new FleetState() },  // only custom slices; built-in slices are auto-created

    // Misc
    maxSteps: 10,                        // tool-loop iteration cap
    outputSchemas: true,                 // structured output schemas; set false for providers that don't support them
    prepareStep: async (info) => ({ /* ... */ }),  // composed with internal classification
});
```

### Type-safe custom state

```ts
interface MyState extends ToolState {
    fleet: FleetState;
}

const agent = createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});
agent.state.fleet;            // FleetState — typed
agent.state.routing;          // built-in slice
```

---

## `DEFAULT_TOOLS` registry

Flat record of named `ToolEntry` objects. ~56 tools shipped. Categories (representative names):

- **Location**: `locatePlace`, `reverseGeocode`, `getCurrentLocation`, `getViewport`
- **Places & search**: `discoverPlaces`, `getPOICategoryCodes`, `processPlaces`, `analysePlaces`
- **Routing**: `setRoute`, `addWaypointsToRoute`, `removeWaypointsFromRoute`, `replaceWaypointInRoute`, `processRoutes`, `analyseRoutes`
- **Geometries**: `processGeometries`, `analyseGeometries`, `recallGeometries`
- **Reachable areas**: `findReachableAreas` (isochrones / isodistances)
- **Traffic — flow & overlays**: `toggleTrafficFlow`, `toggleTrafficIncidents`
- **Traffic — incidents (fetch / monitor / analyse / focus)**: `getTrafficIncidents`, `startTrafficIncidentsMonitor`, `stopTrafficIncidentsMonitor`, `analyseIncidents`, `focusIncidents`
- **Traffic — area analytics**: `getTrafficAreaAnalytics`, `queryTrafficAnalytics`, `showTrafficAreaAnalytics`
- **Map display**: `updatePlacesDisplay`, `updateRoutesDisplay`, `showWaypoints`, `clearMap`
- **Shown introspection**: `getShownPlaces`, `getShownRoutes`, `getShownWaypoints`, `getShownIncidents`, `getShownRouteTrafficIncidents`
- **Map control**: `flyTo`, `zoomInOrOut`, `setMapStandardStyle`, `setRouteTheme`, `setLanguage`, `togglePOIs`, `toggleBaseMapLayerGroups`, `setPitchBearing`, `getStandardMapStyles`
- **MapLibre direct**: `executeMaplibreCode`, `setLayoutProperties`, `setPaintProperties`, `getMapStyleLayers`
- **State / recall**: `recallPlaces`, `recallRoutes`, `recallRanges`, `recallState`, `getCurrentWaypoints`, `setEntryMode`, `resetState`
- **Utilities**: `formatDistance`, `formatDuration`, `calculateBBox`, `help`

Every tool follows the same `ToolEntry` shape. Listed names are stable — agents and apps can reference them via `DEFAULT_TOOLS.locatePlace`, etc.

---

## `ToolEntry` shape

```ts
type ToolEntry<S extends ToolState = ToolState> = {
    description: string;            // sent to the model
    inputSchema: z.ZodType;         // Zod-validated input
    outputSchema?: z.ZodType;       // structured output schema (improves reliability)
    execute: (input: any, state: S) => Promise<any>;

    // classifier metadata
    classificationPrompt?: string;  // one-liner: when to activate this tool
    tags?: string[];                // category labels (e.g. 'location', 'route')
    examples?: string[];            // shown by the help tool
    examplePrompts?: string[];      // shown by the help tool
    relatedTools?: string[];        // hints for the model
    dependsOn?: string[];           // tools that must run first
};
```

### Add a custom tool (BYOD)

```ts
import { z } from 'zod';
import type { Place } from '@tomtom-org/maps-sdk/core';
import type { ToolEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

const getFleetVehicle: ToolEntry = {
    description: 'Get the current map position of a fleet vehicle by ID and add it to the places history.',
    classificationPrompt: 'Locate or display a fleet vehicle on the map by its ID.',
    inputSchema: z.object({ vehicleId: z.string() }),
    execute: async ({ vehicleId }, state) => {
        const position = await fleetApi.getPosition(vehicleId);
        const place: Place = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: position },
            properties: { name: `Vehicle ${vehicleId}` },
        };
        // Append to the places history; the model can show it via updatePlacesDisplay later.
        const entryId = state.places.addPlaceResult(place, `Vehicle ${vehicleId}`);
        return { vehicleId, entryId, position };
    },
    tags: ['location'],
    examplePrompts: ['Where is vehicle TT-001?', 'Show fleet vehicle on the map'],
};

createMapAgent(map, { model, tools: { getFleetVehicle } });
```

### Replace / remove default tools

```ts
createMapAgent(map, {
    model,
    tools: {
        setLanguage: false,                    // remove
        getCurrentLocation: myCustomGetLoc,    // replace (full ToolEntry)
    },
});
```

### Start blank, hand-pick built-ins

```ts
import { createMapAgent, DEFAULT_TOOLS } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

createMapAgent(map, {
    model,
    includeDefaultTools: false,
    tools: {
        getFleetVehicle,
        locatePlace: DEFAULT_TOOLS.locatePlace,
        flyTo: DEFAULT_TOOLS.flyTo,
    },
});
```

---

## `ToolState` slices

Live state, accessible from custom tools and from your app via `agent.state`:

| Slice | What it holds |
|---|---|
| `places` | Append-only history of place / geometry entries; per-entry lazy `PlacesModule` and `GeometriesModule` |
| `routing` | Append-only history of route entries; planning waypoint slots; route parameters; per-entry `RoutingModule` |
| `ranges` | Reachable range entries — origin(s), budgets, polygons, per-entry display modules |
| `customGeometries` | Derived polygon entries produced by `processGeometries` (union, difference, h3-coverage, …); per-entry analyses + lazy `GeometriesModule` |
| `baseMap` | Viewport, style, language, MapLibre map instance (`mapLibreMap`) |
| `trafficTiles` | Real-time traffic flow + incident tile-overlay visibility |
| `trafficAreaAnalytics` | Cached traffic-area-analytics result + current visualisation config |
| `trafficIncidents` | Fetched incident entries (history) + per-entry analyses, focused subsets, and the live monitor — produced/refreshed by `getTrafficIncidents` and `startTrafficIncidentsMonitor` |
| `mapPOIs` | POI category visibility and filters |

Common reads from app code:

```ts
agent.state.routing.currentRoutes;     // most recent Routes
agent.state.places.latestPlace;        // most recent Place[]
agent.state.places.entries;            // full history
agent.state.baseMap.mapLibreMap;       // raw maplibre-gl Map
```

### Custom state slice

```ts
import type { StateSlice, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

class FleetState implements StateSlice {
    vehicles = new Map<string, VehiclePosition>();
    reset() { this.vehicles.clear(); }
}

interface MyState extends ToolState {
    fleet: FleetState;
}

createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});
```

`destroy()` calls `reset()` on every slice that implements `StateSlice` — both built-in and custom.

---

## Classifier

Default classifier is LLM-based and reuses your main `model`. To use a cheaper classifier model:

```ts
createMapAgent(map, {
    model: openai('gpt-4o'),
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),
});
```

Disable entirely (all tools always exposed):

```ts
createMapAgent(map, { model, classifier: false });
```

A classifier is just a function: `(ctx: ClassifierContext) => Promise<ClassificationResult | null>`. Return `null` to fail-open. Custom classifiers receive every tool's `ToolMetadata` (name + classifier prompt + tags + dependsOn) — useful for rule-based selection.

Tune a custom tool's classification by editing its `classificationPrompt`:

```ts
// Too broad — fires on any location query
classificationPrompt: 'Get fleet vehicle data.'

// Precise — fires only when an explicit ID is mentioned
classificationPrompt: 'Locate a fleet vehicle by its ID (e.g. "TT-001"); not for general location queries.'
```

---

## System prompt

`BASE_SYSTEM_PROMPT` teaches GeoJSON coordinate order, tool execution conventions, "near me" vs "in this area" mapping, and response formatting. Keep it as the baseline:

```ts
import { BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

createMapAgent(map, {
    model,
    systemPrompt: BASE_SYSTEM_PROMPT + `

ADDITIONAL INSTRUCTIONS:
- This is a logistics application. Prioritize route efficiency over scenery.
- Always show estimated arrival times in responses.
- When a vehicle ID is mentioned, call getFleetVehicle before anything else.
`,
});
```

`systemPromptSuffix` is the safer alternative — appends to `BASE_SYSTEM_PROMPT` without losing its rules:

```ts
createMapAgent(map, {
    model,
    systemPromptSuffix: 'Always use metric units. Respond in Dutch.',
});
```

(`systemPromptSuffix` is ignored when `systemPrompt` is set.)

---

## Cleanup

```ts
agent.destroy();             // resets all state slices that implement reset()
map.mapLibreMap?.remove();   // tear down MapLibre when unmounting
```

---

## Gotchas

- **Coordinates are `[lng, lat]`** everywhere — GeoJSON order. The base system prompt teaches the LLM this; don't override it without preserving the rule.
- **Tools return summaries, not GeoJSON.** Full data stays in state. Custom tools should follow the same pattern (return small JSON, write GeoJSON to state).
- **Modules are per-entry.** There's no top-level `state.places.getPlacesModule()` — each entry has its own lazy `PlacesModule` (use `state.places.addPlaceResult(...)` then the existing display tools, or `state.places.getEntryPlacesModule(entryId, markerType)` for direct module access).
- **Recall tools exist for a reason.** Tool results are not retained in conversation history. If a custom tool produces stateful results, store them on a `StateSlice` and add a recall tool — don't expect the LLM to remember.
- **`model` is required.** No provider is bundled. The factory throws if you forget.
- **Classification is per-turn-cached.** It runs only on `stepNumber === 0` of each turn; later steps reuse the same active-tools set.
