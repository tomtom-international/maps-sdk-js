import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import { describe, expect, it, vi } from 'vitest';
import { resolveExisting } from '../../tools/compare-catchments';
import { buildDriveIsochrone } from '../../tools/profile-site';

vi.mock('../../config', () => ({}));
vi.mock('../../viz/site-visuals', () => ({}));
vi.mock('../../tools/profile-site', () => ({
    buildDriveIsochrone: vi.fn(async (position: [number, number]) => turf.circle(position, 1)),
    buildWalkCircle: vi.fn(),
    drawCatchment: vi.fn(),
    geocodeSite: vi.fn(),
    toPolygonFeature: vi.fn(),
}));

const storeNetwork = turf.featureCollection(
    Array.from({ length: 20 }, (_, index) =>
        turf.point([-115.2 + index * 0.01, 36.17], { name: `Store ${index + 1}` }),
    ),
);
const state = { byod: { findById: () => ({ data: storeNetwork }), datasets: [] } } as unknown as ToolState;

describe('resolveExisting', () => {
    it('builds catchments for the first eight sites of a BYOD network only, and reports the rest as dropped', async () => {
        const { existing, skipped } = await resolveExisting(
            { proposed: { address: 'Fremont Street' }, existingByodDatasetId: 'stores' },
            state,
            { walking: false, walkReachMeters: 800, driveMinutes: 10 },
        );

        expect(existing.map((site) => site.label)).toEqual(
            Array.from({ length: 8 }, (_, index) => `Store ${index + 1}`),
        );
        expect(vi.mocked(buildDriveIsochrone)).toHaveBeenCalledTimes(8);
        expect(skipped).toEqual(['12 more existing sites beyond the 8-site limit (not compared)']);
    });
});
