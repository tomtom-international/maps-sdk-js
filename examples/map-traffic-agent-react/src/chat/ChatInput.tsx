import { ComposerPrimitive, useAui, useAuiState } from '@assistant-ui/react';
import { Toggle } from '../ui/components';
import micIconRaw from './assets/mic.svg?raw';
import { Icon } from './icon';
import { isSpeechSupported, type SpeechStatus, useSpeechInput } from './useSpeechInput';

const SPEECH_STATUS_LABEL: Record<SpeechStatus, string> = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    sending: 'Sending...',
};

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

export function ChatInput() {
    const aui = useAui();
    const isRunning = useAuiState((s) => s.thread.isRunning);
    const {
        status: speechStatus,
        isAlwaysOn,
        onMicClick,
        onAlwaysOnChange,
        onInputMouseDown,
    } = useSpeechInput({
        onTranscript: (text) => aui.thread().composer().setText(text),
        onSend: () => aui.thread().composer().send(),
        isThreadRunning: isRunning,
    });

    return (
        <div className="flex shrink-0 flex-col gap-1 bg-(--sdk-surface-0)">
            {isSpeechSupported && (
                <VoiceCommand
                    speechStatus={speechStatus}
                    isAlwaysOn={isAlwaysOn}
                    isRunning={isRunning}
                    onMicClick={onMicClick}
                    onAlwaysOnChange={onAlwaysOnChange}
                />
            )}
            <ComposerPrimitive.Root className="flex min-h-[60px] items-center gap-2 rounded-[10px] border border-(--sdk-border-low) bg-(--sdk-surface-0) p-2 shadow-(--sdk-shadow-e3) transition-colors focus-within:border-(--sdk-primary-color)">
                <ComposerPrimitive.Input
                    id="chat-input"
                    className="min-h-[28px] max-h-[200px] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-2 leading-[1.4] text-(--sdk-text-high) shadow-none outline-none [field-sizing:content] focus:outline-none focus:ring-0"
                    placeholder="Ask anything"
                    autoComplete="off"
                    rows={1}
                    onMouseDown={onInputMouseDown}
                />
                <ComposerPrimitive.Send
                    aria-label="Send"
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[40px] border-0 bg-(--sdk-primary-color) p-0 text-transparent disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <span
                        aria-hidden="true"
                        className="ml-[2px] h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white"
                    />
                </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
        </div>
    );
}

type VoiceCommandProps = {
    speechStatus: SpeechStatus;
    isAlwaysOn: boolean;
    isRunning: boolean;
    onMicClick: () => void;
    onAlwaysOnChange: (checked: boolean) => void;
};

function VoiceCommand({ speechStatus, isAlwaysOn, isRunning, onMicClick, onAlwaysOnChange }: VoiceCommandProps) {
    // Mic button visual states map to SDK tokens via a lookup so we don't string-compose Tailwind
    // classes mid-render (which v4's CLI scanner can't see).
    const isRecording = speechStatus === 'listening' && !isAlwaysOn;
    const micVisualClass = isAlwaysOn
        ? 'bg-[color-mix(in_srgb,var(--sdk-primary-color)_8%,var(--sdk-surface-0))] text-(--sdk-primary-color) shadow-[0_0_0_4px_color-mix(in_srgb,var(--sdk-primary-color)_15%,transparent)] [animation:mic-pulse_2s_ease-in-out_infinite]'
        : isRecording
          ? 'bg-[color-mix(in_srgb,var(--sdk-color-error)_8%,var(--sdk-surface-0))] text-(--sdk-color-error) [animation:mic-pulse_1.2s_ease-in-out_infinite]'
          : 'bg-transparent text-(--sdk-text-medium) hover:bg-(--sdk-surface-1) hover:text-(--sdk-text-high)';

    return (
        <div className="flex items-center gap-2 px-2 max-sm:px-1">
            <button
                onClick={onMicClick}
                disabled={isRunning}
                aria-label={isAlwaysOn ? 'Stop always-on voice input' : 'Start voice input'}
                title="Voice input"
                className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${micVisualClass}`}
            >
                <Icon raw={micIconRaw} />
            </button>
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-(--sdk-text-low)">
                {SPEECH_STATUS_LABEL[speechStatus]}
            </span>
            {!isTouchDevice() && (
                <Toggle
                    checked={isAlwaysOn}
                    onChange={onAlwaysOnChange}
                    label="Always on"
                    title="Continuous voice — auto-sends after each pause"
                    size="sm"
                    tone="primary"
                    labelClassName="flex shrink-0 cursor-pointer select-none items-center gap-2 text-[12px] text-(--sdk-text-medium)"
                />
            )}
        </div>
    );
}
