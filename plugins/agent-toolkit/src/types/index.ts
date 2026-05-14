/**
 * @module agent-toolkit-types
 */

export type { CustomGeometriesAnalysis } from '../state/custom-geometries/analysis';
export type { CustomGeometriesEntry, GeometryProvenance } from '../state/custom-geometries/entry';
export type { PlacesAnalysis } from '../state/places/analysis';
export type { PlacesEntry } from '../state/places/entry';
export type { RangesEntry, ReachableRange } from '../state/range/entry';
export type { RoutesAnalysis } from '../state/routing/analysis';
export type { RouteParams, RoutesEntry } from '../state/routing/entry';
export { type GeometriesId, type GeometriesIdKind, geometriesIdSchema } from '../tools/shared';
export * from './state';

import type { LanguageModel, ModelMessage, PrepareStepFunction, ToolLoopAgent } from 'ai';

type JSONValue = null | string | number | boolean | { [key: string]: JSONValue } | JSONValue[];
type ProviderOptions = Record<string, Record<string, JSONValue | undefined>>;

import type { z } from 'zod';
import type {
    BaseMapState,
    CustomGeometriesState,
    MapPOIsState,
    PlacesState,
    RangeState,
    RoutingState,
    TrafficAreaAnalyticsState,
    TrafficIncidentsState,
    TrafficTilesState,
} from '../state';
import type { ToolName } from '../tools';
import type { ClassificationResult } from '../utils';

/**
 * Autocomplete hint for tool names. Suggests known default tool names
 * while allowing arbitrary custom names via `string & {}`.
 *
 * @group Agent Toolkit
 */
export type ToolNameHint = ToolName | (string & {});

/**
 * State passed to tool factory functions. Organized by feature area,
 * each sub-state mixes lazy module access with the current service data
 * produced during the session.
 *
 * @group Agent Toolkit
 *
 * @example
 * ```typescript
 * function createMyTool(state: ToolState) {
 *   return tool({
 *     execute: async () => {
 *       const pins = await state.places.getPinPlacesModule();
 *       state.routing.currentRoutes;  // most recent routes
 *       state.baseMap.mapLibreMap;    // MapLibre instance
 *     }
 *   });
 * }
 * ```
 */
export type ToolState = {
    /** Places layer: PlacesModule plus an append-only search history. */
    places: PlacesState;
    /** Map POI layer: visibility, filtering, and category management. */
    mapPOIs: MapPOIsState;
    /** Route calculation, waypoint management, and planning parameter state. */
    routing: RoutingState;
    /** Base map display: style, language, viewport, layers, and hillshade. */
    baseMap: BaseMapState;
    /** Traffic tile overlays: flow tiles + incident overlay tiles. */
    trafficTiles: TrafficTilesState;
    /** Traffic area analytics: aggregation module + last result + viz config. */
    trafficAreaAnalytics: TrafficAreaAnalyticsState;
    /** Traffic incidents: fetched entry history and per-entry rendering. */
    trafficIncidents: TrafficIncidentsState;
    /** Reachable range results: origin, budgets, and bbox summaries. */
    ranges: RangeState;
    /** Derived/custom polygon entries — output of processGeometries. */
    customGeometries: CustomGeometriesState;
};

/**
 * A tool definition — the universal format for both built-in and third-party tools.
 * Combines execution (inputSchema + execute) with classifier metadata.
 *
 * @typeParam S - The ToolState shape this tool requires. Default: base `ToolState`.
 *
 * @group Agent Toolkit
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
 * Metadata for an agent toolkit tool.
 *
 * @group Agent Toolkit
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
 * Context passed to a classifier function.
 *
 * @group Agent Toolkit
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
 * @group Agent Toolkit
 */
export type Classifier = (context: ClassifierContext) => Promise<ClassificationResult | null>;

/**
 * Feature-flag bag for {@link createMapAgent}. Toggles in-flight or
 * opt-in agent-toolkit behaviour. Individual flags vary in stability —
 * some may graduate to stable public options, others are internal-only
 * experiments that can change or disappear without notice. Check each
 * flag's own doc for its current status.
 *
 * @experimental
 *
 * @group Agent Toolkit
 */
export type FeatureFlags = {
    /**
     * Route `discoverPlaces` through the experimental exploration search
     * backend (and expose its richer input surface — `municipalities`,
     * multiple `boundingBoxes`, `placeTypes`). When `false`/unset,
     * `discoverPlaces` uses the stable default search service and a
     * reduced input schema that matches what the default service supports.
     *
     * **Internal experiment.** Not part of the public agent-toolkit
     * contract; subject to removal at any time.
     *
     * @internal
     * @experimental
     * @default false
     */
    experimentalSearch?: boolean;
};

/**
 * Build-time options passed to a {@link ToolEntryBuilder}. Lets each tool
 * tailor its description, schema, or executor to flags or other config that
 * are only known at agent-creation time.
 *
 * @group Agent Toolkit
 */
export type ToolBuildOptions = {
    /** Active feature flags. */
    featureFlags?: FeatureFlags;
};

/**
 * A builder that produces a {@link ToolEntry} from {@link ToolBuildOptions}.
 * Use this when a tool's metadata, schema, or executor depends on options
 * resolved at agent-creation time (e.g. feature flags).
 *
 * @typeParam S - The ToolState shape this tool requires. Default: base `ToolState`.
 *
 * @group Agent Toolkit
 */
export type ToolEntryBuilder<S extends ToolState = ToolState> = (options: ToolBuildOptions) => ToolEntry<S>;

/**
 * A registered tool definition: either a static {@link ToolEntry} or a
 * {@link ToolEntryBuilder} that builds one from {@link ToolBuildOptions} at
 * agent-creation time. Used wherever the tool registry, resolver, and
 * setup pipeline accept either form interchangeably.
 *
 * @typeParam S - The ToolState shape this tool requires. Default: base `ToolState`.
 *
 * @group Agent Toolkit
 */
export type ToolDefinition<S extends ToolState = ToolState> = ToolEntry<S> | ToolEntryBuilder<S>;

/**
 * Options for creating an agent toolkit.
 *
 * @typeParam CS - Full state type. Must extend `ToolState`. Defaults to base `ToolState` (no custom slices).
 *
 * @group Agent Toolkit
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

    /**
     * Opt into in-flight or experimental agent-toolkit behaviour. Stability
     * varies per flag — see {@link FeatureFlags} and each flag's own doc.
     *
     * @experimental
     */
    featureFlags?: FeatureFlags;

    /**
     * Provider-specific options forwarded to the AI SDK on every step. Keyed by
     * provider id (`openai`, `azure`, `anthropic`, ...).
     *
     * Use this to enable reasoning summaries for gpt-5.x via the Responses API
     * — without `reasoningSummary` the model thinks but returns no reasoning text:
     *
     * @example
     * ```typescript
     * createMapAgent(map, {
     *     model: azure.responses(deploymentId),
     *     providerOptions: {
     *         openai: { reasoningEffort: 'low', reasoningSummary: 'auto' },
     *     },
     * });
     * ```
     */
    providerOptions?: ProviderOptions;

    /**
     * Per-step `providerOptions` override. Called once per step with the
     * classifier-narrowed active toolset; the returned object is merged on top
     * of `providerOptions` for that step. Use it to bump reasoning effort on
     * turns that include a code-execution tool without paying the cost on
     * simple fetch/toggle turns.
     *
     * @example
     * ```typescript
     * stepProviderOptions: ({ activeTools }) =>
     *     activeTools?.some((t) => CODE_EXEC.has(t))
     *         ? { openai: { reasoningEffort: 'medium' } }
     *         : undefined,
     * ```
     */
    stepProviderOptions?: (info: {
        activeTools: string[] | undefined;
        stepNumber: number;
    }) => ProviderOptions | undefined;
};

/**
 * The return type of createMapAgent().
 * A real ToolLoopAgent instance with state access and cleanup.
 *
 * @group Agent Toolkit
 */
export type MapAgentInstance<CS extends ToolState = ToolState> = ToolLoopAgent & {
    /** Live agent state (built-in + custom slices). */
    readonly state: CS;
    /** Tear down: resets all state slices that have a reset() method. */
    destroy(): void;
};
