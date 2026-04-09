/**
 * Map Agent Plugin - Conversational AI agent for TomTom Maps
 * @module
 */

export { createMapAgent } from './create-map-agent';
export { resolveTools } from './resolve-tools';
export { createToolState, type StateSlice } from './state';
export { BASE_SYSTEM_PROMPT, buildSystemPrompt } from './system-prompt';
export { DEFAULT_TOOLS, TOOL_NAMES, type ToolName } from './tools';
export * from './types';
export {
    type ClassificationResult,
    classifyUserIntent,
    createDefaultClassifier,
    extractLastUserText,
} from './utils/intent-classifier';
