import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import { describe, expect, it, vi } from 'vitest';
import { SiteSelectionState } from '../../agent/site-selection-state';
import { buildRankedOverlay, collectSite, rankSites } from '../../tools/rank-sites';

vi.mock('@tomtom-org/maps-sdk/services', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@tomtom-org/maps-sdk/services')>()),
    discoverPlaces: vi.fn(async () => ({ type: 'FeatureCollection', features: [] })),
}));
vi.mock('../../tools/categories', () => ({
    resolveCategories: async () => [],
    resolveCategoriesWithNames: async () => ({ codes: [], names: [] }),
}));
vi.mock('../../config', () => ({}));
vi.mock('../../viz/site-visuals', () => ({}));
// Each address geocodes to its own position; the drive-time range of "Unreachable" fails, and that of
// "Pedestrian Zone" comes back near-empty.
const POSITIONS: Record<string, [number, number]> = {
    'Fremont Street': [-115.14, 36.17],
    Unreachable: [-115.2, 36.1],
    'Pedestrian Zone': [-115.3, 36.2],
};
vi.mock('../../tools/profile-site', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../tools/profile-site')>()),
    geocodeSite: vi.fn(async (address: string) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: POSITIONS[address] },
        properties: { address: { freeformAddress: address } },
    })),
    buildDriveIsochrone: vi.fn(async (position: [number, number]) => {
        if (position[0] === POSITIONS.Unreachable[0]) throw new Error('no route');
        const radiusKilometers = position[0] === POSITIONS['Pedestrian Zone'][0] ? 0.01 : 2;
        return turf.circle(position, radiusKilometers, { units: 'kilometers' });
    }),
}));

describe('collectSite', () => {
    it('keeps a site whose walking catchment is small', async () => {
        const site = await collectSite({ label: 'Fremont Street', position: [-115.14, 36.17] }, 0, {
            walking: true,
            walkReachMeters: 150,
            driveMinutes: 10,
            concept: 'coffee shop',
            includeParking: false,
        });

        expect(site).not.toBeNull();
        expect(site?.unavailable).toBeUndefined();
    });
});

describe('buildRankedOverlay', () => {
    const place = (id: string) => ({
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: [-115.14, 36.17] },
        properties: { poi: { name: id, categories: ['cafe'] } },
    });
    const site = (competitorIds: string[]) =>
        ({
            position: [-115.14, 36.17],
            competitorFeatures: competitorIds.map(place),
            parkingFeatures: [],
            nearestCompetitorPosition: null,
            nearestParkingPosition: null,
            counts: { nearestCompetitorMeters: null, nearestParkingMeters: null },
        }) as unknown as Parameters<typeof buildRankedOverlay>[0][number];

    it('pins a competitor shared by overlapping catchments once', () => {
        const { points } = buildRankedOverlay([site(['cafe-1', 'cafe-2']), site(['cafe-2', 'cafe-3'])]);
        expect(points.map((point) => point.name)).toEqual(['cafe-1', 'cafe-2', 'cafe-3']);
    });
});

describe('rankSites', () => {
    it('refuses to rank when only one site is left after a catchment fails', async () => {
        const state = { siteSelection: new SiteSelectionState() } as unknown as ToolState;
        const result = await rankSites({}).execute(
            {
                concept: 'coffee shop',
                sites: [{ address: 'Fremont Street' }, { address: 'Unreachable' }],
                travelMode: 'driving',
                includeParking: false,
            },
            state,
        );
        expect(result).toEqual({
            error: 'Need at least 2 sites to rank; only Fremont Street could be resolved (not: Unreachable).',
        });
    });

    it('refuses to rank when the only other site has a near-empty drive catchment', async () => {
        const state = { siteSelection: new SiteSelectionState() } as unknown as ToolState;
        const result = await rankSites({}).execute(
            {
                concept: 'coffee shop',
                sites: [{ address: 'Fremont Street' }, { address: 'Pedestrian Zone' }],
                travelMode: 'driving',
                includeParking: false,
            },
            state,
        );
        expect(result).toEqual({
            error: 'Need at least 2 sites to rank; only Fremont Street could be resolved (not: Pedestrian Zone).',
        });
    });
});
