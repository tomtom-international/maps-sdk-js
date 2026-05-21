import {
    MessagePrimitive,
    TextMessagePartComponent,
    type ToolCallMessagePartComponent,
    useAuiState,
} from '@assistant-ui/react';
import { marked } from 'marked';
import { ClassificationChip } from './ClassificationChip';
import { useMessageClassification } from './ClassificationsContext';
import { ToolCall } from './ToolCall';

const MarkdownText: TextMessagePartComponent = ({ text }) => (
    <div dangerouslySetInnerHTML={{ __html: marked(text) as string }} />
);

const AssistantText: TextMessagePartComponent = ({ text }) => (
    <div className="message assistant" dangerouslySetInnerHTML={{ __html: marked(text) as string }} />
);

// AI SDK error results can be primitives, Error instances, Zod issues, or plain
// objects. `String(obj)` collapses to "[object Object]"; preserve detail by JSON-
// stringifying objects and reading `.message` off Errors. When the toolErrorSchema
// shape (`{ error: "..." }`) is the only meaningful field, return the bare message;
// otherwise keep the full payload so structured detail (issues, request ids, …) survives.
const formatToolError = (result: unknown): string => {
    if (result === null || result === undefined) return 'Tool call failed';
    if (typeof result === 'string') return result;
    if (result instanceof Error) return result.message || String(result);
    if (typeof result === 'object') {
        const obj = result as Record<string, unknown>;
        const err = typeof obj.error === 'string' ? obj.error : undefined;
        const otherKeys = Object.keys(obj).filter((k) => k !== 'error');
        if (err !== undefined && otherKeys.length === 0) return err;
    }
    try {
        return JSON.stringify(result, null, 2);
    } catch {
        return String(result);
    }
};

// Agent-toolkit tools often surface failures *in-band* via the shared `toolErrorSchema`
// (a `{ error: string }` shape) rather than by throwing. The AI SDK then resolves the call
// as a success with `isError=false`, so checking only `isError` would hide the failure
// inside what looks like a normal output blob.
const inBandError = (result: unknown): boolean =>
    !!result && typeof result === 'object' && 'error' in (result as Record<string, unknown>);

const ToolCallContent: ToolCallMessagePartComponent = ({ toolName, args, result, isError }) => {
    const errored = isError || inBandError(result);
    return (
        <ToolCall
            toolName={toolName}
            input={args}
            output={errored ? undefined : result}
            errorText={errored ? formatToolError(result) : undefined}
        />
    );
};

export function MessageComponent() {
    const { id, role, content } = useAuiState((s) => s.message);
    const classification = useMessageClassification(id);
    const hasContent = content?.length > 0;

    if (role === 'user') {
        return (
            <MessagePrimitive.Root className={hasContent ? 'message user' : ''}>
                <MessagePrimitive.Content components={{ Text: MarkdownText }} />
            </MessagePrimitive.Root>
        );
    }

    return (
        <MessagePrimitive.Root>
            {/* Per-turn classifier picks rendered right above this assistant turn's tool calls.
                `undefined` means either the welcome message or an in-flight turn whose message
                hasn't been zipped with the classifications array yet — skip in both cases. */}
            {classification !== undefined ? <ClassificationChip classification={classification} /> : null}
            <MessagePrimitive.Content
                components={{
                    Text: AssistantText,
                    tools: { Fallback: ToolCallContent },
                }}
            />
        </MessagePrimitive.Root>
    );
}

export function ThinkingMessage() {
    return <div className="message assistant thinking">Thinking...</div>;
}
