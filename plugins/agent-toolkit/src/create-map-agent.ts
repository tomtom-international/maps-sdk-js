/**
 * @module agent-toolkit
 */

import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { PrepareStepFunction, Tool } from 'ai';
import { hasToolCall, stepCountIs, ToolLoopAgent } from 'ai';
import {
    applyToolScopes,
    composeStepResult,
    createPrepareStepMutex,
    destroyState,
    restoreScopableTools,
    unionActiveTools,
} from './prepare-step-helpers';
import { resolveTools } from './resolve-tools';
import { createToolState, DATA_ENTRY_KIND_TO_SLICE, type DataEntryKind, type EntryModeSlice } from './state';
import { buildSystemPrompt } from './system-prompt';
import { type ScopableToolInfo, setupTools } from './tool-setup';
import { DEFAULT_TOOLS, TOOLS_BY_DATA_ENTRY_KIND } from './tools';
import { ALL_ENTRY_DATA_KINDS } from './tools/shared';
import { resolveSandboxExecutor } from './tools/shared/sandbox';
import type {
    Classifier,
    EntryDataKind,
    MapAgentInstance,
    MapAgentOptions,
    ToolDefinition,
    ToolMetadata,
    ToolState,
} from './types';
import type { ClassificationResult } from './utils';
import { createDefaultClassifier } from './utils';

// CONCURRENCY: the AI SDK does not support per-step tool overrides (`PrepareStepResult` has no
// `tools` field — only `activeTools` for name-level filtering). Mutating the shared `tools` map is
// therefore the only path to a per-turn scoped schema, and it imposes a single-concurrent-run
// invariant on any agent instance that has scopable tools. Two concurrent `respond()` calls on the
// same agent would race on the mutation; we serialise `prepareStep` invocations across the agent
// with `createPrepareStepMutex` to keep the mutation/serialize-request window atomic per call.
// Callers who genuinely need parallel sessions should create one agent per session (the typical
// embedding-app pattern) rather than share an agent across concurrent users.

/**
 * Inputs the step-0 classification needs. Bundled into a single object so the orchestrator's
 * inner closure can pass the agent-creation-time state through to `runStep0Classification` without
 * a wide parameter list. None of the fields change across steps — the agent's whole lifetime sees
 * the same `tools` / `scopableTools` / `toolsMetadata` / `classifier`.
 */
type ClassificationDeps = {
    tools: Record<string, Tool>;
    scopableTools: Record<string, ScopableToolInfo>;
    toolsMetadata: Record<string, ToolMetadata>;
    classifier: Classifier | null;
    onClassify?: (result: ClassificationResult | null) => void;
};

/**
 * Step-0 pipeline: restore each scopable tool to its full surface so the classifier has a clean
 * baseline, run the classifier (swallowing any throw — networks are flaky and `null` triggers
 * fail-open), surface the result via `onClassify`, and finally mutate the live tool objects'
 * `description` + `inputSchema` using the classifier's per-tool scopes. The AI SDK reads tool
 * definitions on its next request build, so this mutation is what makes per-turn scoping work.
 *
 * Returns the classification (or null) for the caller to cache across subsequent steps.
 */
const runStep0Classification = async (
    deps: ClassificationDeps,
    messages: Parameters<PrepareStepFunction>[0]['messages'],
): Promise<ClassificationResult | null> => {
    restoreScopableTools(deps.tools, deps.scopableTools);
    let result: ClassificationResult | null = null;
    if (deps.classifier) {
        try {
            result = await deps.classifier({
                messages,
                toolsMetadata: deps.toolsMetadata,
            });
        } catch {
            result = null;
        }
    }
    deps.onClassify?.(result);
    applyToolScopes(deps.tools, deps.scopableTools, result?.toolScopes);
    return result;
};

/**
 * Creates a conversational agent toolkit that gives an LLM control over a TomTom map.
 *
 * Returns a ToolLoopAgent instance (compatible with DirectChatTransport) with
 * `state` and `destroy` attached. Classification runs transparently inside
 * `prepareStep` — no wrapper type needed.
 *
 * @param map - The TomTomMap instance to control
 * @param options - Agent configuration options
 * @returns A ToolLoopAgent with state access and cleanup
 *
 * @example Basic usage
 * ```typescript
 * import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
 * import { openai } from '@ai-sdk/openai';
 * import { DirectChatTransport } from 'ai/react';
 *
 * const agent = createMapAgent(map, { model: openai('gpt-4o') });
 *
 * // Works directly with DirectChatTransport — no .agent property needed
 * const { messages, sendMessage } = useChat({
 *   transport: new DirectChatTransport({ agent }),
 * });
 * ```
 *
 * @example Custom tools + removal
 * ```typescript
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   tools: {
 *     getCustomLocation: myLocationTool,  // add custom
 *     setLanguage: false,                 // remove default
 *   },
 * });
 * ```
 * @group Agent Toolkit
 */
export const createMapAgent = <CS extends ToolState = ToolState>(
    map: TomTomMap,
    options: MapAgentOptions<CS>,
): MapAgentInstance<CS> => {
    if (!options.model) {
        throw new Error('MapAgent requires a model option. Please provide an AI SDK LanguageModel instance.');
    }

    const state = createToolState(map, options.state) as CS;

    // App-supplied authorization hook for BYOD URL fetches, stored on the slice so
    // `addByodSource` can consult it (see ByodSourceUrlValidator). Optional — unset
    // leaves only the built-in scheme / size / timeout policy in force.
    if (options.byod?.validateSourceUrl) {
        state.byod.sourceUrlValidator = options.byod.validateSourceUrl;
    }

    // Select where analyseData / processData sandbox code runs (default: main thread).
    // Stored on state so those tools can pick it up at execute time.
    state.codeExecution = resolveSandboxExecutor(options.codeExecution);

    // Apply per-kind `entryMode` from `dataEntries`. Each kind maps to a single slice via
    // {@link DATA_ENTRY_KIND_TO_SLICE}. The slice histories are empty at this point so
    // `setEntryMode` resolves synchronously (no entries to hide); the promise is
    // intentionally not awaited because createMapAgent itself is sync.
    if (options.dataEntries) {
        for (const [kindKey, config] of Object.entries(options.dataEntries)) {
            const kind = kindKey as DataEntryKind;
            if (!config?.entryMode) continue;
            const sliceName = DATA_ENTRY_KIND_TO_SLICE[kind];
            void (state[sliceName] as EntryModeSlice).setEntryMode(config.entryMode);
        }
    }

    // Compute the set of enabled data-entry kinds. Used both to filter the tool registry
    // (drop slice-specific tools for disabled kinds) and to narrow analyseData / processData
    // input surface via {@link ToolBuildOptions.enabledDataKinds}. Default is everything
    // enabled; only kinds with an explicit `enabled: false` drop out.
    const isKindEnabled = (kind: DataEntryKind): boolean => options.dataEntries?.[kind]?.enabled !== false;
    const disabledKinds: DataEntryKind[] = (Object.keys(DATA_ENTRY_KIND_TO_SLICE) as DataEntryKind[]).filter(
        (kind) => !isKindEnabled(kind),
    );
    const enabledDataKinds: readonly EntryDataKind[] = ALL_ENTRY_DATA_KINDS.filter((kind) => isKindEnabled(kind));
    // Names of default tools to drop because their slice is disabled. Custom-tool overrides
    // (passed via `options.tools`) are NOT filtered — integrators that want to gate their
    // own tools on a disabled kind can inspect `dataEntries` themselves.
    const droppedToolNames = new Set<string>(disabledKinds.flatMap((kind) => TOOLS_BY_DATA_ENTRY_KIND[kind]));

    // Safe: default tools only access base ToolState properties; CS extends ToolState.
    const defaultsAll =
        options.includeDefaultTools === false ? {} : (DEFAULT_TOOLS as Record<string, ToolDefinition<CS>>);
    // Filter slice-specific default tools out before user overrides — user overrides win,
    // so a custom tool registered under the same name resurrects it on purpose.
    const defaults: Record<string, ToolDefinition<CS>> = Object.fromEntries(
        Object.entries(defaultsAll).filter(([name]) => !droppedToolNames.has(name)),
    );
    const toolEntries = resolveTools(defaults, options.tools);

    const { tools, toolsMetadata, scopableTools } = setupTools(toolEntries, state, {
        outputSchemas: options.outputSchemas,
        featureFlags: options.featureFlags,
        enabledDataKinds,
        onToolExecute: options.onToolExecute,
    });

    // Resolve classifier
    const classifier: Classifier | null =
        options.classifier === false ? null : (options.classifier ?? createDefaultClassifier({ model: options.model }));

    const systemPrompt = buildSystemPrompt({
        customPrompt: options.systemPrompt,
        prefix: options.systemPromptPrefix,
        suffix: options.systemPromptSuffix,
    });

    // Tools flagged `alwaysActive` are unioned into every step's activeTools so the model can always
    // reach them, regardless of what the classifier picked. Computed once from resolved metadata.
    const alwaysActiveToolNames = Object.entries(toolsMetadata)
        .filter(([, meta]) => meta.alwaysActive)
        .map(([name]) => name);

    // Tools flagged `endsTurnOnCall` halt the loop deterministically on the step that calls them — a
    // single silent tool call (e.g. clarifyIntent rendering a form). A tool that awaits the user WITHOUT
    // this flag (e.g. clarifyIntent in prose mode) instead gets one trailing step to present its result
    // as text, then stops naturally when that step makes no tool call.
    const endsTurnStops = Object.entries(toolsMetadata)
        .filter(([, meta]) => meta.endsTurnOnCall)
        .map(([name]) => hasToolCall(name));

    // Classification state — cached per turn (reset on step 0)
    let lastClassification: ClassificationResult | null = null;

    // Per-agent serialising mutex around prepareStep. Guards the tool-object mutation window so
    // concurrent `respond()` calls on the same agent don't race on `tools[name].description /
    // inputSchema`. The AI SDK reads tool definitions immediately after prepareStep returns, so
    // serialising prepareStep keeps each call's request-build atomic with respect to mutations.
    const withPrepareStepLock = createPrepareStepMutex();

    // Bundle classifier + tools so the step-0 helper has a single argument. None of these change
    // across steps, so the bag is constructed once and closed over by prepareStep.
    const classificationDeps: ClassificationDeps = {
        tools,
        scopableTools,
        toolsMetadata,
        classifier,
        onClassify: options.onClassify,
    };

    const prepareStep: PrepareStepFunction = (stepInfo) =>
        withPrepareStepLock(async () => {
            if (stepInfo.stepNumber === 0) {
                lastClassification = await runStep0Classification(classificationDeps, stepInfo.messages);
            }
            const activeTools = unionActiveTools(lastClassification?.activeToolNames, alwaysActiveToolNames);
            const userResult = await options.prepareStep?.(stepInfo);
            const stepProviderOptions = options.stepProviderOptions?.({
                activeTools,
                stepNumber: stepInfo.stepNumber,
            });
            const composed = composeStepResult(activeTools, stepProviderOptions, userResult);
            // composeStepResult intersects activeTools with a host-supplied prepareStep.activeTools,
            // which could otherwise drop always-active tools. Re-assert them on the FINAL result so
            // they stay reachable every step. (When activeTools is omitted, every tool is already
            // active — nothing to re-add.)
            if (!composed?.activeTools) return composed;
            return { ...composed, activeTools: unionActiveTools(composed.activeTools, alwaysActiveToolNames) };
        });

    const agent = new ToolLoopAgent({
        model: options.model,
        tools,
        instructions: systemPrompt,
        stopWhen: [stepCountIs(options.maxSteps ?? 10), ...endsTurnStops],
        prepareStep,
        providerOptions: options.providerOptions,
    });

    return Object.assign(agent, {
        state,
        destroy: () => destroyState(state),
    });
};
