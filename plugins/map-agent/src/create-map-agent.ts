/**
 * @module map-agent
 */

import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { createToolState } from './state';
import { buildSystemPrompt } from './system-prompt';
import { setupTools } from './tool-setup';
import { createStepScope } from './tool-step-scope';
import type { MapAgent, MapAgentOptions, MapAgentStreamOptions, ToolState } from './types';
import { type ClassificationResult, runAutoClassification } from './utils/intent-classifier';

/**
 * Creates a conversational map agent that gives an LLM control over a TomTom map.
 *
 * This factory function sets up a complete AI agent with tools for searching places,
 * calculating routes, and manipulating the map display. The agent uses Vercel AI SDK's
 * ToolLoopAgent to handle multi-step tool execution.
 *
 * @param map - The TomTomMap instance to control
 * @param options - Agent configuration options
 * @returns A map agent instance ready to be used with AI SDK's chat interfaces
 *
 * @example
 * ```typescript
 * import { TomTomMap } from '@tomtom-org/maps-sdk/map';
 * import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-ai-agent';
 * import { openai } from '@ai-sdk/openai';
 *
 * const map = new TomTomMap({
 *   mapLibre: { container: 'map', center: [4.9, 52.4], zoom: 10 }
 * });
 *
 * const mapAgent = createMapAgent(map, { model: openai('gpt-4o') });
 *
 * // Auto-classify + stream in one call
 * const result = await mapAgent.stream({ messages });
 * for await (const delta of result.textStream) { ... }
 *
 * // Custom tools
 * const agentWithCustomTools = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   tools: { getCustomLocation: myTool },
 * });
 *
 * // In React component:
 * const { messages, sendMessage } = useChat({
 *   transport: new DirectChatTransport({ agent: mapAgent.agent }),
 * });

 * ```
 *
 * @throws {Error} If model is not provided
 */
export function createMapAgent(map: TomTomMap, options: MapAgentOptions): MapAgent {
    if (!options.model) {
        throw new Error('MapAgent requires a model option. Please provide an AI SDK LanguageModel instance.');
    }

    const state: ToolState = createToolState(map);
    const stepScope = createStepScope();

    const { tools, toolsMetadata } = setupTools(state, options);
    state.toolsMetadata = toolsMetadata;

    // Strip outputSchema from all tools if disabled
    if (options.outputSchemas === false) {
        for (const t of Object.values(tools)) {
            delete (t as Record<string, unknown>).outputSchema;
        }
    }

    // Build system prompt (customPrompt takes precedence over suffix)
    const systemPrompt = buildSystemPrompt(options.systemPrompt, options.systemPromptSuffix);

    const agent = new ToolLoopAgent({
        model: options.model,
        tools,
        instructions: systemPrompt,
        stopWhen: stepCountIs(options.maxSteps ?? 10),
        prepareStep: () => stepScope.prepareStep(),
    });

    const stream = async (streamOptions: MapAgentStreamOptions): ReturnType<ToolLoopAgent['stream']> => {
        const { onClassify, onError, ...agentOptions } = streamOptions;

        let classification: ClassificationResult | null = null;

        if (options.autoClassify !== false) {
            classification = await runAutoClassification(
                agentOptions.messages,
                options.autoClassify?.model ?? options.model,
                toolsMetadata,
                stepScope,
                options.autoClassify?.onResult,
                options.autoClassify?.maxClassifierHistoryMessages,
                options.autoClassify?.maxClassifierHistoryMessageLength,
            );
        }

        onClassify?.(classification);
        const result = await agent.stream(agentOptions as Parameters<ToolLoopAgent['stream']>[0]);

        // TODO: we need another look at error handling. This seems awkward, perhaps it's because we're wrapping the stream
        if (onError) {
            // Consume fullStream in the background to surface API errors (e.g. 429)
            // that the AI SDK otherwise swallows into a generic NoOutputGeneratedError.
            void (async () => {
                try {
                    for await (const part of result.fullStream) {
                        if (part.type === 'error') {
                            onError(part.error);
                        }
                    }
                } catch {
                    // Stream already consumed by textStream — errors will surface there.
                }
            })();
        }

        return result;
    };

    return {
        agent,
        state,
        setActiveTools: (names) => stepScope.set(names),
        stream,
        destroy: () => {
            state.places.reset();
            state.mapPOIs.reset();
            state.routing.reset();
            state.baseMap.reset();
            state.traffic.reset();
        },
    };
}
