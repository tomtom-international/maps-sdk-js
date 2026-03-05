import type { Map as MapLibreMap } from 'maplibre-gl';

export type EvalTokenUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
};

export type EvalTelemetry = {
    completed: boolean;
    error: string | null;
    userMessages: string[];
    steps: Array<{
        index: number;
        toolCalls: Array<{ name: string; input: unknown; output: unknown }>;
        usage: EvalTokenUsage;
    }>;
    totalUsage: EvalTokenUsage;
    classification: {
        groups: string[];
        activeToolNames: string[];
        timeMs: number;
        usage: EvalTokenUsage;
    } | null;
    agentText: string;
    wallClockMs: number;
};

export type EvalWindow = {
    __evalTelemetry: EvalTelemetry;
    __evalReset: () => void;
    __evalSendMessage: (query: string) => void;
    __maplibreMap: MapLibreMap;
};
