import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { drawRankedSites, type RankedSiteView, restyleRankedSites } from '../../viz/site-visuals';

// The ranked pins are HTML markers; these stand-ins let them be placed and removed outside a browser.
vi.mock('maplibre-gl', () => ({
    Marker: class {
        setLngLat() {
            return this;
        }
        addTo() {
            return this;
        }
        remove() {}
    },
    Popup: class {},
}));
vi.mock('@tomtom-org/maps-sdk/map', () => ({ MAP_BOLD_FONT: 'Noto-Bold' }));
vi.stubGlobal('document', { createElement: () => ({ style: {} }) });

// The ranking's ranges dataset: one catchment per site, in ranking order.
const catchments = {
    type: 'FeatureCollection',
    features: [turf.circle([-115.15, 36.17], 1), turf.circle([-115.1, 36.2], 1)],
} as PolygonFeatures;
const replaceDatasetData = vi.fn(async () => true);
let rankingDataset: { id: string; data: PolygonFeatures } | undefined;
const state = {
    baseMap: { mapLibreMap: {} },
    ranges: { findById: () => rankingDataset, replaceDatasetData },
} as unknown as ToolState;

const site = (label: string, color: string, number: number): RankedSiteView => ({
    label,
    color,
    number,
    position: [-115.15, 36.17],
});
const replacedColors = (): string[] =>
    (replaceDatasetData.mock.calls.at(-1) as unknown as [string, PolygonFeatures])[1].features.map((feature) =>
        String(feature.properties?.color),
    );

describe('restyleRankedSites', () => {
    beforeEach(() => {
        rankingDataset = { id: 'ranking', data: catchments };
        replaceDatasetData.mockClear();
        drawRankedSites(state, 'ranking', [site('Site 1', 'green', 1), site('Site 2', 'red', 2)]);
    });

    it('recolours the catchments in the ranking dataset, so the slice redraws them only where shown', async () => {
        await restyleRankedSites(
            new Map([
                ['Site 1', { color: 'amber', number: 2 }],
                ['Site 2', { color: 'green', number: 1 }],
            ]),
        );

        expect(replaceDatasetData).toHaveBeenCalledWith('ranking', expect.anything(), expect.any(Number));
        expect(replacedColors()).toEqual(['amber', 'green']);
    });

    it('leaves the catchments alone once the ranking dataset is gone', async () => {
        rankingDataset = undefined;

        await restyleRankedSites(new Map([['Site 1', { color: 'amber', number: 1 }]]));

        expect(replaceDatasetData).not.toHaveBeenCalled();
    });
});
