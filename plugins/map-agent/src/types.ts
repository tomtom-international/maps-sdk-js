/**
 * @module map-agent-types
 */

import type { Place, Places, Routes } from '@tomtom-org/maps-sdk/core';
import type {
    BaseMapModule,
    GeometriesModule,
    HillshadeModule,
    PlacesModule,
    POIsModule,
    RoutingModule,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import type { LanguageModel, Tool, ToolLoopAgent } from 'ai';
import type { DefaultToolSet } from './tools';

/**
 * Internal state maintained by the map agent across tool calls.
 *
 * This state retains full GeoJSON data from service calls so map tools
 * can render it without re-fetching. Module instances are cached for reuse.
 */
export interface MapAgentState {
    /** Accumulated search results — full GeoJSON retained for showPlaces(). */
    searchResultsHistory: Places[];

    /** Accumulated calculated routes — full GeoJSON retained for showRoute(). */
    routesHistory: Routes[];

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

/**
 * Names of all default tools provided by the map agent.
 *
 * @remarks
 * Use this type to ensure type safety when overriding default tools.
 * This type is automatically derived from {@link DefaultToolSet},
 * so it stays in sync when tools are added or removed.
 *
 * @group Tools
 */
export type DefaultToolName = keyof DefaultToolSet;

/** * Tool configuration type with autocomplete for default tools.
 *
 * @remarks
 * - Default tool names have autocomplete and can be set to `false` (exclude) or custom tool (override)
 * - Any additional keys can be added for custom tools
 *
 * @group Tools
 */
export type ToolConfiguration = {
    [K in DefaultToolName]?: false | Tool;
} & {
    [customName: string]: false | Tool | undefined;
};

/** * Options for creating a map agent.
 */
export interface MapAgentOptions {
    /** AI SDK language model instance. REQUIRED — no default provider. */
    model: LanguageModel;

    /**
     * Complete system prompt that replaces the default.
     * If provided, this takes precedence over systemPromptSuffix.
     *
     * @remarks
     * Use this when you want full control over agent instructions.
     * Import `BASE_SYSTEM_PROMPT` to reference the default as a starting point.
     *
     * @example
     * ```typescript
     * import { BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-map-agent';
     *
     * systemPrompt: BASE_SYSTEM_PROMPT + '\n\nAlways respond in Spanish.'
     * ```
     */
    systemPrompt?: string;

    /**
     * Additional system prompt text appended to built-in prompt.
     * Ignored if `systemPrompt` is provided.
     *
     * @example
     * ```typescript
     * systemPromptSuffix: 'Always provide distance in miles, not kilometers.'
     * ```
     */
    systemPromptSuffix?: string;

    /**
     * Configure tools: exclude defaults, override defaults, or add custom tools.
     *
     * @remarks
     * **Unified tool configuration with type-safe autocomplete:**
     * - Set default tool to `false` to exclude it
     * - Set default tool to custom implementation to override it
     * - Add new keys for custom tools
     *
     * Type completion provides autocomplete for all 15 default tool names.
     *
     * @example Exclude specific tools
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   tools: {
     *     setMapStyle: false,  // Exclude: prevent style changes
     *     setLanguage: false,  // Exclude: lock language
     *     toggleLayers: false  // Exclude: prevent layer toggling
     *   }
     * });
     * ```
     *
     * @example Override default tool
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   tools: {
     *     searchPlaces: createCustomSearchTool(context)  // Override with custom logic
     *   }
     * });
     * ```
     *
     * @example Add custom tools
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   tools: {
     *     getWeather: createWeatherTool(context),  // New tool
     *     findParking: createParkingTool(context)  // New tool
     *   }
     * });
     * ```
     *
     * @example Mix all three patterns
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   tools: {
     *     setMapStyle: false,                        // Exclude
     *     searchPlaces: createCustomSearchTool(ctx), // Override
     *     getWeather: createWeatherTool(ctx)         // Add custom
     *   }
     * });
     * ```
     *
     * @see {@link DefaultToolName} for list of default tool names
     * @see {@link ToolConfiguration} for the type definition
     */
    tools?: ToolConfiguration;

    /** Max multi-step tool loop iterations. Default: 10. */
    maxSteps?: number;

    /**
     * Enable prompt caching to reduce token usage and costs.
     *
     * @remarks
     * **Prompt caching** allows LLM providers to cache static parts of prompts
     * (like system instructions and tool definitions) across requests, dramatically
     * reducing input token costs and latency.
     *
     * **Provider Support:**
     * - ✅ Anthropic Claude (Sonnet 3.5, Opus 3.5): 90% cost reduction on cached tokens
     * - ⏳ OpenAI: Planned support
     * - ❌ Other providers: No effect, but safe to enable
     *
     * **How it works:**
     * - System prompt is marked as cacheable
     * - First request: Normal cost
     * - Subsequent requests: ~10% cost for cached content
     * - Cache expires after ~5 minutes of inactivity
     *
     * **When to enable:**
     * - Long system prompts (>1000 tokens)
     * - Multi-turn conversations
     * - Repeated queries with same tools
     *
     * @default false
     *
     * @example
     * ```typescript
     * import { anthropic } from '@ai-sdk/anthropic';
     *
     * const agent = createMapAgent(map, {
     *   model: anthropic('claude-3-5-sonnet-20241022'),
     *   promptCaching: true  // Enable caching
     * });
     * ```
     *
     * @see https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
     */
    promptCaching?: boolean;
}

/**
 * Map agent instance returned by createMapAgent().
 */
export interface MapAgent {
    /** The ToolLoopAgent instance — pass to DirectChatTransport. */
    readonly agent: ToolLoopAgent;

    /** The full tool set — useful for server-side or manual streamText usage. */
    readonly tools: Record<string, any>;

    /** The composed system prompt string. */
    readonly systemPrompt: string;

    /** Live agent state (last results, module cache). Readonly externally. */
    readonly state: Readonly<MapAgentState>;

    /** Tear down: clears modules, resets state. */
    destroy(): void;
}

/**
 * Context passed to tool execution functions.
 */
export interface ToolContext {
    map: TomTomMap;
    state: MapAgentState;
}
