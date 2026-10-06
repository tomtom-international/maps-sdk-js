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
vi.mock('@tomtom-org/maps-sdk/map', () => ({ mapStyleLayerIDs: {} }));
vi.stubGlobal('document', { createElement: () => ({ style: {} }) });

type Catchments = { show: (features: PolygonFeatures) => Promise<void> };

// Each request for the catchments module waits until the test hands the module over.
let pendingModules: PromiseWithResolvers<Catchments>[] = [];
const show = vi.fn<Catchments['show']>();
const state = {
    baseMap: { mapLibreMap: {} },
    ranges: {
        entries: [{ id: 'ranking' }],
        getEntryGeometriesModule: () => {
            const pending = Promise.withResolvers<Catchments>();
            pendingModules.push(pending);
            return pending.promise;
        },
    },
} as unknown as ToolState;

const site = (label: string, color: string, number: number): RankedSiteView => ({
    label,
    color,
    number,
    position: [-115.15, 36.17],
    catchment: turf.circle([-115.15, 36.17], 1),
});
const shownColors = (): string[] =>
    show.mock.calls.flatMap(([features]) => features.features.map((feature) => String(feature.properties?.color)));

describe('restyleRankedSites', () => {
    beforeEach(() => {
        pendingModules = [];
        show.mockReset();
        drawRankedSites(state, 'ranking', [site('Site 1', 'green', 1), site('Site 2', 'red', 2)]);
    });

    it('paints only the latest restyle when an earlier one finishes last', async () => {
        const earlier = restyleRankedSites(
            new Map([
                ['Site 1', { color: 'red', number: 2 }],
                ['Site 2', { color: 'green', number: 1 }],
            ]),
        );
        const latest = restyleRankedSites(
            new Map([
                ['Site 1', { color: 'amber', number: 1 }],
                ['Site 2', { color: 'red', number: 2 }],
            ]),
        );
        pendingModules[1]?.resolve({ show });
        await latest;
        pendingModules[0]?.resolve({ show });
        await earlier;

        expect(shownColors()).toEqual(['amber', 'red']);
    });

    it('leaves a newer ranking alone when a restyle of the previous one finishes', async () => {
        const restyle = restyleRankedSites(
            new Map([
                ['Site 1', { color: 'red', number: 2 }],
                ['Site 2', { color: 'green', number: 1 }],
            ]),
        );
        drawRankedSites(state, 'ranking', [site('Site 3', 'green', 1)]);
        pendingModules[0]?.resolve({ show });
        await restyle;

        expect(show).not.toHaveBeenCalled();
    });
});
