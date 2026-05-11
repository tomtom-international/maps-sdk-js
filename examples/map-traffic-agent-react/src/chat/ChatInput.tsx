import { ComposerPrimitive, useAui, useAuiState } from '@assistant-ui/react';
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
        <div>
            {isSpeechSupported && (
                <VoiceCommand
                    speechStatus={speechStatus}
                    isAlwaysOn={isAlwaysOn}
                    isRunning={isRunning}
                    onMicClick={onMicClick}
                    onAlwaysOnChange={onAlwaysOnChange}
                />
            )}
            <ComposerPrimitive.Root id="input-row">
                <ComposerPrimitive.Input
                    id="chat-input"
                    className="sdk-example-input"
                    placeholder="Ask anything"
                    autoComplete="off"
                    rows={1}
                    onMouseDown={onInputMouseDown}
                />
                <ComposerPrimitive.Send className="sdk-example-button" aria-label="Send">
                    <span className="send-button-icon" aria-hidden="true" />
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
    const micButtonClass = [
        'aui-mic-button',
        speechStatus === 'listening' && !isAlwaysOn ? 'recording' : '',
        isAlwaysOn ? 'always-on' : '',
    ]
        .filter(Boolean)
        .join(' ');
    return (
        <div id="mic-row">
            <button
                className={micButtonClass}
                onClick={onMicClick}
                disabled={isRunning}
                aria-label={isAlwaysOn ? 'Stop always-on voice input' : 'Start voice input'}
                title="Voice input"
            >
                <Icon raw={micIconRaw} />
            </button>
            <span className="aui-mic-status">{SPEECH_STATUS_LABEL[speechStatus]}</span>
            {!isTouchDevice() && (
                <label className="aui-always-on-label" title="Continuous voice — auto-sends after each pause">
                    <input
                        type="checkbox"
                        checked={isAlwaysOn}
                        onChange={(event) => onAlwaysOnChange(event.target.checked)}
                        aria-label="Always on"
                    />
                    <span className="aui-always-on-track" aria-hidden="true" />
                    <span className="aui-always-on-text">Always on</span>
                </label>
            )}
        </div>
    );
}
