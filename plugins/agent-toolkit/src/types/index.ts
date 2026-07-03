/**
 * @module agent-toolkit-types
 */

export { type AnalysesEvents, type AnalysisRecord, type EntryAnalysis } from '../state/analyses';
export type { BYODAnalysis } from '../state/byod/analysis';
export type { BYODEntry, BYODSource } from '../state/byod/entry';
export type { BYODDataProfile, BYODPropertyProfile } from '../state/byod/profile';
export type { ByodSourceUrlValidation, ByodSourceUrlValidator } from '../state/byod/state';
export type { CustomGeometriesAnalysis } from '../state/custom-geometries/analysis';
export type { CustomGeometriesEntry, GeometryProvenance } from '../state/custom-geometries/entry';
export type { PlacesAnalysis } from '../state/places/analysis';
export type { PlacesEntry } from '../state/places/entry';
export type { RangesEntry, ReachableRange } from '../state/range/entry';
export type { RoutesAnalysis } from '../state/routing/analysis';
export type { RouteParams, RoutesEntry } from '../state/routing/entry';
export type { TrafficAreaAnalyticsAnalysis } from '../state/traffic-area-analytics/analysis';
export type { TrafficAreaAnalyticsEntry, TrafficAreaAnalyticsParams } from '../state/traffic-area-analytics/entry';
export type { IncidentsAnalysis, TrafficIncidentsEntry } from '../state/traffic-incidents/state';
export { type GeometriesId, type GeometriesIdKind, geometriesIdSchema } from '../tools/shared';
export type { SandboxExecutor } from '../tools/shared/sandbox-code';
export * from './state';

import type { LanguageModel, ModelMessage, PrepareStepFunction, ToolLoopAgent } from 'ai';

type JSONValue = null | string | number | boolean | { [key: string]: JSONValue } | JSONValue[];
type ProviderOptions = Record<string, Record<string, JSONValue | undefined>>;

import type { z } from 'zod';
import type { JobEngine } from '../engine';
import type {
    Analyses,
    BaseMapState,
    BYODState,
    ByodSourceUrlValidator,
    CustomGeometriesState,
    DataEntryConfig,
    DataEntryKind,
    EventsState,
    MapPOIsState,
    PlacesState,
    RangeState,
    RoutingState,
    TrafficAreaAnalyticsState,
    TrafficIncidentsState,
    TrafficTilesState,
} from '../state';
import type { SystemPromptSectionOverrides } from '../system-prompt';
import type { ToolName } from '../tools';
import type { SandboxExecutor } from '../tools/shared/sandbox-code';
import type { ClassificationResult } from '../utils';

/**
 * Autocomplete hint for tool names. Suggests known default tool names
 * while allowing arbitrary custom names via `string & {}`.
 *
 * @group Agent Toolkit
 */
export type ToolNameHint = ToolName | (string & {});

/**
 * Tool-facing union of state slices that own analysable entries — the
 * vocabulary used by tools that read from multiple slices (`analyseData`,
 * `processData`) and by the classifier when proposing per-call scope.
 *
 * Distinct from {@link EntryModeSliceName}, which uses the literal state-slice
 * keys (`routing`, `trafficIncidents`, …) for state-level operations.
 *
 * `ranges` is intentionally excluded: it feeds the analysis/processing tools
 * only via `geometriesEntryIDs` (its isochrone polygons), not as a direct
 * top-level input.
 *
 * @group Agent Toolkit
 */
export type EntryDataKind = 'places' | 'routes' | 'incidents' | 'customGeometries' | 'trafficAreaAnalytics' | 'byod';

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
    /** Derived/custom polygon entries — output of `processData`. */
    customGeometries: CustomGeometriesState;
    /** Bring-your-own-data GeoJSON layers — customer-authored data the agent can read and render. */
    byod: BYODState;
    /**
     * Strategy used to run code-generation tools (`analyseData` / `processData`).
     * Initialised to the main-thread executor by `createToolState`, and overridden
     * by `createMapAgent` from {@link MapAgentOptions.codeExecution}. Tools read this
     * to select where sandbox code runs.
     */
    codeExecution: SandboxExecutor;
    /**
     * The single recurrence engine. Owners (`analyses`, `trackers`) register entry-anchored jobs and keep
     * the returned handles; the engine re-runs each active job when its source entries change. Generic —
     * it never interprets a job's recipe (the tools layer builds the run closure). See {@link JobEngine}.
     */
    engine: JobEngine;
    /**
     * Single session-level registry of every analysis (one-shot + recurring) across all entry kinds.
     * Results live here, and per-entry views read them on demand via {@link Analyses.getAnalysesForEntry}.
     * `analyseData` registers a record + a job on {@link JobEngine}; `monitorAnalysis` toggles the job's
     * active flag.
     */
    analyses: Analyses;
    /**
     * Generic trackers — rising-edge reducers fed by their own {@link JobEngine} jobs. A tracker fires an
     * alert/event when its rule's {@link Verdict} crosses an edge (`ingestVerdict`); owns the durable
     * {@link TrackerEvent} log.
     */
    trackers: EventsState;
};

/**
 * Tunes `analyseData` / `processData` sandbox execution. **Where** the code runs is
 * not configurable: it is chosen by environment — a sandboxed, opaque-origin
 * iframe + Web Worker in the browser (no DOM/storage access, no network via CSP,
 * terminable on timeout), and the main thread in Node / SSR (where that boundary
 * has no equivalent). The options below only tune the isolated browser run.
 *
 * @group Agent Toolkit
 */
export type CodeExecutionConfig = {
    /** Wall-clock budget per isolated (browser) run, in ms. Default: 5000. */
    timeoutMs?: number;
    /**
     * Optional override of the worker's library source. By default the SDK loads its own
     * inlined turf/h3 UMD (a separate lazy chunk), so this is rarely needed — supply it only
     * to pin a specific build or add libraries. Return UMD/IIFE JavaScript that defines
     * `self.turf` and `self.h3` (string or Promise of one).
     */
    loadWorkerLibrarySource?: () => string | Promise<string>;
};

/**
 * A tool definition — the universal format for both built-in and third-party tools.
 * Combines execution (inputSchema + execute) with classifier metadata.
 *
 * @typeParam S - The ToolState shape this tool requires. Default: base `ToolState`.
 * @typeParam Scope - Optional per-tool scope shape. When set via `scopeSchema`, the
 *   classifier may emit a value of this shape per turn so the tool's `description`
 *   and `inputSchema` can be rebuilt narrower for that step. Tools without scope
 *   leave this at the default `unknown`; `scopeSchema` is then absent and no rebuild
 *   ever runs for the tool.
 *
 * @group Agent Toolkit
 */
export type ToolEntry<S extends ToolState = ToolState, Scope = unknown> = {
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
    /**
     * Keep this tool active on every step regardless of the classifier's selection. Its name is
     * unioned into the per-turn `activeTools` set, so the model can always reach it. Use sparingly —
     * for tools that may be needed to set up *any* request (e.g. asking the user to clarify intent).
     * Has no effect on the fail-open path (when classification is skipped, every tool is active).
     */
    alwaysActive?: boolean;
    /**
     * Halt the agent loop on the SAME step that calls this tool, with no trailing step. Use for tools
     * whose turn must be a single silent tool call (e.g. clarifyIntent rendering a form). Leave unset to
     * let the model take one more step after the tool returns — e.g. to present the tool's result as text
     * before the loop stops naturally on a no-tool-call step. A tool that semantically awaits the user
     * conveys that through its own result (e.g. clarifyIntent's `status: 'awaiting_user_response'`), not
     * this flag.
     */
    endsTurnOnCall?: boolean;
    /**
     * Optional per-tool scope schema. When set, the classifier may emit a
     * scope value (validated against this schema) and `prepareStep` will
     * rebuild this tool's `description` + `inputSchema` by re-invoking its
     * {@link ToolEntryBuilder} with the parsed scope. Tools without a builder
     * cannot be scoped — `scopeSchema` is only meaningful on builder-produced
     * entries.
     */
    scopeSchema?: z.ZodType<Scope>;
    /**
     * Compact one-line hint for the classifier explaining when and how to scope
     * this tool (e.g. "Emit `{ kinds: ['places'] }` when only places entries
     * are relevant"). Appended to the tool's classifier-prompt entry.
     */
    scopePrompt?: string;
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
    /** Keep this tool active on every step regardless of the classifier's selection. */
    alwaysActive?: boolean;
    /** Halt the agent loop on the step that calls this tool (no trailing step) — e.g. clarifyIntent rendering a form. */
    endsTurnOnCall?: boolean;
    /** When set, the classifier may emit `toolScopes[name]` for this tool to narrow per-turn. */
    scopePrompt?: string;
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
     * multiple `boundingBoxes`, `placeTypes`, `areaId`, `areaTags`). When
     * `false`/unset, `discoverPlaces` uses the stable default search
     * service and a reduced input schema that matches what the default
     * service supports.
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
 * tailor its description, schema, or executor to flags or per-turn scope
 * resolved by the classifier.
 *
 * @typeParam Scope - The per-tool scope shape. Defaults to `unknown` for the
 *   generic builder signature; individual builders narrow this via their own
 *   `Scope` generic so the `scope` argument is well-typed within the tool.
 *
 * @group Agent Toolkit
 */
export type ToolBuildOptions<Scope = unknown> = {
    /** Active feature flags. */
    featureFlags?: FeatureFlags;
    /**
     * Per-turn scope emitted by the classifier (already validated against the
     * tool's {@link ToolEntry.scopeSchema}). `undefined` at agent-creation time
     * or when the classifier omits a scope for this tool — builders should
     * treat `undefined` as "produce the full surface".
     */
    scope?: Scope;
    /**
     * Subset of {@link EntryDataKind} the agent is configured to expose, derived
     * from `createMapAgent`'s `dataEntries` option. Builders for `analyseData`
     * and `processData` use this to narrow their static (unscoped) input surface
     * to the agent's enabled kinds. `undefined` means "no agent-level filtering —
     * every kind stays available".
     */
    enabledDataKinds?: readonly EntryDataKind[];
};

/**
 * A builder that produces a {@link ToolEntry} from {@link ToolBuildOptions}.
 * Use this when a tool's metadata, schema, or executor depends on options
 * resolved at agent-creation time (e.g. feature flags) or per turn
 * (classifier-emitted scope).
 *
 * @typeParam S - The ToolState shape this tool requires. Default: base `ToolState`.
 * @typeParam Scope - The per-tool scope shape, propagated to the produced
 *   {@link ToolEntry} so the `scopeSchema` and runtime `scope` stay in lockstep.
 *
 * @group Agent Toolkit
 */
export type ToolEntryBuilder<S extends ToolState = ToolState, Scope = unknown> = (
    options: ToolBuildOptions<Scope>,
) => ToolEntry<S, Scope>;

/**
 * A registered tool definition: either a static {@link ToolEntry} or a
 * {@link ToolEntryBuilder} that builds one from {@link ToolBuildOptions} at
 * agent-creation time. Used wherever the tool registry, resolver, and
 * setup pipeline accept either form interchangeably.
 *
 * @typeParam S - The ToolState shape this tool requires. Default: base `ToolState`.
 * @typeParam Scope - Optional per-tool scope shape (only relevant for builder
 *   form). Defaults to `never` for non-scopable tools.
 *
 * @group Agent Toolkit
 */
// `Scope` defaults to `any` here (not `unknown`) so the registry's `satisfies Record<string,
// ToolDefinition>` clause accepts builders parameterised by narrower scope types (e.g.
// `ToolEntryBuilder<ToolState, AnalyseDataScope>`). Tool-author-facing types
// ({@link ToolEntry}, {@link ToolEntryBuilder}) still default to `unknown`.
export type ToolDefinition<S extends ToolState = ToolState, Scope = any> =
    | ToolEntry<S, Scope>
    | ToolEntryBuilder<S, Scope>;

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
/** Per-tool execution outcome reported to {@link MapAgentOptions.onToolExecute}. */
export type ToolExecutionInfo = {
    /** Registered tool name (the `defaultTools` key). */
    toolName: string;
    /** Wall-clock duration of `execute`, in milliseconds (includes any network/IO). */
    durationMs: number;
    /** True if the tool threw or returned the standardized `{ error: string }` shape. */
    isError: boolean;
    /** Error message when `isError` is true (the thrown message or the returned `error`). */
    errorMessage?: string;
};

/** Observer invoked after each tool's `execute` settles. */
export type OnToolExecute = (info: ToolExecutionInfo) => void;

export type MapAgentOptions<CS extends ToolState = ToolState> = {
    /** AI SDK language model instance. REQUIRED — no default provider. */
    model: LanguageModel;

    /**
     * Either a full prompt string that replaces the default entirely, or a
     * {@link SystemPromptSectionOverrides} map whose entries override individual
     * sections of the built-in prompt (omitted sections keep their defaults).
     *
     * To extend a single section rather than replace it, read its default from
     * the exported `SYSTEM_PROMPT_SECTIONS` map and override with a derived value
     * (e.g. ``responseFormatting: `${SYSTEM_PROMPT_SECTIONS.responseFormatting}\n- Answer in Spanish.` ``).
     *
     * A full string ignores `systemPromptPrefix` and `systemPromptSuffix`;
     * section overrides still honor both.
     */
    systemPrompt?: string | SystemPromptSectionOverrides;

    /**
     * Text prepended above the whole prompt as a preamble, separated by a blank
     * line and carrying no heading. Applied on top of the base prompt or section
     * overrides; ignored only when `systemPrompt` is a full replacement string.
     */
    systemPromptPrefix?: string;

    /**
     * Additional text appended under an `ADDITIONAL INSTRUCTIONS` heading.
     * Applied on top of the base prompt or section overrides; ignored only when
     * `systemPrompt` is a full replacement string.
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
     * Per-kind data-entry configuration. Each {@link DataEntryKind} accepts
     * `{ enabled?, entryMode? }`. Setting `enabled: false` removes the kind from the
     * agent's tool surface entirely — it disappears from `analyseData` / `processData`
     * scope and input fields, and the slice-specific recall / display / fetch tools
     * are dropped from the registry. `entryMode` is applied to the underlying slice
     * right after the agent state is built — before any tool runs.
     *
     * Keys are LLM-facing kind names (`routes`, `incidents`) — not slice names
     * (`routing`, `trafficIncidents`). The slice mapping is internal.
     *
     * @example
     * ```typescript
     * createMapAgent(map, {
     *     model: openai('gpt-4o'),
     *     dataEntries: {
     *         routes: { entryMode: 'single' },
     *         incidents: { entryMode: 'single' },
     *         byod: { enabled: false }, // disables recallState, addByodSource, setByodLayers, updateByodDisplay + byod scope on analyse/process
     *         ranges: { enabled: false }, // disables findReachableAreas + recallState
     *     },
     * });
     * ```
     */
    dataEntries?: Partial<Record<DataEntryKind, DataEntryConfig>>;

    /**
     * BYOD (bring-your-own-data) options.
     *
     * @example
     * ```typescript
     * createMapAgent(map, {
     *     model: openai('gpt-4o'),
     *     byod: {
     *         // Refuse cloud-metadata / private addresses; allow only known hosts.
     *         validateSourceUrl: (url) =>
     *             url.hostname === 'data.example.com'
     *                 ? { valid: true }
     *                 : { valid: false, reason: `Host "${url.hostname}" is not allowed.` },
     *     },
     * });
     * ```
     */
    byod?: {
        /**
         * Authorize each `addByodSource` URL before it is fetched — see
         * {@link ByodSourceUrlValidator}. Return `{ valid: true }` to allow or
         * `{ valid: false, reason }` to block (sync or async). Runs in addition
         * to the built-in scheme / size / timeout policy.
         */
        validateSourceUrl?: ByodSourceUrlValidator;
    };

    /**
     * Tunes `analyseData` / `processData` sandbox execution — see {@link CodeExecutionConfig}.
     * Where the code runs is chosen by environment (off-thread iframe-worker in the browser,
     * main thread in Node/SSR), not configured here; these options only adjust the isolated
     * browser run (`timeoutMs`, `loadWorkerLibrarySource`).
     *
     * @experimental
     */
    codeExecution?: CodeExecutionConfig;

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
     * Called after each tool's `execute` settles (success or throw), with its
     * wall-clock duration and whether it failed. Use to observe per-tool latency
     * and error rates (e.g. telemetry). Errors are detected both from a thrown
     * exception and from the standardized `{ error: string }` return shape.
     */
    onToolExecute?: OnToolExecute;

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
