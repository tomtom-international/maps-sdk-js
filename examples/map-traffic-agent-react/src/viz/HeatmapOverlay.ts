import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { mapStyleLayerIDs } from '@tomtom-org/maps-sdk/map';
import type { GeoJSONSource, HeatmapLayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { VizMode } from './types';

const SOURCE_ID = 'tm-incident-heatmap';
const LAYER_ID = 'tm-incident-heatmap-layer';

// Sampling step along LineString incidents, in meters. Smaller = smoother but
// more features in the source.
const STEP_M = 25;

// Cap on per-sample weight (delay seconds per meter of road). A 100 m closure
// holding everyone for 1000 s is 10 s/m — that's already very intense; anything
// hotter would just saturate the ramp without reading as different.
// Tune empirically against real city data.
const MAX_DELAY_PER_M = 10;

// For incidents with length below this, treat them as "concentrated" at one
// point — avoids divide-by-zero and avoids pathological s/m values from sub-step
// LineStrings.
const MIN_LEN_M = 10;

// YlOrRd 8-stop ramp ported from the deck.gl version.
const HEAT_COLOR_RAMP: Array<[number, string]> = [
    [0.0, 'rgba(255,255,204,0)'],
    [0.15, '#ffeda0'],
    [0.3, '#fed976'],
    [0.45, '#feb24c'],
    [0.6, '#fd8d3c'],
    [0.75, '#fc4e2a'],
    [0.88, '#e31a1c'],
    [1.0, '#b10026'],
];

type SampleProps = { weight: number };

export class HeatmapOverlay {
    private mode: VizMode = 'off';
    private removed = false;
    private features: GeoJSON.Feature<GeoJSON.Point, SampleProps>[] = [];

    constructor(private readonly map: MapLibreMap) {
        this.ensureSourceAndLayer();
    }

    setIncidents(incidents: readonly TrafficIncident[]): void {
        this.features = featuresFromIncidents(incidents);
        this.pushData();
    }

    setMode(mode: VizMode): void {
        if (this.mode === mode) return;
        this.mode = mode;
        this.applyVisibility();
    }

    getMode(): VizMode {
        return this.mode;
    }

    remove(): void {
        if (this.removed) return;
        this.removed = true;
        try {
            if (this.map.getLayer(LAYER_ID)) this.map.removeLayer(LAYER_ID);
            if (this.map.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID);
        } catch {
            // Map may already be torn down; ignore.
        }
    }

    private ensureSourceAndLayer(): void {
        if (!this.map.getSource(SOURCE_ID)) {
            this.map.addSource(SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
        }
        if (!this.map.getLayer(LAYER_ID)) {
            // beforeId of `lowestRoadLine` puts the heatmap *under* every road
            // line in the basemap — same pattern as TrafficAreaAnalyticsModule.
            const beforeId = this.map.getLayer(mapStyleLayerIDs.lowestRoadLine)
                ? mapStyleLayerIDs.lowestRoadLine
                : undefined;
            this.map.addLayer(buildHeatmapLayerSpec(), beforeId);
            this.applyVisibility();
        }
    }

    private pushData(): void {
        if (this.removed) return;
        const src = this.map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;
        src.setData({ type: 'FeatureCollection', features: this.features });
    }

    private applyVisibility(): void {
        if (this.removed) return;
        if (!this.map.getLayer(LAYER_ID)) return;
        this.map.setLayoutProperty(LAYER_ID, 'visibility', this.mode === 'heatmap' ? 'visible' : 'none');
    }
}

const buildHeatmapLayerSpec = (): HeatmapLayerSpecification => ({
    id: LAYER_ID,
    type: 'heatmap',
    source: SOURCE_ID,
    paint: {
        // `weight` on each feature is delay-seconds-per-meter, capped at MAX_DELAY_PER_M.
        // Map [0, MAX_DELAY_PER_M] linearly to [0, 1] kernel contribution.
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, MAX_DELAY_PER_M, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 2, 16, 4],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 1, 8, 3, 12, 35, 14, 80, 16, 100],
        'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            ...HEAT_COLOR_RAMP.flatMap(([d, c]) => [d, c] as const),
        ],
        'heatmap-opacity': 0.75,
    },
});

// ── Sampling: incidents → weighted point features ───────────────────────

function featuresFromIncidents(incidents: readonly TrafficIncident[]): GeoJSON.Feature<GeoJSON.Point, SampleProps>[] {
    const out: GeoJSON.Feature<GeoJSON.Point, SampleProps>[] = [];
    for (const inc of incidents) {
        const id = inc.properties.id;
        if (typeof id !== 'string') continue;
        const delay = inc.properties.delayInSeconds ?? 0;
        if (delay <= 0) continue;

        const g = inc.geometry;
        if (g.type === 'Point') {
            out.push(pointFeature(g.coordinates as [number, number], clampWeight(delay / MIN_LEN_M)));
            continue;
        }
        if (g.type !== 'LineString') continue;

        const coords = g.coordinates as [number, number][];
        const lengthM = polylineLengthM(coords);
        if (lengthM < STEP_M) {
            // Treat very short lines as a single concentrated point at the midpoint.
            const mid = pointAtDistance(coords, lengthM / 2) ?? coords[0];
            out.push(pointFeature(mid, clampWeight(delay / Math.max(lengthM, MIN_LEN_M))));
            continue;
        }

        const weight = clampWeight(delay / lengthM);
        // Walk along the line at fixed STEP_M intervals — each sample carries the
        // same delay-per-meter, so total mass scales with length × delay-per-meter
        // = delay (Option C).
        for (const pos of walkPolyline(coords, STEP_M)) {
            out.push(pointFeature(pos, weight));
        }
    }
    return out;
}

function clampWeight(w: number): number {
    if (!Number.isFinite(w) || w <= 0) return 0;
    return Math.min(w, MAX_DELAY_PER_M);
}

function pointFeature(coord: [number, number], weight: number): GeoJSON.Feature<GeoJSON.Point, SampleProps> {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coord },
        properties: { weight },
    };
}

// ── Geodesic helpers ────────────────────────────────────────────────────

const EARTH_R = 6_371_000;

function haversineM(a: [number, number], b: [number, number]): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function polylineLengthM(coords: readonly [number, number][]): number {
    let total = 0;
    for (let i = 1; i < coords.length; i++) total += haversineM(coords[i - 1], coords[i]);
    return total;
}

// Yields evenly-spaced points along the polyline at `stepM` meters.
function* walkPolyline(coords: readonly [number, number][], stepM: number): Generator<[number, number]> {
    if (coords.length === 0) return;
    yield [coords[0][0], coords[0][1]];
    let carry = 0; // distance walked since the last emitted sample
    for (let i = 1; i < coords.length; i++) {
        const a = coords[i - 1];
        const b = coords[i];
        const segLen = haversineM(a, b);
        if (segLen === 0) continue;
        let along = stepM - carry;
        while (along <= segLen) {
            const t = along / segLen;
            yield [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
            along += stepM;
        }
        carry = segLen - (along - stepM);
    }
}

function pointAtDistance(coords: readonly [number, number][], distM: number): [number, number] | null {
    let remaining = distM;
    for (let i = 1; i < coords.length; i++) {
        const a = coords[i - 1];
        const b = coords[i];
        const segLen = haversineM(a, b);
        if (remaining <= segLen) {
            const t = segLen === 0 ? 0 : remaining / segLen;
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        }
        remaining -= segLen;
    }
    return coords.length > 0 ? [coords[coords.length - 1][0], coords[coords.length - 1][1]] : null;
}
