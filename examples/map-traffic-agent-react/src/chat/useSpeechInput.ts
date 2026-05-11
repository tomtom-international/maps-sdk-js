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
    const [isAlwaysOn, setIsAlwaysOn] = useState(false);

    // Refs hold mutable state accessible inside recognition callbacks without stale closures
    const refs = useRef({
        recognition: null as SpeechRecognitionInstance | null,
        autoSendTimer: null as ReturnType<typeof setTimeout> | null,
        alwaysOnActive: false,
        isThreadRunning: false,
        onTranscript,
        onSend,
    });

    refs.current.onTranscript = onTranscript;
    refs.current.onSend = onSend;
    refs.current.isThreadRunning = isThreadRunning;

    // Pause always-on recognition while the thread is processing, resume after
    const prevRunningRef = useRef(isThreadRunning);
    useEffect(() => {
        const wasRunning = prevRunningRef.current;
        prevRunningRef.current = isThreadRunning;

        if (wasRunning && !isThreadRunning && refs.current.alwaysOnActive) {
            startAlwaysOnRecognition();
        } else if (!wasRunning && isThreadRunning && refs.current.recognition) {
            refs.current.recognition.stop();
        }
    }, [isThreadRunning]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            refs.current.alwaysOnActive = false;
            stopRecognition();
            cancelAutoSend();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function stopRecognition() {
        if (refs.current.recognition) {
            refs.current.recognition.stop();
            refs.current.recognition = null;
        }
    }

    function cancelAutoSend() {
        if (refs.current.autoSendTimer !== null) {
            clearTimeout(refs.current.autoSendTimer);
            refs.current.autoSendTimer = null;
            setStatus('idle');
        }
    }

    function startOneShotRecognition() {
        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;

        let transcript = '';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            transcript = event.results[event.resultIndex][0].transcript;
            refs.current.onTranscript(transcript);
        };

        recognition.onstart = () => {
            refs.current.recognition = recognition;
            setStatus('listening');
        };

        recognition.onend = () => {
            refs.current.recognition = null;

            if (transcript.trim()) {
                setStatus('sending');
                refs.current.autoSendTimer = setTimeout(() => {
                    refs.current.autoSendTimer = null;
                    setStatus('idle');
                    refs.current.onSend();
                }, 1000);
            } else {
                setStatus('idle');
            }
        };

        recognition.onerror = () => {
            refs.current.recognition = null;
            setStatus('idle');
        };

        recognition.start();
    }

    function startAlwaysOnRecognition() {
        if (!SpeechRecognitionAPI || refs.current.isThreadRunning) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.resultIndex];
            refs.current.onTranscript(result[0].transcript);

            if (result.isFinal && result[0].transcript.trim() && !refs.current.isThreadRunning) {
                refs.current.onSend();
            }
        };

        recognition.onstart = () => {
            refs.current.recognition = recognition;
            setStatus('listening');
        };

        recognition.onend = () => {
            refs.current.recognition = null;
            if (refs.current.alwaysOnActive && !refs.current.isThreadRunning) {
                setTimeout(startAlwaysOnRecognition, 200);
            } else {
                setStatus('idle');
            }
        };

        recognition.onerror = () => {
            refs.current.recognition = null;
            if (refs.current.alwaysOnActive && !refs.current.isThreadRunning) {
                setTimeout(startAlwaysOnRecognition, 500);
            } else {
                setStatus('idle');
            }
        };

        recognition.start();
    }

    const onMicClick = () => {
        if (refs.current.alwaysOnActive) {
            refs.current.alwaysOnActive = false;
            setIsAlwaysOn(false);
            stopRecognition();
            setStatus('idle');
            return;
        }

        cancelAutoSend();

        if (refs.current.recognition) {
            refs.current.recognition.stop();
            return;
        }

        startOneShotRecognition();
    };

    const onAlwaysOnChange = (checked: boolean) => {
        refs.current.alwaysOnActive = checked;
        setIsAlwaysOn(checked);

        if (checked) {
            cancelAutoSend();
            stopRecognition();
            startAlwaysOnRecognition();
        } else {
            stopRecognition();
            setStatus('idle');
        }
    };

    const onInputMouseDown = () => cancelAutoSend();

    return { status, isAlwaysOn, onMicClick, onAlwaysOnChange, onInputMouseDown };
}
