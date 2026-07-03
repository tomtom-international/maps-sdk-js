import type { BBox, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, type GeometriesModuleConfig, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Marker } from 'maplibre-gl';
import { playbook } from '../ui/lib/playbook-tokens';

/**
 * The watched-area highlight: a green rounded box around each shown incident area's fetched bbox, with a
 * "Live · <label>" pill pinned to its top-left corner. Mirrors {@link HeatmapOverlay}/`ClustersOverlay` —
 * an example-side viz overlay over the map, kept in sync from `useWatchedAreaOverlay`. The agent-toolkit
 * state layer intentionally owns no presentation: this brand visual (color, font, copy) lives here.
 *
 * The box rides a single {@link GeometriesModule} (one FeatureCollection of all areas, re-shown on
 * change); the pills are HTML MapLibre markers (an outline can't carry a corner chip), diffed by entry id.
 */
export type WatchedArea = { id: string; bbox: BBox; label: string };

// Brand success-green — mirrors the `--pb-color-success` token. Hard-coded as a hex because MapLibre
// paint properties can't resolve CSS custom properties; the DOM pill below uses the token directly.
const AREA_COLOR = '#00A65E';

// Solid outline over a faint green fill, below the map's labels (and so below the incident markers).
// TODO: once the GeometriesModule `lineDashArray` option ships (PR #1916), add `lineDashArray: [2, 2]`
// here for the Figma dashed treatment.
const AREA_CONFIG: GeometriesModuleConfig = {
    beforeLayerConfig: 'lowestLabel',
    fill: { color: AREA_COLOR, opacity: 0.1 },
    line: { color: AREA_COLOR, width: 2, opacity: 1 },
};

// Corner radius as a fraction of each side — proportional rounding at every zoom (a fixed geographic
// radius would balloon when zoomed in, vanish when zoomed out). STEPS = points per quarter-arc.
const CORNER_FRACTION = 0.02;
const CORNER_STEPS = 8;

// Rounded-rectangle ring for a bbox. MapLibre line layers have no border-radius, so the rounding is
// baked into the geometry: each corner is a quarter-ellipse and the straight edges fall out of joining
// consecutive arc endpoints. Returns a closed Polygon feature (PolygonFeature requires a bbox).
const roundedRectFromBBox = (bbox: BBox): PolygonFeature => {
    const [w, s, e, n] = bbox;
    const rx = (e - w) * CORNER_FRACTION;
    const ry = (n - s) * CORNER_FRACTION;
    const arc = (cx: number, cy: number, fromDeg: number, toDeg: number): [number, number][] => {
        const pts: [number, number][] = [];
        for (let i = 0; i <= CORNER_STEPS; i++) {
            const a = ((fromDeg + ((toDeg - fromDeg) * i) / CORNER_STEPS) * Math.PI) / 180;
            pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
        }
        return pts;
    };
    const ring: [number, number][] = [
        ...arc(e - rx, n - ry, 90, 0),
        ...arc(e - rx, s + ry, 0, -90),
        ...arc(w + rx, s + ry, -90, -180),
        ...arc(w + rx, n - ry, 180, 90),
    ];
    ring.push(ring[0]);
    return { type: 'Feature', bbox, properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
};

// A zero-width or zero-height bbox has nothing to outline.
const hasArea = (b: BBox): boolean => b[2] !== b[0] && b[3] !== b[1];

// The "Live · <label>" pill — a white rounded chip with a green status dot, anchored to the box's
// top-left corner. Inline styles so the overlay needs no separate stylesheet.
const buildPillEl = (label: string): HTMLElement => {
    const el = document.createElement('div');
    el.style.cssText =
        'display:flex;align-items:center;gap:6px;padding:4px 10px;background:#fff;border-radius:100px;' +
        'box-shadow:0 1px 4px rgba(0,0,0,0.2);white-space:nowrap;pointer-events:none;' +
        `font-family:${playbook.font.headings};font-weight:700;font-size:12px;line-height:16px;color:#000;`;
    const dot = document.createElement('span');
    dot.style.cssText = `width:8px;height:8px;border-radius:50%;flex:none;background:${AREA_COLOR};`;
    const text = document.createElement('span');
    text.textContent = `Live · ${label}`;
    el.append(dot, text);
    return el;
};

export class WatchedAreaOverlay {
    private readonly ttMap: TomTomMap;
    private module: GeometriesModule | null = null;
    private readonly markers = new Map<string, Marker>();
    private removed = false;

    constructor(ttMap: TomTomMap) {
        this.ttMap = ttMap;
    }

    /** Replace the set of highlighted areas. Boxes are re-shown wholesale; pills are diffed by id. */
    async setAreas(areas: readonly WatchedArea[]): Promise<void> {
        if (this.removed) return;
        const drawable = areas.filter((a) => hasArea(a.bbox));

        // Lazy-init the box module on first use; GeometriesModule.get is async, so re-check `removed`.
        this.module ??= await GeometriesModule.get(this.ttMap, AREA_CONFIG);
        if (this.removed) return;
        await this.module.show({
            type: 'FeatureCollection',
            features: drawable.map((a) => roundedRectFromBBox(a.bbox)),
        });
        if (this.removed) return;

        const live = new Set(drawable.map((a) => a.id));
        for (const [id, marker] of this.markers) {
            if (!live.has(id)) {
                marker.remove();
                this.markers.delete(id);
            }
        }
        for (const area of drawable) {
            const [w, , , n] = area.bbox;
            const existing = this.markers.get(area.id);
            if (existing) {
                existing.setLngLat([w, n]);
            } else {
                this.markers.set(
                    area.id,
                    new Marker({ element: buildPillEl(area.label), anchor: 'top-left', offset: [8, 8] })
                        .setLngLat([w, n])
                        .addTo(this.ttMap.mapLibreMap),
                );
            }
        }
    }

    remove(): void {
        this.removed = true;
        for (const marker of this.markers.values()) marker.remove();
        this.markers.clear();
        void this.module?.clear();
        this.module = null;
    }
}
