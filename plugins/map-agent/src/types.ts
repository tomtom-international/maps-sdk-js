/**
 * @module map-agent-types
 */

import type { LanguageModel, ModelMessage, PrepareStepFunction, ToolLoopAgent } from 'ai';
import type { z } from 'zod';
import type { BaseMapState, MapPOIsState, PlacesState, RangeState, RoutingState, TrafficState } from './state';
import type { ToolName } from './tools';
import type { ClassificationResult } from './utils/intent-classifier';

/**
 * Autocomplete hint for tool names. Suggests known default tool names
 * while allowing arbitrary custom names via `string & {}`.
 *
 * @group Tools
 */
export type ToolNameHint = ToolName | (string & {});

/**
 * Context passed to a classifier function.
 *
 * @group Classifier
 */
export type ClassifierContext = {
    /** Full message history for the current conversation. */
    messages: ReadonlyArray<ModelMessage>;
    /** Metadata for all registered tools. */
    toolsMetadata: Record<string, ToolMetadata>;
};

/**
 * A classifier function that selects which tools to activate for a user message.
 * Return `null` to activate all tools (fail-open).
 *
 * @group Classifier
 */
export type Classifier = (context: ClassifierContext) => Promise<ClassificationResult | null>;

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
    relatedTools?: ToolNameHint[];
    /** Tool names that must run before this one. */
    dependsOn?: ToolNameHint[];
};

/**
 * A tool definition — the universal format for both built-in and third-party tools.
 * Combines execution (inputSchema + execute) with classifier metadata.
 *
 * @typeParam S - The ToolState shape this tool requires. Default: base `ToolState`.
 *
 * @group Tools
 */
export type ToolEntry<S extends ToolState = ToolState> = {
    /** Description of the tool's purpose. */
    description: string;
    /** Zod schema defining the tool's input parameters. */
    inputSchema: z.ZodType;
    /** Optional Zod schema describing the tool's structured output. */
    outputSchema?: z.ZodType;
    /** Function that executes the tool. Receives parsed input and the agent's state. */
    execute: (input: any, state: S) => Promise<any>;
    /** Compact one-liner for the intent classifier prompt. */
    classificationPrompt?: string;
    /** Category tags (e.g. 'location', 'routing'). */
    tags?: string[];
    /** Usage examples (e.g. 'geocode("Amsterdam")'). */
    examples?: string[];
    /** Natural language prompts (e.g. 'Where is the Louvre?'). */
    examplePrompts?: string[];
    /** Tool names that are often used together with this tool. */
    relatedTools?: string[];
    /** Tool names that must run before this one. */
    dependsOn?: string[];
};

/**
 * Options for creating a map agent.
 *
 * @typeParam CS - Full state type. Must extend `ToolState`. Defaults to base `ToolState` (no custom slices).
 *
 * @example Custom state
 * ```typescript
 * interface MyState extends ToolState {
 *     fleet: FleetState;
 * }
 *
 * createMapAgent<MyState>(map, {
 *     model,
 *     state: { fleet: new FleetState() },
 * });
 * ```
 */
export type MapAgentOptions<CS extends ToolState = ToolState> = {
    /** AI SDK language model instance. REQUIRED — no default provider. */
    model: LanguageModel;

    /**
     * Complete system prompt that replaces the default.
     * If provided, `systemPromptSuffix` is ignored.
     */
    systemPrompt?: string;

    /**
     * Additional text appended to the built-in prompt.
     * Ignored if `systemPrompt` is provided.
     */
    systemPromptSuffix?: string;

    /**
     * Whether to include all built-in default tools.
     * Defaults to `true`. Set to `false` to start with no defaults
     * and provide only custom tools via `tools`.
     */
    includeDefaultTools?: boolean;

    /**
     * Tool overrides merged with default tools.
     * - `ToolEntry` values add a new tool or replace a default.
     * - `false` values exclude a default tool.
     *
     * When omitted, all default tools are used as-is.
     *
     * @example
     * ```typescript
     * // Add a custom tool (defaults included automatically)
     * createMapAgent(map, {
     *     model,
     *     tools: { getCustomLocation: myTool },
     * });
     *
     * // Remove a default tool
     * createMapAgent(map, {
     *     model,
     *     tools: { setLanguage: false },
     * });
     * ```
     */
    tools?: { [K in ToolNameHint]?: ToolEntry<CS> | false | undefined };

    /**
     * Custom state slices merged alongside built-in state.
     * Only custom slices need to be provided — built-in slices are created automatically.
     * Accessible in custom tool `execute` via the state parameter.
     */
    state?: Omit<CS, keyof ToolState>;

    /**
     * Pluggable classifier for automatic tool selection.
     * - Omit to use the default LLM-based classifier (uses main model)
     * - Pass a `Classifier` function for custom logic
     * - Pass `false` to disable classification entirely
     */
    classifier?: Classifier | false;

    /**
     * Called after each classification. Use to observe selected tools or log.
     */
    onClassify?: (result: ClassificationResult | null) => void;

    /**
     * Custom prepareStep hook, composed with internal classification step.
     * Your `activeTools` are intersected with the classifier's selection.
     */
    prepareStep?: PrepareStepFunction;

    /**
     * Whether to include output schemas on tools.
     * Defaults to `true`. Set to `false` for providers that don't support structured tool outputs.
     */
    outputSchemas?: boolean;

    /** Max multi-step tool loop iterations. Default: 10. */
    maxSteps?: number;
};

/**
 * The return type of createMapAgent().
 * A real ToolLoopAgent instance with state access and cleanup.
 */
export type MapAgentInstance<CS extends ToolState = ToolState> = ToolLoopAgent & {
    /** Live agent state (built-in + custom slices). */
    readonly state: CS;
    /** Tear down: resets all state slices that have a reset() method. */
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
