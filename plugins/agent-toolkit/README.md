# TomTom Maps SDK - Agent Toolkit Plugin

A headless conversational agent that gives Large Language Models tool-based control over a [TomTom Map](https://developer.tomtom.com/) and TomTom location services, powered by [Vercel AI SDK v6](https://ai-sdk.dev/).

No UI is included — bring your own chat interface. No LLM provider is bundled — supply any AI SDK-compatible model.

> **Full documentation** — guides, architecture diagrams, and tutorials are available at [docs.tomtom.com](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit).

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
import { DirectChatTransport } from 'ai/react';
import { useChat } from 'ai/react';

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

The plugin ships 53 tools organized into five categories. All tools are included by default and can be individually removed or replaced via the [`tools` option](#composing-tool-sets).

### Service tools — fetch data from TomTom APIs

| Tool | Description |
|---|---|
| `locatePlace` | Resolve a location string (landmark, city, address) to a place; optionally stage as a waypoint |
| `reverseGeocode` | Convert `[longitude, latitude]` coordinates to an address |
| `discoverPlaces` | Search for places by text query or POI category within an area |
| `setRouteLocations` | Set waypoints by resolving location queries and calculate a route |
| `setRouteParameters` | Configure route options (alternatives, avoidances, departure time) and recalculate |
| `addStopToRoute` | Insert a stop at the optimal position in the current route |
| `removeStopFromRoute` | Remove a stop by index from the current route |
| `getPOICategoryCodes` | Look up TomTom POI category codes from natural-language names |
| `getTrafficIncidents` | Fetch traffic incidents by bounding box or IDs |
| `getTrafficAreaAnalytics` | Fetch historical traffic analytics (speed, congestion, travel time) for an area |
| `queryTrafficAnalytics` | Query cached analytics data or check what is currently displayed |
| `searchAlongRoute` | Search for POIs along a calculated route, ranked by detour cost |
| `findReachableArea` | Calculate isochrone/isodistance polygons from a point |

### TomTom Map tools — render and inspect map state

| Tool | Description |
|---|---|
| `showPlaces` | Display the most recent place results as markers on the map |
| `showRoute` | Render the most recently calculated route and fit the camera |
| `showTrafficAreaAnalytics` | Visualize traffic analytics as hexgrid, heatmap, or tiles |
| `showWaypoints` | Display staged waypoint markers without the route line |
| `clearMap` | Remove displayed places, routes, or all features |
| `getShownPlaces` | List places currently displayed on the map |
| `getShownRoutes` | List routes currently rendered on the map |
| `getShownWaypoints` | List waypoint markers currently shown |
| `getShownRouteSections` | List sections (toll, country, motorway, etc.) of the shown route |
| `getShownRouteTrafficIncidents` | List traffic incidents overlaid on the shown route |
| `getShownIncidents` | List real-time incidents visible in the current viewport |
| `getStandardMapStyles` | List available standard map style presets |
| `setMapStandardStyle` | Switch map style (light, dark, satellite, driving, etc.) |
| `setRouteTheme` | Color the route line and waypoint icons |
| `setLanguage` | Change the language for map labels and API responses |
| `toggleBaseMapLayerGroups` | Show/hide named layer groups (buildings3D, roadLabels, water, etc.) |
| `togglePOIs` | Show/hide built-in map POI icons with optional category filtering |
| `toggleTrafficFlow` | Toggle real-time traffic flow overlay |
| `toggleTrafficIncidents` | Toggle real-time traffic incident markers |
| `fitRouteSection` | Fit the camera to a specific route section by type and ID |

### MapLibre tools — direct map engine access

| Tool | Description |
|---|---|
| `flyTo` | Move the camera to a position or bounding box |
| `getViewport` | Get current map center, zoom, and bounding box |
| `getMapStyleLayers` | List MapLibre layer IDs with their paint/layout properties |
| `setLayoutProperties` | Set MapLibre layout properties on named layers |
| `setPaintProperties` | Set MapLibre paint properties (colors, widths, opacity) on named layers |
| `setPitchBearing` | Tilt (pitch) and/or rotate (bearing) the camera |
| `zoomInOrOut` | Adjust the zoom level by a delta |
| `executeMaplibreCode` | Execute arbitrary MapLibre JS code for maximum flexibility |

### State tools — recall session history

| Tool | Description |
|---|---|
| `recallPlaces` | Retrieve the history of place lookups from this session |
| `recallRoutes` | Retrieve previously calculated routes from this session |
| `recallRanges` | Retrieve stored reachable range results |
| `getCurrentWaypoints` | Get the staged waypoint slots (origin, stops, destination) |

### Utility tools — pure computation helpers

| Tool | Description |
|---|---|
| `calculateBBox` | Compute a bounding box from GeoJSON features or tool results |
| `formatDistance` | Format meters into a human-readable string (e.g. "2.5 km") |
| `formatDuration` | Format seconds into a human-readable string (e.g. "1 h 30 min") |
| `getCurrentLocation` | Get the user's physical GPS location from the browser |
| `getRouteProgress` | Get the position along the route at a given time or distance |
| `getSectionProgress` | Get the distance and travel time for route sections by type |
| `getSectionBBox` | Get the bounding box of a specific route section |
| `help` | List available capabilities in summary or searchable detail mode |

## Customization

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
        relatedTools: ['showPlaces'],
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

`ToolState` is organized by feature area. Each slice manages lazy-initialized map modules and an append-only history of results produced during the session. Built-in slices: `PlacesState`, `RoutingState`, `BaseMapState`, `TrafficState`, `RangeState`, `MapPOIsState`.

Create state manually for advanced scenarios:

```typescript
import { createToolState, type ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Base state
const state = createToolState(map);

// With custom slices
const state = createToolState(map, {
    fleet: new FleetState(),
    weather: new WeatherCache(),
});
```

Custom slices are merged alongside built-in state. When using `createMapAgent`, define an interface extending `ToolState` and pass the type parameter — only custom slices need to be provided:

```typescript
interface MyState extends ToolState {
    fleet: FleetState;
}

const agent = createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});

agent.state.fleet;   // FleetState — custom slice
agent.state.places;  // PlacesState — built-in slice
```

## Intent classifier

The intent classifier is an optional per-turn optimization that selects which tools the LLM sees, reducing noise and improving accuracy.

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

### Manual agent setup

Bypass `createMapAgent` for maximum control:

```typescript
import { ToolLoopAgent, stepCountIs, tool } from 'ai';
import { createToolState, DEFAULT_TOOLS, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

const state = createToolState(map);
const { help, ...toolEntries } = DEFAULT_TOOLS; // customize as needed

// Convert ToolEntry records to AI SDK tools (bind state)
const tools = Object.fromEntries(
    Object.entries(toolEntries).map(([name, entry]) => [
        name,
        tool({
            description: entry.description,
            inputSchema: entry.inputSchema,
            outputSchema: entry.outputSchema,
            execute: async (input) => entry.execute(input, state),
        }),
    ]),
);

const agent = new ToolLoopAgent({
    model: openai('gpt-4o'),
    tools,
    instructions: BASE_SYSTEM_PROMPT + '\n\nCustom instructions...',
    stopWhen: stepCountIs(15),
});
```

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
        setRouteLocations: false,
        setRouteParameters: false,
        addStopToRoute: false,
        removeStopFromRoute: false,
        showRoute: false,
        searchAlongRoute: false,
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
        toggleBaseMapLayerGroups: false,
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
export { createMapAgent } from './create-map-agent';

// State
export { createToolState, type StateSlice } from './state';

// System prompt
export { BASE_SYSTEM_PROMPT, buildSystemPrompt } from './system-prompt';

// Tool registry
export { DEFAULT_TOOLS, TOOL_NAMES, type ToolName } from './tools';

// Tool composition
export { resolveTools } from './resolve-tools';

// Classifier
export {
    type ClassificationResult,
    classifyUserIntent,
    createDefaultClassifier,
    extractLastUserText,
} from './utils/intent-classifier';

// Types
export type {
    Classifier,
    ClassifierContext,
    MapAgentInstance,
    MapAgentOptions,
    ToolEntry,
    ToolMetadata,
    ToolNameHint,
    ToolState,
} from './types';
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

- [AI SDK v6 documentation](https://ai-sdk.dev/)
- [TomTom Maps SDK documentation](https://developer.tomtom.com/)
- [Engineering guidelines](./ENGINEERING-GUIDELINES.md) — tool design standards, state management, system prompt structure
- [Example application](../../examples/map-chat-agent) — full chat interface implementation
