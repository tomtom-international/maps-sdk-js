/**
 * Map Agent Plugin - Conversational AI agent for TomTom Maps
 * @module
 */

export * from './src/create-map-agent';
export { buildSystemPrompt } from './src/system-prompt';
export type { ToolTag } from './src/tools';
export * from './src/tools';
export * from './src/types';
export type { ClassificationResult, ClassifierOptions, ConversationMessage } from './src/utils/intent-classifier';
export { classifyUserIntent } from './src/utils/intent-classifier';
