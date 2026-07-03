import { message, type ScriptStep, user } from '@langwatch/scenario';
import type { JSONValue, ModelMessage, ToolCallPart, ToolResultPart } from 'ai';

// Prior-turn staging for follow-up scenarios. Instead of narrating loaded state in crafted assistant
// prose, these helpers replay a completed turn the way it actually appears in the model's history: an
// assistant tool-CALL message, the matching tool-RESULT message, then a short summary. The agent under
// test then sees realistic mid-session state (entry IDs live in tool results, not narrated text).

/** One staged tool invocation: the call the assistant made plus the result it observed. */
export type SeededToolCall = { tool: string; input: Record<string, unknown>; output: JSONValue };

/** Convenience constructor for a {@link SeededToolCall}. Suites that validate the output against the
 * tool's own schema can wrap this with their own typed `toolCall`. */
export const toolCall = (tool: string, input: Record<string, unknown>, output: JSONValue): SeededToolCall => ({
    tool,
    input,
    output,
});

/**
 * Replay a completed prior turn as message history: the user request, the assistant's tool-call
 * message, the matching tool-result message, and a short natural-language summary. Returns the
 * `ScriptStep[]` a scenario's `priorTurns` expects.
 */
export const priorTurn = (request: string, calls: SeededToolCall[], summary: string): ScriptStep[] => {
    const toolCallParts: ToolCallPart[] = calls.map((call, index) => ({
        type: 'tool-call',
        toolCallId: `seed-${index}`,
        toolName: call.tool,
        input: call.input,
    }));
    const toolResultParts: ToolResultPart[] = calls.map((call, index) => ({
        type: 'tool-result',
        toolCallId: `seed-${index}`,
        toolName: call.tool,
        output: { type: 'json', value: call.output },
    }));
    const assistantCall: ModelMessage = { role: 'assistant', content: toolCallParts };
    const toolResults: ModelMessage = { role: 'tool', content: toolResultParts };
    const assistantSummary: ModelMessage = { role: 'assistant', content: summary };
    return [user(request), message(assistantCall), message(toolResults), message(assistantSummary)];
};
