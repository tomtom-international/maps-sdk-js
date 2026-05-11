import { AssistantRuntimeProvider, ThreadPrimitive } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import type { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport, InferAgentUIMessage } from 'ai';
import { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessages, WELCOME_TEXT } from './ChatMessages';

type MapAgentChatProps = {
    transport: ChatTransport<InferAgentUIMessage<ReturnType<typeof createMapAgent>>>;
    deploymentId: string;
    availableDeployments: readonly string[];
    onDeploymentChange: (deploymentId: string) => void;
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

export function MapAgentChat({ transport, deploymentId, availableDeployments, onDeploymentChange }: MapAgentChatProps) {
    const [errors, setErrors] = useState<string[]>([]);

    const runtime = useChatRuntime({
        transport,
        messages: [
            {
                id: 'welcome',
                role: 'assistant',
                parts: [{ type: 'text', text: WELCOME_TEXT }],
            },
        ],
        onError: (err) => {
            setErrors((prev) => [...prev, formatError(err)]);
        },
    });

    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <ThreadPrimitive.Root id="chat-panel" className={isCollapsed ? 'collapsed' : undefined}>
                <ChatHeader
                    isCollapsed={isCollapsed}
                    onToggle={() => setIsCollapsed((c) => !c)}
                    deploymentId={deploymentId}
                    availableDeployments={availableDeployments}
                    onDeploymentChange={onDeploymentChange}
                />
                <ThreadPrimitive.Viewport id="chat-messages">
                    <ChatMessages errors={errors} />
                    <ThreadPrimitive.ViewportFooter className="chat-footer">
                        <ChatInput />
                    </ThreadPrimitive.ViewportFooter>
                </ThreadPrimitive.Viewport>
            </ThreadPrimitive.Root>
        </AssistantRuntimeProvider>
    );
}
