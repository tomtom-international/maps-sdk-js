import { FULL_SCENARIOS, MODEL, priorTurn } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';
import { stagedWaypointsSeed, toolCall } from './seed';

// Editing an EXISTING calculated route. Without a route in context these prompts ("remove the
// second stop", "change the origin") have nothing to act on, so we replay a calculated 3-waypoint
// route (setRoute's real result; the route's waypoints/id are recalled by the edit tools). The
// classifier must then separate the three editors from each other and from a full `setRoute`
// replacement.
const calculatedRouteSeed = () =>
    priorTurn(
        'Plan a route from Amsterdam to Brussels with a stop in Utrecht',
        [
            toolCall(
                'setRoute',
                { locations: ['Amsterdam', 'Utrecht', 'Brussels'], showOnMap: true },
                {
                    count: 3,
                    entryId: 'routes-0',
                    routes: [
                        { index: 0, summary: { travelTimeInSeconds: 8400, lengthInMeters: 210000 } },
                        { index: 1, summary: { travelTimeInSeconds: 8700, lengthInMeters: 214000 } },
                        { index: 2, summary: { travelTimeInSeconds: 9000, lengthInMeters: 219000 } },
                    ],
                },
            ),
        ],
        'Done — calculated the route Amsterdam → Utrecht → Brussels (about 210 km, 2 h 20 min) with two ' +
            'alternatives, and drew it on the map.',
    );

describe.skipIf(!MODEL)('addWaypointsToRoute scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('addWaypointsToRoute');
    // Adding a NAMED stop ("from my house") can resolve the place first via locatePlace, or the
    // agent may re-plan the whole trip via setRoute — accept both alongside addWaypointsToRoute.
    const acceptedAlternatives = ['locatePlace', 'setRoute'] as const;
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'addWaypointsToRoute',
            prompt: canonical,
            acceptedAlternatives,
            priorTurns: calculatedRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'addWaypointsToRoute',
            prompt,
            acceptedAlternatives,
            priorTurns: calculatedRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('removeWaypointsFromRoute scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('removeWaypointsFromRoute');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'removeWaypointsFromRoute',
            prompt: canonical,
            priorTurns: calculatedRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'removeWaypointsFromRoute',
            prompt,
            priorTurns: calculatedRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('replaceWaypointInRoute scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('replaceWaypointInRoute');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'replaceWaypointInRoute',
            prompt: canonical,
            priorTurns: calculatedRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'replaceWaypointInRoute',
            prompt,
            priorTurns: calculatedRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

// STAGED waypoints are a different slice from a calculated route: the origin/stops/destination
// queued for the NEXT setRoute. `stagedWaypointsSeed` (seed.ts) replays locatePlace staging the
// slots WITHOUT calculating, so the prompt can't be answered from a route entry — this is the
// getCurrentWaypoints vs recallRoutes split.
describe.skipIf(!MODEL)('getCurrentWaypoints scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('getCurrentWaypoints');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'getCurrentWaypoints',
            prompt: canonical,
            priorTurns: stagedWaypointsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'getCurrentWaypoints',
            prompt,
            priorTurns: stagedWaypointsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
