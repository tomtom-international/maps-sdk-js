import type { LanguageModel } from 'ai';
import type { ToolMetadata } from '../../types';

/**
 * Result returned by {@link classifyUserIntent}.
 *
 * @group Agent Toolkit
 */
export type ClassificationResult = {
    /** Tool names selected by the classifier. */
    activeToolNames: string[];
    /**
     * Optional per-tool scope. Keyed by tool name, value is the raw classifier
     * output for that tool — validated against the tool's `scopeSchema` in
     * `prepareStep` before any narrowing is applied. Tools without
     * `scopeSchema`, or for which the classifier omitted a scope, retain
     * their full description and inputSchema for the turn.
     */
    toolScopes?: Record<string, unknown>;
    /** Wall-clock time in ms for the classification step only (not the agent response). */
    timeMs: number;
    /** Token usage for the classification LLM call. */
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
};

/**
 * Options passed to {@link classifyUserIntent}.
 *
 * @group Agent Toolkit
 */
export type ClassifierOptions = {
    /**
     * Language model to use for structured generation.
     * Ideally should be a fast, low-cost model (e.g. gpt-4o-mini).
     */
    chatModel: LanguageModel;
    /** Per-tool metadata used to build the classifier prompt. */
    toolsMetadata: Record<string, ToolMetadata>;
};
