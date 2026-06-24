import './chat.css';
import { type AssistantRuntime, AssistantRuntimeProvider, ThreadPrimitive } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import type { ClassificationResult, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport, InferAgentUIMessage } from 'ai';
import { useEffect, useState } from 'react';
import { sendMessageToCurrentThread } from './assistantRuntimeUtils';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessages, DEFAULT_WELCOME_TEXT } from './ChatMessages';
import { ClassificationsProvider } from './ClassificationsContext';

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
    /** Per-turn classifier results, in the order the classifier produced them. The Nth entry is
     * paired with the Nth non-welcome assistant message so each turn's chip can render above its
     * own tool calls. */
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
    deploymentId,
    availableDeployments,
    onDeploymentChange,
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
            <ClassificationsProvider classifications={classifications}>
                <ThreadPrimitive.Root
                    className={`flex w-[380px] flex-col gap-4 bg-(--sdk-surface-0) p-2 transition-[max-height] max-sm:w-full max-sm:overflow-hidden ${collapsedClass}`}
                >
                    <ChatHeader
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed((c) => !c)}
                        label={label}
                        deploymentId={deploymentId}
                        availableDeployments={availableDeployments}
                        onDeploymentChange={onDeploymentChange}
                    />
                    <ThreadPrimitive.Viewport id="chat-messages" className="flex flex-1 flex-col overflow-y-auto">
                        <ChatMessages errors={errors} suggestedPrompts={suggestedPrompts} />
                        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-(--sdk-surface-0)">
                            <ChatInput />
                        </ThreadPrimitive.ViewportFooter>
                    </ThreadPrimitive.Viewport>
                </ThreadPrimitive.Root>
            </ClassificationsProvider>
        </AssistantRuntimeProvider>
    );
}
