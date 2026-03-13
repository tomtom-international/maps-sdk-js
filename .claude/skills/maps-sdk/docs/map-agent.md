# Map Agent Reference

Build a conversational AI agent that controls a TomTom map through natural language. The map-agent plugin gives LLMs tool-based access to search, routing, traffic, and map display — users chat and the map responds.

## Install

```bash
npm i @tomtom-org/maps-sdk-plugin-ai-agent
```

**Peer dependencies:** `ai@^6` (Vercel AI SDK), `zod@^3.23`, plus an LLM provider package (e.g. `@ai-sdk/azure`, `@ai-sdk/openai`, `@ai-sdk/anthropic`).

## Imports

```ts
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-ai-agent';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createAzure } from '@ai-sdk/azure';      // or any AI SDK provider
```

---

## Create the agent

```ts
const azure = createAzure({
    resourceName: AZURE_RESOURCE_NAME,   // your Azure OpenAI resource
    apiKey: AZURE_API_KEY,
});

const map = new TomTomMap({
    mapLibre: { container: 'map', center: [4.9, 52.4], zoom: 12 },
});

const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),  // REQUIRED — any Vercel AI SDK model
    maxSteps: 10,                            // tool calls per turn (default: 10)
});
```

The agent comes with 30+ built-in tools covering search, geocoding, routing, map display, traffic, and appearance. No manual tool wiring needed.

---

## Use with React (AI SDK `useChat`)

```ts
import { useChat, DirectChatTransport } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit } = useChat({
    transport: new DirectChatTransport({ agent: agent.agent }),
});
```

---

## Streaming (non-React)

```ts
const result = await agent.stream({
    messages: [{ role: 'user', content: 'Find coffee shops near Amsterdam Centraal' }],
});

for await (const delta of result.textStream) {
    process.stdout.write(delta);
}
```

---

## Customization

### Add custom tools

```ts
const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),
    tools: {
        getWeather: myWeatherTool,       // add a new tool
        searchPlaces: myCustomSearch,    // override a built-in tool
        setMapStyle: false,              // disable a built-in tool
    },
});
```

### Custom system prompt

```ts
const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),
    systemPromptSuffix: 'You are a friendly travel assistant. Always suggest nearby restaurants.',
});
```

### Start from scratch (no default tools)

```ts
const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),
    includeDefaultTools: false,
    tools: { geocode: myGeocodeTool, searchPlaces: mySearchTool },
});
```

---

## Auto-classification (token optimization)

Reduces token usage ~30% by selecting only the tools needed for each query:

```ts
const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),
    autoClassify: {
        model: azure.chat(AZURE_DEPLOYMENT_ID),  // can use same or cheaper deployment
        onResult: (classification) => {
            console.log('Tool groups:', classification?.groups);
        },
    },
});
```

Tool groups: `routing`, `routing-stops`, `routing-analysis`, `search`, `appearance`, `advanced-appearance`, `full`

---

## Access agent state

```ts
// Most recent service results
agent.context.services.lastPlaces;     // last search results
agent.context.services.lastRoutes;     // last calculated routes
agent.context.services.lastWaypoints;  // last geocoded waypoints

// Full history
agent.context.services.searchResultsHistory;
agent.context.services.routesHistory;

// Manual tool selection (bypass auto-classify)
agent.setActiveTools(['geocode', 'searchPlaces', 'showPlaces', 'flyTo']);
```

---

## Cleanup

```ts
agent.destroy();   // releases map modules and state
```

---

## Built-in tools summary

| Category | Tools |
|----------|-------|
| **Location services** | `geocode`, `reverseGeocode`, `searchPlaces`, `calculateRoute`, `getPOICategoryCodes` |
| **Map display** | `showPlaces`, `showRoute`, `showWaypoints`, `clearMap`, `flyTo`, `fitBounds`, `fitRouteSection`, `getViewport` |
| **Map appearance** | `setMapStyle`, `setLanguage`, `toggleLayers`, `togglePOIs`, `toggleTrafficFlow`, `toggleTrafficIncidents`, `setPitchBearing` |
| **Route management** | `addStopToRoute`, `removeStopFromRoute` |
| **Utilities** | `formatDistance`, `formatDuration`, `getRouteProgress`, `getSectionProgress`, `calculateBBox` |
| **Meta** | `searchTools` — LLM discovers tools by keyword |

---

## Gotchas

- **Client-side only** — the agent runs in the browser; you supply the LLM provider
- **Vercel AI SDK v6** required — earlier versions won't work
- All tools return `{ error: string }` on failure instead of throwing, so the LLM can explain errors naturally
- Tool results are token-summarized (e.g., search returns count + first 10 items, not full GeoJSON)
- Map modules are lazy-initialized on first tool use and cached for reuse
