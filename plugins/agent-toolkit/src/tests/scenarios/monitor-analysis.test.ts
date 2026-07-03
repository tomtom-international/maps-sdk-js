import { MODEL, priorTurn } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { runToolScenario } from './helpers';
import { toolCall } from './seed';

// monitorAnalysis is generic over every analyseData input kind, not just incidents: enabling it keeps
// an analysis recomputing whenever its source entries change — re-searched places, recalculated
// routes, refreshed incidents/BYOD/area-analytics. These scenarios stage a one-shot analysis over a
// PLACES and a ROUTES entry, then a "keep it up to date" follow-up that should route to monitorAnalysis.

const AMS: [number, number] = [4.89, 52.37];

// A places search with a one-shot category breakdown already attached (analysisId
// "by-category::places-1"). The follow-up keeps that breakdown live as the search is refined.
const analysedPlacesSeed = () =>
    priorTurn(
        'Find restaurants near the centre and break them down by category',
        [
            toolCall(
                'discoverPlaces',
                { query: 'restaurants', where: { near: 'centre' } },
                {
                    count: 8,
                    features: [{ id: 'rest-0', position: AMS, name: 'Restaurant' }],
                    placesEntryId: 'places-1',
                    label: 'restaurants',
                },
            ),
            toolCall(
                'analyseData',
                {
                    placesEntryIDs: ['places-1'],
                    name: 'by-category',
                    code: 'const c = {}; for (const p of placesByEntry["places-1"].features) c[p.properties.poi?.categories?.[0] ?? "other"] = (c[p.properties.poi?.categories?.[0] ?? "other"] ?? 0) + 1; return c;',
                },
                {
                    affectedEntries: [{ kind: 'places', id: 'places-1' }],
                    analysisId: 'by-category::places-1',
                    name: 'by-category',
                    outputFormat: 'json',
                    analysis: { italian: 3, cafe: 5 },
                },
            ),
        ],
        'Found 8 restaurants near the centre and broke them down by category — attached as the "by-category" analysis.',
    );

// A calculated route with a one-shot traffic-delay summary already attached (analysisId
// "route-delay::routes-0"). The follow-up keeps that summary live as the route is recalculated.
const analysedRouteSeed = () =>
    priorTurn(
        'Plan a route from Amsterdam to Brussels and summarise the total traffic delay on it',
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
                'analyseData',
                {
                    routesEntryIDs: ['routes-0'],
                    name: 'route-delay',
                    code: 'const r = routesByEntry["routes-0"].features[0]; const secs = r.properties.sections.traffic ?? []; return { totalDelaySeconds: secs.reduce((s, x) => s + (x.delayInSeconds ?? 0), 0) };',
                },
                {
                    affectedEntries: [{ kind: 'routes', id: 'routes-0' }],
                    analysisId: 'route-delay::routes-0',
                    name: 'route-delay',
                    outputFormat: 'json',
                    analysis: { totalDelaySeconds: 480 },
                },
            ),
        ],
        'Planned the Amsterdam → Brussels route and summarized its total traffic delay — attached as the ' +
            '"route-delay" analysis.',
    );

describe.skipIf(!MODEL)('monitorAnalysis — cross-kind (places / routes)', { timeout: 180_000, retry: 3 }, () => {
    it('keeps a PLACES analysis updated as the search is refined', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'monitorAnalysis',
            prompt: 'Keep that category breakdown up to date as I refine my restaurant search',
            priorTurns: analysedPlacesSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    it('keeps a ROUTES analysis updated as the route is recalculated', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'monitorAnalysis',
            prompt: 'Keep that route delay summary updated whenever I recalculate the route',
            priorTurns: analysedRouteSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
