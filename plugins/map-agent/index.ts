/**
 * Map Agent Plugin - Conversational AI agent for TomTom Maps
 * @module
 */

export { createMapAgent } from './src/create-map-agent';
export { resolveTools } from './src/resolve-tools';
export { createToolState, type StateSlice } from './src/state';
export { BASE_SYSTEM_PROMPT, buildSystemPrompt } from './src/system-prompt';
export { DEFAULT_TOOLS, TOOL_NAMES, type ToolName } from './src/tools';
export * from './src/types';
export {
    type ClassificationResult,
    classifyUserIntent,
    createDefaultClassifier,
    extractLastUserText,
} from './src/utils/intent-classifier';
