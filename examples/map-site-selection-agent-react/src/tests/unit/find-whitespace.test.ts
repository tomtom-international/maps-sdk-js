import { type DiscoverPlacesResponse, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import { resolveWithin, type ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteSelectionState } from '../../agent/site-selection-state';
import { getResultsSnapshot } from '../../results/results-store';
import { findWhitespace } from '../../tools/find-whitespace';

vi.mock('@tomtom-org/maps-sdk/services', () => ({ reverseGeocode: vi.fn(), discoverPlaces: vi.fn() }));
vi.mock('@tomtom-org/maps-sdk-plugin-agent-toolkit', () => ({
    isResolveError: () => false,
    resolveWithin: vi.fn(),
    toolStateToWhereContext: () => ({}),
}));
vi.mock('../../tools/categories', () => ({ resolveCategoriesWithNames: async () => ({ codes: [], names: [] }) }));
// The app config reads the Azure settings on import; the scan never reads it.
vi.mock('../../config', () => ({}));
// The map visuals reach MapLibre, which needs a browser. No cell is clipped in, so no pocket is scored.
vi.mock('../../viz/site-visuals', () => ({
    CATEGORY_OTHER_COLOR: '#9CA3AF',
    CATEGORY_PALETTE: [],
    clipHexToArea: () => null,
    drawHexOutlineGrid: vi.fn(),
    drawNumberedHexes: vi.fn(),
    drawRichOverlay: vi.fn(),
    fitBesidePanel: vi.fn(),
    styleScanArea: vi.fn(),
}));

const discoverPlacesMock = vi.mocked(discoverPlaces);

// Two small areas side by side, each resolved by its name.
const areas = {
    Downtown: turf.bboxPolygon([-115.15, 36.16, -115.13, 36.18]).geometry,
    Eastside: turf.bboxPolygon([-115.11, 36.16, -115.09, 36.18]).geometry,
};
vi.mocked(resolveWithin).mockImplementation(async ({ queries }) => {
    const label = queries?.[0]?.query as keyof typeof areas;
    return [{ label, polygon: areas[label], bbox: turf.bbox(areas[label]) }] as unknown as Awaited<
        ReturnType<typeof resolveWithin>
    >;
});

// The scan reads the session preferences and redraws its scan-area outline through these.
const state = {
    siteSelection: new SiteSelectionState(),
    customGeometries: {
        entries: [],
        addEntry: vi.fn(async () => 'scan-area'),
        getEntryGeometriesModule: vi.fn(async () => ({})),
        showEntry: vi.fn(),
    },
} as unknown as ToolState;

const scan = (areaNames: (keyof typeof areas)[]) =>
    findWhitespace({}).execute(
        { areas: areaNames, targetCategories: ['gym'], colocation: 'avoid', cellSizeMeters: 400, topN: 5 },
        state,
    );

describe('findWhitespace', () => {
    beforeEach(() => {
        discoverPlacesMock.mockReset();
        // Every search inside Eastside fails; Downtown has no places.
        discoverPlacesMock.mockImplementation(async (request) =>
            'geometries' in request && request.geometries[0] === areas.Eastside
                ? Promise.reject(new Error('503'))
                : ({ type: 'FeatureCollection', features: [] } as unknown as DiscoverPlacesResponse),
        );
    });

    it('scans the other areas when one area search fails, and names the one it skipped', async () => {
        const result = await scan(['Downtown', 'Eastside']);
        expect(result.ok).toBe(true);
        expect(result.headline).toContain('Scanned Downtown');
        expect(result.headline).toContain('Not scanned, as the place search failed: Eastside');
        expect(getResultsSnapshot().whitespace?.area).toBe('Downtown');
        expect(getResultsSnapshot().whitespace?.warnings).toContain(
            'Not scanned, as the place search failed: Eastside.',
        );
    });

    it('fails the scan when no area could be searched', async () => {
        expect(await scan(['Eastside'])).toEqual({
            error: 'Whitespace scan failed: the place search failed for Eastside.',
        });
    });
});
