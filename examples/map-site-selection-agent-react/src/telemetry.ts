import {
    type ClassificationResult,
    createMapAgent,
    type ToolExecutionInfo,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport, InferAgentUIMessage, LanguageModelUsage } from 'ai';
import { convertToModelMessages, validateUIMessages } from 'ai';
import { APPLICATIONINSIGHTS_CONNECTION_STRING } from './config';

const APP_NAME = 'map-site-selection-agent-react';

type ToolCallEvent = { toolName: string; input: unknown };

export type TurnRole = 'user' | 'agent';
export type TurnContext = { conversationId: string; turnId: string; turnRole: TurnRole; turnIndex: number };

export type TelemetrySink = {
    trackEvent(event: { name: string; properties: Record<string, string> }): void;
    trackException(event: { error: Error; properties: Record<string, string> }): void;
};

export type AgentUIMessage = InferAgentUIMessage<ReturnType<typeof createMapAgent>>;
type Tracker = ReturnType<typeof createTracker>;

function createAppInsightsSink(connectionString: string): TelemetrySink {
    // Lazy-load the SDK: a static import would make the docs' in-browser sandpack bundler resolve
    // the whole App Insights module graph at page load (and crash when its CDN manifest is
    // incomplete). Events fired before the SDK arrives queue on the promise; if it never loads,
    // telemetry degrades to a warning instead of taking the app down.
    const instancePromise = import('@microsoft/applicationinsights-web')
        .then(({ ApplicationInsights }) => {
            const instance = new ApplicationInsights({
                config: {
                    connectionString,
                    disableFetchTracking: true,
                    disableAjaxTracking: true,
                    autoTrackPageVisitTime: true,
                    samplingPercentage: 100, // Keep every event; sampling would punch holes in conversation reconstruction.
                },
            });
            instance.loadAppInsights();
            // Tag every event with the app so one resource can separate the agents.
            instance.addTelemetryInitializer((envelope) => {
                envelope.tags = envelope.tags ?? {};
                envelope.tags['ai.cloud.role'] = APP_NAME;
            });
            return instance;
        })
        .catch((error) => {
            console.warn('Application Insights failed to load — telemetry disabled.', error);
            return null;
        });

    return {
        trackEvent: (event) => void instancePromise.then((instance) => instance?.trackEvent(event)),
        trackException: ({ error, properties }) =>
            void instancePromise.then((instance) => instance?.trackException({ exception: error, properties })),
    };
}

// No-op sink for local dev: telemetry is optional, so a missing connection string
// silently drops events instead of crashing the app.
const noopSink = (): TelemetrySink => ({ trackEvent: () => {}, trackException: () => {} });

const defaultSink = (): TelemetrySink => {
    if (APPLICATIONINSIGHTS_CONNECTION_STRING) return createAppInsightsSink(APPLICATIONINSIGHTS_CONNECTION_STRING);

    console.warn('APPLICATIONINSIGHTS_CONNECTION_STRING is not set; agent telemetry is disabled.');
    return noopSink();
};

function ctxProps(ctx: TurnContext): Record<string, string> {
    return {
        conversationId: ctx.conversationId,
        turnId: ctx.turnId,
        turnRole: ctx.turnRole,
        turnIndex: String(ctx.turnIndex),
    };
}

function resultIsError(result: { output?: unknown } | undefined): boolean {
    const output = result?.output as { error?: unknown } | undefined;
    return typeof output?.error === 'string';
}

// Every value ships as a string in `properties` (App Insights customDimensions); numeric fields are
// stringified here and cast back with toint / todouble in the workbook KQL. There is no separate
// measurements bag — one flat property map per event.
export function createTracker(sink: TelemetrySink) {
    return {
        userQuery(ctx: TurnContext, userMessage: string) {
            sink.trackEvent({
                name: 'UserQuery',
                properties: { ...ctxProps(ctx), query: userMessage, queryLength: String(userMessage.length) },
            });
        },
        toolCall(ctx: TurnContext, stepIndex: number, toolCall: ToolCallEvent, isError: boolean) {
            sink.trackEvent({
                name: 'AgentToolCall',
                properties: {
                    ...ctxProps(ctx),
                    toolName: toolCall.toolName,
                    input: JSON.stringify(toolCall.input),
                    isError: String(isError),
                    step: String(stepIndex),
                },
            });
        },
        tokenUsage(ctx: TurnContext, usage: LanguageModelUsage) {
            sink.trackEvent({
                name: 'AgentTokenUsage',
                properties: {
                    ...ctxProps(ctx),
                    inputTokens: String(usage.inputTokens ?? 0),
                    outputTokens: String(usage.outputTokens ?? 0),
                    totalTokens: String(usage.totalTokens ?? 0),
                },
            });
        },
        // Only the length is recorded; the response body is intentionally dropped to avoid noise.
        agentSuccess(ctx: TurnContext, responseLength: number, wallClockMs: number, stepCount: number) {
            sink.trackEvent({
                name: 'AgentSuccess',
                properties: {
                    ...ctxProps(ctx),
                    responseLength: String(responseLength),
                    wallClockMs: String(wallClockMs),
                    stepCount: String(stepCount),
                },
            });
        },
        agentError(ctx: TurnContext, errorMessage: string, wallClockMs: number) {
            sink.trackException({
                error: new Error(errorMessage),
                properties: { ...ctxProps(ctx), wallClockMs: String(wallClockMs) },
            });
        },
        // Classifier-picked tools as a JSON array, so KQL can expand it or read it per conversation.
        classification(ctx: TurnContext, result: ClassificationResult) {
            sink.trackEvent({
                name: 'AgentClassification',
                properties: {
                    ...ctxProps(ctx),
                    activeToolNames: JSON.stringify(result.activeToolNames),
                    toolCount: String(result.activeToolNames.length),
                    classifierTimeMs: String(result.timeMs),
                    inputTokens: String(result.usage.inputTokens),
                    outputTokens: String(result.usage.outputTokens),
                    totalTokens: String(result.usage.totalTokens),
                },
            });
        },
        // Per-tool outcome (no ids — aggregated by tool + time): powers the error + exec-time graphs.
        toolExecution(info: ToolExecutionInfo) {
            const properties: Record<string, string> = {
                toolName: info.toolName,
                isError: String(info.isError),
                durationMs: String(info.durationMs),
            };
            if (info.errorMessage) properties.errorMessage = info.errorMessage;
            sink.trackEvent({ name: 'AgentToolExecution', properties });
        },
    };
}

function extractUserText(messages: readonly AgentUIMessage[]): string {
    const lastUserMsg = messages.filter((m) => m.role === 'user').at(-1);
    return (
        lastUserMsg?.parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('') ?? ''
    );
}

function trackTurnOutcome(
    track: Tracker,
    ctx: TurnContext,
    result: { totalUsage: PromiseLike<LanguageModelUsage>; text: PromiseLike<string> },
    turnStartMs: number,
    getStepCount: () => number,
) {
    void result.totalUsage.then((usage) => track.tokenUsage(ctx, usage));
    void result.text.then(
        (text) => track.agentSuccess(ctx, text.length, Date.now() - turnStartMs, getStepCount()),
        (error: unknown) =>
            track.agentError(ctx, error instanceof Error ? error.message : String(error), Date.now() - turnStartMs),
    );
}

type TurnDeps = {
    track: Tracker;
    startTurn: (role: TurnRole) => TurnContext;
    onAgentTurn: (ctx: TurnContext) => void;
};

async function runInstrumentedTurn(
    agent: ReturnType<typeof createMapAgent>,
    messages: readonly AgentUIMessage[],
    deps: TurnDeps,
    abortSignal?: AbortSignal,
) {
    const { track, startTurn, onAgentTurn } = deps;

    const userCtx = startTurn('user');
    track.userQuery(userCtx, extractUserText(messages));

    const agentCtx = startTurn('agent');
    onAgentTurn(agentCtx);

    const turnStartMs = Date.now();
    let stepCount = 0;

    const modelMessages = await convertToModelMessages(await validateUIMessages({ messages, tools: agent.tools }), {
        tools: agent.tools,
    });

    const result = await agent.stream({
        prompt: modelMessages,
        abortSignal,
        onStepFinish: (step) => {
            stepCount += 1;
            for (const toolCall of step.toolCalls) {
                const toolResult = step.toolResults.find((r) => r.toolCallId === toolCall.toolCallId);
                track.toolCall(agentCtx, stepCount, toolCall, resultIsError(toolResult));
            }
        },
    });

    trackTurnOutcome(track, agentCtx, result, turnStartMs, () => stepCount);
    return result.toUIMessageStream();
}

export function createAgentTelemetry(conversationId: string, sink: TelemetrySink = defaultSink()) {
    const track = createTracker(sink);
    let turnIndex = 0;
    let currentAgentTurn: TurnContext | null = null;

    const deps: TurnDeps = {
        track,
        startTurn: (turnRole) => ({ conversationId, turnId: crypto.randomUUID(), turnRole, turnIndex: turnIndex++ }),
        onAgentTurn: (ctx) => {
            currentAgentTurn = ctx;
        },
    };

    return {
        runInstrumentedTurn: (
            agent: ReturnType<typeof createMapAgent>,
            messages: readonly AgentUIMessage[],
            abortSignal?: AbortSignal,
        ) => runInstrumentedTurn(agent, messages, deps, abortSignal),
        // Thin ChatTransport bridge: each send delegates to the instrumented run and returns its stream.
        instrumentTransport: (agent: ReturnType<typeof createMapAgent>): ChatTransport<AgentUIMessage> => ({
            sendMessages: ({ messages, abortSignal }) => runInstrumentedTurn(agent, messages, deps, abortSignal),
            reconnectToStream: async () => null,
        }),
        onClassify: (result: ClassificationResult | null) => {
            if (result && currentAgentTurn) track.classification(currentAgentTurn, result);
        },
        onToolExecute: (info: ToolExecutionInfo) => track.toolExecution(info),
    };
}
