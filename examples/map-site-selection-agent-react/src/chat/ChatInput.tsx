import { ComposerPrimitive, useAui, useAuiState } from '@assistant-ui/react';
import micIconRaw from './assets/mic.svg?raw';
import { Icon } from './icon';
import { isSpeechSupported, useSpeechInput } from './useSpeechInput';

// AI Input: a white rounded-10 card with border/low-em + elevation e3 and 8px
// padding. It stacks a full-width "Ask anything" text field (Proxima 14/20) over an actions row: a
// disabled attachment button on the left (the feature is unsupported), and a neutral mic + brand-red
// send on the right. The border stays neutral on focus.
export function ChatInput() {
    const aui = useAui();
    const isRunning = useAuiState((s) => s.thread.isRunning);
    const {
        status: speechStatus,
        onMicClick,
        onInputMouseDown,
    } = useSpeechInput({
        onTranscript: (text) => aui.thread().composer().setText(text),
        onSend: () => aui.thread().composer().send(),
        isThreadRunning: isRunning,
    });

    // Listening pulses the mic red; the placeholder shows the state — so the input stays one row.
    const micVisualClass =
        speechStatus === 'listening'
            ? 'bg-[color-mix(in_srgb,var(--pb-color-error)_8%,var(--pb-surface-0))] text-(--pb-color-error) [animation:mic-pulse_1.2s_ease-in-out_infinite]'
            : 'bg-transparent text-(--pb-text-medium) hover:bg-(--pb-surface-1) hover:text-(--pb-text-high)';
    const placeholder =
        speechStatus === 'listening' ? 'Listening…' : speechStatus === 'sending' ? 'Sending…' : 'Ask anything';

    return (
        <div className="flex shrink-0 flex-col gap-1 bg-(--pb-surface-0)">
            {/* AI Input: a rounded-10 card stacking the text field over an actions
                row. Stacking (rather than one inline row) keeps the action buttons put as the textarea
                grows to multiple rows. Border stays neutral on focus — no brand-red active outline. */}
            <ComposerPrimitive.Root className="flex w-full flex-col gap-1 rounded-[10px] border border-(--pb-border-low) bg-(--pb-surface-0) p-2 shadow-(--pb-shadow-e3)">
                {/* Text field — full-width, grows downward up to 200px then scrolls. */}
                <div className="flex w-full px-2 py-1">
                    <ComposerPrimitive.Input
                        id="chat-input"
                        className="min-h-[20px] max-h-[200px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-[14px] leading-[20px] text-(--pb-text-high) shadow-none outline-none [field-sizing:content] placeholder:text-(--pb-text-low) focus:outline-none focus:ring-0"
                        placeholder={placeholder}
                        autoComplete="off"
                        rows={1}
                        onMouseDown={onInputMouseDown}
                    />
                </div>

                {/* Actions row — attachment on the left (disabled: unsupported), mic + brand-red send on
                    the right. md (44px) icon buttons. */}
                <div className="flex w-full items-center justify-between">
                    <button
                        type="button"
                        disabled
                        aria-label="Attach file (not available)"
                        title="Attachments aren't supported yet"
                        className="flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full border-0 bg-transparent text-(--pb-text-disabled) opacity-60 [&_svg]:h-5 [&_svg]:w-5"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                        {isSpeechSupported && (
                            <button
                                type="button"
                                onClick={onMicClick}
                                disabled={isRunning}
                                aria-label={speechStatus === 'listening' ? 'Stop voice input' : 'Start voice input'}
                                title="Voice input"
                                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 transition-colors disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:h-5 [&_svg]:w-5 ${micVisualClass}`}
                            >
                                <Icon raw={micIconRaw} />
                            </button>
                        )}
                        <ComposerPrimitive.Send
                            aria-label="Send"
                            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-(--pb-primary-color) p-0 text-white transition-colors hover:bg-(--pb-primary-hover) disabled:cursor-not-allowed disabled:bg-(--pb-surface-1) disabled:text-(--pb-text-disabled)"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </ComposerPrimitive.Send>
                    </div>
                </div>
            </ComposerPrimitive.Root>
            {/* Tiny always-on AI-mistakes disclaimer (the privacy notice shows once on the welcome screen). */}
            <p className="px-1 text-center font-(family-name:--pb-font-secondary) text-[10px] leading-[14px] text-(--pb-text-low)">
                AI can make mistakes — verify important results.
            </p>
        </div>
    );
}
