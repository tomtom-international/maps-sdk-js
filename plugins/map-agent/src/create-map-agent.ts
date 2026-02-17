/**
 * @module map-agent
 */

import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type Tool, ToolLoopAgent, ToolLoopAgentSettings } from 'ai';
import { createState } from './state';
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
 * import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-ai-agent';
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
 * // With custom system prompt
 * const customAgent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   systemPrompt: 'You are a navigation assistant. Always provide turn-by-turn directions.'
 * });
 *
 * // Override specific default tools
 * const extendedAgent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   overrideTools: { searchPlaces: createCustomSearchTool({ map, state }) },
 *   customTools: { getWeather: createWeatherTool({ map, state }) }
 * });
 *
 * // Use only custom tools
 * const minimalAgent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   includeDefaultTools: false,
 *   customTools: { geocode: createGeocodeTool({ map, state }) }
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
    const state = createState(map);

    // Create tool context
    const context = { state };

    // Create toolset - always start with defaults
    const defaultTools = createMapToolSet(context);

    // Process tools configuration
    const finalTools: Record<string, Tool> = {};

    // Start with default tools
    for (const [name, tool] of Object.entries(defaultTools)) {
        finalTools[name] = tool;
    }

    // Apply tools configuration (exclude, override, add)
    if (options.tools) {
        for (const [name, toolOrFalse] of Object.entries(options.tools)) {
            if (toolOrFalse === false) {
                // Exclude: remove from final set
                delete finalTools[name];
            } else if (toolOrFalse !== undefined) {
                // Override or add: replace or add to final set
                finalTools[name] = toolOrFalse;
            }
        }
    }

    // Build system prompt (customPrompt takes precedence over suffix)
    const systemPrompt = buildSystemPrompt(options.systemPrompt, options.systemPromptSuffix);

    // Create ToolLoopAgent with optional prompt caching
    const agentConfig: ToolLoopAgentSettings = {
        model: options.model,
        tools: finalTools,
        instructions: systemPrompt,
        ...(options.maxSteps && { maxToolRoundtrips: options.maxSteps }),
    };

    // Enable prompt caching for Anthropic Claude (reduces token costs by ~90%)
    if (options.promptCaching) {
        (agentConfig as any).experimental_providerMetadata = {
            anthropic: {
                cacheControl: { type: 'ephemeral' },
            },
        };
    }

    const agent = new ToolLoopAgent(agentConfig);

    // Return MapAgent interface
    return {
        agent,
        state,
        destroy: () => {
            state.reset();
        },
    };
}
