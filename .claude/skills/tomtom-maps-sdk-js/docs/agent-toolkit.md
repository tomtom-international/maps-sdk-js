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
    ENTRY_MODE_SLICE_NAMES,
    type EntryDataKind,
    type EntryModeSliceName,
    type ToolEntry,
    type ToolBuildOptions,
    type ToolEntryBuilder,
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

1. **Intent classification** — a lightweight pre-pass picks the minimal subset of tools relevant to the turn from each tool's `classificationPrompt`. For *scopable* tools (`analyseData`, `processData`), the classifier also emits a `toolScopes[<name>]` value naming the kinds of entries the turn touches — mandatory whenever a scopable tool is selected. `prepareStep` validates the scope against the tool's `scopeSchema` and rebuilds that tool's `description` + `inputSchema` for the upcoming step from a terse default into a per-kind narrowed surface. The narrowing is invisible to the model — it just sees a smaller, more focused prompt.
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

    // Per-data-entry-kind config (keyed by LLM-facing kind names: routes / incidents / …)
    dataEntries: {
        routes: { entryMode: 'single' },       // only one route at a time
        incidents: { entryMode: 'single' },
        byod: { enabled: false },              // drop byod from analyseData/processData scope + recallByod/addByodLayer/updateByodDisplay
    },

    // Classifier (optional)
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),  // cheaper model
    // classifier: false,                                                    // disable (scopable tools fall back to terse unscoped surface)
    onClassify: (result) => console.log(result?.activeToolNames, result?.toolScopes),

    // Custom state (optional)
    state: { fleet: new FleetState() },  // only custom slices; built-in slices are auto-created

    // Feature flags
    featureFlags: { experimentalSearch: true },   // route discoverPlaces through explorationSearch (more input fields)

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

Flat record of named `ToolEntry` objects. Categories (representative names — see `DEFAULT_TOOLS` for the full list and `TOOL_NAMES` for the union type):

- **Location**: `locatePlace`, `reverseGeocode`, `getCurrentLocation`, `getViewport`
- **Places & search**: `discoverPlaces`, `getPOICategoryCodes`
- **Routing**: `setRoute`, `addWaypointsToRoute`, `removeWaypointsFromRoute`, `replaceWaypointInRoute`, `getCurrentWaypoints`
- **Reachable areas**: `findReachableAreas` (isochrones / isodistances)
- **Geometries (polygon namespace)**: `recallGeometries` — tagged `{ kind, id }` lookups across `place` / `places` / `ranges` / `customGeometries` entries
- **BYOD (bring-your-own-data)**: `addByodLayer`, `recallByod`, `updateByodDisplay` — customer-authored GeoJSON layers (URL fetch or inline) registered as `byod` entries
- **Traffic — tiles**: `toggleTilesTrafficFlow`, `toggleTilesTrafficIncidents`, `getShownTileIncidents`
- **Traffic — incidents (fetch / monitor / focus)**: `getTrafficIncidents`, `startTrafficIncidentsMonitor`, `stopTrafficIncidentsMonitor`, `focusIncidents`
- **Traffic — area analytics**: `getTrafficAreaAnalytics`, `queryTrafficAnalytics`, `updateTrafficAreaAnalyticsDisplay`
- **Unified data tools (scope-aware)**: `analyseData`, `processData` — see [Scope-aware tools](#scope-aware-tools) below
- **Map display**: `updatePlacesDisplay`, `updateRoutesDisplay` (replaces the old `setRouteTheme`), `updateWaypointsDisplay`, `updateTrafficAreaAnalyticsDisplay`, `updateByodDisplay`, `clearMap`
- **Map control**: `flyTo`, `zoomInOrOut`, `setMapStandardStyle`, `setLanguage`, `toggleTilesPOIs`, `toggleTilesBaseMapLayerGroups`, `setPitchBearing`, `getStandardMapStyles`
- **MapLibre direct**: `executeMaplibreCode`, `setLayoutProperties`, `setPaintProperties`, `getMapStyleLayers`
- **State / recall**: `recallPlaces`, `recallRoutes`, `recallRanges`, `recallGeometries`, `recallByod`, `recallState`, `setEntryMode`, `resetState`
- **Utilities**: `formatDistance`, `formatDuration`, `calculateBBox`, `help`

Every tool follows the same `ToolEntry` shape. Listed names are stable — agents and apps can reference them via `DEFAULT_TOOLS.locatePlace`, etc.

---

## `ToolEntry` shape

```ts
type ToolEntry<S extends ToolState = ToolState, Scope = unknown> = {
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

    // OPTIONAL: per-turn scope (see "Scope-aware tools" below)
    scopeSchema?: z.ZodType<Scope>; // shape of `toolScopes[name]` the classifier should emit
    scopePrompt?: string;           // hint shown to the classifier explaining the scope shape
};
```

Builder form (`ToolEntryBuilder`) accepts `ToolBuildOptions<Scope>` and is what the registry uses for tools that need to react to feature flags or per-turn scope:

```ts
type ToolEntryBuilder<S, Scope = unknown> = (options: ToolBuildOptions<Scope>) => ToolEntry<S, Scope>;

type ToolBuildOptions<Scope = unknown> = {
    featureFlags?: FeatureFlags;
    scope?: Scope;                  // classifier-resolved scope; undefined at agent-creation time and on the no-scope fallback path
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

## Scope-aware tools

`analyseData` and `processData` are the **two unified data tools** that replace the older per-kind splits (`analysePlaces` / `analyseRoutes` / `analyseGeometries` / `analyseIncidents` and `processPlaces` / `processRoutes` / `processGeometries`). Each takes any combination of `placesEntryIDs` / `routesEntryIDs` / `incidentsEntryIDs` / `geometriesEntryIDs` / `trafficAreaAnalyticsEntryIDs` / `byodEntryIDs` and exposes them as sandbox inputs (`places`, `routes`, `incidents`, `geometries`, `trafficAreaAnalytics`, `byod`, plus `byEntry` partition views).

The catch: a tool that documents all 6 input kinds + per-kind schema docs + cross-kind ops cheat-sheet is large (~5–8 K tokens per tool when unscoped). To keep cost down, both tools are **scopable**: the classifier emits a `toolScopes[<name>]` value naming the kinds the turn actually touches, and `prepareStep` rebuilds the tool's description + inputSchema for that step to mention *only* those kinds.

**Scope shape:**

```ts
type AnalyseDataKind = 'places' | 'routes' | 'incidents' | 'customGeometries' | 'trafficAreaAnalytics' | 'byod';
type AnalyseDataScope = { kinds: readonly AnalyseDataKind[] };

// processData has its own ProcessDataKind / ProcessDataScope with the same shape.
```

The shared union `EntryDataKind` covers all entry-owning slices that show up as data-tool inputs:

```ts
type EntryDataKind =
    | 'places'
    | 'routes'
    | 'incidents'
    | 'customGeometries'
    | 'trafficAreaAnalytics'
    | 'byod';
```

(Distinct from `EntryModeSliceName`, which uses the literal state-slice keys for state-level operations: `routing` vs `routes`, `customGeometries` vs `geometries`, etc.)

**Classifier contract:** picking a scopable tool *without* emitting its scope is rejected by the classifier output schema's `superRefine`. Up to two retry attempts; on persistent failure the tool falls back to the terse unscoped surface (degraded but functional). When `classifier: false`, scoping never engages and tools use the terse unscoped surface permanently.

**Observability:** `onClassify` receives both the picked tool names and the per-tool scopes:

```ts
onClassify: (result) => {
    console.log('tools:', result?.activeToolNames);   // ['analyseData', 'recallPlaces']
    console.log('scopes:', result?.toolScopes);       // { analyseData: { kinds: ['places', 'routes'] } }
}
```

**Add a scopable custom tool:** declare `scopeSchema` + `scopePrompt` and produce the entry from a `ToolEntryBuilder` that reads `options.scope`:

```ts
type FleetScope = { kinds: ('vehicles' | 'jobs')[] };

const fleetScopeSchema = z.object({
    kinds: z.array(z.enum(['vehicles', 'jobs'])).min(1),
});

const fleetAnalyseBuilder: ToolEntryBuilder<MyState, FleetScope> = ({ scope }) => ({
    description: scope ? `Analyse ${scope.kinds.join(' + ')} entries via dynamic JS.` : 'Analyse fleet data.',
    inputSchema: buildFleetSchema(scope),
    execute: executeFleetAnalyse,
    scopeSchema: fleetScopeSchema,
    scopePrompt: 'Emit `{ kinds: ["vehicles" | "jobs"] }` listing only the kinds the user query touches.',
});
```

The classifier discovers the new tool's scope via its `scopePrompt`; the prepareStep mutation engages automatically.

---

## `ToolState` slices

Live state, accessible from custom tools and from your app via `agent.state`:

| Slice | What it holds |
|---|---|
| `places` | Append-only history of place / geometry entries; per-entry lazy `PlacesModule` and `GeometriesModule` |
| `routing` | Append-only history of route entries; planning waypoint slots; route parameters; per-entry `RoutingModule` |
| `ranges` | Reachable range entries — origin(s), budgets, polygons, per-entry display modules |
| `customGeometries` | Derived polygon entries produced by `processData` (union, difference, h3-coverage, …); per-entry analyses + lazy `GeometriesModule` |
| `byod` | Customer-authored GeoJSON layer entries (URL fetch or inline) with per-entry lazy `CustomGeoJSONModule`. Produced by `addByodLayer` or programmatic `state.byod.addEntry(...)` |
| `baseMap` | Viewport, style, language, MapLibre map instance (`mapLibreMap`) |
| `trafficTiles` | Real-time traffic flow + incident tile-overlay visibility |
| `trafficAreaAnalytics` | Per-entry traffic-area-analytics history; per-entry visualisation config + lazy `TrafficAreaAnalyticsModule` |
| `trafficIncidents` | Fetched incident entries (history) + per-entry analyses, focused subsets, and the live monitor — produced/refreshed by `getTrafficIncidents` and `startTrafficIncidentsMonitor` |
| `mapPOIs` | POI category visibility and filters |

Common reads from app code:

```ts
agent.state.routing.currentRoutes;     // most recent Routes
agent.state.places.latestEntry;        // most recent places entry
agent.state.places.entries;            // full history
agent.state.byod.entries;              // BYOD layer entries
agent.state.byod.shownEntryIds;        // set of currently-rendered BYOD ids
agent.state.baseMap.mapLibreMap;       // raw maplibre-gl Map
```

### Tagged geometries-id discriminator

`recallGeometries` and the data-tool `geometriesEntryIDs` input accept tagged ids that select polygons from any of four sources:

```ts
type GeometriesIdKind = 'place' | 'places' | 'ranges' | 'customGeometries';

// { kind: 'place', id: '<placeId>' }          → that one place's footprint
// { kind: 'places', id: '<placesEntryId>' }   → every footprint in a places entry
// { kind: 'ranges', id: '<rangesEntryId>' }   → every isochrone polygon in a ranges entry
// { kind: 'customGeometries', id: '<entryId>' } → a custom-geometries entry produced by processData
```

(The `customGeometries` literal was previously `custom` — renamed for consistency with the slice key.)

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

### Entry mode

Every entry-bearing slice supports `setEntryMode('single' | 'multiple')`. The slice union `EntryModeSliceName` and runtime list `ENTRY_MODE_SLICE_NAMES` are exported so custom UIs / tools can iterate every entry-mode-aware slice without hard-coding names:

```ts
import { ENTRY_MODE_SLICE_NAMES } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

for (const slice of ENTRY_MODE_SLICE_NAMES) {
    console.log(slice, agent.state[slice].entryMode);
}
```

The model also surfaces mode changes through the `setEntryMode` tool (responds to *"only show one route at a time"*).

---

## Classifier

Default classifier is LLM-based and reuses your main `model`. To use a cheaper classifier model:

```ts
createMapAgent(map, {
    model: openai('gpt-4o'),
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),
});
```

Disable entirely (all tools always exposed; scopable tools fall back to terse unscoped surface):

```ts
createMapAgent(map, { model, classifier: false });
```

A classifier is just a function: `(ctx: ClassifierContext) => Promise<ClassificationResult | null>`. Return `null` to fail-open. Custom classifiers receive every tool's `ToolMetadata` (name + `classificationPrompt` + `scopePrompt` + tags + dependsOn) — useful for rule-based selection.

`ClassificationResult` carries:

```ts
type ClassificationResult = {
    activeToolNames: string[];
    toolScopes?: Record<string, unknown>;    // per-tool scope, validated in prepareStep
    timeMs: number;
    usage: { inputTokens; outputTokens; totalTokens };
};
```

Tune a custom tool's classification by editing its `classificationPrompt`:

```ts
// Too broad — fires on any location query
classificationPrompt: 'Get fleet vehicle data.'

// Precise — fires only when an explicit ID is mentioned
classificationPrompt: 'Locate a fleet vehicle by its ID (e.g. "TT-001"); not for general location queries.'
```

For a scopable custom tool, set `scopePrompt` describing the scope shape; the default classifier appends a "SCOPE:" hint per tool in its system prompt and requires the scope to be emitted whenever the tool is picked.

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

## `getTrafficIncidents` `where` schema

Traffic-incident loading uses a `where` schema (`within` mode) instead of a top-level bbox. The same multi-region inputs that `discoverPlaces.where.within` accepts (`viewport`, `boundingBox`, `queries`, `placeIds`, `geometries`, `range`, `route`) all resolve to bboxes and are unioned into one bbox for the underlying SDK call. Default when `where` is omitted: `{ mode: 'within', viewport: true }`.

```ts
// Current viewport
getTrafficIncidents({});

// Named area (geocoded → polygon bbox)
getTrafficIncidents({ where: { mode: 'within', queries: [{ query: 'Paris', queryAs: 'place' }] } });

// Buffered corridor around the latest route
getTrafficIncidents({ where: { mode: 'within', route: { widthMeters: 1000 } } });

// Multi-source union
getTrafficIncidents({
    where: { mode: 'within', queries: [{ query: 'Amsterdam' }], placeIds: ['G55fc4abe-...'] },
});
```

When the classifier picks `getTrafficIncidents` with both a meaningful multi-region field *and* `viewport: true` (strict-mode LLMs default both), the executor prefers the multi-region intent — never silently answers with the viewport when the user named a specific area.

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
- **Modules are per-entry.** There's no top-level `state.places.getPlacesModule()` — each entry has its own lazy `PlacesModule` / `GeometriesModule` / `RoutingModule` / `CustomGeoJSONModule` / `TrafficAreaAnalyticsModule`. Use the slice helpers (`state.places.addPlaceResult(...)`, `state.byod.addEntry(...)`, etc.) and the existing display tools, or `slice.getEntryModule(entryId)` for direct module access.
- **Recall tools exist for a reason.** Tool results are not retained in conversation history. If a custom tool produces stateful results, store them on a `StateSlice` and add a recall tool — don't expect the LLM to remember.
- **Scopable tools require scope** when picked by the classifier. The classifier output schema enforces this; classifier failures fall back to the terse unscoped surface (functional but less detailed in the `code` doc).
- **`classifier: false` disables scope mutation.** Scopable tools fall back to their terse unscoped form for every call. Enable a classifier (default or custom) to get the narrowed surface.
- **Single-concurrent-run per agent.** The scope-narrowing mechanism mutates the shared tool objects between classification and the model request. `prepareStep` serialises calls within an agent via a mutex; for parallel sessions, create one agent per session (the typical embedding-app pattern).
- **`model` is required.** No provider is bundled. The factory throws if you forget.
