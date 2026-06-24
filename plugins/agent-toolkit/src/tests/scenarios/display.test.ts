import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, getExamplePrompts, MODEL, runToolScenario } from './helpers';
import { priorTurn, stagedWaypointsSeed, toolCall } from './seed';

// Show / hide / swap / restyle of the agent's OWN rendered entries (distinct from the base-map tile
// toggles in tile-toggles.test.ts). Each display tool acts on a slice that must already hold an
// entry, so each gets a seed that replays the producing tool's real result (see seed.ts) so "also
// show the cafes" / "show the Edinburgh route" / "hide the customer pins" resolve against a real
// entry instead of triggering a fresh search.

const loadedPlacesSeed = () =>
    priorTurn(
        'Search for cafes, pubs, banks and hotels near the centre, and pull the neighbourhood boundaries',
        [
            toolCall(
                'discoverPlaces',
                { query: 'cafes', where: { near: 'centre' } },
                {
                    count: 12,
                    features: [{ id: 'cafe-0', position: [4.89, 52.37], name: 'Cafe' }],
                    placesEntryId: 'places-1',
                    label: 'cafes',
                },
            ),
            toolCall(
                'discoverPlaces',
                { query: 'pubs', where: { near: 'centre' } },
                {
                    count: 9,
                    features: [{ id: 'pub-0', position: [4.89, 52.37], name: 'Pub' }],
                    placesEntryId: 'places-2',
                    label: 'pubs',
                },
            ),
            toolCall(
                'discoverPlaces',
                { query: 'banks', where: { near: 'centre' } },
                {
                    count: 7,
                    features: [{ id: 'bank-0', position: [4.89, 52.37], name: 'Bank' }],
                    placesEntryId: 'places-3',
                    label: 'banks',
                },
            ),
            toolCall(
                'discoverPlaces',
                { query: 'hotels', where: { near: 'centre' } },
                {
                    count: 5,
                    features: [{ id: 'hotel-0', position: [4.89, 52.37], name: 'Hotel' }],
                    placesEntryId: 'places-4',
                    label: 'hotels',
                },
            ),
            toolCall(
                'discoverPlaces',
                { query: 'neighbourhoods' },
                {
                    count: 4,
                    features: [{ id: 'nb-0', position: [4.89, 52.37], name: 'Neighbourhood' }],
                    placesEntryId: 'places-5',
                    label: 'neighbourhood boundaries',
                },
            ),
            // A "cities" entry so prompts referring to "the cities" (e.g. "Pin the cities and
            // outline them too") resolve against a real loaded entry instead of provoking a
            // "which cities?" clarification — the same reason every other label here is seeded.
            toolCall(
                'discoverPlaces',
                { query: 'cities' },
                {
                    count: 3,
                    features: [{ id: 'city-0', position: [4.89, 52.37], name: 'City' }],
                    placesEntryId: 'places-6',
                    label: 'cities',
                },
            ),
        ],
        'Done — I stored cafes, pubs, banks, hotels, the neighbourhood boundaries and the cities as places entries. ' +
            'Nothing is drawn on the map yet.',
    );
describe.skipIf(!MODEL)('updatePlacesDisplay scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Outlining a NAMED city ("also outline Utrecht…") legitimately routes to locatePlace, which
    // resolves the name and draws its boundary in one call (see locatePlace's own examples) — a
    // by-design overlap with updatePlacesDisplay's geometry mode, so accept either. The other
    // display prompts (add/remove/swap of already-loaded entries) classify strictly here.
    const acceptedAlternatives = ['locatePlace'] as const;
    const [canonical, ...rest] = getExamplePrompts('updatePlacesDisplay');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'updatePlacesDisplay',
            prompt: canonical,
            acceptedAlternatives,
            priorTurns: loadedPlacesSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'updatePlacesDisplay',
            prompt,
            acceptedAlternatives,
            priorTurns: loadedPlacesSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

const loadedRoutesSeed = () =>
    priorTurn(
        'Plan a few routes: Amsterdam to Brussels, London to Edinburgh, and Paris to Lyon',
        [
            toolCall(
                'setRoute',
                { locations: ['Amsterdam', 'Brussels'], showOnMap: false },
                {
                    count: 3,
                    entryId: 'routes-0',
                    routes: [
                        { index: 0, summary: { travelTimeInSeconds: 7200, lengthInMeters: 210000 } },
                        { index: 1, summary: { travelTimeInSeconds: 7500, lengthInMeters: 216000 } },
                        { index: 2, summary: { travelTimeInSeconds: 7900, lengthInMeters: 223000 } },
                    ],
                },
            ),
            toolCall(
                'setRoute',
                { locations: ['London', 'Edinburgh'], showOnMap: false },
                {
                    count: 1,
                    entryId: 'routes-1',
                    routes: [{ index: 0, summary: { travelTimeInSeconds: 23400, lengthInMeters: 660000 } }],
                },
            ),
            toolCall(
                'setRoute',
                { locations: ['Paris', 'Lyon'], showOnMap: false },
                {
                    count: 1,
                    entryId: 'routes-2',
                    routes: [{ index: 0, summary: { travelTimeInSeconds: 16800, lengthInMeters: 470000 } }],
                },
            ),
        ],
        'Done — I calculated three route entries (none drawn yet): Amsterdam → Brussels with two alternatives, ' +
            'London → Edinburgh, and Paris → Lyon.',
    );
describe.skipIf(!MODEL)('updateRoutesDisplay scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('updateRoutesDisplay');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'updateRoutesDisplay',
            prompt: canonical,
            priorTurns: loadedRoutesSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'updateRoutesDisplay',
            prompt,
            priorTurns: loadedRoutesSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('updateWaypointsDisplay scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('updateWaypointsDisplay');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'updateWaypointsDisplay',
            prompt: canonical,
            priorTurns: stagedWaypointsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'updateWaypointsDisplay',
            prompt,
            priorTurns: stagedWaypointsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

const loadedByodSeed = () =>
    priorTurn(
        'Import my sales territories and my customer pins from GeoJSON',
        [
            toolCall(
                'addByodSource',
                { label: 'Sales territories' },
                {
                    byodEntryId: 'byod-0',
                    label: 'Sales territories',
                    source: { kind: 'inline' },
                    profile: { featureCount: 12, geometryTypes: ['Polygon'], properties: [] },
                },
            ),
            toolCall(
                'addByodSource',
                { label: 'Customer pins' },
                {
                    byodEntryId: 'byod-1',
                    label: 'Customer pins',
                    source: { kind: 'inline' },
                    profile: { featureCount: 40, geometryTypes: ['Point'], properties: [] },
                },
            ),
        ],
        'Imported two BYOD layers and added them to the map: Sales territories (12 polygons) and Customer pins ' +
            '(40 points).',
    );
describe.skipIf(!MODEL)('updateByodDisplay scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('updateByodDisplay');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'updateByodDisplay',
            prompt: canonical,
            priorTurns: loadedByodSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'updateByodDisplay',
            prompt,
            priorTurns: loadedByodSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

// clearMap is a cold imperative ("Clear the map", "Remove all markers", "Hide everything on the
// map"). The misleading "Start fresh" (→ resetState) and "Hide the analytics overlay" (→
// updateTrafficAreaAnalyticsDisplay) examples were dropped from the registry after the run.
describe.skipIf(!MODEL)('clearMap scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('clearMap');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'clearMap', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'clearMap', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
