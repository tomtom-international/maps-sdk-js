import type { LanguageModelUsage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createAgentTelemetry, createTracker, type TelemetrySink, type TurnContext } from './telemetry';

// vi.mock is hoisted above every import by vitest, so these mocks apply before ./telemetry loads even
// though it is imported at the top with the rest.
// Avoid loading the real ./config (it requires Azure env vars at import time and
// would otherwise try to load the App Insights browser SDK). A falsy connection
// string keeps the module on its no-op path; tests inject their own sink.
vi.mock('./config', () => ({ APPLICATIONINSIGHTS_CONNECTION_STRING: undefined }));

// The transport runs the AI SDK message-conversion helpers before streaming;
// stub them to identity so unit tests stay focused on telemetry shaping.
vi.mock('ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('ai')>();
    return {
        ...actual,
        validateUIMessages: vi.fn(async ({ messages }: { messages: unknown }) => messages),
        convertToModelMessages: vi.fn((messages: unknown) => messages),
    };
});

type TrackedEvent = { name: string; properties: Record<string, string> };
type TrackedException = { error: Error; properties: Record<string, string> };

function fakeSink() {
    const events: TrackedEvent[] = [];
    const exceptions: TrackedException[] = [];
    const sink: TelemetrySink = {
        trackEvent: (event) => events.push(event),
        trackException: (event) => exceptions.push(event),
    };
    return { sink, events, exceptions };
}

// A turn is one side of an exchange. userQuery lands on a user turn; every agent-side event on an
// agent turn. createTracker is role-agnostic (it flattens whatever ctx it is given), so these fixtures
// just drive the shaping assertions.
const userCtx: TurnContext = { conversationId: 'conv-1', turnId: 'turn-0', turnRole: 'user', turnIndex: 0 };
const ctx: TurnContext = { conversationId: 'conv-1', turnId: 'turn-1', turnRole: 'agent', turnIndex: 1 };
const agentProps = { conversationId: 'conv-1', turnId: 'turn-1', turnRole: 'agent', turnIndex: '1' };

describe('createTracker', () => {
    it('userQuery: query text + length in properties (as strings), turn ids carried', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).userQuery(userCtx, 'find a cafe');

        expect(events).toEqual([
            {
                name: 'UserQuery',
                properties: {
                    conversationId: 'conv-1',
                    turnId: 'turn-0',
                    turnRole: 'user',
                    turnIndex: '0',
                    query: 'find a cafe',
                    queryLength: String('find a cafe'.length),
                },
            },
        ]);
    });

    it('toolCall: toolName + JSON input + isError + step, all in properties', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).toolCall(ctx, 2, { toolName: 'searchPlaces', input: { q: 'cafe' } }, false);

        expect(events[0]).toEqual({
            name: 'AgentToolCall',
            properties: { ...agentProps, toolName: 'searchPlaces', input: '{"q":"cafe"}', isError: 'false', step: '2' },
        });
    });

    it('toolCall: isError is "true" when the call errored', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).toolCall(ctx, 1, { toolName: 'searchPlaces', input: {} }, true);

        expect(events[0].properties.isError).toBe('true');
    });

    it('tokenUsage: token counts as string properties, nullish coerced to "0"', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).tokenUsage(ctx, {
            inputTokens: 10,
            outputTokens: undefined,
            totalTokens: 10,
        } as unknown as LanguageModelUsage);

        expect(events[0].properties).toEqual({
            ...agentProps,
            inputTokens: '10',
            outputTokens: '0',
            totalTokens: '10',
        });
    });

    it('agentSuccess: records only metrics (as strings), never the response body', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).agentSuccess(ctx, 42, 1234, 3);

        expect(events[0]).toEqual({
            name: 'AgentSuccess',
            properties: { ...agentProps, responseLength: '42', wallClockMs: '1234', stepCount: '3' },
        });
        // Guard against a response body sneaking back in.
        expect(Object.keys(events[0].properties)).not.toContain('response');
    });

    it('agentError: routes to trackException with ids + wallClockMs', () => {
        const { sink, exceptions } = fakeSink();
        createTracker(sink).agentError(ctx, 'boom', 99);

        expect(exceptions).toHaveLength(1);
        expect(exceptions[0].error.message).toBe('boom');
        expect(exceptions[0].properties).toEqual({ ...agentProps, wallClockMs: '99' });
    });

    it('classification: activeToolNames as JSON + usage/timing as string properties', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).classification(ctx, {
            activeToolNames: ['locatePlace', 'setRoute'],
            timeMs: 120,
            usage: { inputTokens: 30, outputTokens: 5, totalTokens: 35 },
        });

        expect(events[0]).toEqual({
            name: 'AgentClassification',
            properties: {
                ...agentProps,
                activeToolNames: '["locatePlace","setRoute"]',
                toolCount: '2',
                classifierTimeMs: '120',
                inputTokens: '30',
                outputTokens: '5',
                totalTokens: '35',
            },
        });
    });

    it('toolExecution: toolName + isError + durationMs in properties (success)', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).toolExecution({ toolName: 'locatePlace', durationMs: 42, isError: false });

        expect(events[0]).toEqual({
            name: 'AgentToolExecution',
            properties: { toolName: 'locatePlace', isError: 'false', durationMs: '42' },
        });
    });

    it('toolExecution: includes errorMessage when the tool failed', () => {
        const { sink, events } = fakeSink();
        createTracker(sink).toolExecution({
            toolName: 'discoverPlaces',
            durationMs: 10,
            isError: true,
            errorMessage: 'no area resolved',
        });

        expect(events[0].properties).toEqual({
            toolName: 'discoverPlaces',
            isError: 'true',
            durationMs: '10',
            errorMessage: 'no area resolved',
        });
    });
});

type FakeToolCall = { toolName: string; input: unknown; toolCallId: string };
type FakeToolResult = { toolCallId: string; output: unknown };
type FakeStep = { toolCalls: FakeToolCall[]; toolResults: FakeToolResult[] };

function fakeAgent(opts: { steps?: FakeStep[]; usage?: Partial<LanguageModelUsage>; text?: string; reject?: unknown }) {
    return {
        tools: {},
        stream: ({ onStepFinish }: { onStepFinish: (step: FakeStep) => void }) => {
            for (const step of opts.steps ?? []) onStepFinish(step);
            return {
                totalUsage: Promise.resolve(opts.usage ?? { inputTokens: 1, outputTokens: 2, totalTokens: 3 }),
                text: 'reject' in opts ? Promise.reject(opts.reject) : Promise.resolve(opts.text ?? 'ok'),
                toUIMessageStream: () => ({}),
            };
        },
    } as unknown as Parameters<ReturnType<typeof createAgentTelemetry>['runInstrumentedTurn']>[0];
}

const userMessages = [{ role: 'user', parts: [{ type: 'text', text: 'hello' }] }] as never;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createAgentTelemetry', () => {
    it('mints a user turn then an agent turn per exchange, conversationId stable, turnIndex monotonic', async () => {
        const { sink, events } = fakeSink();
        const telemetry = createAgentTelemetry('conv-1', sink);

        await telemetry.runInstrumentedTurn(fakeAgent({}), userMessages);
        await flush();
        await telemetry.runInstrumentedTurn(fakeAgent({}), userMessages);
        await flush();

        const queries = events.filter((e) => e.name === 'UserQuery');
        expect(queries).toHaveLength(2);
        // conversationId is stable for the session; turns are distinct and user-roled.
        expect(queries[0].properties.conversationId).toBe(queries[1].properties.conversationId);
        expect(queries[0].properties.turnId).not.toBe(queries[1].properties.turnId);
        expect(queries.every((q) => q.properties.turnRole === 'user')).toBe(true);
        // Each exchange mints a user turn (even index) then an agent turn (odd), so the user turns are 0 and 2.
        expect(Number(queries[0].properties.turnIndex)).toBe(0);
        expect(Number(queries[1].properties.turnIndex)).toBe(2);
    });

    it('emits query (user turn), per-step tool calls, token usage, and success (agent turn) for an exchange', async () => {
        const { sink, events } = fakeSink();
        await createAgentTelemetry('conv-1', sink).runInstrumentedTurn(
            fakeAgent({
                steps: [
                    {
                        toolCalls: [
                            { toolName: 'a', input: {}, toolCallId: 't1' },
                            { toolName: 'b', input: {}, toolCallId: 't2' },
                        ],
                        toolResults: [
                            { toolCallId: 't1', output: { ok: true } },
                            { toolCallId: 't2', output: { ok: true } },
                        ],
                    },
                    {
                        toolCalls: [{ toolName: 'c', input: {}, toolCallId: 't3' }],
                        toolResults: [{ toolCallId: 't3', output: { ok: true } }],
                    },
                ],
                usage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 },
                text: 'final answer',
            }),
            userMessages,
        );
        await flush();

        const names = events.map((e) => e.name);
        expect(names.filter((n) => n === 'UserQuery')).toHaveLength(1);
        expect(names.filter((n) => n === 'AgentToolCall')).toHaveLength(3);

        // The query is a user turn; the response events are agent turns.
        expect(events.find((e) => e.name === 'UserQuery')?.properties.turnRole).toBe('user');
        expect(events.find((e) => e.name === 'AgentSuccess')?.properties.turnRole).toBe('agent');
        expect(events.filter((e) => e.name === 'AgentToolCall').every((e) => e.properties.turnRole === 'agent')).toBe(
            true,
        );

        const usage = events.find((e) => e.name === 'AgentTokenUsage')?.properties;
        expect(usage).toMatchObject({ inputTokens: '5', outputTokens: '7', totalTokens: '12' });

        const success = events.find((e) => e.name === 'AgentSuccess');
        expect(success?.properties.responseLength).toBe(String('final answer'.length));
        expect(success?.properties.stepCount).toBe('2');

        const toolEvents = events.filter((e) => e.name === 'AgentToolCall');
        // step index increments per onStepFinish, not per tool call
        expect(toolEvents.map((e) => e.properties.step)).toEqual(['1', '1', '2']);
        // every successful call is flagged isError=false
        expect(toolEvents.every((e) => e.properties.isError === 'false')).toBe(true);
    });

    it('records the FINAL step count when steps finish after the stream returns (regression)', async () => {
        const { sink, events } = fakeSink();
        // The real SDK keeps firing onStepFinish as the stream is consumed — after sendMessages
        // returns. Here steps fire on later microtasks and text resolves only once they're done, so
        // stepCount is still 0 when the outcome is wired. Guards against reading it by value.
        const asyncStepAgent = {
            tools: {},
            stream: ({ onStepFinish }: { onStepFinish: (step: FakeStep) => void }) => {
                const steps = (async () => {
                    for (let i = 0; i < 3; i += 1) {
                        await Promise.resolve();
                        onStepFinish({ toolCalls: [], toolResults: [] });
                    }
                })();
                return {
                    totalUsage: Promise.resolve({ inputTokens: 1, outputTokens: 1, totalTokens: 2 }),
                    text: steps.then(() => 'done'),
                    toUIMessageStream: () => ({}),
                };
            },
        } as unknown as Parameters<ReturnType<typeof createAgentTelemetry>['runInstrumentedTurn']>[0];

        await createAgentTelemetry('conv-1', sink).runInstrumentedTurn(asyncStepAgent, userMessages);
        await flush();

        expect(events.find((e) => e.name === 'AgentSuccess')?.properties.stepCount).toBe('3');
    });

    it('flags isError="true" for a tool that returns { error } (drives retry exclusion)', async () => {
        const { sink, events } = fakeSink();
        await createAgentTelemetry('conv-1', sink).runInstrumentedTurn(
            fakeAgent({
                steps: [
                    {
                        toolCalls: [{ toolName: 'discoverPlaces', input: {}, toolCallId: 't1' }],
                        toolResults: [{ toolCallId: 't1', output: { error: 'boom' } }],
                    },
                ],
                text: 'done',
            }),
            userMessages,
        );
        await flush();

        const toolEvents = events.filter((e) => e.name === 'AgentToolCall');
        expect(toolEvents).toHaveLength(1);
        expect(toolEvents[0].properties.toolName).toBe('discoverPlaces');
        expect(toolEvents[0].properties.isError).toBe('true');
    });

    it('onClassify emits AgentClassification on the agent turn that follows the user query', async () => {
        const { sink, events } = fakeSink();
        const telemetry = createAgentTelemetry('conv-1', sink);

        await telemetry.runInstrumentedTurn(fakeAgent({}), userMessages);
        await flush();
        // The real agent fires onClassify during the turn; here we invoke it directly.
        telemetry.onClassify({
            activeToolNames: ['locatePlace'],
            timeMs: 10,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        });

        const query = events.find((e) => e.name === 'UserQuery');
        const classification = events.find((e) => e.name === 'AgentClassification');
        expect(classification).toBeDefined();
        // Same conversation, but a distinct turn: the query is the user turn, classification the agent turn.
        expect(classification?.properties.conversationId).toBe(query?.properties.conversationId);
        expect(query?.properties.turnRole).toBe('user');
        expect(classification?.properties.turnRole).toBe('agent');
        // The agent turn immediately follows the user turn it answers.
        expect(Number(classification?.properties.turnIndex)).toBe(Number(query?.properties.turnIndex) + 1);
        expect(classification?.properties.activeToolNames).toBe('["locatePlace"]');
    });

    it('onClassify ignores a null result (classification disabled or failed)', () => {
        const { sink, events } = fakeSink();
        createAgentTelemetry('conv-1', sink).onClassify(null);
        expect(events).toHaveLength(0);
    });

    it('falls back to a no-op sink when no sink is injected and the connection string is absent (telemetry is optional locally)', () => {
        // ./config is mocked to an undefined connection string, so the default sink is the no-op.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => createAgentTelemetry('conv-1')).not.toThrow();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('APPLICATIONINSIGHTS_CONNECTION_STRING'));
        warn.mockRestore();
    });

    it('exposes onToolExecute that emits AgentToolExecution', () => {
        const { sink, events } = fakeSink();
        createAgentTelemetry('conv-1', sink).onToolExecute({ toolName: 'flyTo', durationMs: 5, isError: false });

        const event = events.find((e) => e.name === 'AgentToolExecution');
        expect(event?.properties.toolName).toBe('flyTo');
        expect(event?.properties.isError).toBe('false');
        expect(event?.properties.durationMs).toBe('5');
    });

    it('records an exception (and no success) when the run rejects', async () => {
        const { sink, events, exceptions } = fakeSink();
        await createAgentTelemetry('conv-1', sink).runInstrumentedTurn(
            fakeAgent({ reject: new Error('stream failed') }),
            userMessages,
        );
        await flush();

        expect(exceptions).toHaveLength(1);
        expect(exceptions[0].error.message).toBe('stream failed');
        expect(events.some((e) => e.name === 'AgentSuccess')).toBe(false);
    });
});
