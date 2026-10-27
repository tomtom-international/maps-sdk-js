import {
    type createMapAgent,
    formatStateDigestDiff,
    getStateDigest,
    type StateDigest,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import {
    type ChatTransport,
    convertToModelMessages,
    type InferAgentUIMessage,
    type LanguageModelUsage,
    type ModelMessage,
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

function prependToLastUserMessage(modelMessages: ModelMessage[], note: string) {
    const lastUserIdx = modelMessages.findLastIndex((message) => message.role === 'user');
    const original = modelMessages[lastUserIdx];
    if (original?.role === 'user') {
        const originalContent = original.content;
        const annotatedContent =
            typeof originalContent === 'string'
                ? `${note}\n\n${originalContent}`
                : [{ type: 'text' as const, text: note }, ...originalContent];
        modelMessages[lastUserIdx] = { ...original, content: annotatedContent };
    }
}

export function createInstrumentedTransport(
    agent: ReturnType<typeof createMapAgent>,
    { onUsage }: InstrumentedTransportOptions = {},
): ChatTransport<AgentUIMessage> {
    // Snapshot of state as the LLM last saw it. We update it after every assistant turn finishes
    // (so the LLM's own tool calls are baked in) and diff it against the live state at the start
    // of the next user turn — anything that moved in between happened outside the conversation (the
    // UI, or a background incident poll failing) and gets surfaced to the LLM as a one-line context note.
    let lastSyncedDigest: StateDigest = getStateDigest(agent.state);

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

                // If the user changed map state via the UI (clicked a recents shortcut, toggled a
                // panel) since the last assistant turn, prepend the diff to the most recent user
                // message so the LLM doesn't reason from a stale snapshot. We mutate only this
                // request's copy; the persisted conversation history stays unaltered.
                const currentDigest = getStateDigest(agent.state);
                const uiContextNote = formatStateDigestDiff(lastSyncedDigest, currentDigest);
                if (uiContextNote) prependToLastUserMessage(modelMessages, uiContextNote);

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
                (text) => {
                    trackAgentSuccess(text, Date.now() - runStartMs, stepCounter);
                    // Re-baseline once the assistant is done — this absorbs every tool call the LLM
                    // made during the turn, so only future UI changes show up as a diff next time.
                    lastSyncedDigest = getStateDigest(agent.state);
                },
                (error: unknown) => {
                    // Once a step has run, the model has read this turn's note and made its own tool
                    // calls, so both are its; before that, the note never reached it and must go again.
                    if (stepCounter > 0) lastSyncedDigest = getStateDigest(agent.state);
                    reportFailure(error);
                },
            );
            return toUIMessageStream({ stream: result.stream, tools: agent.tools });
        },
        async reconnectToStream() {
            return null;
        },
    };
}
