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
                        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-(--ui-rounded-10) border border-(--ui-border-low-em) bg-(--ui-surface-1) px-3 py-2 text-(--ui-font-caption-m) text-(--ui-text-med-em) transition-colors hover:border-(--ui-border-high-em) hover:bg-(--ui-surface-2) hover:text-(--ui-text-high-em) [&::-webkit-details-marker]:hidden">
                            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
                                ›
                            </span>
                            <span>Try an example prompt</span>
                            <span className="ml-auto text-(--ui-text-low-em)">({suggestedPrompts.length})</span>
                        </summary>
                        <div className="mt-1.5 flex flex-col items-start gap-1.5">
                            {suggestedPrompts.map((prompt) => (
                                <ThreadPrimitive.Suggestion
                                    key={prompt}
                                    prompt={prompt}
                                    send
                                    className="max-w-full cursor-pointer rounded-(--ui-rounded-10) border border-(--ui-border-low-em) bg-(--ui-surface-1) px-3 py-2 text-left text-(--ui-font-caption-m) leading-snug text-(--ui-text-med-em) transition-colors hover:border-(--ui-border-high-em) hover:bg-(--ui-surface-2) hover:text-(--ui-text-high-em) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ui-surface-brand-red)"
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
