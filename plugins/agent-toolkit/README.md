# TomTom Maps SDK - Agent Toolkit Plugin

A headless conversational agent that gives Large Language Models tool-based control over a [TomTom Map](https://developer.tomtom.com/) and TomTom location services, powered by [Vercel AI SDK v6](https://ai-sdk.dev/).

No UI is included — bring your own chat interface. No LLM provider is bundled — supply any AI SDK-compatible model.

> **Full documentation** — guides, architecture diagrams, and tutorials are available at [docs.tomtom.com](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/overview).

## Installation

```bash
pnpm add @tomtom-org/maps-sdk @tomtom-org/maps-sdk-plugin-agent-toolkit ai zod maplibre-gl
```

Install at least one AI SDK provider:

```bash
# Pick one (or more)
pnpm add @ai-sdk/openai
pnpm add @ai-sdk/anthropic
pnpm add @ai-sdk/azure
```

## Quick start

```typescript
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { openai } from '@ai-sdk/openai';

// 1. Create a TomTom map
const map = new TomTomMap({
    mapLibre: { container: 'map', center: [4.9, 52.4], zoom: 10 },
});

// 2. Create the agent
const agent = createMapAgent(map, {
    model: openai('gpt-4o'),
});

// 3. Send a message
const result = await agent.generate({
    messages: [{ role: 'user', content: 'Find coffee shops near Dam Square, Amsterdam' }],
});

console.log(result.text);
```

### With React (`useChat`)

```typescript
import { DirectChatTransport, useChat } from 'ai/react';

const agent = createMapAgent(map, { model: openai('gpt-4o') });

function ChatPanel() {
    const { messages, sendMessage } = useChat({
        transport: new DirectChatTransport({ agent }),
    });

    return (
        <div>
            {messages.map((m) => (
                <div key={m.id}>{m.content}</div>
            ))}
            <input onKeyDown={(e) => e.key === 'Enter' && sendMessage(e.target.value)} />
        </div>
    );
}
```

See [`examples/map-chat-agent`](../../examples/map-chat-agent) for a full working example.

## Tools reference

The plugin ships a `DEFAULT_TOOLS` registry covering search, routing, traffic, reachable areas, BYOD GeoJSON, base-map control, MapLibre access, and code-generated analysis. All tools are included by default and can be individually removed or replaced via the [`tools` option](#composing-tool-sets). The full per-tool reference lives in the [Agent Toolkit guide](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/tools).

### Location & search

| Tool | Description |
|---|---|
| `locatePlace` | Resolve a location string (landmark, city, address) to a place; optionally stage as a waypoint |
| `reverseGeocode` | Convert `[longitude, latitude]` coordinates to an address |
| `discoverPlaces` | Search for places by text query or POI category within an area |
| `getPOICategoryCodes` | Look up TomTom POI category codes from natural-language names |
| `getCurrentLocation` | Get the user's physical GPS location from the browser |
| `getViewport` | Get current map center, zoom, and bounding box |

### Routing & reachable areas

| Tool | Description |
|---|---|
| `setRoute` | Calculate or recalculate a route — provide `locations` (waypoints), `parameters` (route options), or both |
| `addWaypointsToRoute` | Extend the current route — prepend a new origin, append a new destination, and/or insert intermediate stops |
| `removeWaypointsFromRoute` | Remove one or more waypoints by index from the current route |
| `replaceWaypointInRoute` | Overwrite a single waypoint of the current route in place — origin, destination, or by index |
| `getCurrentWaypoints` | Get the staged waypoint slots (origin, stops, destination) |
| `findReachableAreas` | Calculate isochrone/isodistance polygons from one or more origins |

### Traffic

| Tool | Description |
|---|---|
| `getTrafficIncidents` | Fetch traffic incidents within an area (viewport, named place, route corridor, polygon, IDs) |
| `startTrafficIncidentsMonitor` | Start a live monitor that refreshes incident state on a configurable cadence |
| `stopTrafficIncidentsMonitor` | Stop the live incident monitor |
| `focusIncidents` | Highlight a subset of incidents (by id / category / severity) on the map and dim the rest |
| `getTrafficAreaAnalytics` | Fetch historical traffic analytics (speed, congestion, travel time) for an area |
| `queryTrafficAnalytics` | Query cached analytics data or check what is currently displayed |
| `toggleTilesTrafficFlow` | Toggle the real-time traffic-flow tile overlay |
| `toggleTilesTrafficIncidents` | Toggle the real-time traffic-incidents tile overlay |
| `getShownTileIncidents` | List real-time incidents visible in the current viewport |

### Bring-your-own-data (BYOD)

| Tool | Description |
|---|---|
| `addByodLayer` | Ingest a customer-authored GeoJSON layer from a URL or inline `FeatureCollection` |
| `recallByod` | List BYOD entries, or retrieve a single entry's full `FeatureCollection` by id |
| `updateByodDisplay` | Show, hide, or clear BYOD layers on the map |

> See the [Bring your own data](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/byod) guide for ingestion patterns, visibility lifecycle, and how BYOD entries feed into `analyseData` / `processData`.

### Unified data tools — scope-aware code generation

| Tool | Description |
|---|---|
| `analyseData` | Aggregate / chart entries (`places`, `routes`, `incidents`, `geometries`, `trafficAreaAnalytics`, `byod`) via dynamic JS; classifier-emitted scope narrows the schema per turn |
| `processData` | Transform entries into new `places`, `placeConnections`, `geometries`, `byod`, or a `fitOnMap` camera move via dynamic JS |
| `executeMaplibreCode` | Execute arbitrary MapLibre JS against the live `Map` instance — escape hatch for custom layers, animations, raster overlays |

> See [Code generation](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation) for the injected identifiers, output contracts, and threat model (these tools have no sandbox), and [Scope-aware data tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/scope-aware-data-tools) for how the per-turn classifier scope keeps the prompt small.

### Map display

| Tool | Description |
|---|---|
| `updatePlacesDisplay` | Show, hide, or restyle place entries on the map |
| `updateRoutesDisplay` | Show, hide, or restyle route entries (line color, waypoint icons, fit camera) |
| `updateWaypointsDisplay` | Show staged waypoint markers without the route line |
| `updateTrafficAreaAnalyticsDisplay` | Visualize traffic-area-analytics as hexgrid, heatmap, or tiles |
| `clearMap` | Remove displayed places, routes, BYOD layers, or all features |

### Map control

| Tool | Description |
|---|---|
| `flyTo` | Move the camera to a position or bounding box |
| `zoomInOrOut` | Adjust the zoom level by a delta |
| `setPitchBearing` | Tilt (pitch) and/or rotate (bearing) the camera |
| `getStandardMapStyles` | List available standard map style presets |
| `setMapStandardStyle` | Switch map style (light, dark, satellite, driving, etc.) |
| `setLanguage` | Change the language for map labels and API responses |
| `toggleTilesBaseMapLayerGroups` | Show/hide named layer groups (buildings3D, roadLabels, water, etc.) |
| `toggleTilesPOIs` | Show/hide built-in map POI icons with optional category filtering |

### MapLibre direct access

| Tool | Description |
|---|---|
| `getMapStyleLayers` | List MapLibre layer IDs with their paint/layout properties |
| `setLayoutProperties` | Set MapLibre layout properties on named layers |
| `setPaintProperties` | Set MapLibre paint properties (colors, widths, opacity) on named layers |

### State & recall

| Tool | Description |
|---|---|
| `recallPlaces` | Retrieve the history of place lookups from this session |
| `recallRoutes` | Retrieve previously calculated routes from this session |
| `recallRanges` | Retrieve stored reachable-range results |
| `recallGeometries` | Look up polygon sources by `{ kind, id }` across place footprints, isochrones, and `customGeometries` entries |
| `recallByod` | Retrieve BYOD entries (see [BYOD](#bring-your-own-data-byod)) |
| `recallState` | Summarize the current contents of every state slice |
| `setEntryMode` | Switch a slice between `multiple` (default) and `single` entry modes |
| `resetState` | Reset one or all state slices |

### Utilities

| Tool | Description |
|---|---|
| `calculateBBox` | Compute a bounding box from GeoJSON features or tool results |
| `formatDistance` | Format meters into a human-readable string (e.g. "2.5 km") |
| `formatDuration` | Format seconds into a human-readable string (e.g. "1 h 30 min") |
| `help` | List available capabilities in summary or searchable detail mode |

## Customization

> See [Customizing tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/customizing-tools) for the full walkthrough — registry resolution, removing or replacing defaults, adding scopable custom tools, and starting from a blank slate.

### `createMapAgent` options

```typescript
// Define custom state by extending ToolState
interface MyState extends ToolState {
    fleet: FleetState;
}

const agent = createMapAgent<MyState>(map, {
    // Required: AI SDK language model instance
    model: openai('gpt-4o'),

    // Include built-in defaults (default: true). Set false for custom-only.
    includeDefaultTools: true,

    // Add, replace, or remove tools (merged with defaults)
    tools: { myCustomTool: weatherTool },

    // Append to the built-in system prompt
    systemPromptSuffix: 'Always respond in Spanish. Use metric units.',

    // Or replace it entirely (systemPromptSuffix is ignored when this is set)
    systemPrompt: 'You are a delivery route planner...',

    // Custom state slices — only custom fields needed, built-in slices are created automatically
    state: { fleet: new FleetState() },

    // Per-kind data-entry config. `enabled: false` removes the kind from the tool surface
    // (drops its recall/display/fetch tools and the kind from analyseData/processData scope).
    // `entryMode` switches the slice between 'multiple' (default) and 'single' (latest only).
    dataEntries: {
        routes: { entryMode: 'single' },
        byod: { enabled: false },
    },

    // Intent classifier: omit for default LLM-based, false to disable
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),

    // Observe classifier decisions
    onClassify: (result) => console.log('Selected tools:', result?.activeToolNames),

    // Custom prepareStep hook (composed with internal classification)
    prepareStep: async (stepInfo) => ({ toolChoice: 'auto' }),

    // Disable structured output schemas for providers that don't support them
    outputSchemas: false,

    // Max tool-loop iterations (default: 10)
    maxSteps: 15,

    // Opt into experimental features (subject to change without notice)
    featureFlags: { experimentalSearch: true },

    // Provider-specific options forwarded to the AI SDK on every step
    providerOptions: {
        openai: { reasoningEffort: 'low', reasoningSummary: 'auto' },
    },

    // Per-step providerOptions override — e.g. bump reasoning only on code-exec turns
    stepProviderOptions: ({ activeTools }) =>
        activeTools?.includes('processData')
            ? { openai: { reasoningEffort: 'medium' } }
            : undefined,
});
```

### Composing tool sets

The `tools` option is merged with the built-in defaults. Use `false` to exclude a tool.

```typescript
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Add custom tools (defaults included automatically)
createMapAgent(map, { model, tools: { getWeather: myWeatherTool } });

// Remove specific defaults
createMapAgent(map, { model, tools: { setMapStandardStyle: false, setLanguage: false } });

// Replace a default tool (full ToolEntry required)
createMapAgent(map, { model, tools: { discoverPlaces: myCustomSearchTool } });

// Mix: add, remove, and replace in one call
createMapAgent(map, {
    model,
    tools: {
        setLanguage: false,
        discoverPlaces: myCustomSearchTool,
        getWeather: myWeatherTool,
    },
});

// No defaults — only custom tools
createMapAgent(map, { model, includeDefaultTools: false, tools: { myTool } });
```

### Defining custom tools

Use `satisfies` for type-safe custom tool definitions:

```typescript
import { type ToolEntry, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { z } from 'zod';

const fleetTools = {
    trackVehicle: {
        description: 'Track a vehicle by ID on the map.',
        inputSchema: z.object({ vehicleId: z.string() }),
        execute: async ({ vehicleId }, state) => {
            // state is the full ToolState — access state.places, state.routing, etc.
            const position = await fetchVehiclePosition(vehicleId);
            return { vehicleId, position };
        },
        tags: ['fleet'],
        relatedTools: ['updatePlacesDisplay'],
    },
} satisfies Record<string, ToolEntry>;

// Pass directly — merged with defaults automatically
createMapAgent(map, { model, tools: fleetTools });
```

### Tool entry shape

Every tool (built-in or custom) follows the `ToolEntry` interface:

```typescript
type ToolEntry<S extends ToolState = ToolState> = {
    description: string;            // Operational contract for the LLM
    inputSchema: z.ZodType;         // Zod schema for input validation
    outputSchema?: z.ZodType;       // Optional structured output schema
    execute: (input, state: S) => Promise<any>;

    // Classifier metadata (optional)
    classificationPrompt?: string;  // One-liner for the intent classifier
    tags?: string[];                // Category tags (e.g. 'location', 'route')
    examples?: string[];            // Code examples
    examplePrompts?: string[];      // Natural language prompt examples
    relatedTools?: string[];        // Tools often used together
    dependsOn?: string[];           // Tools that must run before this one
};
```

## State management

> See the [State](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/state) guide for a per-slice deep dive, `entryMode` semantics (`multiple` vs `single`), inspecting state from your application, and adding custom slices.

`ToolState` is organized by feature area. Each slice manages lazy-initialized map modules and an append-only history of results produced during the session. Built-in slices:

- `PlacesState` — place / geometry entry history
- `RoutingState` — route history, planning waypoint slots, route parameters
- `RangeState` — reachable-range entries
- `CustomGeometriesState` — derived polygon entries produced by `processData` (union, difference, h3-coverage, …)
- `BYODState` — bring-your-own-data GeoJSON layer entries
- `BaseMapState` — viewport, style, language, raw `mapLibreMap`
- `TrafficTilesState` — real-time traffic flow + incident tile-overlay visibility
- `TrafficAreaAnalyticsState` — historical traffic-area-analytics entries and per-entry visualisation
- `TrafficIncidentsState` — fetched incident entries, registered analyses, focused subsets, and the optional polling monitor
- `MapPOIsState` — POI category visibility and filters

Built-in slices are constructed automatically by `createMapAgent`. To add custom slices, define an interface extending `ToolState` and pass the type parameter — only the custom fields need to be provided:

```typescript
interface MyState extends ToolState {
    fleet: FleetState;
}

const agent = createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});

agent.state.fleet;   // FleetState — custom slice
agent.state.places;  // PlacesState — append-only history of place entries
```

## Intent classifier

The intent classifier is an optional per-turn optimization that selects which tools the LLM sees, reducing noise and improving accuracy. See the [How it works](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/how-it-works) guide for the full two-phase pipeline (classification → tool loop), prompt assembly, and observability hooks.

```typescript
import { createMapAgent, createDefaultClassifier } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Default: uses the main model for classification
const agent = createMapAgent(map, { model: openai('gpt-4o') });

// Use a cheaper model for classification
const agent = createMapAgent(map, {
    model: openai('gpt-4o'),
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),
});

// Disable classification entirely (all tools always visible)
const agent = createMapAgent(map, {
    model: openai('gpt-4o'),
    classifier: false,
});
```

The classifier prompt is built dynamically from each tool's `classificationPrompt` and `relatedTools` metadata, so it stays in sync automatically when tools are added or renamed.

## System prompt

The built-in `BASE_SYSTEM_PROMPT` teaches the LLM coordinate conventions, tool execution patterns, location reference rules, and response formatting. You can extend or replace it:

```typescript
import { createMapAgent, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Append additional instructions
const agent = createMapAgent(map, {
    model,
    systemPromptSuffix: 'Always use metric units. Respond in Dutch.',
});

// Full replacement
const agent = createMapAgent(map, {
    model,
    systemPrompt: BASE_SYSTEM_PROMPT + '\n\nYou are a delivery fleet dispatcher...',
});
```

## Advanced usage

### Wrapping default tools

Add logging, analytics, or custom behavior around existing tools:

```typescript
import { DEFAULT_TOOLS, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

const wrappedDiscover = {
    ...DEFAULT_TOOLS.discoverPlaces,
    execute: async (input, state) => {
        console.log('[Analytics] Search:', input.query);
        const result = await DEFAULT_TOOLS.discoverPlaces.execute(input, state);
        console.log('[Analytics] Found:', result.count, 'places');
        return result;
    },
};

createMapAgent(map, { model, tools: { discoverPlaces: wrappedDiscover } });
```

### Common configuration patterns

**Search-only agent (no routing):**

```typescript
const agent = createMapAgent(map, {
    model,
    tools: {
        setRoute: false,
        addWaypointsToRoute: false,
        removeWaypointsFromRoute: false,
        replaceWaypointInRoute: false,
        updateRoutesDisplay: false,
    },
});
```

**Locked visual appearance:**

```typescript
const agent = createMapAgent(map, {
    model,
    tools: {
        setMapStandardStyle: false,
        setLanguage: false,
        setLayoutProperties: false,
        setPaintProperties: false,
        toggleTilesBaseMapLayerGroups: false,
    },
});
```

### The `MapAgentInstance`

`createMapAgent` returns a `ToolLoopAgent` (usable directly with `DirectChatTransport`) with two extra properties:

```typescript
const agent = createMapAgent(map, { model });

agent.state;     // Live state — typed as CS when custom state is provided, ToolState otherwise
agent.destroy(); // Reset all state slices (call on unmount)
```

## Public API exports

```typescript
// Main factory
export { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Tool registry and composition
export {
    DEFAULT_TOOLS,
    getDefaultToolPrompts,
    resolveTools,
    TOOL_NAMES,
    type ToolName,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// System prompt
export { BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Data-entry & entry-mode introspection
export {
    DATA_ENTRY_KIND_TO_SLICE,
    ENTRY_MODE_SLICE_NAMES,
    TOOLS_BY_DATA_ENTRY_KIND,
    type DataEntryConfig,
    type DataEntryKind,
    type EntryDataKind,
    type EntryMode,
    type EntryModeSlice,
    type EntryModeSliceName,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Geometries id schema (tagged `{ kind, id }` accepted by analyseData/processData)
export {
    geometriesIdSchema,
    type GeometriesId,
    type GeometriesIdKind,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// State digest (for dev panels / debug UIs)
export {
    formatStateDigestDiff,
    getStateDigest,
    type StateDigest,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Classifier
export {
    classifyUserIntent,
    createDefaultClassifier,
    extractLastUserText,
    type ClassificationResult,
    type Classifier,
    type ClassifierContext,
    type ClassifierOptions,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Traffic-incidents monitor types
export type {
    IncidentSnapshot,
    MonitoredArea,
    PollingStatus,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Core types — `StateSlice`, `ToolState`, `MapAgentOptions`, `MapAgentInstance`,
// `ToolEntry`, `ToolEntryBuilder`, `ToolDefinition`, `ToolBuildOptions`,
// `ToolMetadata`, `ToolName`, `ToolNameHint`, `FeatureFlags`, entry/analysis
// types (`PlacesEntry`, `PlacesAnalysis`, `RoutesEntry`, `RoutesAnalysis`,
// `BYODEntry`, `BYODSource`, `CustomGeometriesEntry`, `CustomGeometriesAnalysis`,
// `GeometryProvenance`, `RangesEntry`, `ReachableRange`, `RouteParams`,
// `TrafficAreaAnalyticsEntry`, `TrafficAreaAnalyticsAnalysis`,
// `TrafficAreaAnalyticsParams`, `TrafficIncidentsEntry`, `IncidentsAnalysis`),
// and more.
export type * from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
```

## Dependencies

| Type | Package | Purpose |
|---|---|---|
| Peer | `@tomtom-org/maps-sdk` | TomTom Maps SDK (types, services, map modules) |
| Peer | `ai@^6.0.0` | Vercel AI SDK (ToolLoopAgent, tool types) |
| Peer | `zod@^3.23.0` | Schema validation |
| Peer | `maplibre-gl@^5.0.0` | Map rendering engine |

## Design principles

1. **Client-side only** — uses AI SDK's `DirectChatTransport` + `ToolLoopAgent`. The consumer provides the model; no server infrastructure is required.
2. **No bundled LLM provider** — supply any AI SDK-compatible `LanguageModel`. Keeps the package provider-agnostic.
3. **Token-efficient** — all service responses are summarized before reaching the LLM. Full GeoJSON stays in `ToolState`.
4. **Lazy module initialization** — map modules are instantiated on first use and cached in state.
5. **Coordinate convention** — always `[longitude, latitude]` per GeoJSON standard, enforced throughout.
6. **Task-oriented tools** — tool boundaries follow user tasks, not SDK API surface. See [ENGINEERING-GUIDELINES.md](./ENGINEERING-GUIDELINES.md).

## References

- [Agent Toolkit guides](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/overview) — full documentation set:
    - [How it works](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/how-it-works) — two-phase pipeline (classifier + tool loop), prompt assembly, observability
    - [Tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/tools) — per-tool reference
    - [State](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/state) — per-slice reference, entry modes, custom slices
    - [Customizing tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/customizing-tools) — add, replace, remove, or start from a blank slate
    - [Code generation](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation) — `analyseData` / `processData` / `executeMaplibreCode` (threat model included)
    - [Scope-aware data tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/scope-aware-data-tools) — per-turn scope mechanism
    - [Bring your own data](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/byod) — ingest customer GeoJSON layers
- [AI SDK v6 documentation](https://ai-sdk.dev/)
- [TomTom Maps SDK documentation](https://developer.tomtom.com/)
- [Engineering guidelines](./ENGINEERING-GUIDELINES.md) — tool design standards, state management, system prompt structure
- [Example application](../../examples/map-chat-agent) — full chat interface implementation
