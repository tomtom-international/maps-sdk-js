import {
    MessagePrimitive,
    TextMessagePartComponent,
    type ToolCallMessagePartComponent,
    useAuiState,
} from '@assistant-ui/react';
import { marked } from 'marked';
import { ToolCall } from './ToolCall';

const MarkdownText: TextMessagePartComponent = ({ text }) => (
    <div dangerouslySetInnerHTML={{ __html: marked(text) as string }} />
);

const AssistantText: TextMessagePartComponent = ({ text }) => (
    <div className="message assistant" dangerouslySetInnerHTML={{ __html: marked(text) as string }} />
);

// AI SDK error results can be primitives, Error instances, Zod issues, or plain
// objects. `String(obj)` collapses to "[object Object]"; preserve detail by JSON-
// stringifying objects and reading `.message` off Errors.
const formatToolError = (result: unknown): string => {
    if (result === null || result === undefined) return 'Tool call failed';
    if (typeof result === 'string') return result;
    if (result instanceof Error) return result.message || String(result);
    if (typeof result === 'object' && 'error' in (result as Record<string, unknown>)) {
        const err = (result as Record<string, unknown>).error;
        if (typeof err === 'string') return err;
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
    const { role, content } = useAuiState((s) => s.message);
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
