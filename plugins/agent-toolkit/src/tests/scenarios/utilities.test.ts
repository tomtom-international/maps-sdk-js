import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, getExamplePrompts, MODEL, runToolScenario } from './helpers';
import { priorTurn, toolCall } from './seed';

// Utility tools. Most classify from a cold turn (the prompt is the whole instruction). `calculateBBox`
// is the exception: "the bounding box of these places" / "the extent of this route" only mean
// something once data is loaded, so it gets a seed staging a route + a places entry. The run also
// showed "bounding box of these places" legitimately served by `processData` (which can compute a
// bbox), so calculateBBox accepts that as an alternative — see the PR description's overlaps notes.

describe.skipIf(!MODEL)('getPOICategoryCodes scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('getPOICategoryCodes');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'getPOICategoryCodes', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'getPOICategoryCodes', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('getCurrentLocation scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('getCurrentLocation');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'getCurrentLocation', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'getCurrentLocation', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('help scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('help');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'help', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'help', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('calculateBBox scenarios', { timeout: 180_000, retry: 3 }, () => {
    // "extent of this route" / "bounding box of these places" sit on the analyse/process/bbox
    // overlap: calculateBBox is canonical, but the agent also legitimately derives an extent via
    // processData (spatial op that renders) or analyseData (geometry-stat metadata). Accept the whole
    // family so the smoke test asserts "routed to a spatial-data tool", not one exact pick.
    const acceptedAlternatives = ['processData', 'analyseData'] as const;
    const priorTurns = () =>
        priorTurn(
            'Plan a route from Amsterdam to Brussels and find some cafes along the way',
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
                    'discoverPlaces',
                    { query: 'cafes' },
                    {
                        count: 6,
                        features: [{ id: 'cafe-0', position: [4.7, 51.5], name: 'Cafe' }],
                        placesEntryId: 'places-1',
                        label: 'cafes',
                    },
                ),
            ],
            'Done — planned the Amsterdam → Brussels route (~210 km) and found 6 cafes near it.',
        );
    const [canonical, ...rest] = getExamplePrompts('calculateBBox');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'calculateBBox',
            prompt: canonical,
            acceptedAlternatives,
            priorTurns,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'calculateBBox',
            prompt,
            acceptedAlternatives,
            priorTurns,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
