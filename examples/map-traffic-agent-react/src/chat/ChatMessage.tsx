import {
    MessagePrimitive,
    type ReasoningMessagePartComponent,
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

// A successful tool result of `{ error: string }` is our convention for in-band failures
// (e.g. "No incidents loaded. Call getTrafficIncidents first"). Treat those as errors in
// the UI so the message isn't hidden inside a successful-looking "output" blob.
function inBandError(result: unknown): boolean {
    return !!result && typeof result === 'object' && 'error' in (result as Record<string, unknown>);
}

function stringifyError(raw: unknown): string {
    if (typeof raw === 'string') return raw;
    try {
        return JSON.stringify(raw, null, 2);
    } catch {
        return String(raw);
    }
}

const ReasoningContent: ReasoningMessagePartComponent = ({ text, status }) => {
    const streaming = status?.type === 'running';
    if (!text && !streaming) return null;
    return (
        <details className="message assistant reasoning" open={streaming}>
            <summary>{streaming ? 'Thinking…' : 'Thought process'}</summary>
            <div className="reasoning-body">{text}</div>
        </details>
    );
};

const ToolCallContent: ToolCallMessagePartComponent = ({ toolName, args, result, isError }) => {
    const errored = isError || inBandError(result);
    return (
        <ToolCall
            toolName={toolName}
            input={args}
            output={errored ? undefined : result}
            errorText={errored ? stringifyError(result) : undefined}
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
                    Reasoning: ReasoningContent,
                    tools: { Fallback: ToolCallContent },
                }}
            />
        </MessagePrimitive.Root>
    );
}

export function ThinkingMessage() {
    return <div className="message assistant thinking">Thinking...</div>;
}
