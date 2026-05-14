import { AuiIf, ThreadPrimitive } from '@assistant-ui/react';
import { MessageComponent, ThinkingMessage } from './ChatMessage';

export const DEFAULT_WELCOME_TEXT = [
    "Hi! I'm your **map agent** — I can search places, plan routes, find stops along the way, calculate reachable areas, analyze traffic, and style the map.",
    'Not sure where to start? Ask **"What can you do?"**',
    '&nbsp;',
    '🧪 *This is an experimental feature.*',
].join('\n\n');

type ChatMessagesProps = {
    errors?: string[];
    /** Optional starter prompts. Rendered only while the thread has no user messages. */
    suggestedPrompts?: readonly string[];
};

export function ChatMessages({ errors = [], suggestedPrompts }: ChatMessagesProps) {
    return (
        <>
            <ThreadPrimitive.Messages>
                {({ message }) => {
                    if (message.role === 'user' || message.role == 'assistant') return <MessageComponent />;
                    return null;
                }}
            </ThreadPrimitive.Messages>

            {suggestedPrompts && suggestedPrompts.length > 0 && (
                <AuiIf condition={(s) => !s.thread.messages.some((m) => m.role === 'user')}>
                    <div className="flex flex-col items-start gap-1.5 px-3 py-2">
                        {suggestedPrompts.map((prompt) => (
                            <ThreadPrimitive.Suggestion
                                key={prompt}
                                prompt={prompt}
                                send
                                className="max-w-full cursor-pointer rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-1) px-3 py-2 text-left text-(--sdk-font-caption-m) leading-snug text-(--sdk-text-medium) transition-colors hover:border-(--sdk-border-high) hover:bg-(--sdk-surface-2) hover:text-(--sdk-text-high) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sdk-primary-color)"
                            >
                                {prompt}
                            </ThreadPrimitive.Suggestion>
                        ))}
                    </div>
                </AuiIf>
            )}

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
