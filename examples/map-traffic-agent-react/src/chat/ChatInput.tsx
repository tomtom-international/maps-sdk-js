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
            ? 'bg-[color-mix(in_srgb,var(--ui-surface-brand-red)_8%,var(--ui-surface-0))] text-(--ui-surface-brand-red) [animation:mic-pulse_1.2s_ease-in-out_infinite]'
            : 'bg-transparent text-(--ui-text-med-em) hover:bg-(--ui-surface-1) hover:text-(--ui-text-high-em)';
    const placeholder =
        speechStatus === 'listening' ? 'Listening…' : speechStatus === 'sending' ? 'Sending…' : 'Ask anything';

    return (
        <div className="flex shrink-0 flex-col gap-1 bg-(--ui-surface-0)">
            {/* AI Input: a rounded-10 card stacking the text field over an actions
                row. Stacking (rather than one inline row) keeps the action buttons put as the textarea
                grows to multiple rows. Border stays neutral on focus — no brand-red active outline. */}
            <ComposerPrimitive.Root className="flex w-full flex-col gap-1 rounded-[10px] border border-(--ui-border-low-em) bg-(--ui-surface-0) p-2 shadow-(--ui-elevation-e3)">
                {/* Text field — full-width, grows downward up to 200px then scrolls. */}
                <div className="flex w-full px-2 py-1">
                    <ComposerPrimitive.Input
                        id="chat-input"
                        className="min-h-[20px] max-h-[200px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-[14px] leading-[20px] text-(--ui-text-high-em) shadow-none outline-none [field-sizing:content] placeholder:text-(--ui-text-low-em) focus:outline-none focus:ring-0"
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
                        className="flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full border-0 bg-transparent text-(--ui-text-disabled) opacity-60 [&_svg]:h-5 [&_svg]:w-5"
                    >
                        {/* Attachment glyph exported verbatim from the Figma AI-toolkit design. */}
                        <svg viewBox="13 13 18 18" fill="currentColor" aria-hidden="true">
                            <path d="M21.0044 13.6667C19.2524 13.6667 17.8333 15.0858 17.8333 16.8378V26.0561C17.8333 28.4201 19.7465 30.3334 22.1106 30.3334C24.4747 30.3334 26.3879 28.4201 26.3879 26.0561V17.354H24.8392V26.0561C24.8392 27.5637 23.6182 28.7847 22.1106 28.7847C20.603 28.7847 19.382 27.5637 19.382 26.0561V16.8378C19.382 15.9423 20.1089 15.2154 21.0044 15.2154C21.8999 15.2154 22.6268 15.9423 22.6268 16.8378V24.5811C22.6268 24.8646 22.394 25.0974 22.1106 25.0974C21.8272 25.0974 21.5944 24.8646 21.5944 24.5811V17.354H20.0457V24.5811C20.0457 25.721 20.9707 26.646 22.1106 26.646C23.2505 26.646 24.1755 25.721 24.1755 24.5811V16.8378C24.1755 15.0858 22.7564 13.6667 21.0044 13.6667Z" />
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
                            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-(--ui-surface-brand-red) p-0 text-white transition-colors hover:bg-(--ui-surface-brand-red-hover) disabled:cursor-not-allowed disabled:bg-(--ui-surface-1) disabled:text-(--ui-text-disabled)"
                        >
                            {/* Send glyph exported verbatim from the Figma AI-toolkit design. */}
                            <svg viewBox="13 13 18 18" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M16.5271 14.6083L15.3333 15.6245L17.8333 22.2912L18.6136 22.8319H22.7802V21.1652H19.1911L17.7044 17.2007L26.1006 21.9986L17.7311 26.7812L18.609 24.4986H16.8233L15.3358 28.3661L16.5271 29.3888L28.1937 22.7221V21.275L16.5271 14.6083Z"
                                />
                            </svg>
                        </ComposerPrimitive.Send>
                    </div>
                </div>
            </ComposerPrimitive.Root>
        </div>
    );
}
