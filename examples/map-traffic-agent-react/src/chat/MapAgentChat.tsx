import '../../../src/templates/css/agent-chat.css';
import { type AssistantRuntime, AssistantRuntimeProvider, ThreadPrimitive, useAuiState } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import type { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport, InferAgentUIMessage } from 'ai';
import { useEffect, useState } from 'react';
import { sendMessageToCurrentThread } from './assistantRuntimeUtils';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessages, DEFAULT_WELCOME_TEXT } from './ChatMessages';
import { ClarifyForm, type ClarifyQuestion } from './ClarifyForm';

// While the agent is awaiting a clarifyIntent answer, the survey wizard takes over the composer slot
// (pinned at the bottom, per Figma). Detect it from the LAST assistant turn's clarifyIntent tool call —
// once the user answers, a user message becomes last and this returns null, restoring the input.
function usePendingClarify(): { key: string; questions: ClarifyQuestion[] } | null {
    const part = useAuiState((s) => {
        const last = s.thread.messages.at(-1);
        if (!last || last.role !== 'assistant') return undefined;
        return (last.content ?? []).find(
            (p) =>
                (p as { type?: string }).type === 'tool-call' &&
                (p as { toolName?: string }).toolName === 'clarifyIntent',
        );
    });
    // Only show the wizard once the call has finished streaming — clarifyIntent sets a `result` when its
    // args are fully parsed, so this avoids rendering a half-built question set.
    if ((part as { result?: unknown } | undefined)?.result === undefined) return null;
    const questions = (part as { args?: { questions?: unknown } } | undefined)?.args?.questions;
    if (!Array.isArray(questions) || questions.length === 0) return null;
    const valid = questions.every(
        (q) =>
            q &&
            typeof q === 'object' &&
            typeof (q as { id?: unknown }).id === 'string' &&
            typeof (q as { question?: unknown }).question === 'string' &&
            Array.isArray((q as { options?: unknown }).options),
    );
    if (!valid) return null;
    const key = (part as { toolCallId?: string } | undefined)?.toolCallId ?? 'clarify';
    return { key, questions: questions as ClarifyQuestion[] };
}

type MapAgentChatProps = {
    transport: ChatTransport<InferAgentUIMessage<ReturnType<typeof createMapAgent>>>;
    /** Optional header label override. Defaults to "Maps agent". */
    label?: string;
    /** Optional welcome message rendered as the seeded assistant turn. Defaults to a generic
     * maps-agent intro. */
    welcomeText?: string;
    /** Optional starter prompts rendered as clickable suggestions while the thread is empty. */
    suggestedPrompts?: readonly string[];
    /** Optional deployment selector. When `availableDeployments` has more than one entry the
     * header renders a `<select>`; with one entry it shows a static badge. Omit for no badge. */
    deploymentId?: string;
    availableDeployments?: readonly string[];
    onDeploymentChange?: (deploymentId: string) => void;
};

// Figma start-screen disclaimer — info-accent box pinned just above the composer until the first turn.
function WelcomeDisclaimer() {
    return (
        <div className="mb-2 flex items-start gap-1 rounded-(--pb-radius-10) bg-[#F5F8FA] p-2 font-(family-name:--pb-font-secondary) text-[10px] leading-[14px] font-semibold text-[#5083A7]">
            <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-px shrink-0"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" strokeLinecap="round" />
                <path d="M12 8h.01" strokeLinecap="round" />
            </svg>
            <span>
                This tool is powered by AI and may produce mistakes. All chats are temporarily stored for learning
                purposes only — we advise to avoid using personal information.
            </span>
        </div>
    );
}

// The composer slot: the pinned survey wizard while a clarify is awaiting an answer, otherwise the input
// (with the start-screen disclaimer pinned above it until the first user turn). Keyed by the tool-call id
// so a fresh clarify later in the session resets the wizard's step/answers.
function ChatFooter() {
    const clarify = usePendingClarify();
    // Skipping every question dismisses the wizard (restoring the composer) without sending a message.
    // Keyed by the clarify tool-call id so a later clarify re-opens the form.
    const [dismissedKey, setDismissedKey] = useState<string | null>(null);
    const hasUserMessage = useAuiState((s) => s.thread.messages.some((m) => m.role === 'user'));
    if (clarify && clarify.key !== dismissedKey) {
        return (
            <ClarifyForm
                key={clarify.key}
                questions={clarify.questions}
                onDismiss={() => setDismissedKey(clarify.key)}
            />
        );
    }
    return (
        <>
            {!hasUserMessage && <WelcomeDisclaimer />}
            <ChatInput />
        </>
    );
}

function formatError(error: unknown): string {
    const statusCode =
        error instanceof Error && 'statusCode' in error ? (error as { statusCode: number }).statusCode : null;
    const message = error instanceof Error ? error.message : '';

    if (statusCode === 429 || message.includes('Too Many Requests')) {
        const retryMatch = message.match(/(\d+)\s*second/i);
        const retrySuffix = retryMatch ? ` Please wait ${retryMatch[1]} seconds.` : '';
        return `Rate limit exceeded.${retrySuffix} Try again shortly.`;
    }
    return message || 'An unexpected error occurred.';
}

export function MapAgentChat({
    transport,
    label,
    welcomeText = DEFAULT_WELCOME_TEXT,
    suggestedPrompts,
    deploymentId,
    availableDeployments,
    onDeploymentChange,
}: MapAgentChatProps) {
    const [errors, setErrors] = useState<string[]>([]);

    const runtime = useChatRuntime({
        transport,
        messages: [
            {
                id: 'welcome',
                role: 'assistant',
                parts: [{ type: 'text', text: welcomeText }],
            },
        ],
        onError: (err) => {
            setErrors((prev) => [...prev, formatError(err)]);
        },
    });

    // Eval mode only: expose a hook the Playwright proxy calls to drive the agent
    // through the app's real send path.
    useEffect(() => {
        if (process.env.VITE_EVAL_MODE !== 'true') return;
        (globalThis as Record<string, unknown>).__sendMessageToAgentUnderTest = (query: string) =>
            sendMessageToCurrentThread(runtime, query);
    }, [runtime]);

    const [isCollapsed, setIsCollapsed] = useState(true);

    // Mobile collapse: shrinks the panel to a thin strip when isCollapsed is true.
    const collapsedClass = isCollapsed ? 'max-sm:max-h-12' : 'max-sm:max-h-[50dvh]';
    return (
        <AssistantRuntimeProvider runtime={runtime as unknown as AssistantRuntime}>
            <ThreadPrimitive.Root
                className={`flex h-full w-full flex-col gap-3 rounded-[20px] bg-(--pb-surface-0) py-3 pr-2 pl-3 transition-[max-height] max-sm:w-full max-sm:rounded-none max-sm:overflow-hidden ${collapsedClass}`}
            >
                <ChatHeader
                    isCollapsed={isCollapsed}
                    onToggle={() => setIsCollapsed((c) => !c)}
                    label={label}
                    deploymentId={deploymentId}
                    availableDeployments={availableDeployments}
                    onDeploymentChange={onDeploymentChange}
                />
                {/* px-2 insets the scrolling messages so they read as narrower than the composer. */}
                <ThreadPrimitive.Viewport id="chat-messages" className="flex flex-1 flex-col overflow-y-auto px-2">
                    <ChatMessages errors={errors} suggestedPrompts={suggestedPrompts} />
                </ThreadPrimitive.Viewport>
                {/* Composer is a static bottom bar outside the scroll viewport — as a sticky footer
                    inside it, it floated over messages when a turn's content reflowed. */}
                <div className="shrink-0">
                    <ChatFooter />
                </div>
            </ThreadPrimitive.Root>
        </AssistantRuntimeProvider>
    );
}
