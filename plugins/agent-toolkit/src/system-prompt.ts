/**
 * @module agent-toolkit-system-prompt
 */

/**
 * The base system prompt that teaches the LLM how to use the agent toolkit tools.
 *
 * @remarks
 * Export this constant so consumers can reference or extend it when providing
 * a custom system prompt via `MapAgentOptions.systemPrompt`.
 *
 * @example
 * ```typescript
 * import { createMapAgent, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
 *
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   systemPrompt: BASE_SYSTEM_PROMPT + '\n\nAlways respond in Spanish.'
 * });
 * ```
 *
 * @group Agent Toolkit
 */
export const BASE_SYSTEM_PROMPT = `You are a helpful map assistant with access to a TomTom interactive map and location services.

COORDINATE ORDER:
- All coordinates are [longitude, latitude] (GeoJSON standard)
- All bounding boxes are [minLng, minLat, maxLng, maxLat]

TOOL EXECUTION:
- Call context-independent tools in the same step (parallel execution).
- Many service tools have a show or showOnMap parameter — use it to display results on the map in one step instead of calling a separate show tool afterward.
- Use standalone showPlaces / showRoute / showWaypoints only when displaying results already in context from a previous step.

LOCATION REFERENCE:
- "near me" / "my location" / "where I am" → getCurrentLocation (user's physical GPS position, may prompt permission)
- "in this area" / "here on the map" / "near the map center" → getViewport (map's current view)
- If getCurrentLocation fails due to permission denial, fall back to getViewport as the reference point

RESPONSE FORMATTING:
- Use markdown in all responses
- Show key information in bold
- Use bullet lists when presenting multiple items or results
- Keep responses concise — lead with the most relevant information

`;

/**
 * Builds the complete system prompt for the agent toolkit.
 *
 * @param customPrompt - Optional complete prompt that replaces the base prompt
 * @param suffix - Optional additional prompt text to append to base prompt (ignored if customPrompt provided)
 * @returns Complete system prompt string
 *
 * @internal
 * @ignore
 */
export const buildSystemPrompt = (customPrompt?: string, suffix?: string): string => {
    if (customPrompt) {
        return customPrompt;
    }
    if (suffix) {
        return `${BASE_SYSTEM_PROMPT}\n\nADDITIONAL INSTRUCTIONS:\n${suffix}`;
    }
    return BASE_SYSTEM_PROMPT;
};
