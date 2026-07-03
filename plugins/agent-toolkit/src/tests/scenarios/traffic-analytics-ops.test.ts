import { FULL_SCENARIOS, MODEL, priorTurn } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';
import { toolCall } from './seed';

// Historical traffic-area-analytics that is already fetched and shown.
// updateTrafficAreaAnalyticsDisplay restyles / toggles the render. Replay a loaded entry so
// "switch to heatmap view" etc. resolve. (Breakdowns are analyseData's job now —
// queryTrafficAnalytics was removed.)
const loadedAnalyticsSeed = () =>
    priorTurn(
        'Get historical traffic analytics for Amsterdam for last week',
        [
            toolCall(
                'getTrafficAreaAnalytics',
                { where: { near: 'Amsterdam' }, dateRange: { start: '2026-06-08', end: '2026-06-14' } },
                {
                    entryId: 'tta-0',
                    name: 'Amsterdam',
                    dateRange: { start: '2026-06-08', end: '2026-06-14' },
                    baseData: {},
                    metrics: [],
                    tileCount: 24,
                    availableGranularities: [],
                },
            ),
        ],
        'Fetched historical traffic analytics for Amsterdam — congestion level and speed over the last 7 days, ' +
            'shown on the map as a 2D hexgrid coloured by congestion.',
    );

describe.skipIf(!MODEL)('updateTrafficAreaAnalyticsDisplay scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('updateTrafficAreaAnalyticsDisplay');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'updateTrafficAreaAnalyticsDisplay',
            prompt: canonical,
            priorTurns: loadedAnalyticsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'updateTrafficAreaAnalyticsDisplay',
            prompt,
            priorTurns: loadedAnalyticsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
