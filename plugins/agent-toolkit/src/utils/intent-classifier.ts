/**
 * @module agent-toolkit-classifier
 *
 * Query intent classification for automatic tool selection.
 *
 * Uses LLM-based structured generation to map a user query directly to the
 * minimal set of tool names needed to answer it.
 *
 * The classifier prompt is built dynamically from each tool's `relatedTools`
 * in the tool metadata, so it stays in sync automatically when tools are
 * added or renamed.
 */

import { generateText, type LanguageModel, type ModelMessage, Output, type TextPart } from 'ai';
import { z } from 'zod';
import type { Classifier, ClassifierContext, ToolMetadata } from '../types';
import type { ClassificationResult, ClassifierOptions } from './types';

/**
 * A single turn in the conversation passed to {@link classifyUserIntent}.
 *
 * @ignore
 */
export type ConversationMessage = { role: 'user' | 'assistant'; content: string };

/** Max character length for each history message when compacting for the classifier. */
const MAX_HISTORY_MESSAGE_LENGTH = 300;

/** Number of most-recent history messages (excluding the last user message) passed to the classifier. */
const MAX_CLASSIFIER_HISTORY_MESSAGES = 8;

/** Formats a single tool's metadata into a compact classifier prompt entry. */
const formatToolEntry = (name: string, entry: ToolMetadata): string => {
    const classificationPrompt = entry.classificationPrompt ? ` ${entry.classificationPrompt}.` : '';
    // const related = entry.relatedTools?.length ? ` Related: ${entry.relatedTools.join(', ')}.` : '';
    const depends = entry.dependsOn?.length ? ` Depends on: ${entry.dependsOn.join(', ')}.` : '';
    const scope = entry.scopePrompt ? ` SCOPE: ${entry.scopePrompt}` : '';
    return `${name}${classificationPrompt}${depends}${scope}`;
};

// Names of tools whose metadata declares a `scopePrompt` — used to surface the per-turn
// scope contract in the classifier system prompt.
const scopableToolNames = (toolsMetadata: Record<string, ToolMetadata>): string[] =>
    Object.entries(toolsMetadata)
        .filter(([, meta]) => meta.scopePrompt)
        .map(([name]) => name);

/**
 * Builds the system prompt listing available tools for the classifier.
 *
 * @ignore
 */
export const buildClassifySystemPrompt = (toolsMetadata: Record<string, ToolMetadata>): string => {
    const toolEntries = Object.entries(toolsMetadata).map(([name, entry]) => formatToolEntry(name, entry));
    const scopable = scopableToolNames(toolsMetadata);
    const scopeContract = scopable.length
        ? [
              '',
              'TOOL SCOPES — MANDATORY when selecting a scopable tool:',
              `The following tools REQUIRE a scope entry in \`toolScopes\` whenever they appear in \`tools\`: ${scopable.join(', ')}.`,
              "For each picked scopable tool, emit `toolScopes[<name>]` with the per-tool object shape described in its SCOPE hint above. Don't omit. Don't leave it implicit.",
              'If the user query truly needs all input kinds the tool supports, still emit the scope explicitly — list every kind. Never skip the scope entry when picking the tool.',
          ]
        : [];

    return [
        'You are a tool selector for a map assistant.',
        'You will receive a conversation. Select the minimal set of tools needed to fulfill the LAST user message.',
        // A picked tool can only read data that already exists in state. `Depends on:` lists the tools
        // that PRODUCE that data — without co-picking them the model is hard-restricted and cannot load
        // the prerequisite, so it invents entry ids and fails. The "unless already satisfied" clause keeps
        // this from over-selecting when the data was loaded on an earlier turn.
        'PREREQUISITES: each tool below may list `Depends on: <tools>` — the tools that produce the data it ' +
            'reads. When you pick a tool, ALSO pick every tool in its `Depends on:` list, UNLESS the ' +
            'conversation shows that prerequisite is already satisfied (the data was loaded, or the place ' +
            'located, on an earlier turn). E.g. arming a tracker/alert on a fresh area needs getTrafficIncidents ' +
            '(to load the incidents) and locatePlace (for a named area) picked alongside it.',
        `LOCATION REFERENCE:
            - "near me" / "my location" / "where I am" → getCurrentLocation (user's physical GPS position, may prompt permission)
            - "in this area" / "here on the map" / "near the map center" → getViewport (map's current view)
            - If getCurrentLocation fails due to permission denial, fall back to getViewport as the reference point`,
        '',
        'Available tools:',
        ...toolEntries,
        ...scopeContract,
    ].join('\n');
};

// Per-call output schema. Scopable tools (those whose metadata carries a `scopePrompt`) must
// appear in `toolScopes` when selected — the LLM cannot opt out.
//
// IMPORTANT: We can't use `z.record(z.string(), z.unknown())` for `toolScopes`. Azure / OpenAI
// strict structured-output mode requires every object property to be declared explicitly with
// `additionalProperties: false`, and `z.record` doesn't translate to that. Instead we build an
// explicit `z.object({ [scopableToolName]: scopeShape.optional(), … })` with one optional field
// per known scopable tool. The value shape is loose (`{ kinds: string[] }`) at the classifier
// level — final validation against the tool's real `scopeSchema` happens in `prepareStep`.
//
// The `superRefine` then enforces "if you picked tool X and X is scopable, you must emit
// toolScopes[X]". The AI SDK's structured-output retry loop sees that as a typed validation error
// and re-runs with the message pointing at the missing entry.
const looseScopeShape = z.object({
    kinds: z
        .array(z.string())
        .min(1)
        .describe("Entry-data kinds the turn touches (one of the kinds listed in the tool's SCOPE hint)."),
});

// Human-readable hint of the expected response shape, embedded in the system prompt. The model
// produces any JSON (we use `output: 'no-schema'` to avoid attaching a strict schema to the API
// request); this hint plus the SCOPE blocks already in the system prompt give it enough structure
// to consistently emit something our zod schema can validate.
const buildExpectedShapeHint = (scopableNames: ReadonlySet<string>): string => {
    if (scopableNames.size === 0) {
        return '{ "tools": ["toolName", ...] }';
    }
    const scopeKeys = [...scopableNames].map((n) => `    "${n}": { "kinds": [...] } | null`).join(',\n');
    return `{
  "tools": ["toolName", ...],
  "toolScopes": {
${scopeKeys}
  }
}
For every scopable tool you LIST in "tools", the matching "toolScopes" entry MUST be a non-null object \`{ "kinds": [...] }\`. For scopable tools you DON'T pick, set the corresponding "toolScopes" entry to \`null\`.`;
};

const buildClassifySchema = (scopableNames: ReadonlySet<string>) => {
    const base = z.object({
        tools: z
            .array(z.string()) // using string to save tokens, since tool names already included in system prompt
            .min(1)
            .describe('Tool names needed to fulfill the query.'),
    });

    if (scopableNames.size === 0) {
        return base;
    }

    // Each scopable tool gets a `.nullable()` field (not `.optional()`). Reason: Azure / OpenAI
    // strict structured-output mode requires every property to be in the JSON schema's `required`
    // list — `optional` maps to "may be absent" which strict mode rejects. `nullable` lets the
    // LLM emit `null` for unused entries while keeping the field listed in `required`.
    // We use `generateObject` with `mode: 'json'` below which doesn't require strict-mode
    // semantics, but keeping the schema strict-mode-clean future-proofs against runtime mode
    // switches.
    const toolScopesShape: Record<string, z.ZodNullable<typeof looseScopeShape>> = {};
    for (const name of scopableNames) {
        toolScopesShape[name] = looseScopeShape.nullable();
    }
    const toolScopesObject = z
        .object(toolScopesShape)
        .nullable()
        .describe(
            'Per-tool scope. One field per scopable tool; MANDATORY (non-null) for every scopable tool you list in ' +
                "`tools`. For tools you didn't pick, set the corresponding field to `null`. See each tool's SCOPE hint.",
        );

    return base.extend({ toolScopes: toolScopesObject }).superRefine((data, ctx) => {
        const scopes: Record<string, unknown> = (data.toolScopes ?? {}) as Record<string, unknown>;
        for (const name of data.tools) {
            if (!scopableNames.has(name)) continue;
            const value = scopes[name];
            if (value === null || value === undefined) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['toolScopes', name],
                    message: `Tool "${name}" requires \`toolScopes.${name}\` — emit it per the SCOPE hint (don't leave null when picking).`,
                });
            }
        }
    });
};

/**
 * Calls the LLM with structured output to select tools for the conversation. Tries up to
 * `MAX_CLASSIFY_ATTEMPTS` times — the structured-output mode rejects classifications missing
 * mandatory scope, and on rejection the LLM gets a retry with the validation error pointing at
 * the missing entry. If every attempt still fails, returns the latest tool list without scopes
 * and lets `prepareStep` fall back to the (terse) unscoped surface.
 */
const MAX_CLASSIFY_ATTEMPTS = 2;

type Usage = ClassificationResult['usage'];
type Partial = { tools?: unknown; toolScopes?: unknown } | null | undefined;
type Soft = { tools: string[]; scopes?: Record<string, unknown> } | undefined;

const addUsage = (
    target: Usage,
    source: { inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined,
): void => {
    if (!source) return;
    target.inputTokens += source.inputTokens ?? 0;
    target.outputTokens += source.outputTokens ?? 0;
    target.totalTokens += source.totalTokens ?? 0;
};

// Pull a (best-effort) `{ tools, scopes }` pair out of whatever the LLM returned. Used by both
// the "valid-shape but failed local validation" and "generateObject threw" paths to populate the
// soft-fallback when every attempt fails. Returns `undefined` when nothing looks usable.
const extractPartialTools = (partial: Partial): Soft => {
    if (!partial || !Array.isArray(partial.tools) || !partial.tools.every((tool) => typeof tool === 'string')) {
        return undefined;
    }
    const scopes =
        partial.toolScopes && typeof partial.toolScopes === 'object'
            ? (partial.toolScopes as Record<string, unknown>)
            : undefined;
    return { tools: partial.tools, ...(scopes && { scopes }) };
};

// Compact a successful classification: drop the `null` placeholders in `toolScopes` (the "not
// picked" sentinel) so prepareStep's `applyToolScopes` doesn't churn through no-ops.
const compactSuccess = (
    parsed: { tools: string[]; toolScopes?: Record<string, unknown> | null },
    usage: Usage,
): { tools: string[]; toolScopes?: Record<string, unknown>; usage: Usage } => {
    const cleanedScopes = parsed.toolScopes
        ? Object.fromEntries(Object.entries(parsed.toolScopes).filter(([, value]) => value != null))
        : undefined;
    return {
        tools: parsed.tools,
        ...(cleanedScopes && Object.keys(cleanedScopes).length > 0 && { toolScopes: cleanedScopes }),
        usage,
    };
};

const classifyQueryToTools = async (
    conversation: ConversationMessage[],
    model: LanguageModel,
    toolsMetadata: Record<string, ToolMetadata>,
): Promise<{ tools: string[]; toolScopes?: Record<string, unknown>; usage: Usage }> => {
    const scopableNames = new Set(scopableToolNames(toolsMetadata));
    const schema = buildClassifySchema(scopableNames);
    const aggregateUsage: Usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    // System prompt embeds the expected JSON shape so the model produces something we can validate
    // locally. We use `output: 'no-schema'` below (json_object mode on Azure / OpenAI), which means
    // the API doesn't see our zod schema at all — strict-mode-friendly by construction.
    const expectedShape = buildExpectedShapeHint(scopableNames);
    const system = `${buildClassifySystemPrompt(toolsMetadata)}\n\nReturn JSON matching this shape exactly:\n${expectedShape}`;

    let soft: Soft;
    for (let attempt = 0; attempt < MAX_CLASSIFY_ATTEMPTS; attempt++) {
        try {
            // `Output.json()` puts the model into json-output mode without attaching a JSON Schema
            // to the request — strict-mode-friendly on Azure/OpenAI (their strict mode rejects
            // several Zod constructs we use). We validate locally against our zod schema after.
            const generated = await generateText({
                model,
                output: Output.json(),
                system,
                messages: conversation,
                maxOutputTokens: 400,
            });
            addUsage(aggregateUsage, generated.usage);

            const parsed = schema.safeParse(generated.output);
            if (parsed.success) {
                return compactSuccess(
                    parsed.data as { tools: string[]; toolScopes?: Record<string, unknown> | null },
                    aggregateUsage,
                );
            }
            // Validation failed locally — capture the partial for soft-fallback and retry.
            soft = extractPartialTools(generated.output as Partial) ?? soft;
        } catch (error) {
            // Best-effort: `generateText` may reject with `{ value, usage }` on output-validation
            // failures; capture both so the soft-fallback below still has something useful and
            // usage stays accurate across the retry.
            const errRecord = error as { value?: unknown; usage?: typeof aggregateUsage };
            addUsage(aggregateUsage, errRecord.usage);
            soft = extractPartialTools(errRecord.value as Partial) ?? soft;
        }
    }

    if (!soft) {
        throw new Error(`Classifier failed after ${MAX_CLASSIFY_ATTEMPTS} attempts to produce a valid response.`);
    }
    return {
        tools: soft.tools,
        ...(soft.scopes && { toolScopes: soft.scopes }),
        usage: aggregateUsage,
    };
};

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
 *   toolsMetadata,
 * });
 * // result.activeToolNames contains the selected tools
 * ```
 *
 * @group Agent Toolkit
 */
export const classifyUserIntent = async (
    conversation: ConversationMessage[],
    options: ClassifierOptions,
): Promise<ClassificationResult> => {
    const { chatModel, toolsMetadata } = options;
    const startTime = performance.now();

    const { tools, toolScopes, usage } = await classifyQueryToTools(conversation, chatModel, toolsMetadata);

    const activeToolNames = tools;

    const timeMs = performance.now() - startTime;

    return {
        activeToolNames,
        ...(toolScopes && { toolScopes }),
        timeMs,
        usage,
    };
};

/** Type predicate that narrows a message content part to a TextPart. */
const isTextPart = (part: { type: string }): part is TextPart => part.type === 'text';

/**
 * Extracts plain text from a message's content (string or structured content array).
 *
 * @ignore
 */
export const extractMessageText = (content: string | Array<{ type: string }>): string | null => {
    if (typeof content === 'string') return content;

    const textParts = content.filter(isTextPart);
    if (textParts.length > 0) return textParts.map((part) => part.text).join('');

    return null;
};

/**
 * Extracts the text content of the last user message in a message array.
 * Returns null if no user message is found or if content has no text.
 *
 * @group Agent Toolkit
 */
export const extractLastUserText = (messages: ReadonlyArray<ModelMessage>): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            return extractMessageText(messages[i].content);
        }
    }
    return null;
};

/**
 * Creates the default LLM-based classifier. Uses structured generation to select
 * the minimal tool set for each user message.
 *
 * @param options.model - Language model for classification (ideally fast/cheap like gpt-4o-mini)
 * @param options.maxHistoryMessages - Max prior turns for context. Default: 8
 * @param options.maxHistoryMessageLength - Max chars per history message. Default: 300
 *
 * @group Agent Toolkit
 */
export const createDefaultClassifier = (options: {
    model: LanguageModel;
    maxHistoryMessages?: number;
    maxHistoryMessageLength?: number;
}): Classifier => {
    const { model, maxHistoryMessages, maxHistoryMessageLength } = options;

    return async (context: ClassifierContext): Promise<ClassificationResult | null> => {
        const { messages, toolsMetadata } = context;
        if (!messages?.length) return null;

        const historyLimit = maxHistoryMessages ?? MAX_CLASSIFIER_HISTORY_MESSAGES;
        const messageCharLimit = maxHistoryMessageLength ?? MAX_HISTORY_MESSAGE_LENGTH;

        // Find last user message index and extract text in one pass
        let lastUserIndex = -1;
        let lastUserText: string | null = null;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserIndex = i;
                lastUserText = extractMessageText(messages[i].content);
                break;
            }
        }
        if (!lastUserText) return null;

        // Compact history
        const conversation: ConversationMessage[] = [];
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
            return await classifyUserIntent(conversation, { chatModel: model, toolsMetadata });
        } catch {
            return null;
        }
    };
};
