# TomTom Maps SDK - Map Agent Plugin

**Status: Core Implementation Complete ✅**

A conversational map agent plugin that gives Large Language Models (LLMs) tool-based control over TomTom Maps SDK using Vercel AI SDK v6.

## Overview

This plugin creates a headless conversational agent that can:
- Search for places, businesses, and points of interest
- Geocode addresses and reverse geocode coordinates
- Calculate driving routes between locations
- Display results on an interactive map  
- Control map appearance (styles, language, traffic, POIs)
- Navigate the map camera

## Implementation Status

### ✅ Completed
- [x] Package scaffolding (package.json, tsconfig, vite, vitest configs)
- [x] Type definitions (MapAgentState, MapAgentOptions, MapAgent interface)
- [x] State management (createState, resetState helpers)
- [x] Utility helpers (summarize functions for token-efficient LLM responses)
- [x] Data tools (4 tools):
  - `geocode` - Convert addresses to coordinates
  - `reverseGeocode` - Convert coordinates to addresses  
  - `searchPlaces` - Search for places/POIs
  - `calculateRoute` - Calculate driving routes
- [x] Map tools (11 tools):
  - `showPlaces` - Display search results as markers
  - `showRoute` - Display calculated routes
  - `clearMap` - Remove displayed features
  - `flyTo` - Move camera to location
  - `fitBounds` - Fit camera to all data
  - `toggleTraffic` - Show/hide traffic flow
  - `togglePOIs` - Show/hide POI icons
  - `setMapStyle` - Change visual theme
  - `setLanguage` - Change label language
  - `getViewport` - Get current viewport info
  - `toggleLayers` - Control base map layers
- [x] Tool barrel export (createMapToolSet function)
- [x] System prompt (comprehensive instructions for LLM)
- [x] Main factory (createMapAgent function)
- [x] Type errors resolved (switched from `tool()` to `dynamicTool()`)
- [x] Build verified (generates dist bundle successfully)
- [x] Example application ([examples/map-chat-agent](../../examples/map-chat-agent))

### 🚧 Next Steps
- [ ] Add integration tests for createMapAgent factory
- [ ] Test with real LLM providers (OpenAI, Anthropic, etc.)
- [ ] Performance testing with large datasets

## Architecture

```
MapAgent (created by createMapAgent)
├── ToolLoopAgent (AI SDK) - Manages multi-step tool execution
├── MapToolSet (15 tools using dynamicTool)
│   ├── Data Tools (4) - Call TomTom services, return summarized data
│   └── Map Tools (11) - Manipulate map display
├── System Prompt - Teaches LLM how to use tools
└── MapAgentState - Retains GeoJSON data + cached modules
```

### Tool Implementation

All tools use `dynamicTool()` from AI SDK (not `tool()`) with the following pattern:

```typescript
import { dynamicTool } from 'ai';
import { z } from 'zod';

export function createTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    const schema = z.object({
        param: z.string().describe('Parameter description'),
    });

    return dynamicTool({
        description: 'Tool description for LLM',
        inputSchema: schema, // Note: inputSchema, not parameters
        execute: async (params) => {
            const { param } = params as z.infer<typeof schema>;
            // Implementation
        },
    });
}
```

**Key points:**
- Use `dynamicTool()` not `tool()` 
- Property is `inputSchema` not `parameters`
- Add explicit return type: `ReturnType<typeof dynamicTool>`
- Type-cast params inside execute: `params as z.infer<typeof schema>`

## Files Created

**Configuration:**
- `package.json` - Dependencies: ai@^6.0.0, zod@^3.23.0  
- `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`
- `LICENSE.txt`

**Source (`src/`):**
- `index.ts` - Public API barrel export
- `types.ts` - TypeScript interfaces
- `state.ts` - State management  
- `system-prompt.ts` - LLM instructions
- `create-map-agent.ts` - Main factory function
- `utils/summarize.ts` - Token-efficient formatters
- `tools/*.ts` - 15 tool implementations
- `tools/index.ts` - Tool barrel export

## Usage

### Installation

Install the plugin and required peers in your app:

```bash
pnpm add @tomtom-org/maps-sdk @tomtom-org/maps-sdk-plugin-ai-agent ai zod maplibre-gl
```

Then install at least one AI provider package (for example OpenAI, Azure, or Anthropic):

```bash
pnpm add @ai-sdk/openai
```

Note: `ai` is a peer dependency of this plugin, so it must be installed in the consuming project.

### Basic Usage

```typescript
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-ai-agent';
import { openai } from '@ai-sdk/openai';

const map = new TomTomMap({
  mapLibre: { container: 'map', center: [4.9, 52.4], zoom: 10 }
});

const mapAgent = createMapAgent(map, {
  model: openai('gpt-4o'),
  maxSteps: 10,
});

// Execute a query
const result = await mapAgent.agent.generate({
  messages: [{ role: 'user', content: 'Find coffee shops near Dam Square' }]
});

console.log(result.text); // Agent's response
```

See [examples/map-chat-agent](../../examples/map-chat-agent) for a complete chat interface implementation.

### Customization Options

```typescript
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-ai-agent';

const agent = createMapAgent(map, {
  model: openai('gpt-4o'),
  
  // Customize system prompt
  systemPromptSuffix: 'Always use metric units and respond in Spanish.',
  
  // Unified tool configuration with autocomplete
  tools: {
    // Exclude default tools (set to false)
    setMapStyle: false,
    setLanguage: false,
    toggleLayers: false,
    
    // Override default tool (provide replacement)
    searchPlaces: createCustomSearchTool(context),
    
    // Add custom tools (new keys)
    getWeather: createWeatherTool(context),
    findParking: createParkingTool(context)
  }
});
```

## Advanced Usage

**Note:** Most users should use `createMapAgent` with options. The exports below are for advanced scenarios.

### Token Optimization

The plugin includes comprehensive token optimization features to minimize costs and latency:

#### 1. Prompt Caching (90% savings on cached content)

```typescript
import { anthropic } from '@ai-sdk/anthropic';

const agent = createMapAgent(map, {
  model: anthropic('claude-3-5-sonnet-20241022'),
  promptCaching: true  // Cache system prompt + tool definitions
});

// First request: Normal cost
// Subsequent requests within ~5min: ~10x cheaper
```

**Provider support**: Anthropic Claude only (as of Feb 2026)

#### 2. Conversation History Management

```typescript
import { truncateHistory, estimateTokenCount } from '@tomtom-org/maps-sdk-plugin-ai-agent';

// In your chat component - keep last 10 exchanges
const truncated = truncateHistory(messages, {
  maxMessagePairs: 10,
  preserveSystemMessages: true
});

// Monitor token usage
const tokens = estimateTokenCount(messages);
if (tokens > 100000) {
  messages = truncateHistory(messages, { maxMessagePairs: 5 });
}

// With React useChat
const { messages } = useChat({
  transport: new DirectChatTransport({ agent: mapAgent.agent }),
  onSubmit: () => truncateHistory(messages, { maxMessagePairs: 15 })
});
```

#### 3. Token Budget per Tool Response

```typescript
const agent = createMapAgent(map, {
  model: openai('gpt-4o'),
  toolResponseBudget: 1000  // Max 1000 tokens per tool response
});

// Or wrap specific tools manually
import { withTokenBudget, createMapToolSet, createState } from '@tomtom-org/maps-sdk-plugin-ai-agent';

const state = createState();
const tools = createMapToolSet({ map, state });

const limitedSearchTool = {
  ...tools.searchPlaces,
  execute: withTokenBudget(tools.searchPlaces.execute, {
    maxTokens: 500,
    onExceed: 'truncate',
    preserveFields: ['count']
  })
};
```

#### 4. Geometry Simplification (for custom tools)

```typescript
import { simplifyRoutes, estimateCoordinateCount } from '@tomtom-org/maps-sdk-plugin-ai-agent';

// Default tool responses don't include geometry (only distance/duration)
// But if you're building custom tools that send GeoJSON to the LLM:
const before = estimateCoordinateCount(routes);  // e.g., 2000 coords
const simplified = simplifyRoutes(routes, { tolerance: 0.0005 });
const after = estimateCoordinateCount(simplified);  // e.g., 200 coords (90% reduction)

// Return simplified geometry to LLM
return { routes: simplified };
```

**Note**: Default tools already use token-efficient summaries (distance/duration only), so geometry simplification is only useful for custom tools that send full GeoJSON to the LLM.

### Common Tool Configuration Patterns

**Read-only agent (no map manipulation):**
```typescript
const readOnlyAgent = createMapAgent(map, {
  model: openai('gpt-4o'),
  tools: {
    setMapStyle: false,
    setLanguage: false,
    toggleLayers: false,
    flyTo: false,
    fitBounds: false
  }
});
```

**Search-only agent (no routing):**
```typescript
const searchAgent = createMapAgent(map, {
  model: openai('gpt-4o'),
  tools: {
    calculateRoute: false,
    showRoute: false
  }
});
```

**Locked visual appearance:**
```typescript
const lockedStyleAgent = createMapAgent(map, {
  model: openai('gpt-4o'),
  tools: {
    setMapStyle: false,
    setLanguage: false
  }
});
```

**Minimal agent (only specific tools):**
```typescript
// Import all default tool names
import type { DefaultToolName } from '@tomtom-org/maps-sdk-plugin-ai-agent';

const allDefaults: DefaultToolName[] = [
  'geocode', 'reverseGeocode', 'searchPlaces', 'searchGeometry',
  'calculateRoute', 'showPlace', 'showPlaces', 'showRoute',
  'clearMap', 'flyTo', 'fitBounds', 'setMapStyle', 'setLanguage',
  'toggleLayers', 'showTrafficFlow'
];

const geocodeAgent = createMapAgent(map, {
  model: openai('gpt-4o'),
  tools: {
    // Exclude all defaults except geocode
    ...Object.fromEntries(
      allDefaults.filter(name => name !== 'geocode').map(name => [name, false])
    )
  }
});
```

**Override with custom implementation:**
```typescript
const customAgent = createMapAgent(map, {
  model: openai('gpt-4o'),
  tools: {
    searchPlaces: createEnhancedSearchTool(context),  // Override default
    getWeather: createWeatherTool(context)            // Add custom
  }
});
```

### Wrapping Default Tools

Add logging, analytics, or custom behavior to default tools:

```typescript
import { createMapAgent, createMapToolSet, createState } from '@tomtom-org/maps-sdk-plugin-ai-agent';

const state = createState();
const context = { map, state };
const defaultTools = createMapToolSet(context);

// Wrap search tool with logging
const loggingSearchTool = {
  ...defaultTools.searchPlaces,
  execute: async (args) => {
    console.log('[Analytics] Search started:', args);
    const result = await defaultTools.searchPlaces.execute(args);
    console.log('[Analytics] Search completed');
    return result;
  }
};

const agent = createMapAgent(map, {
  model: openai('gpt-4o'),
  tools: { searchPlaces: loggingSearchTool }  // Override with wrapped version
});
```
```

### Manual Agent Setup

Build a custom agent bypassing `createMapAgent` for maximum control:

```typescript
import { ToolLoopAgent } from 'ai';
import { createMapToolSet, createState, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-ai-agent';

const state = createState();
const tools = createMapToolSet({ map, state });

const agent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  tools: {
    ...tools,
    customTool: createCustomTool({ map, state })
  },
  systemPrompt: BASE_SYSTEM_PROMPT + '\n\nAdditional instructions...',
  maxSteps: 15,
  onStepFinish: (event) => {
    // Custom step handling
  }
});
```

### Testing Tools

Test individual tools in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { createMapToolSet, createState } from '@tomtom-org/maps-sdk-plugin-ai-agent';

describe('Map agent tools', () => {
  it('should geocode locations', async () => {
    const mockMap = createMockMap();
    const state = createState();
    const tools = createMapToolSet({ map: mockMap, state });
    
    await tools.geocode.execute({ query: 'Amsterdam' });
    
    expect(state.lastGeocodeResult).toBeDefined();
    expect(state.lastGeocodeResult?.properties.name).toContain('Amsterdam');
  });
  
  it('should accumulate multiple searches', async () => {
    const mockMap = createMockMap();
    const state = createState();
    const tools = createMapToolSet({ map: mockMap, state });
    
    await tools.searchPlaces.execute({ query: 'coffee' });
    await tools.searchPlaces.execute({ query: 'restaurants' });
    
    expect(state.searchResultsHistory).toHaveLength(2);
  });
});
```

## Dependencies

**Runtime:**
- `ai@^6.0.0` - Vercel AI SDK (ToolLoopAgent, dynamicTool function)
- `zod@^3.23.0` - Schema validation (peer dependency of AI SDK)

**Peer:**
- `@tomtom-org/maps-sdk` (workspace) - Core SDK (types, services, map)
- `maplibre-gl@^5.0.0` - Map rendering engine

**Dev:**
- `@ai-sdk/openai@^3.0.0` - For tests and examples (v3+ required for AI SDK v6 compatibility)
- Standard TypeScript/Vite build tools

**Important:** When using this plugin with OpenAI, ensure you have `@ai-sdk/openai@^3.0.0` or later. Earlier versions (1.x) use an older model specification that's incompatible with AI SDK v6.

## Design Decisions

1. **Client-side only**: Uses AI SDK's `DirectChatTransport` + `ToolLoopAgent`. Server-side split (data tools on server, map tools on client) documented as future enhancement.

2. **No bundled LLM provider**: Consumer must supply their own `LanguageModel` instance. Keeps package provider-agnostic.

3. **Token-efficient**: All service responses are summarized before being sent to LLM (e.g., Places → `{ count, places: [{ name, address, position }] }`).

4. **Lazy module initialization**: Map modules (PlacesModule, RoutingModule, etc.) are instantiated on first use and cached in state.

5. **Coordinate convention**: Always `[longitude, latitude]` per GeoJSON standard. Heavily documented in system prompt to prevent LLM confusion.

## Next Maintainer Actions

1. **Resolution Required**: Fix the AI SDK `tool()` type compatibility issue (see Known Issue section above)
2. **After Fix**: Run `pnpm build` to verify compilation
3. **Create Example**: Follow step 9 in AGENTS.md to build `examples/map-chat-agent/`
4. **Add Tests**: Implement step 10 integration tests

## References

- **AI SDK v6 Docs**: https://sdk.vercel.ai/docs
- **TomTom Maps SDK**: [Parent repository documentation]
- **Implementation Plan**: `AGENTS.md` in this directory
