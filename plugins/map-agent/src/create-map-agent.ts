/**
 * @module map-agent
 */

import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { ToolLoopAgent } from 'ai';
import { createState, resetState } from './state';
import { buildSystemPrompt } from './system-prompt';
import { createMapToolSet } from './tools';
import type { MapAgent, MapAgentOptions } from './types';

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
 * import { createMapAgent } from '@tomtom-org/maps-sdk-map-agent';
 * import { openai } from '@ai-sdk/openai';
 * import { useChat } from '@ai-sdk/react';
 * import { DirectChatTransport } from 'ai';
 *
 * const map = new TomTomMap({
 *   mapLibre: { container: 'map', center: [4.9, 52.4], zoom: 10 }
 * });
 *
 * const mapAgent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
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

    // Create agent state
    const state = createState();

    // Create tool context
    const context = { map, state };

    // Create toolset
    const tools = createMapToolSet(context);

    // Merge custom tools if provided
    const finalTools = options.tools ? { ...tools, ...options.tools } : tools;

    // Build system prompt
    const systemPrompt = buildSystemPrompt(options.systemPromptSuffix);

    // Create ToolLoopAgent
    const agent = new ToolLoopAgent({
        model: options.model,
        tools: finalTools,
        instructions: systemPrompt,
        ...(options.maxSteps && { maxToolRoundtrips: options.maxSteps }),
    });

    // Return MapAgent interface
    return {
        agent,
        tools: finalTools,
        systemPrompt,
        state,
        destroy: () => {
            resetState(state);
        },
    };
}
