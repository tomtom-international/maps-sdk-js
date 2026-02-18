/**
 * @module map-agent-types
 */

import type { LanguageModel, Tool, ToolLoopAgent } from 'ai';
import type { TomTomMapWithModules, TomTomServiceResponses } from './state';
import type { DefaultToolSet } from './tools';

// Re-export classes for backwards compatibility
export { TomTomMapWithModules, TomTomServiceResponses } from './state';

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
};

/**
 * Map agent instance returned by createMapAgent().
 */
export type MapAgent = {
    /** The ToolLoopAgent instance — pass to DirectChatTransport. */
    readonly agent: ToolLoopAgent;

    /** Live agent state (last results, module cache). Readonly externally. */
    readonly state: Readonly<TomTomMapWithModules>;

    /** Tear down: clears modules, resets state. */
    destroy(): void;
};

/**
 * Context passed to tool execution functions.
 */
export type ToolContext = {
    map: TomTomMapWithModules;
    services: TomTomServiceResponses;
};
