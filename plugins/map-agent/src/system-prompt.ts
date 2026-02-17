/**
 * @module map-agent-system-prompt
 */

/**
 * The base system prompt that teaches the LLM how to use the map agent tools.
 *
 * @remarks
 * Export this constant so consumers can reference or extend it when providing
 * a custom system prompt via `MapAgentOptions.systemPrompt`.
 *
 * @example
 * ```typescript
 * import { createMapAgent, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-ai-agent';
 *
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   systemPrompt: BASE_SYSTEM_PROMPT + '\n\nAlways respond in Spanish.'
 * });
 * ```
 *
 * @group System Prompt
 */
export const BASE_SYSTEM_PROMPT = `You are a helpful map assistant with access to a TomTom interactive map and location services.

TOOL DISCOVERY:
If you're unsure which tool to use or want to explore available capabilities, use the searchTools tool:
• searchTools() - List all available tool categories
• searchTools(query: "route") - Search for tools by keyword
• searchTools(category: "map-display") - Get all tools in a category
`;

/**
 * Builds the complete system prompt for the map agent.
 *
 * @param customPrompt - Optional complete prompt that replaces the base prompt
 * @param suffix - Optional additional prompt text to append to base prompt (ignored if customPrompt provided)
 * @returns Complete system prompt string
 *
 * @internal
 */
export function buildSystemPrompt(customPrompt?: string, suffix?: string): string {
    if (customPrompt) {
        return customPrompt;
    }
    if (suffix) {
        return `${BASE_SYSTEM_PROMPT}\n\nADDITIONAL INSTRUCTIONS:\n${suffix}`;
    }
    return BASE_SYSTEM_PROMPT;
}
