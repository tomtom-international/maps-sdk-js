/**
 * @module map-agent-types
 */

import type { LanguageModel, ToolLoopAgent } from 'ai';
import type { z } from 'zod';
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

/**
 * Metadata for a map agent tool.
 *
 * @group Tools
 */
export type ToolMetadata = {
    /** Tool identifier, derived from the config key. */
    name: string;
    /** Description of the tool's purpose. Used by the SDK's system prompt. */
    description: string;
    /** Compact one-liner for the intent classifier prompt. */
    classificationPrompt?: string;
    /** Category tags used by the help tool for filtering (e.g. 'location', 'routing'). */
    tags?: string[];
    /** Usage examples (e.g. 'geocode("Amsterdam")'). */
    examples?: string[];
    /** Natural language prompts shown by the help tool (e.g. 'Where is the Louvre?'). */
    examplePrompts?: string[];
    /** Tool names that are often used together with this tool. */
    relatedTools?: string[];
    /** Tool names that must run before this one. */
    dependsOn?: string[];
};

/**
 * A custom map agent tool. Users define tools with this type instead of the AI SDK `tool()` directly.
 * Combines execution (inputSchema + execute) with classifier metadata in a single object.
 *
 * @example
 * ```typescript
 * const getWeather: MapAgentTool = {
 *     description: 'Get weather forecast for a city',
 *     inputSchema: z.object({ city: z.string() }),
 *     execute: async ({ city }) => fetchWeather(city),
 *     classificationPrompt: 'weather forecast',
 *     dependsOn: ['geocode'],
 * };
 * ```
 *
 * @group Tools
 */
// `name` is omitted because it's derived from the config key in setupTools
export type MapAgentTool = Omit<ToolMetadata, 'name'> & {
    /** Zod schema defining the tool's input parameters. */
    inputSchema: z.ZodType;
    /** Optional Zod schema describing the tool's structured output. */
    outputSchema?: z.ZodType;
    /** Function that executes the tool. Receives the parsed input from the schema. */
    execute: (input: any) => Promise<any>;
};

/**
 * A tool registry entry. Can be:
 * - `false` to exclude a built-in tool
 * - Metadata only (to tweak a built-in without replacing it)
 * - A {@link MapAgentTool} (to add or override)
 *
 * @group Tools
 */
export type ToolRegistryEntry = false | Partial<ToolMetadata> | MapAgentTool;

/**
 * Tool configuration: keyed by tool name, with autocomplete for built-in defaults.
 *
 * @group Tools
 */
export type ToolConfiguration = {
    [K in DefaultToolName]?: ToolRegistryEntry;
} & Record<string, ToolRegistryEntry>;

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
     * Configure tools: exclude defaults, override defaults, add custom tools, or tweak tool metadata.
     *
     * @remarks
     * **Unified tool configuration with type-safe autocomplete:**
     * - Works together with `includeDefaultTools`
     *
     * Each entry can be:
     * - `false` — exclude a built-in tool
     * - Metadata only — tweak a built-in tool's metadata without replacing it
     * - A {@link MapAgentTool} — add a custom tool or override a built-in
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
     *     getWeather: {
     *       ...weatherTool,
     *       classificationPrompt: 'weather forecast',   // Helps the classifier know when to select this tool
     *       dependsOn: ['geocode'],                     // Tells the classifier this tool needs geocode first
     *     },
     *   }
     * });
     * ```
     *
     * @example Tweak built-in tool metadata
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   tools: {
     *     geocode: { dependsOn: ['myAuthTool'] },
     *   }
     * });
     * ```
     *
     * @example Mix all patterns
     * ```typescript
     * const agent = createMapAgent(map, {
     *   model: openai('gpt-4o'),
     *   tools: {
     *     setMapStandardStyle: false,                             // Exclude
     *     discoverPlaces: createCustomSearchTool(ctx),            // Override
     *     geocode: { dependsOn: ['myAuthTool'] },                 // Tweak metadata
     *     getWeather: { ...weatherTool, dependsOn: ['geocode'] }, // Add custom
     *   }
     * });
     * ```
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
    // TODO: we need another look at error handling. This seems awkward, perhaps it's because we're wrapping the stream
    /** Called when the underlying LLM API emits an error (e.g. 429 rate limit). */
    onError?: (error: unknown) => void;
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
     * const classification = await classifyUserIntent(conversation, { chatModel: model, toolsMetadata });
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
    /** Parameterized tool metadata — populated in createMapAgent after setupTools. */
    toolsMetadata?: Record<string, ToolMetadata>;
};
