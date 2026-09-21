import type { Route, RouteProps, WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoutingState } from '../../../state';
import { makeMockRoute, makeMockState } from '../../../tests/constants';
import { executeRecallRoutes } from '../recall-routes';

// A route feature carrying the minimal RouteProps that summarizeRoutes reads
// (index, summary with Date fields, sections.leg).
const makeSummarizableRoute = (): Route =>
    makeMockRoute({
        properties: {
            index: 0,
            summary: {
                arrivalTime: new Date('2024-01-01T01:00:00Z'),
                departureTime: new Date('2024-01-01T00:00:00Z'),
                lengthInMeters: 1000,
                travelTimeInSeconds: 3600,
            },
            sections: { leg: [{ summary: { lengthInMeters: 1000 } }] },
        } as unknown as RouteProps,
    });

describe('executeRecallRoutes', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('lists entries newest-first with a shown flag reflecting shownEntryIds', async () => {
        const routing = new RoutingState({} as TomTomMap);
        const firstId = await routing.addRoutes(
            { type: 'FeatureCollection', features: [makeSummarizableRoute()] },
            [],
            'first',
        );
        const secondId = await routing.addRoutes(
            { type: 'FeatureCollection', features: [makeSummarizableRoute()] },
            [],
            'second',
        );
        // showEntry needs a real map module; mark shown directly on the live entry instead
        // (routing.entries returns the internal array, and shownEntryIds derives from `_shown`).
        (routing.entries.find((e) => e.id === secondId) as { _shown?: boolean })._shown = true;

        const result = await executeRecallRoutes({}, makeMockState({ routing }));
        if (!('entries' in result)) expect.fail('expected an index result');

        expect(result.entries.map((e) => e.id)).toEqual([secondId, firstId]);
        expect(result.entries.find((e) => e.id === secondId)?.shown).toBe(true);
        expect(result.entries.find((e) => e.id === firstId)?.shown).toBe(false);
    });

    it('errors on an unknown id', async () => {
        const routing = new RoutingState({} as TomTomMap);
        const result = await executeRecallRoutes({ id: 'routes-9' }, makeMockState({ routing }));
        expect(result).toEqual({ error: 'No entry found with id "routes-9"' });
    });

    it('returns route + waypoint detail, dropping waypoints that cannot be summarized', async () => {
        const routing = new RoutingState({} as TomTomMap);
        const waypoints = [[4.9, 52.4], null] as unknown as WaypointLike[];
        const id = await routing.addRoutes(
            { type: 'FeatureCollection', features: [makeSummarizableRoute()] },
            waypoints,
            'trip',
        );

        const result = await executeRecallRoutes({ id }, makeMockState({ routing }));
        if (!('routes' in result)) expect.fail('expected a detail result');

        expect(result.id).toBe(id);
        expect(result.routes.count).toBe(1);
        // The null waypoint is silently dropped; only the summarizable tuple survives.
        expect(result.waypoints).toEqual([{ position: [4.9, 52.4] }]);
    });

    // Mirrors the reverse-geocode phantom-return regression: summarizeRoute's very first line
    // destructures `route.properties.summary`/`sections.leg` with no guard, and executeRecallRoutes
    // wraps none of this in a try/catch — so a stored route entry whose data is a "phantom" Feature
    // with no real summary (`makeMockRoute()`'s bare `properties: {}`, e.g. a route computed without
    // full metadata) currently crashes instead of returning a graceful error.
    it('rejects (does not return a caught error) on a phantom route entry with no summary data', async () => {
        const routing = new RoutingState({} as TomTomMap);
        const id = await routing.addRoutes({ type: 'FeatureCollection', features: [makeMockRoute()] }, [], 'phantom');

        const promise = executeRecallRoutes({ id }, makeMockState({ routing }));

        await expect(promise).rejects.toThrow();
    });
});
