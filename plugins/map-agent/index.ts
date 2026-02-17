/**
 * Map Agent Plugin - Conversational AI agent for TomTom Maps
 * @module
 */

export * from './src/create-map-agent';
export { buildSystemPrompt } from './src/system-prompt';
export type { ToolCategory, ToolMetadata } from './src/tools';
export {
    createAllToolsFromRegistry,
    createToolFromRegistry,
    getToolMetadata,
    getToolsByCategory,
    searchToolsInRegistry,
    TOOL_CATEGORIES,
    TOOL_REGISTRY,
} from './src/tools';
export * from './src/types';
