# Agent Toolkit Plugin

This plugin is a headless conversational agent that gives large language models tool-based control over a [TomTom Map](https://docs.tomtom.com/maps-sdk-js/guides/map/tomtom-map) and TomTom location services. It's built on [Vercel AI SDK v7](https://ai-sdk.dev/).

> **Public preview.** This plugin is in [Public Preview](https://docs.tomtom.com/legal/public-preview) until its 1.0.0 release.

The plugin has no UI, so you bring your own chat interface. It bundles no LLM provider, so you supply any AI SDK-compatible model.

> **Full documentation**, with guides, architecture diagrams and tutorials, lives at [docs.tomtom.com](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/overview).

## Design principles

1. **Client-side only** — the agent runs on AI SDK's `DirectChatTransport` and `ToolLoopAgent`. You provide the model and need no server infrastructure.
2. **No bundled LLM provider** — you supply any AI SDK-compatible `LanguageModel`, which keeps the package provider-agnostic.
3. **Token-efficient** — the plugin summarizes every service response before it reaches the LLM. The full GeoJSON stays in `ToolState`.
4. **Lazy module initialization** — the plugin creates each map module on first use and caches it in state.
5. **Coordinate convention** — the plugin always uses and enforces `[longitude, latitude]`, the GeoJSON standard's order.
6. **Task-oriented tools** — tool boundaries follow user tasks, not the SDK's API surface, so one prompt maps to one tool call.

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

For a full working app, see the [traffic agent example](https://docs.tomtom.com/maps-sdk-js/examples/map-traffic-agent-react).

## Tools reference

The plugin ships a `DEFAULT_TOOLS` registry that covers search, routing, traffic, reachable areas, BYOD GeoJSON, base-map control, MapLibre access and code-generated analysis. The agent gets every tool in it by default, and you can remove or replace each one through the [`tools` option](#composing-tool-sets). The [Agent Toolkit guide](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/tools) has the full per-tool reference.

### Location & search

| Tool | Description |
|---|---|
| `locatePlace` | Resolve a location string (landmark, city, address) to a place; optionally stage as a waypoint |
| `reverseGeocode` | Convert `[longitude, latitude]` coordinates to an address |
| `discoverPlaces` | Search for places by text query or POI category within an area |
| `getPOICategoryCodes` | Look up TomTom POI category codes from natural-language names |
| `getCurrentLocation` | Get the user's physical GPS location from the browser |
| `getViewport` | Get the current map center, zoom and bounding box |

### Routing & reachable areas

| Tool | Description |
|---|---|
| `setRoute` | Calculate or recalculate a route — provide `locations` (waypoints), `parameters` (route options) or both |
| `addWaypointsToRoute` | Extend the current route — prepend a new origin, append a new destination, and/or insert intermediate stops |
| `removeWaypointsFromRoute` | Remove one or more waypoints by index from the current route |
| `replaceWaypointInRoute` | Overwrite a single waypoint of the current route in place — origin, destination or by index |
| `getCurrentWaypoints` | Get the staged waypoint slots (origin, stops, destination) |
| `startRouteMonitor` | Recalculate an already-calculated route on a cadence (default 60 s) so its live-traffic delays stay current |
| `stopRouteMonitor` | Stop recalculating a route. The dataset keeps its last data |
| `findReachableAreas` | Calculate isochrone/isodistance polygons from one or more origins (in private preview, so the API key needs Calculate Reachable Range access) |

### Traffic

| Tool | Description |
|---|---|
| `getTrafficIncidents` | Fetch traffic incidents within an area (viewport, named place, route corridor, polygon, IDs). By default, the dataset keeps refreshing |
| `setTrafficIncidentsMonitor` | Turn background refreshing of an already-loaded incidents dataset on or off |
| `clusterIncidents` | Group loaded incidents into hotspots (DBSCAN) with road and category labels, delay totals and trends |
| `focusIncidents` | Highlight a subset of incidents by id (`analyseData` can pick them by category or severity) on the map and dim the rest |
| `getTrafficAreaAnalytics` | Fetch historical traffic analytics (speed, congestion, travel time) for an area |

### Trackers

| Tool | Description |
|---|---|
| `createTracker` | Watch loaded datasets with generated code and log an alert when its condition turns true (e.g. an incident near a hospital) |
| `getTrackers` | List the active trackers and whether each is firing |
| `getTrackerHistory` | Read the alerts and events trackers have logged, for one tracker or since a time |
| `clearTracker` | Stop a tracker. The datasets it watched stay |

### Bring-your-own-data (BYOD)

| Tool | Description |
|---|---|
| `addByodSource` | Ingest a customer-authored GeoJSON source (URL or inline `FeatureCollection`) and profile its shape. The dataset has no layers and renders nothing until the agent sets them with `setByodLayers` |
| `setByodLayers` | Restyle a BYOD dataset by replacing its MapLibre layers (type and data-driven paint), using the dataset's data `profile` |
| `updateByodDisplay` | Show, hide or clear BYOD layers on the map |

> See the [Bring your own data](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/byod) guide for ingestion patterns, the visibility lifecycle and how BYOD datasets feed into `analyseData` / `processData`.

### Unified data tools — scope-aware code generation

| Tool | Description |
|---|---|
| `analyseData` | Aggregate or chart datasets (`places`, `routes`, `incidents`, `geometries`, `trafficAreaAnalytics`, `byod`) with dynamic JS. The scope the classifier emits narrows the schema each turn |
| `processData` | Transform datasets, with dynamic JS, into new `places`, `placeConnections`, `geometries`, `byod` or a `fitOnMap` camera move |
| `monitorAnalysis` | Start or stop recomputing an `analyseData` analysis whenever its source datasets change |

`executeMaplibreCode` runs arbitrary MapLibre JS against the live `Map` instance, an escape hatch for custom layers, animations and raster overlays. Its code runs in your page with no sandbox, so it's not in `DEFAULT_TOOLS`. Add it with `tools: { executeMaplibreCode: createExecuteMaplibreCodeTool() }` only where you trust the model.

> See [Code generation](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation) for the injected identifiers, output contracts and threat model, and [Scope-aware data tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/scope-aware-data-tools) for how the per-turn classifier scope keeps the prompt small.

`analyseData`, `processData`, `createTracker` and `clusterIncidents` code is **isolated in the browser, or not run**, unless you opt into `codeExecution.allowMainThreadFallback`. It runs in a Web Worker inside a sandboxed, opaque-origin iframe with no DOM or network access, terminable on timeout. The SDK lazily loads its own bundled turf and h3 for the worker, so a page without a Content Security Policy needs no configuration. A page with one must allow what the sandbox needs, which the code-generation guide lists. The environment decides where the code runs. The browser isolates it, while Node and SSR always run it on the main thread. That boundary has no equivalent there, so the protection is defense-in-depth only. The optional `codeExecution` tunes the browser run:

```typescript
const agent = createMapAgent(map, {
    model,
    codeExecution: { timeoutMs: 5000 }, // wall-clock budget per isolated run (default 10000)
});
```

> **Experimental.** The `e2e-tests/` suite verifies the isolation boundary (CSP egress-block, worker termination, opaque-origin isolation) and runs in CI as a dedicated job. If the iframe can't start, the code doesn't run. The tool returns an error to the model, and a call 30 seconds or more later tries again. `agent.getCodeExecutionMode()` reports where the code runs, and `codeExecution.allowMainThreadFallback: true` runs it in the page, not isolated, and does not retry the iframe. The worker bundles `turf`, `h3` and `routeUtils`, so that code, route slicing included, runs fully in the browser. See the [code-generation guide](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation#data-tool-execution-isolation-experimental).

### Map display

| Tool | Description |
|---|---|
| `updatePlacesDisplay` | Show, hide or restyle place datasets on the map |
| `updateRoutesDisplay` | Show, hide or swap route datasets, switch the highlighted alternative or fit the camera |
| `updateWaypointsDisplay` | Show staged waypoint markers without the route line |
| `updateTrafficAreaAnalyticsDisplay` | Show, hide or swap traffic-area-analytics datasets |
| `clearMap` | Remove displayed places, routes, BYOD layers or all features |

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
| `setMapStyling` | Set or reset, by knob id, what the base map shows and how it looks. That covers layer groups such as 3D buildings, the built-in POI icons and their categories, the live traffic overlays and their filters, the hillshade and 3D terrain, sizes, colours, map presets, or a whole theme from a few colours or an image. It also sets the look of every layer the agent drew: places, routes and their sections, polygons, reachable areas, area analytics and fetched incidents. The classifier scope lists only the knob families a turn touches |

### MapLibre direct access

| Tool | Description |
|---|---|
| `getMapStyleLayers` | List MapLibre layer IDs with their paint/layout properties |
| `setLayerProperties` | Set MapLibre paint (colors, widths, opacity) and layout (visibility, text, sizes) properties on named layers |

### State & recall

| Tool | Description |
|---|---|
| `recallState` | Read session state: a snapshot of the places, routes and ranges datasets with the map style and layer configs, one kind's datasets (`places`, `routes`, `ranges`, `geometries`, `byod`, …), or one dataset by `{ kind, id }` |
| `setDatasetMode` | Switch a slice between `multiple` (default) and `single` dataset modes |
| `resetState` | Reset every state slice and the map style to their defaults |

### Utilities

| Tool | Description |
|---|---|
| `calculateBBox` | Compute a bounding box from GeoJSON features or tool results |
| `clarifyIntent` | Ask the user to resolve a genuinely ambiguous or missing input, as a few numbered choices plus a free answer |
| `help` | List available capabilities in summary or searchable detail mode |

## Customization

> See [Customizing tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/customizing-tools) for the full walkthrough. It covers registry resolution, removing or replacing defaults, adding scopable custom tools and starting from a blank slate.

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

    // Per-kind dataset config. `enabled: false` removes the kind from the tool surface
    // (drops its recall/display/fetch tools and the kind from analyseData/processData scope).
    // `datasetMode` switches the slice between 'multiple' (default) and 'single' (latest only).
    datasets: {
        routes: { datasetMode: 'single' },
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

The plugin merges the `tools` option with the built-in defaults. To exclude a tool, set it to `false`.

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

To define custom tools type-safely, use `satisfies`:

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

> See the [State](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/state) guide for a per-slice deep dive, `datasetMode` semantics (`multiple` vs `single`), inspecting state from your application and adding custom slices.

`ToolState` holds one slice per feature area. Each slice manages lazily initialized map modules and an append-only history of the results the session produces. The built-in slices are:

- `PlacesState` — place / geometry dataset history
- `RoutingState` — route history, planning waypoint slots, route parameters
- `RangeState` — reachable-range datasets
- `CustomGeometriesState` — derived polygon datasets produced by `processData` (union, difference, h3-coverage, …)
- `BYODState` — bring-your-own-data GeoJSON layer datasets
- `BaseMapState` — viewport, style, language, raw `mapLibreMap`
- `TrafficTilesState` — visibility of the real-time traffic flow and incident tile overlays
- `TrafficAreaAnalyticsState` — historical traffic-area-analytics datasets and per-dataset visualisation
- `TrafficIncidentsState` — fetched incident datasets, registered analyses, focused subsets and the optional polling monitor
- `MapPOIsState` — POI category visibility and filters

`createMapAgent` constructs the built-in slices. To add custom slices, define an interface that extends `ToolState` and pass it as the type parameter. You provide only the custom fields:

```typescript
interface MyState extends ToolState {
    fleet: FleetState;
}

const agent = createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});

agent.state.fleet;   // FleetState — custom slice
agent.state.places;  // PlacesState — append-only history of place datasets
```

## Privacy

> See the [What the agent sends, and where](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/what-the-agent-sends) guide for the full list.

- **What reaches your model provider**: every message and the system prompt, plus the classifier's copy of earlier messages. By default, that copy holds up to eight messages of 300 characters each, and `classifier: false` turns it off. Tool results go too, including addresses, coordinates, the viewport, the device location, `analyseData` and `processData` output over your BYOD data, and up to 200 events per tracker.
- **The provider is your processor**: sign a DPA with it and pick an EEA region where it offers one.
- **What stays in memory**: `agent.state`, until the `resetState` tool or `agent.destroy()` clears it. Nothing goes to browser storage. Chat history is yours, so erasing a user's data means clearing it and calling `agent.destroy()`.
- **To send less**: remove tools (`getCurrentLocation: false`), turn off the classifier or replace a tool with one that returns less.

## Intent classifier

The intent classifier is an optional per-turn optimization. It picks which tools the LLM sees, which cuts noise and improves accuracy. The [How it works](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/how-it-works) guide covers the full two-phase pipeline (classification, then the tool loop), prompt assembly and observability hooks.

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

The plugin builds the classifier prompt on the fly from each tool's `classificationPrompt` and `relatedTools` metadata, so the prompt stays in sync when you add or rename tools.

## System prompt

The built-in `BASE_SYSTEM_PROMPT` covers identity, a capability summary, scope/rejection rules, response formatting, data-confidence rules, tool-execution guidance and session-state conventions. Per-tool mechanics (coordinate order, location-reference routing, etc.) live in the tool descriptions and the classifier prompt, not here.

`systemPrompt` accepts **either** a full replacement string **or** a section-overrides object (`Partial<Record<SystemPromptSection, string>>`). Sections you omit keep their defaults. For a section you override, you supply only its body, and the plugin adds the heading:

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
    systemPromptSuffix: 'Never expose internal dataset ids to the user.',
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

To add logging, analytics or custom behavior around an existing tool, wrap it. `DEFAULT_TOOLS` types
each value as a `ToolDefinition`: `locatePlace` is a static `ToolEntry`, while builders such as
`discoverPlaces` are functions of `ToolBuildOptions` that return one.

```typescript
import { DEFAULT_TOOLS, createMapAgent, type ToolEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

const locatePlace = DEFAULT_TOOLS.locatePlace as ToolEntry;

const wrappedLocatePlace: ToolEntry = {
    ...locatePlace,
    execute: async (input, state, options) => {
        console.log('[Analytics] Locate:', input);
        const result = await locatePlace.execute(input, state, options);
        console.log('[Analytics] Result:', result);
        return result;
    },
};

createMapAgent(map, { model, tools: { locatePlace: wrappedLocatePlace } });
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

`createMapAgent` returns a `ToolLoopAgent` (usable directly with `DirectChatTransport`) with three extra properties:

```typescript
const agent = createMapAgent(map, { model });

agent.state;                  // Live state — typed as CS when custom state is provided, ToolState otherwise
agent.getCodeExecutionMode(); // Where the code-generation tools run: not-started, iframe-worker, unavailable or main-thread
agent.destroy();              // Reset all state slices (call on unmount)
```

## Public API exports

The main entry point is `createMapAgent`. `DEFAULT_TOOLS` and `BASE_SYSTEM_PROMPT` cover the most common customizations, as the examples above show.

For the complete, always-current list of exports, including factories, tool-registry helpers, state introspection, the classifier and all types, see the [API reference](https://docs.tomtom.com/maps-sdk-js/reference).

## Dependencies

| Type | Package | Purpose |
|---|---|---|
| Peer | `@tomtom-org/maps-sdk@^1.0.0-rc.4` | TomTom Maps SDK (types, services, map modules), from 1.0.0-rc.4 through every 1.x release |
| Peer | `@tomtom-org/maps-sdk-plugin-map-theme@>=0.3.0` | Theming the map from a few colours or an image in `setMapStyling` |
| Peer | `ai@^7.0.143` | Vercel AI SDK (ToolLoopAgent, tool types) |
| Peer | `zod@^4.6.7` | Schema validation |
| Peer | `maplibre-gl@^6.15.0` | Map rendering engine |
| Peer | `@turf/turf@^7` | Geospatial math (distance, bbox, bearing) used by the data tools |
| Peer | `chart.js@^4` | Chart rendering for `analyseData` outputs |
| Peer | `h3-js@^4` | H3 hexagonal grid for `processData` coverage / hexgrid visualizations |

## References

- [Agent Toolkit guides](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/overview) — full documentation set:
    - [How it works](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/how-it-works) — two-phase pipeline (classifier + tool loop), prompt assembly, observability
    - [Tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/tools) — per-tool reference
    - [State](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/state) — per-slice reference, dataset modes, custom slices
    - [Customizing tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/customizing-tools) — add, replace, remove or start from a blank slate
    - [Code generation](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation) — `analyseData` / `processData` / `createTracker` / `clusterIncidents` / `executeMaplibreCode` (threat model included)
    - [Scope-aware data tools](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/scope-aware-data-tools) — per-turn scope mechanism
    - [Bring your own data](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/byod) — ingest customer GeoJSON layers
- [AI SDK v7 documentation](https://ai-sdk.dev/)
- [TomTom Maps SDK documentation](https://docs.tomtom.com/maps-sdk-js)
- [Example application](https://docs.tomtom.com/maps-sdk-js/examples/map-traffic-agent-react) — full chat interface implementation

## License

See `LICENSE.txt`.

## Security

To report a security vulnerability, follow our [security policy](https://github.com/tomtom-international/maps-sdk-js/security/policy), which keeps it private.
