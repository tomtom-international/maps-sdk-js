/**
 * @module map-agent-types
 */

import type { LanguageModel, Tool, ToolLoopAgent } from 'ai';
import type { BaseMapState, MapPOIsState, PlacesState, RangeState, RoutingState, TrafficState } from './state';
import type { DefaultToolSet } from './tools';
import type { ClassificationResult } from './utils/intent-classifier';

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
export type MapAgentOptions = {
    /** AI SDK language model instance. REQUIRED — no default provider. */
    model: LanguageModel;

    /**
     * Whether to include all built-in default tools.
     *
     * @remarks
     * Defaults to `true`.
     * Set to `false` to start with no default tools and provide only custom tools via `tools`.
     *
     * @example
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   includeDefaultTools: false,
     *   tools: {
     *     geocode: createGeocodeTool(context),
     *     getWeather: createWeatherTool(context)
     *   }
     * });
     * ```
     */
    includeDefaultTools?: boolean;

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
     * import { BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-ai-agent';
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
     * - Works together with `includeDefaultTools`
     * - Set default tool to `false` to exclude it
     * - Set default tool to custom implementation to override it
     * - Add new keys for custom tools
     *
     * Type completion provides autocomplete for all default tool names.
     *
     * @example Exclude specific tools
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   tools: {
     *     setMapStandardStyle: false,  // Exclude: prevent style changes
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
     *     discoverPlaces: createCustomSearchTool(context)  // Override with custom logic
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
     *     setMapStandardStyle: false,                        // Exclude
     *     discoverPlaces: createCustomSearchTool(ctx), // Override
     *     getWeather: createWeatherTool(ctx)         // Add custom
     *   }
     * });
     * ```
     *
     * @see {@link DefaultToolName} for list of default tool names
     * @see {@link ToolConfiguration} for the type definition
     */
    tools?: ToolConfiguration;

    /**
     * Whether to include output schemas on tools for structured outputs.
     *
     * @remarks
     * Defaults to `true`. Set to `false` for providers that do not support
     * structured tool outputs (e.g. some OpenAI-compatible APIs).
     *
     * @example
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   outputSchemas: false,
     * });
     * ```
     */
    outputSchemas?: boolean;

    /** Max multi-step tool loop iterations. Default: 10. */
    maxSteps?: number;

    /**
     * Controls automatic intent classification before each agent call, which selects the minimal
     * tool set to reduce token usage. Classification runs by default using the main model unless
     * this option is explicitly set to `false`.
     *
     *  Set to `false` to disable all classification. When not `false`, you can pass an object to
     * customise behaviour — e.g. use a cheaper/faster model for classification.
     * @example Disable classification
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   autoClassify: false,
     * });
     * ```
     *
     * @example Use a dedicated cheaper model for classification
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   autoClassify: {
     *     model: openai('gpt-4o-mini'),
     *     onResult: (classification) => console.log('Tools:', classification.activeToolNames),
     *   },
     * });
     * ```
     */
    autoClassify?:
        | false
        | {
              /** Language model for intent classification. Defaults to the main model if omitted. */
              model?: LanguageModel;
              /** Called after each classification. Use to observe selected tools or update UI. */
              onResult?: (result: ClassificationResult) => void;
              /** Max number of previous turns (user + assistant) included as context. Defaults to 6. */
              maxClassifierHistoryMessages?: number;
              /** Max character length per history message before truncation. Defaults to 300. */
              maxClassifierHistoryMessageLength?: number;
          };
};

/**
 * Options for {@link MapAgent.stream}. Extends `ToolLoopAgent.stream()` options
 * with an optional per-call classification callback.
 */
export type MapAgentStreamOptions = Parameters<ToolLoopAgent['stream']>[0] & {
    /** Called once after classification resolves, or with `null` if classification was skipped. */
    onClassify?: (result: ClassificationResult | null) => void;
};

/**
 * Map agent instance returned by createMapAgent().
 */
export type MapAgent = {
    /** The ToolLoopAgent instance — pass to DirectChatTransport. */
    readonly agent: ToolLoopAgent;

    /** Live agent state (current results, module cache). Readonly externally. */
    readonly state: ToolState;

    /**
     * Restricts which tools the model sees for the next agent call.
     *
     * @param names - Tool names to activate, or `null` to reset to all loaded tools.
     *
     * @example
     * ```typescript
     * const classification = await classifyUserIntent(conversation, { chatModel: model });
     * agent.setActiveTools(classification.activeToolNames);
     * const result = await agent.agent.generate({ messages });
     * ```
     */
    setActiveTools(names: string[] | null): void;

    /**
     * Stream a chat response, automatically classifying the last user message
     * if `autoClassify` is configured and enabled.
     *
     * Prefer this over calling `agent.stream()` directly when using `autoClassify`.
     *
     * @example
     * ```typescript
     * const result = await mapAgent.stream({
     *   messages,
     *   onStepFinish: (step) => console.log(step.usage),
     *   onClassify: (classification) => console.log('Active tools:', classification?.activeToolNames),
     * });
     * for await (const delta of result.textStream) { ... }
     * ```
     */
    stream(options: MapAgentStreamOptions): ReturnType<ToolLoopAgent['stream']>;

    /** Tear down: clears modules, resets state. */
    destroy(): void;
};

/**
 * State passed to tool factory functions. Organized by feature area,
 * each sub-state mixes lazy module access with the current service data
 * produced during the session.
 *
 * @example
 * ```typescript
 * function createMyTool(state: ToolState) {
 *   return tool({
 *     execute: async () => {
 *       const module = await state.places.getPlacesModule();
 *       state.routing.currentRoutes;  // most recent routes
 *       state.baseMap.mapLibreMap;    // MapLibre instance
 *     }
 *   });
 * }
 * ```
 */
export type ToolState = {
    /** Place search, geocoding, and geometries state. */
    places: PlacesState;
    /** Map POI layer: visibility, filtering, and category management. */
    mapPOIs: MapPOIsState;
    /** Route calculation, waypoint management, and planning parameter state. */
    routing: RoutingState;
    /** Base map display: style, language, viewport, layers, and hillshade. */
    baseMap: BaseMapState;
    /** Traffic flow and incident overlay state. */
    traffic: TrafficState;
    /** Reachable range results: origin, budgets, and bbox summaries. */
    ranges: RangeState;
};
