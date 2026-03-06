import type { EvalTelemetry, EvalTokenUsage, EvalWindow } from './types';

type TokenUsageLike = {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
};

type ClassificationLike = {
    groups: string[];
    activeToolNames: string[];
    timeMs: number;
    usage?: TokenUsageLike;
};

type ToolCallLike = {
    toolCallId: string;
    toolName: string;
    input: unknown;
};

type ToolResultLike = {
    toolCallId: string;
    output: unknown;
};

type StepLike = {
    toolCalls: ToolCallLike[];
    toolResults?: ToolResultLike[];
    usage?: TokenUsageLike;
};

const toTokenUsage = (usage?: TokenUsageLike): EvalTokenUsage => ({
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
});

export const createEmptyEvalTelemetry = (): EvalTelemetry => ({
    completed: false,
    error: null,
    userMessages: [],
    steps: [],
    totalUsage: toTokenUsage(),
    classification: null,
    agentText: '',
    wallClockMs: 0,
});

export class EvalTelemetryRuntime {
    private telemetry: EvalTelemetry = createEmptyEvalTelemetry();

    constructor(private readonly enabled: boolean) {
        this.sync();
    }

    reset(): void {
        if (!this.enabled) {
            return;
        }

        this.telemetry = createEmptyEvalTelemetry();
        this.sync();
    }

    startRun(): void {
        this.reset();
    }

    onUserMessage(message: string): void {
        if (!this.enabled) {
            return;
        }

        this.telemetry.userMessages.push(message);
        this.sync();
    }

    onClassify(classification: ClassificationLike | null): void {
        if (!this.enabled) {
            return;
        }

        this.telemetry.classification = classification
            ? {
                  groups: classification.groups,
                  activeToolNames: classification.activeToolNames,
                  timeMs: classification.timeMs,
                  usage: toTokenUsage(classification.usage),
              }
            : null;
        this.sync();
    }

    onFinish(totalUsage: TokenUsageLike): void {
        if (!this.enabled) {
            return;
        }

        this.telemetry.totalUsage = toTokenUsage(totalUsage);
        this.sync();
    }

    onStepFinish(step: StepLike, stepIndex: number): void {
        if (!this.enabled) {
            return;
        }

        const resultsById = new Map(
            (step.toolResults ?? []).map((toolResult) => [toolResult.toolCallId, toolResult.output]),
        );

        this.telemetry.steps.push({
            index: stepIndex,
            toolCalls: step.toolCalls.map((toolCall) => ({
                name: toolCall.toolName,
                input: toolCall.input,
                output: resultsById.get(toolCall.toolCallId),
            })),
            usage: toTokenUsage(step.usage),
        });
        this.sync();
    }

    onSuccess(agentText: string, startedAtMs: number): void {
        if (!this.enabled) {
            return;
        }

        this.telemetry.agentText = agentText;
        this.telemetry.completed = true;
        this.telemetry.wallClockMs = Date.now() - startedAtMs;
        this.sync();
    }

    onError(errorMessage: string, startedAtMs: number): void {
        if (!this.enabled) {
            return;
        }

        this.telemetry.error = errorMessage;
        this.telemetry.completed = true;
        this.telemetry.wallClockMs = Date.now() - startedAtMs;
        this.sync();
    }

    private sync(): void {
        if (!this.enabled) {
            return;
        }

        const evalWindow = globalThis as unknown as Partial<EvalWindow>;
        evalWindow.__evalTelemetry = this.telemetry;
    }
}
