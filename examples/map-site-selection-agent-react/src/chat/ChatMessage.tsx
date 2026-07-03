import {
    MessagePrimitive,
    TextMessagePartComponent,
    type ToolCallMessagePartComponent,
    useAuiState,
} from '@assistant-ui/react';
import { marked } from 'marked';
import { useState } from 'react';
import agentsDemoIconRaw from './assets/agents-demo-icon.svg?raw';
import { Icon } from './icon';
import { ToolCall, ToolDisclosure } from './ToolCall';

// User turns are static, so a one-shot marked() render is fine.
const MarkdownText: TextMessagePartComponent = ({ text }) => (
    <div dangerouslySetInnerHTML={{ __html: marked(text) as string }} />
);

// Assistant turns render markdown with marked() → innerHTML, styled by the existing
// `.message.assistant` CSS — same as the user/welcome turns and the sibling agent examples.
// We intentionally avoid @assistant-ui/react-markdown's MarkdownTextPrimitive: it pulls in the
// unified/remark/vfile chain, and vfile's `#minpath` package-`imports` subpath can't be resolved
// by Sandpack's in-browser bundler (same class as the SANDPACK_DEP_PIN `#mcp-stdio` seam), which
// crashed this example's docs-portal Sandpack preview.
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

type ToolCallData = { toolCallId: string; toolName: string; input: unknown; output: unknown; errorText?: string };

// Pull the turn's executed tool calls out of the message content (excluding clarifyIntent, whose UI is
// the pinned wizard). These become the per-tool rows grouped under the "Used N tools" disclosure.
function extractToolCalls(content: readonly unknown[] | undefined): ToolCallData[] {
    return (content ?? [])
        .map(
            (p) =>
                p as {
                    type?: string;
                    toolCallId?: string;
                    toolName?: string;
                    args?: unknown;
                    result?: unknown;
                    isError?: boolean;
                },
        )
        .filter((p) => p.type === 'tool-call' && p.toolName !== 'clarifyIntent')
        .map((p) => {
            const errored = !!p.isError || inBandError(p.result);
            return {
                toolCallId: p.toolCallId ?? p.toolName ?? '',
                toolName: p.toolName ?? 'tool',
                input: p.args,
                output: errored ? undefined : p.result,
                errorText: errored ? formatToolError(p.result) : undefined,
            };
        });
}

// "Used N tools" pill: the turn's tool calls collapsed into one chip that expands to the
// individual per-tool rows. Renders nothing on turns that ran no (non-clarify) tools.
function ToolGroup({ toolCalls }: { toolCalls: ToolCallData[] }) {
    const n = toolCalls.length;
    if (n === 0) return null;
    return (
        <details className="group/used my-1 w-full self-start">
            <summary className="inline-flex w-fit cursor-pointer list-none items-center gap-1 rounded-[5px] bg-[rgba(0,0,0,0.04)] py-1 pr-1 pl-2 font-(family-name:--pb-font-code) text-[12px] leading-5 font-semibold text-(--pb-text-high) group-open/used:rounded-b-none [&::-webkit-details-marker]:hidden">
                <span>
                    Used {n} {n === 1 ? 'tool' : 'tools'}
                </span>
                <svg
                    className="shrink-0 transition-transform group-open/used:rotate-90"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </summary>
            <div className="flex w-full flex-col rounded-b-(--pb-radius-10) rounded-tr-(--pb-radius-10) bg-[rgba(0,0,0,0.04)] p-1">
                {toolCalls.map((tc) => (
                    <ToolDisclosure
                        key={tc.toolCallId}
                        toolName={tc.toolName}
                        input={tc.input}
                        output={tc.output}
                        errorText={tc.errorText}
                    />
                ))}
            </div>
        </details>
    );
}

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

// The copy control below an agent reply. The button itself is the hit zone — 32px square around a
// 16px icon ("extended hit zone") — so the tappable area is far larger than the glyph.
function ActionIcon({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-(--pb-radius-5) border-0 bg-transparent text-(--pb-text-low) transition-colors hover:bg-(--pb-surface-1) hover:text-(--pb-text-high) [&_svg]:h-4 [&_svg]:w-4"
        >
            {children}
        </button>
    );
}

// Action row beneath an agent reply: a single copy-the-reply control. (Thumbs up/down and the
// more-options affordance were removed per captain review.) The padded hit zone (see ActionIcon)
// doubles as the breathing room between the last reply and the composer.
function AssistantActions({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        void navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => setCopied(false));
    };
    return (
        <div className="-ml-1.5 mt-0.5 mb-2 flex items-center gap-0.5">
            <ActionIcon label={copied ? 'Copied' : 'Copy'} onClick={copy}>
                {copied ? (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                ) : (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                )}
            </ActionIcon>
        </div>
    );
}

// The turn's plain answer text (markdown source), concatenated from its text parts — used as the copy
// payload and to decide whether the actions row should render (tool-only turns have none).
function getAnswerText(content: readonly unknown[] | undefined): string {
    return (content ?? [])
        .map((p) => p as { type?: string; text?: unknown })
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text as string)
        .join('');
}

export function MessageComponent() {
    const { id, role, content } = useAuiState((s) => s.message);
    const hasUserMessage = useAuiState((s) => s.thread.messages.some((m) => m.role === 'user'));
    const hasContent = content?.length > 0;

    // The seeded welcome renders as the start screen: a red two-star spark, the "Site Selection
    // Agent" title + tagline (centered), and a full-width divider above the prompts. Not a chat bubble.
    // Once the user sends their first prompt it disappears (the Restart pill takes its place).
    if (id === 'welcome') {
        if (hasUserMessage) return null;
        const welcomeMarkdown = (content ?? [])
            .map((part) =>
                typeof (part as { text?: string }).text === 'string' ? (part as { text: string }).text : '',
            )
            .join('');
        return (
            <MessagePrimitive.Root>
                <section className="chat-welcome">
                    <span className="chat-welcome-spark" aria-hidden="true">
                        <Icon raw={agentsDemoIconRaw} />
                    </span>
                    <div dangerouslySetInnerHTML={{ __html: marked(welcomeMarkdown) as string }} />
                    <hr className="chat-welcome-divider" />
                </section>
            </MessagePrimitive.Root>
        );
    }

    if (role === 'user') {
        return (
            <MessagePrimitive.Root className={hasContent ? 'message user' : ''}>
                <MessagePrimitive.Content components={{ Text: MarkdownText }} />
            </MessagePrimitive.Root>
        );
    }

    const answerText = getAnswerText(content as readonly unknown[] | undefined);
    return (
        <MessagePrimitive.Root>
            {/* The turn's tool calls collapsed into the "Used N tools" pill — it expands to the
                per-tool rows. Rendered above the answer text. */}
            <ToolGroup toolCalls={extractToolCalls(content as readonly unknown[] | undefined)} />
            <MessagePrimitive.Content
                components={{
                    Text: AssistantText,
                    tools: { Fallback: ToolCallContent },
                }}
            />
            {/* Action row beneath the reply. Only on turns that produced answer
                text — tool-only turns get none. */}
            {answerText.trim() && <AssistantActions text={answerText} />}
        </MessagePrimitive.Root>
    );
}

export function ThinkingMessage() {
    return <div className="message assistant thinking">Thinking...</div>;
}
