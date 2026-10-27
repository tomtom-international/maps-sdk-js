import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import {
    type ChatTransport,
    convertToModelMessages,
    type InferAgentUIMessage,
    type LanguageModelUsage,
    toUIMessageStream,
    validateUIMessages,
} from 'ai';
import { APPLICATIONINSIGHTS_CONNECTION_STRING } from './config';

type ToolCallEvent = {
    toolName: string;
};

const connectionString = APPLICATIONINSIGHTS_CONNECTION_STRING;

let appInsights: import('@microsoft/applicationinsights-web').ApplicationInsights | null = null;

if (connectionString) {
    import('@microsoft/applicationinsights-web')
        .then(({ ApplicationInsights }) => {
            appInsights = new ApplicationInsights({
                config: {
                    connectionString,
                    disableFetchTracking: true,
                    disableAjaxTracking: true,
                    autoTrackPageVisitTime: true,
                    disableCookiesUsage: true,
                },
            });
            appInsights.loadAppInsights();
        })
        .catch(() => {
            console.warn('Telemetry unavailable — Application Insights blocked or failed to load.');
        });
}

function trackEvent(name: string, properties: Record<string, string | number | boolean>) {
    if (!appInsights) return;

    const customProperties: Record<string, string> = {};

    for (const [key, value] of Object.entries(properties)) {
        customProperties[key] = String(value);
    }

    appInsights.trackEvent({ name }, customProperties);
}

export function trackUserQuery(userMessage: string) {
    trackEvent('AgentQuery', {
        queryLength: userMessage.length,
    });
}

export function trackToolCall(stepIndex: number, toolCall: ToolCallEvent) {
    trackEvent('AgentToolCall', {
        step: stepIndex,
        toolName: toolCall.toolName,
    });
}

export function trackTokenUsage(usage: LanguageModelUsage) {
    trackEvent('AgentTokenUsage', {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
    });
}

export function trackAgentSuccess(response: string, wallClockMs: number, stepCount: number) {
    trackEvent('AgentSuccess', {
        responseLength: response.length,
        wallClockMs,
        stepCount,
    });
}

export function trackAgentError(errorMessage: string, wallClockMs: number) {
    if (appInsights) {
        appInsights.trackException({
            exception: new Error(errorMessage),
            properties: { source: 'MapAgentReact', wallClockMs: String(wallClockMs) },
        });
    }
}

export type AgentUIMessage = InferAgentUIMessage<ReturnType<typeof createMapAgent>>;

type InstrumentedTransportOptions = {
    /** Called after each assistant turn with the run's total token usage. Used by the chat UI to
     * accumulate a compact session counter; ignore if you don't need it. */
    onUsage?: (usage: LanguageModelUsage) => void;
};

export function createInstrumentedTransport(
    agent: ReturnType<typeof createMapAgent>,
    { onUsage }: InstrumentedTransportOptions = {},
): ChatTransport<AgentUIMessage> {
    return {
        async sendMessages({ messages, abortSignal }) {
            const lastUserMsg = messages.filter((m) => m.role === 'user').at(-1);
            const userText =
                lastUserMsg?.parts
                    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                    .map((p) => p.text)
                    .join('') ?? '';
            trackUserQuery(userText);

            const runStartMs = Date.now();
            let stepCounter = 0;

            const reportFailure = (error: unknown) => {
                if (abortSignal?.aborted) return; // Stop is not a failure.
                trackAgentError(error instanceof Error ? error.message : String(error), Date.now() - runStartMs);
            };

            const startRun = async () => {
                const modelMessages = await convertToModelMessages(
                    await validateUIMessages({ messages, tools: agent.tools }),
                    { tools: agent.tools },
                );
                return agent.stream({
                    prompt: modelMessages,
                    abortSignal,
                    onStepEnd: (step) => {
                        stepCounter += 1;
                        for (const toolCall of step.toolCalls) {
                            trackToolCall(stepCounter, toolCall);
                        }
                    },
                });
            };
            const result = await startRun().catch((error: unknown) => {
                reportFailure(error);
                throw error;
            });

            void result.usage.then(
                (usage) => {
                    trackTokenUsage(usage);
                    onUsage?.(usage);
                },
                () => undefined, // A failed run is reported once, from the text below.
            );
            void result.text.then(
                (text) => trackAgentSuccess(text, Date.now() - runStartMs, stepCounter),
                reportFailure,
            );
            return toUIMessageStream({ stream: result.stream, tools: agent.tools });
        },
        async reconnectToStream() {
            return null;
        },
    };
}
