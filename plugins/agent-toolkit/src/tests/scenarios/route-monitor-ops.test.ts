import { FULL_SCENARIOS, MODEL, priorTurn } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';
import { toolCall } from './seed';

// Operations over an ALREADY-CALCULATED route: arm / stop the live-traffic recalculation monitor.
// Seed a calculated route (entry routes-0) plus a started monitor so "stop refreshing the route" has
// something to stop and "keep it updated" references a real entry.
const monitoredRouteSeed = () =>
    priorTurn(
        'Plan a route from Paris to Amsterdam and keep its traffic updated',
        [
            toolCall(
                'setRoute',
                {
                    locations: ['Paris', 'Amsterdam'],
                    showOnMap: true,
                    parameters: { maxAlternatives: 2, costModel: { traffic: 'historical' } },
                },
                {
                    entryId: 'routes-0',
                    count: 3,
                    routes: [
                        { index: 0, summary: { travelTimeInSeconds: 18000, lengthInMeters: 500000 } },
                        { index: 1, summary: { travelTimeInSeconds: 18600, lengthInMeters: 505000 } },
                        { index: 2, summary: { travelTimeInSeconds: 19200, lengthInMeters: 512000 } },
                    ],
                },
            ),
            toolCall(
                'startRouteMonitor',
                { routesEntryID: 'routes-0' },
                { routesEntryID: 'routes-0', alreadyRunning: false },
            ),
        ],
        'Planned the Paris → Amsterdam route (entry routes-0) on typical traffic with two alternatives, and I am ' +
            'refreshing its live-traffic delays every 60 seconds.',
    );

// A route calculated but NOT yet monitored — "keep this route updated" must arm the monitor.
const routeOnlySeed = () =>
    priorTurn(
        'Plan a route from Paris to Amsterdam on typical traffic',
        [
            toolCall(
                'setRoute',
                {
                    locations: ['Paris', 'Amsterdam'],
                    showOnMap: true,
                    parameters: { costModel: { traffic: 'historical' } },
                },
                {
                    entryId: 'routes-0',
                    count: 1,
                    routes: [{ index: 0, summary: { travelTimeInSeconds: 18000, lengthInMeters: 500000 } }],
                },
            ),
        ],
        'Planned the Paris → Amsterdam route (entry routes-0) on typical traffic.',
    );

describe.skipIf(!MODEL)('startRouteMonitor scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('startRouteMonitor');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'startRouteMonitor',
            prompt: canonical,
            priorTurns: routeOnlySeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'startRouteMonitor',
            prompt,
            priorTurns: routeOnlySeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('stopRouteMonitor scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('stopRouteMonitor');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'stopRouteMonitor',
            prompt: canonical,
            priorTurns: monitoredRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'stopRouteMonitor',
            prompt,
            priorTurns: monitoredRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
