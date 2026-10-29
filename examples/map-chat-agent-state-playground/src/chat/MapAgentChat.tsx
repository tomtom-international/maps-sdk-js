import { AssistantRuntimeProvider, ThreadPrimitive, useAuiState } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import type { ClassificationResult, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport, InferAgentUIMessage } from 'ai';
import { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessages, DEFAULT_WELCOME_TEXT } from './ChatMessages';
import { ClassificationsProvider } from './ClassificationsContext';

// Figma start-screen disclaimer — info-accent box pinned just above the composer until the first turn.
function WelcomeDisclaimer() {
    return (
        <div className="mx-2 mb-3 flex items-start gap-1 rounded-(--ui-rounded-10) bg-[#F5F8FA] p-2 font-(family-name:--ui-font-proxima) text-[10px] leading-[14px] font-semibold text-[#5083A7]">
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
                Your messages are stored for 30 days to monitor and improve the service, then deleted. Don't enter
                personal details about yourself or anyone else. See our{' '}
                <a
                    href="https://www.tomtom.com/en-gb/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-inherit underline"
                >
                    Privacy Statement
                </a>{' '}
                for how we handle data.
            </span>
        </div>
    );
}

// The composer slot: the input, with the start-screen disclaimer pinned above it until the first user turn.
function ChatFooter() {
    const hasUserMessage = useAuiState((s) => s.thread.messages.some((m) => m.role === 'user'));
    return (
        <>
            {!hasUserMessage && <WelcomeDisclaimer />}
            <ChatInput />
        </>
    );
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
    /** Optional running session token totals. When provided, a compact In/Out chip is rendered
     * in the header (hidden until the first turn produces a non-zero count). */
    tokenUsage?: { input: number; output: number };
    /** Per-turn classifier results, in the order the classifier produced them. The Nth entry
     * is paired with the Nth assistant message in the thread (the seeded welcome message is
     * skipped) so each turn's chip can render directly above its own tool calls. */
    classifications?: readonly (ClassificationResult | null)[];
};

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
    tokenUsage,
    classifications = [],
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

    const [isCollapsed, setIsCollapsed] = useState(true);

    // Mobile collapse: shrinks the panel to a thin strip when isCollapsed is true.
    const collapsedClass = isCollapsed ? 'max-sm:max-h-12' : 'max-sm:max-h-[50dvh]';
    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <ClassificationsProvider classifications={classifications}>
                <ThreadPrimitive.Root
                    className={`flex w-[380px] flex-col gap-4 bg-(--ui-surface-0) p-2 transition-[max-height] max-sm:w-full max-sm:overflow-hidden ${collapsedClass}`}
                >
                    <ChatHeader
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed((c) => !c)}
                        label={label}
                        tokenUsage={tokenUsage}
                    />
                    <ThreadPrimitive.Viewport id="chat-messages" className="flex flex-1 flex-col overflow-y-auto">
                        <ChatMessages errors={errors} suggestedPrompts={suggestedPrompts} />
                        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-(--ui-surface-0)">
                            <ChatFooter />
                        </ThreadPrimitive.ViewportFooter>
                    </ThreadPrimitive.Viewport>
                </ThreadPrimitive.Root>
            </ClassificationsProvider>
        </AssistantRuntimeProvider>
    );
}
