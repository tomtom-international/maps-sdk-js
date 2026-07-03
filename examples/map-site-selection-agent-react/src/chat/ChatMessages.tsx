import { AuiIf, ThreadPrimitive } from '@assistant-ui/react';
import { useState } from 'react';
import { MessageComponent, ThinkingMessage } from './ChatMessage';

// Figma "Restart" — a centered pill atop the chat content that starts over. Shown once the thread has
// a user turn. A full page reload is the reliable reset: it clears the conversation AND the map (drawn
// layers, pins) AND the side panels back to the initial state in one shot. Tearing those down piecemeal
// (new thread + resetting every store + removing map layers) would risk leaving stale results behind.
function RestartButton() {
    const restart = () => window.location.reload();
    return (
        <div
            className="sticky top-0 z-10 flex items-start justify-center pt-1 pb-4"
            // Solid behind the pill, fading to transparent at the bottom so messages dissolve as they
            // scroll under it (rather than hard-cutting against a solid white bar).
            style={{ background: 'linear-gradient(var(--pb-surface-0) 60%, transparent)' }}
        >
            <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-1.5 rounded-full border border-(--pb-border-low) bg-(--pb-surface-0) px-3 py-1 font-(family-name:--pb-font-primary) text-[12px] leading-[16px] font-bold text-(--pb-text-high) transition-colors hover:bg-(--pb-surface-1)"
            >
                Restart
                <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
            </button>
        </div>
    );
}

const INITIAL_PROMPTS = 3;

// Figma welcome empty-state "Pick a prompt": a left-aligned title over full-width suggestion cards
// (white, hairline border/base-em, rounded-10, Proxima 16/24) and a centered "More prompts" secondary
// pill that reveals the rest. Shown only before the first user turn.
function SuggestedPrompts({ prompts }: { prompts: readonly string[] }) {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? prompts : prompts.slice(0, INITIAL_PROMPTS);
    return (
        <div className="flex w-full flex-col items-center gap-2 py-1">
            <h2 className="m-0 w-full font-(family-name:--pb-font-primary) text-[16px] leading-[24px] font-bold text-(--pb-text-high)">
                Pick a prompt
            </h2>
            <div className="flex w-full flex-col gap-2">
                {visible.map((prompt) => (
                    <ThreadPrimitive.Suggestion
                        key={prompt}
                        prompt={prompt}
                        send
                        className="cursor-pointer rounded-(--pb-radius-10) border border-(--pb-border-base) bg-(--pb-surface-0) px-3 py-2 text-left font-(family-name:--pb-font-secondary) text-[16px] leading-[24px] text-(--pb-text-high) transition-colors hover:border-(--pb-border-low) hover:bg-(--pb-surface-1) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pb-primary-color)"
                    >
                        {prompt}
                    </ThreadPrimitive.Suggestion>
                ))}
            </div>
            {!showAll && prompts.length > INITIAL_PROMPTS && (
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="rounded-full border border-(--pb-border-low) bg-(--pb-surface-0) px-3 py-1.5 font-(family-name:--pb-font-primary) text-[13px] leading-[18px] font-semibold text-(--pb-text-high) transition-colors hover:bg-(--pb-surface-1)"
                >
                    More prompts
                </button>
            )}
        </div>
    );
}

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
            <AuiIf condition={(s) => s.thread.messages.some((m) => m.role === 'user')}>
                <RestartButton />
            </AuiIf>

            <ThreadPrimitive.Messages>
                {({ message }) => {
                    if (message.role === 'user' || message.role == 'assistant') return <MessageComponent />;
                    return null;
                }}
            </ThreadPrimitive.Messages>

            {suggestedPrompts && suggestedPrompts.length > 0 && (
                <AuiIf condition={(s) => !s.thread.messages.some((m) => m.role === 'user')}>
                    <SuggestedPrompts prompts={suggestedPrompts} />
                </AuiIf>
            )}

            {/* Show "Thinking…" only BEFORE the assistant turn starts producing answer text. Once
                output is streaming, the answer itself is the indicator — keeping the thinking
                placeholder up alongside the output is what made it look like a "thinking" bubble
                was rendering the response. */}
            <AuiIf
                condition={(s) => {
                    if (!s.thread.isRunning) return false;
                    const last = s.thread.messages.at(-1);
                    if (last?.role !== 'assistant') return true;
                    const hasAnswerText = (last.content ?? []).some((part) => {
                        const candidate = part as { type?: string; text?: string };
                        return candidate.type === 'text' && (candidate.text?.length ?? 0) > 0;
                    });
                    return !hasAnswerText;
                }}
            >
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
