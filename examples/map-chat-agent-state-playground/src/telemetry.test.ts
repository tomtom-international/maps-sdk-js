import { beforeEach, describe, expect, it, vi } from 'vitest';

// ./config requires Azure env vars at import time; the connection string is set so ./telemetry
// starts App Insights, whose SDK is stubbed. The state digest the transport diffs is stubbed to
// "nothing changed", which keeps the prompt out of these tests.
vi.mock('./config', () => ({ APPLICATIONINSIGHTS_CONNECTION_STRING: 'InstrumentationKey=test' }));
vi.mock('@tomtom-org/maps-sdk-plugin-agent-toolkit', () => ({
    getStateDigest: () => ({}),
    formatStateDigestDiff: () => '',
}));

const { ApplicationInsights } = vi.hoisted(() => ({
    ApplicationInsights: vi.fn(
        class {
            loadAppInsights = vi.fn();
            trackEvent = vi.fn();
            trackException = vi.fn();
        },
    ),
}));
vi.mock('@microsoft/applicationinsights-web', () => ({ ApplicationInsights }));

// The transport runs the AI SDK message-conversion helpers before streaming; stub them to identity
// so the tests stay on telemetry.
vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<typeof import('ai')>()),
    validateUIMessages: vi.fn(async ({ messages }: { messages: unknown }) => messages),
    convertToModelMessages: vi.fn((messages: unknown) => messages),
    toUIMessageStream: vi.fn(() => ({})),
}));

// ./telemetry starts App Insights once, when it is first imported, so each test imports it afresh.
beforeEach(() => {
    vi.resetModules();
    ApplicationInsights.mockClear();
});

async function loadTelemetry() {
    const telemetry = await import('./telemetry');
    await vi.waitFor(() => expect(ApplicationInsights).toHaveBeenCalledOnce());
    return telemetry;
}

describe('App Insights', () => {
    it('disables cookies, so no ai_user / ai_session cookie is set without consent', async () => {
        await loadTelemetry();

        expect(ApplicationInsights.mock.calls[0][0]).toMatchObject({ config: { disableCookiesUsage: true } });
    });
});

const fakeRunStream = {};

describe('createInstrumentedTransport', () => {
    it('sends no user text, model text or tool input in any event', async () => {
        const { createInstrumentedTransport } = await loadTelemetry();
        const agent = {
            tools: {},
            state: {},
            stream: async ({ onStepEnd }: { onStepEnd: (step: unknown) => void }) => {
                onStepEnd({ toolCalls: [{ toolName: 'locatePlace', input: { position: [4.8897, 52.3731] } }] });
                return {
                    stream: fakeRunStream,
                    usage: Promise.resolve({ inputTokens: 5, outputTokens: 7, totalTokens: 12 }),
                    text: Promise.resolve('Your flat on Damrak is 300 m away'),
                };
            },
        } as unknown as Parameters<typeof createInstrumentedTransport>[0];

        await createInstrumentedTransport(agent).sendMessages({
            messages: [{ role: 'user', parts: [{ type: 'text', text: 'route from my flat on Damrak' }] }],
        } as never);
        await new Promise((resolve) => setTimeout(resolve, 0));

        const { trackEvent } = ApplicationInsights.mock.instances[0];
        expect(trackEvent.mock.calls.map(([event]) => event.name)).toEqual([
            'AgentQuery',
            'AgentToolCall',
            'AgentTokenUsage',
            'AgentSuccess',
        ]);
        const sent = JSON.stringify(trackEvent.mock.calls);
        expect(sent).not.toContain('Damrak');
        expect(sent).not.toContain('52.3731');

        const { toUIMessageStream } = await import('ai');
        expect(toUIMessageStream).toHaveBeenLastCalledWith({ stream: fakeRunStream, tools: agent.tools });
    });
});
