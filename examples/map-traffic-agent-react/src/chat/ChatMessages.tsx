import { AuiIf, ThreadPrimitive } from '@assistant-ui/react';
import { MessageComponent, ThinkingMessage } from './ChatMessage';

export const DEFAULT_WELCOME_TEXT = [
    'Hi! I\'m your **map agent** — try a prompt below, or ask **"What can you do?"**',
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
                    <details className="group px-3 py-2">
                        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-1) px-3 py-2 text-(--sdk-font-caption-m) text-(--sdk-text-medium) transition-colors hover:border-(--sdk-border-high) hover:bg-(--sdk-surface-2) hover:text-(--sdk-text-high) [&::-webkit-details-marker]:hidden">
                            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
                                ›
                            </span>
                            <span>Try an example prompt</span>
                            <span className="ml-auto text-(--sdk-text-low)">({suggestedPrompts.length})</span>
                        </summary>
                        <div className="mt-1.5 flex flex-col items-start gap-1.5">
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
                    </details>
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
