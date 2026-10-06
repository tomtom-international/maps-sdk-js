# Agent Toolkit Plugin

A headless conversational agent that gives Large Language Models tool-based control over a [TomTom Map](https://docs.tomtom.com/maps-sdk-js/guides/map/tomtom-map) and TomTom location services, powered by [Vercel AI SDK v6](https://ai-sdk.dev/).

No UI is included — bring your own chat interface. No LLM provider is bundled — supply any AI SDK-compatible model.

> **Full documentation** — guides, architecture diagrams, and tutorials are available at [docs.tomtom.com](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/overview).

## Design principles

1. **Client-side only** — uses AI SDK's `DirectChatTransport` + `ToolLoopAgent`. The consumer provides the model; no server infrastructure is required.
2. **No bundled LLM provider** — supply any AI SDK-compatible `LanguageModel`. Keeps the package provider-agnostic.
3. **Token-efficient** — all service responses are summarized before reaching the LLM. Full GeoJSON stays in `ToolState`.
4. **Lazy module initialization** — map modules are instantiated on first use and cached in state.
5. **Coordinate convention** — always `[longitude, latitude]` per GeoJSON standard, enforced throughout.
6. **Task-oriented tools** — tool boundaries follow user tasks, not SDK API surface, so a single prompt maps to a single tool call.

## Installation

```bash
pnpm add @tomtom-org/maps-sdk @tomtom-org/maps-sdk-plugin-agent-toolkit @tomtom-org/maps-sdk-plugin-map-theme ai zod maplibre-gl @turf/turf chart.js h3-js
```

Install at least one AI SDK provider, plus `@ai-sdk/react` for the `useChat` example below:

```bash
# Pick one (or more)
pnpm add @ai-sdk/openai
pnpm add @ai-sdk/anthropic
pnpm add @ai-sdk/azure

pnpm add @ai-sdk/react
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

```tsx
import { DirectChatTransport, isTextUIPart } from 'ai';
import { useChat } from '@ai-sdk/react';

const agent = createMapAgent(map, { model: openai('gpt-4o') });

function ChatPanel() {
    const { messages, sendMessage } = useChat({
        transport: new DirectChatTransport({ agent }),
    });

    return (
        <div>
            {messages.map((message) => (
                <div key={message.id}>{message.parts.filter(isTextUIPart).map((part) => part.text).join('')}</div>
            ))}
            <input onKeyDown={(event) => event.key === 'Enter' && sendMessage({ text: event.currentTarget.value })} />
        </div>
    );
}
```

See the [traffic agent example](https://docs.tomtom.com/maps-sdk-js/examples/map-traffic-agent-react) for a full working example.

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
| `startRouteMonitor` | Recalculate an already-calculated route on a cadence (default 60 s) so its live-traffic delays stay current |
| `stopRouteMonitor` | Stop recalculating a route; the entry keeps its last data |
| `findReachableAreas` | Calculate isochrone/isodistance polygons from one or more origins (private preview: the API key needs Calculate Reachable Range access) |

### Traffic

| Tool | Description |
|---|---|
| `getTrafficIncidents` | Fetch traffic incidents within an area (viewport, named place, route corridor, polygon, IDs); the entry keeps refreshing by default |
| `setTrafficIncidentsMonitor` | Turn background refreshing of an already-loaded incidents entry on or off |
| `clusterIncidents` | Group loaded incidents into hotspots (DBSCAN) with road and category labels, delay totals and trends |
| `focusIncidents` | Highlight a subset of incidents (by id / category / severity) on the map and dim the rest |
| `getTrafficAreaAnalytics` | Fetch historical traffic analytics (speed, congestion, travel time) for an area |

### Trackers

| Tool | Description |
|---|---|
| `createTracker` | Watch loaded entries with generated code and log an alert when its condition turns true (e.g. an incident near a hospital) |
| `getTrackers` | List the active trackers and whether each is firing |
| `getTrackerHistory` | Read the alerts and events trackers have logged, for one tracker or since a time |
| `clearTracker` | Stop a tracker; the entries it watched stay |

### Bring-your-own-data (BYOD)

| Tool | Description |
|---|---|
| `addByodSource` | Ingest a customer-authored GeoJSON source (URL or inline `FeatureCollection`) and profile its shape; the entry has no layers and renders nothing until the agent sets them via `setByodLayers` |
| `setByodLayers` | Restyle a BYOD entry — replace its MapLibre layers (type + data-driven paint) using the entry's data `profile` |
| `updateByodDisplay` | Show, hide, or clear BYOD layers on the map |

> See the [Bring your own data](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/byod) guide for ingestion patterns, visibility lifecycle, and how BYOD entries feed into `analyseData` / `processData`.

### Unified data tools — scope-aware code generation

| Tool | Description |
|---|---|
| `analyseData` | Aggregate / chart entries (`places`, `routes`, `incidents`, `geometries`, `trafficAreaAnalytics`, `byod`) via dynamic JS; classifier-emitted scope narrows the schema per turn |
| `processData` | Transform entries into new `places`, `placeConnections`, `geometries`, `byod`, or a `fitOnMap` camera move via dynamic JS |
| `monitorAnalysis` | Start or stop recomputing an `analyseData` analysis whenever its source entries change |
| `executeMaplibreCode` | Execute arbitrary MapLibre JS against the live `Map` instance — escape hatch for custom layers, animations, raster overlays |

> See [Code generation](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation) for the injected identifiers, output contracts, and threat model, and [Scope-aware data tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/scope-aware-data-tools) for how the per-turn classifier scope keeps the prompt small.

`analyseData`, `processData`, `createTracker` and `clusterIncidents` code is **always isolated in the browser** — a Web Worker in a sandboxed, opaque-origin iframe (no DOM/network; terminable on timeout), zero-config (the SDK lazily loads its own bundled turf/h3 for the worker). Where the code runs is chosen by environment, not configured: the browser always isolates; Node / SSR always run on the main thread (where that boundary has no equivalent — defense-in-depth only). The optional `codeExecution` only tunes the isolated browser run:

```typescript
const agent = createMapAgent(map, {
    model,
    codeExecution: { timeoutMs: 5000 }, // wall-clock budget per isolated run (default 10000)
});
```

> **Experimental** — the isolation boundary is verified by the `e2e-tests/` suite (CSP egress-block, worker termination, opaque-origin isolation), which runs in CI as a dedicated job; if the iframe can't initialise it falls back to the main thread (with a warning). `turf` / `h3` / `routeUtils` are all bundled into the worker, so that code (route-slicing included) runs fully in the browser. See the [code-generation guide](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation#data-tool-execution-isolation-experimental).

### Map display

| Tool | Description |
|---|---|
| `updatePlacesDisplay` | Show, hide, or restyle place entries on the map |
| `updateRoutesDisplay` | Show, hide, or swap route entries, switch the highlighted alternative, fit the camera |
| `updateWaypointsDisplay` | Show staged waypoint markers without the route line |
| `updateTrafficAreaAnalyticsDisplay` | Show, hide, or swap traffic-area-analytics entries |
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
| `setGeopoliticalView` | Show disputed borders and territory names from a country's view, for the map and later searches |
| `setMapStyling` | Set or reset what the base map shows and how it looks, by knob id — layer groups such as 3D buildings, the built-in POI icons and their categories, the live traffic overlays and their filters, the hillshade and 3D terrain, sizes, colours, map presets, or a whole theme from a few colours or an image — and the look of every layer the agent drew: places, routes and their sections, polygons, reachable areas, area analytics and fetched incidents; the classifier scope lists only the knob families a turn touches |

### MapLibre direct access

| Tool | Description |
|---|---|
| `getMapStyleLayers` | List MapLibre layer IDs with their paint/layout properties |
| `setLayerProperties` | Set MapLibre paint (colors, widths, opacity) and layout (visibility, text, sizes) properties on named layers |

### State & recall

| Tool | Description |
|---|---|
| `recallState` | Read session state: a snapshot of every slice, one kind's entries (`places`, `routes`, `ranges`, `geometries`, `byod`, …), or one entry by `{ kind, id }` |
| `setEntryMode` | Switch a slice between `multiple` (default) and `single` entry modes |
| `resetState` | Reset one or all state slices |

### Utilities

| Tool | Description |
|---|---|
| `calculateBBox` | Compute a bounding box from GeoJSON features or tool results |
| `clarifyIntent` | Ask the user to resolve a genuinely ambiguous or missing input, as a few numbered choices plus a free answer |
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
type ToolEntry<S extends ToolState = ToolState, Scope = unknown> = {
    description: string;            // Operational contract for the LLM
    inputSchema: z.ZodType;         // Zod schema for input validation
    outputSchema?: z.ZodType;       // Optional structured output schema
    // options.signal is the turn's AbortSignal: forward it to the services calls the tool makes
    execute: (input, state: S, options?: ToolExecuteOptions) => Promise<any>;

    // Classifier metadata (optional)
    classificationPrompt?: string;  // One-liner for the intent classifier
    tags?: string[];                // Category tags (e.g. 'location', 'route')
    examples?: string[];            // Code examples
    examplePrompts?: string[];      // Natural language prompt examples
    relatedTools?: string[];        // Tools often used together
    dependsOn?: string[];           // Tools that must run before this one
    scopeSchema?: z.ZodType<Scope>; // Per-turn scope the classifier may emit to narrow the tool
    scopePrompt?: string;           // Classifier hint on when and how to scope the tool

    // Loop control (optional)
    alwaysActive?: boolean;         // Visible on every step, whatever the classifier picks
    endsTurnOnCall?: boolean;       // Stop the loop on the step that calls this tool
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

## Privacy

> See the [What the agent sends, and where](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/what-the-agent-sends) guide for the full list.

- **What reaches your model provider**: every message and the system prompt; the classifier's copy (by default up to 8 earlier messages, 300 characters each; `classifier: false` turns it off); and tool results, including addresses, coordinates, the viewport, the device location, `analyseData` and `processData` output over your BYOD data, and up to 200 events per tracker.
- **The provider is your processor**: sign a DPA with it and pick an EEA region where it offers one.
- **What stays in memory**: `agent.state`, until the `resetState` tool or `agent.destroy()`. Nothing goes to browser storage. Chat history is yours, so erasing a user's data means clearing it and calling `agent.destroy()`.
- **To send less**: remove tools (`getCurrentLocation: false`), turn off the classifier, or replace a tool with one that returns less.

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

The built-in `BASE_SYSTEM_PROMPT` covers identity, a capability summary, scope/rejection rules, response formatting, data-confidence rules, tool-execution guidance, and session-state conventions. Per-tool mechanics (coordinate order, location-reference routing, etc.) live in the tool descriptions and the classifier prompt, not here.

`systemPrompt` accepts **either** a full replacement string **or** a section-overrides object (`Partial<Record<SystemPromptSection, string>>`) — omitted sections keep their defaults, and you supply only the section body (the heading is added for you):

```typescript
import {
    createMapAgent,
    BASE_SYSTEM_PROMPT,
    composeSystemPrompt,
    SYSTEM_PROMPT_SECTIONS,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Override individual sections — pass the overrides object straight to systemPrompt
const agent = createMapAgent(map, {
    model,
    systemPrompt: {
        identity: 'You are a delivery fleet dispatcher built on the TomTom map.',
        responseFormatting: 'Reply in Dutch, metric units, one short paragraph.',
        // every other section falls back to its default
    },
    // Section overrides still honor the prefix and suffix (a full string replacement does not).
    // The prefix is prepended above the whole prompt as a heading-less preamble; the suffix is
    // appended under an "ADDITIONAL INSTRUCTIONS" heading.
    systemPromptPrefix: 'You work for Acme Logistics.',
    systemPromptSuffix: 'Never expose internal entry ids to the user.',
});

// Append-only: keep the whole base prompt, add instructions
const agent = createMapAgent(map, { model, systemPromptSuffix: 'Always use metric units.' });

// composeSystemPrompt() does the same composition explicitly, if you need the string elsewhere
const prompt = composeSystemPrompt({ responseFormatting: 'Reply in Dutch.' });

// Extend a default section instead of replacing it: read its default body from
// SYSTEM_PROMPT_SECTIONS, derive a new value, and override with the result. Handy for
// handing a default to a coding agent to rewrite under some criteria.
const agentWithExtraRule = createMapAgent(map, {
    model,
    systemPrompt: {
        rejectionRules: `${SYSTEM_PROMPT_SECTIONS.rejectionRules}\n- Decline weather questions.`,
    },
});

// Full replacement (systemPromptPrefix and systemPromptSuffix are ignored)
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
        setLayerProperties: false,
        setMapStyling: false,
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

The main entry point is `createMapAgent`; `DEFAULT_TOOLS` and `BASE_SYSTEM_PROMPT` cover the most common customizations (see the examples above).

For the complete, always-current list of exports — factories, tool-registry helpers, state introspection, the classifier, and all types — see the [API reference](https://docs.tomtom.com/maps-sdk-js/reference).

## Dependencies

| Type | Package | Purpose |
|---|---|---|
| Peer | `@tomtom-org/maps-sdk@>=1.0.0-rc.0 <1.0.0` | TomTom Maps SDK (types, services, map modules) — its 1.0.0 release candidates |
| Peer | `@tomtom-org/maps-sdk-plugin-map-theme@>=0.3.0` | Theming the map from a few colours or an image in `setMapStyling` |
| Peer | `ai@^6` | Vercel AI SDK (ToolLoopAgent, tool types) |
| Peer | `zod@^4` | Schema validation |
| Peer | `maplibre-gl@^6` | Map rendering engine |
| Peer | `@turf/turf@^7` | Geospatial math (distance, bbox, bearing) used by the data tools |
| Peer | `chart.js@^4` | Chart rendering for `analyseData` outputs |
| Peer | `h3-js@^4` | H3 hexagonal grid for `processData` coverage / hexgrid visualizations |

## References

- [Agent Toolkit guides](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/overview) — full documentation set:
    - [How it works](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/how-it-works) — two-phase pipeline (classifier + tool loop), prompt assembly, observability
    - [Tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/tools) — per-tool reference
    - [State](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/state) — per-slice reference, entry modes, custom slices
    - [Customizing tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/customizing-tools) — add, replace, remove, or start from a blank slate
    - [Code generation](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation) — `analyseData` / `processData` / `createTracker` / `clusterIncidents` / `executeMaplibreCode` (threat model included)
    - [Scope-aware data tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/scope-aware-data-tools) — per-turn scope mechanism
    - [Bring your own data](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/byod) — ingest customer GeoJSON layers
- [AI SDK v6 documentation](https://ai-sdk.dev/)
- [TomTom Maps SDK documentation](https://docs.tomtom.com/maps-sdk-js)
- [Example application](https://docs.tomtom.com/maps-sdk-js/examples/map-traffic-agent-react) — full chat interface implementation

## License

See `LICENSE.txt`.
