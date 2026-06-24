import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, getExamplePrompts, MODEL, runToolScenario } from './helpers';
import { priorTurn, toolCall } from './seed';

// Stages a calculated route and a reachable range from an earlier turn, so the route- and
// range-relative fanout prompts ("…corridor along my planned route", "…within the reachable range",
// "…under 10 min detour") bind to real entries instead of provoking a "which route?" clarification.
// No places/geometries are seeded, so the cold prompts (search-by-category, outline-a-named-area)
// still classify to discoverPlaces unchanged.
const routeAndRangeSeed = () =>
    priorTurn(
        'Plan a route from Amsterdam to Brussels and compute a 30-minute reachable area from Amsterdam',
        [
            toolCall(
                'setRoute',
                { locations: ['Amsterdam', 'Brussels'], showOnMap: true },
                {
                    count: 1,
                    entryId: 'routes-0',
                    routes: [{ index: 0, summary: { travelTimeInSeconds: 7200, lengthInMeters: 210000 } }],
                },
            ),
            toolCall(
                'findReachableAreas',
                { origin: 'Amsterdam', budgets: [{ type: 'timeMinutes', value: 30 }] },
                {
                    rangesId: 'ranges-0',
                    ranges: [{ originName: 'Amsterdam', budgets: [{ type: 'timeMinutes', value: 30 }] }],
                },
            ),
        ],
        'Planned the Amsterdam → Brussels route and computed a 30-minute reachable area from Amsterdam.',
    );

describe.skipIf(!MODEL)('discoverPlaces scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Canonical = the first registry examplePrompt (single source of truth); the rest fan out under
    // SCENARIOS_FULL.
    const [canonical, ...rest] = getExamplePrompts('discoverPlaces');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'discoverPlaces', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'discoverPlaces',
            prompt,
            priorTurns: routeAndRangeSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
