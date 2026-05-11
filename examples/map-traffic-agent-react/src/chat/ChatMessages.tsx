import { AuiIf, ThreadPrimitive } from '@assistant-ui/react';
import { MessageComponent, ThinkingMessage } from './ChatMessage';

export const WELCOME_TEXT = [
    "I'm your **live traffic operations** partner — ask me what's happening on the network right now, where the biggest slowdowns are, or to triage a specific work zone or zone.",
    '&nbsp;',
    '🧪 *Experimental feature.*',
].join('\n\n');

const SUGGESTED_PROMPTS = [
    "What incidents are happening on London's roads right now?",
    'Summarise the 3 biggest slowdown clusters in central London',
    'Focus on the worst delays inside the M25',
];

type ChatMessagesProps = {
    errors?: string[];
};

export function ChatMessages({ errors = [] }: ChatMessagesProps) {
    return (
        <>
            <ThreadPrimitive.Messages>
                {({ message }) => {
                    if (message.role === 'user' || message.role == 'assistant') return <MessageComponent />;
                    return null;
                }}
            </ThreadPrimitive.Messages>

            <AuiIf condition={(s) => !s.thread.messages.some((m) => m.role === 'user')}>
                <div className="chat-suggestions">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                        <ThreadPrimitive.Suggestion key={prompt} prompt={prompt} send className="chat-suggestion">
                            {prompt}
                        </ThreadPrimitive.Suggestion>
                    ))}
                </div>
            </AuiIf>

            <AuiIf condition={(s) => s.thread.isRunning}>
                <ThinkingMessage />
            </AuiIf>

            {errors.map((msg, i) => (
                <div key={i} className="message error">
                    {msg}
                </div>
            ))}
        </>
    );
}
