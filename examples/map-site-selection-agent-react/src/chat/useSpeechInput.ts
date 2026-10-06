import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start(): void;
    stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type GlobalWithSpeechRecognition = typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const SpeechRecognitionAPI =
    (globalThis as GlobalWithSpeechRecognition).SpeechRecognition ??
    (globalThis as GlobalWithSpeechRecognition).webkitSpeechRecognition;

export const isSpeechSupported = SpeechRecognitionAPI !== undefined;

export type SpeechStatus = 'idle' | 'listening' | 'sending';

type UseSpeechInputOptions = {
    onTranscript: (text: string) => void;
    onSend: () => void;
    isThreadRunning: boolean;
};

export function useSpeechInput({ onTranscript, onSend, isThreadRunning }: UseSpeechInputOptions) {
    const [status, setStatus] = useState<SpeechStatus>('idle');

    // Refs hold mutable state accessible inside recognition callbacks without stale closures.
    const refs = useRef({
        recognition: null as SpeechRecognitionInstance | null,
        sendTimer: null as ReturnType<typeof setTimeout> | null,
        onTranscript,
        onSend,
        isThreadRunning,
    });
    refs.current.onTranscript = onTranscript;
    refs.current.onSend = onSend;
    refs.current.isThreadRunning = isThreadRunning;

    useEffect(() => {
        return () => {
            refs.current.recognition?.stop();
            refs.current.recognition = null;
            if (refs.current.sendTimer) clearTimeout(refs.current.sendTimer);
        };
    }, []);

    const cancelAutoSend = () => {
        if (refs.current.sendTimer) {
            clearTimeout(refs.current.sendTimer);
            refs.current.sendTimer = null;
            setStatus('idle');
        }
    };

    // Push-to-talk: click to start, click again (or finishing speaking) to stop; the transcript fills
    // the composer and auto-sends shortly after.
    const onMicClick = () => {
        if (refs.current.isThreadRunning) return;
        if (refs.current.recognition) {
            refs.current.recognition.stop(); // toggle off
            return;
        }
        if (!SpeechRecognitionAPI) return;
        cancelAutoSend();

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        let transcript = '';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            transcript = event.results[event.resultIndex][0].transcript;
            refs.current.onTranscript(transcript);
        };
        recognition.onstart = () => setStatus('listening');
        recognition.onend = () => {
            refs.current.recognition = null;
            if (transcript.trim()) {
                setStatus('sending');
                refs.current.sendTimer = setTimeout(() => {
                    refs.current.sendTimer = null;
                    setStatus('idle');
                    refs.current.onSend();
                }, 400);
            } else {
                setStatus('idle');
            }
        };
        recognition.onerror = () => {
            refs.current.recognition = null;
            setStatus('idle');
        };

        // Set the ref BEFORE start() so a quick second click toggles off (start fires onstart async).
        refs.current.recognition = recognition;
        try {
            recognition.start();
        } catch {
            refs.current.recognition = null;
            setStatus('idle');
        }
    };

    const onInputMouseDown = () => cancelAutoSend();

    return { status, onMicClick, onInputMouseDown };
}
