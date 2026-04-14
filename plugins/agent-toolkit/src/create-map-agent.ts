/**
 * @module agent-toolkit
 */

import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { PrepareStepFunction, PrepareStepResult } from 'ai';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { resolveTools } from './resolve-tools';
import { createToolState, type StateSlice } from './state';
import { buildSystemPrompt } from './system-prompt';
import { setupTools } from './tool-setup';
import { DEFAULT_TOOLS } from './tools';
import type { Classifier, MapAgentInstance, MapAgentOptions, ToolEntry, ToolState } from './types';
import type { ClassificationResult } from './utils/intent-classifier';
import { createDefaultClassifier } from './utils/intent-classifier';

/** Intersects two activeTools lists. Returns undefined if neither is set. */
function intersectActiveTools(
    a: string[] | undefined,
    b: readonly (string | number | symbol)[] | undefined,
): string[] | undefined {
    if (!a) return b as string[] | undefined;
    if (!b) return a;
    const setB = new Set(b);
    return a.filter((name) => setB.has(name));
}

/** Type guard for StateSlice — checks for reset() method. */
function isStateSlice(value: unknown): value is StateSlice {
    return (
        typeof value === 'object' && value !== null && 'reset' in value && typeof (value as any).reset === 'function'
    );
}

/** Resets all state slices that implement StateSlice. */
function destroyState(state: ToolState): void {
    for (const slice of Object.values(state)) {
        if (isStateSlice(slice)) {
            slice.reset();
        }
    }
}

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
 */
export function createMapAgent<CS extends ToolState = ToolState>(
    map: TomTomMap,
    options: MapAgentOptions<CS>,
): MapAgentInstance<CS> {
    if (!options.model) {
        throw new Error('MapAgent requires a model option. Please provide an AI SDK LanguageModel instance.');
    }

    const state = createToolState(map, options.state) as CS;

    // Safe: default tools only access base ToolState properties; CS extends ToolState.
    const defaults = options.includeDefaultTools === false ? {} : (DEFAULT_TOOLS as Record<string, ToolEntry<CS>>);
    const toolEntries = resolveTools(defaults, options.tools);

    const { tools, toolsMetadata } = setupTools(toolEntries, state, {
        outputSchemas: options.outputSchemas,
    });

    // Resolve classifier
    const classifier: Classifier | null =
        options.classifier === false ? null : (options.classifier ?? createDefaultClassifier({ model: options.model }));

    const systemPrompt = buildSystemPrompt(options.systemPrompt, options.systemPromptSuffix);

    // Classification state — cached per turn (reset on step 0)
    let lastClassification: ClassificationResult | null = null;

    const prepareStep: PrepareStepFunction = async (stepInfo) => {
        let activeTools: string[] | undefined;

        if (stepInfo.stepNumber === 0) {
            lastClassification = null;
            if (classifier) {
                try {
                    lastClassification = await classifier({
                        messages: stepInfo.messages,
                        toolsMetadata,
                    });
                } catch {
                    lastClassification = null;
                }
            }
            options.onClassify?.(lastClassification);
        }

        if (lastClassification) {
            activeTools = lastClassification.activeToolNames;
        }

        // Compose with developer's prepareStep
        const userResult: PrepareStepResult | undefined = await options.prepareStep?.(stepInfo);

        if (userResult) {
            return {
                ...userResult,
                activeTools: intersectActiveTools(activeTools, userResult.activeTools),
            };
        }

        return activeTools ? { activeTools } : {};
    };

    const agent = new ToolLoopAgent({
        model: options.model,
        tools,
        instructions: systemPrompt,
        stopWhen: stepCountIs(options.maxSteps ?? 10),
        prepareStep,
    });

    return Object.assign(agent, {
        state,
        destroy: () => destroyState(state),
    });
}
