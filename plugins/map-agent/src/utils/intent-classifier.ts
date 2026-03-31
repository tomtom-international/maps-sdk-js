/**
 * @module map-agent-classifier
 *
 * Query intent classification for automatic tool selection.
 *
 * Uses LLM-based structured generation to map a user query directly to the
 * minimal set of tool names needed to answer it.
 *
 * The classifier prompt is built dynamically from each tool's `relatedTools`
 * in the tool registry, so it stays in sync automatically when tools are
 * added or renamed.
 */

import { generateText, type LanguageModel, type ModelMessage, Output, type TextPart } from 'ai';
import { z } from 'zod';
import type { StepScope } from '../tool-step-scope';
import { TOOL_NAMES, TOOL_REGISTRY } from '../tools';

/** A single turn in the conversation passed to {@link classifyUserIntent}. */
export type ConversationMessage = { role: 'user' | 'assistant'; content: string };

/** Result returned by {@link classifyUserIntent}. */
export type ClassificationResult = {
    /** Tool names selected by the classifier. Pass to {@link MapAgent.setActiveTools}. */
    activeToolNames: string[];
    /** Wall-clock time in ms for the classification step only (not the agent response). */
    timeMs: number;
    /** Token usage for the classification LLM call. */
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
};

/** Options passed to {@link classifyUserIntent}. */
export type ClassifierOptions = {
    /**
     * Language model to use for structured generation.
     * Ideally should be a fast, low-cost model (e.g. gpt-4o-mini).
     */
    chatModel: LanguageModel;
};

/** Max character length for each history message when compacting for the classifier. */
const MAX_HISTORY_MESSAGE_LENGTH = 300;

/** Number of most-recent history messages (excluding the last user message) passed to the classifier. */
const MAX_CLASSIFIER_HISTORY_MESSAGES = 8;

/** Builds the system prompt listing all tools with their related tools. */
function buildClassifySystemPrompt(): string {
    const toolMetadata = TOOL_NAMES.map((name) => {
        const { relatedTools, dependsOn } = TOOL_REGISTRY[name];
        const related = relatedTools?.length ? ` Related: ${relatedTools.join(', ')}.` : '';
        const depends = dependsOn?.length ? ` Requires: ${dependsOn.join(', ')}.` : '';
        return `${name}${related}${depends}`;
    });

    return [
        'You are a tool selector for a map assistant.',
        'You will receive a conversation. Select the minimal set of tools needed to fulfill the LAST user message.',
        `LOCATION REFERENCE:
            - "near me" / "my location" / "where I am" → getCurrentLocation (user's physical GPS position, may prompt permission)
            - "in this area" / "here on the map" / "near the map center" → getViewport (map's current view)
            - If getCurrentLocation fails due to permission denial, fall back to getViewport as the reference point`,
        '',
        'Available tools:',
        ...toolMetadata,
    ].join('\n');
}

const classifySchema = z.object({
    tools: z
        .array(z.string()) // using string to save tokens, since tool names already included in system prompt
        .min(1)
        .describe('Tool names needed to fulfill the query.'),
});

/** Calls the LLM with structured output to select tools for the conversation. */
async function classifyQueryToTools(
    conversation: ConversationMessage[],
    model: LanguageModel,
): Promise<{ tools: string[]; usage: ClassificationResult['usage'] }> {
    const generated = await generateText({
        model,
        output: Output.object({ schema: classifySchema }),
        system: buildClassifySystemPrompt(),
        messages: conversation,
        maxOutputTokens: 200,
    });

    return {
        tools: generated.output.tools,
        usage: {
            inputTokens: generated.usage?.inputTokens ?? 0,
            outputTokens: generated.usage?.outputTokens ?? 0,
            totalTokens: generated.usage?.totalTokens ?? 0,
        },
    };
}

/**
 * Classify a user conversation to determine which tools to activate.
 *
 * The `conversation` should contain the last user message plus a compaction
 * of the previous chat history (each truncated to save tokens).
 *
 * @example
 * ```typescript
 * const result = await classifyUserIntent(conversation, {
 *   chatModel: openai('gpt-4o-mini'),
 * });
 * // result.activeToolNames → ['geocode', 'calculateRoute', 'showRoute', 'formatDistance', ...]
 *
 * agent.setActiveTools(result.activeToolNames);
 * ```
 */
export async function classifyUserIntent(
    conversation: ConversationMessage[],
    options: ClassifierOptions,
): Promise<ClassificationResult> {
    const { chatModel } = options;
    const startTime = performance.now();

    const { tools, usage } = await classifyQueryToTools(conversation, chatModel);

    const activeToolNames = tools;

    const timeMs = performance.now() - startTime;

    return {
        activeToolNames,
        timeMs,
        usage,
    };
}

/** Type predicate that narrows a message content part to a TextPart. */
function isTextPart(part: { type: string }): part is TextPart {
    return part.type === 'text';
}

/** Extracts plain text from a message's content (string or structured content array). */
function extractMessageText(content: string | Array<{ type: string }>): string | null {
    if (typeof content === 'string') return content;

    const textParts = content.filter(isTextPart);
    if (textParts.length > 0) return textParts.map((part) => part.text).join(' ');

    return null;
}

/**
 * Runs auto-classification for the given messages: builds the classifier conversation,
 * selects active tools, updates step scope, and invokes the optional result callback.
 * Returns null and fails open if classification errors or no user message is found.
 */
export async function runAutoClassification(
    messages: ReadonlyArray<ModelMessage> | undefined,
    classifyModel: LanguageModel,
    loadedToolNames: ReadonlySet<string>,
    stepScope: StepScope,
    onResult?: (result: ClassificationResult) => void,
    maxHistoryMessages?: number,
    maxHistoryMessageLength?: number,
): Promise<ClassificationResult | null> {
    if (!messages?.length) return null;

    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            lastUserIndex = i;
            break;
        }
    }
    if (lastUserIndex === -1) return null;

    const lastMessage = messages[lastUserIndex];
    if (lastMessage.role !== 'user') return null;

    const lastUserText = extractMessageText(lastMessage.content);
    if (!lastUserText) return null;

    const conversation: ConversationMessage[] = [];

    const historyLimit = maxHistoryMessages ?? MAX_CLASSIFIER_HISTORY_MESSAGES;
    const messageCharLimit = maxHistoryMessageLength ?? MAX_HISTORY_MESSAGE_LENGTH;

    const historyStartIndex = Math.max(0, lastUserIndex - historyLimit);

    for (let i = historyStartIndex; i < lastUserIndex; i++) {
        const message = messages[i];
        if (message.role !== 'user' && message.role !== 'assistant') continue;

        const text = extractMessageText(message.content);
        if (!text) continue;

        const compacted = text.length > messageCharLimit ? text.slice(0, messageCharLimit) + '…' : text;
        conversation.push({ role: message.role, content: compacted });
    }

    conversation.push({ role: 'user', content: lastUserText });

    try {
        const classification = await classifyUserIntent(conversation, { chatModel: classifyModel });
        // Classifier uses TOOL_REGISTRY (all known), agent may have fewer.
        stepScope.set(classification.activeToolNames.filter((name) => loadedToolNames.has(name)));
        onResult?.(classification);
        return classification;
    } catch {
        // Classifier failed (network/provider/schema error) — fail open with all tools
        stepScope.set(null);
        return null;
    }
}
