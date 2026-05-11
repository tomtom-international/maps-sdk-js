/**
 * Read per-magnitude incident colours from the loaded MapLibre style. Missing layers fall
 * back silently; layers present with a non-string `line-color` (match/case/etc.) fall back
 * and warn once — the author likely intended an override we can't evaluate here.
 *
 * @module
 * @ignore
 */

import type { Map as MapLibreMap } from 'maplibre-gl';

const MAGNITUDES = ['unknown', 'minor', 'moderate', 'major', 'indefinite'] as const;
type Magnitude = (typeof MAGNITUDES)[number];

/** @ignore */
export type IncidentPalette = {
    outline: Record<Magnitude, string>;
    inner: Record<Magnitude, string>;
};

type LayerIdPair = { outline: string; inner: string };

// Layer IDs we pull colours from. Update when the loaded style renames them.
const LAYER_IDS: Record<Magnitude, LayerIdPair> = {
    unknown: { outline: 'TrafficIncidents - No delay outline', inner: 'TrafficIncidents - No delay pattern' },
    minor: { outline: 'TrafficIncidents - Minor jam outline', inner: 'TrafficIncidents - Minor jam' },
    moderate: { outline: 'TrafficIncidents - Moderate jam outline', inner: 'TrafficIncidents - Moderate jam' },
    major: { outline: 'TrafficIncidents - Major jam outline', inner: 'TrafficIncidents - Major jam' },
    indefinite: { outline: 'TrafficIncidents - Closed road outline', inner: 'TrafficIncidents - Closed road pattern' },
};

/** @ignore */
export const FALLBACK_INCIDENT_PALETTE: IncidentPalette = {
    outline: {
        unknown: 'hsl(198, 20%, 54%)',
        minor: 'hsl(45, 85%, 36%)',
        moderate: 'hsl(9, 87%, 31%)',
        major: 'hsl(0, 100%, 17%)',
        indefinite: 'hsl(0, 100%, 34%)',
    },
    inner: {
        unknown: 'hsl(198, 20%, 90%)',
        minor: 'hsl(45, 100%, 51%)',
        moderate: 'hsl(9, 97%, 51%)',
        major: 'hsl(0, 100%, 34%)',
        indefinite: 'hsl(197, 28%, 95%)',
    },
};

/** @ignore */
export const readIncidentPalette = (map: Pick<MapLibreMap, 'getStyle'>): IncidentPalette => {
    const layers = map.getStyle()?.layers ?? [];
    const byId = new Map<string, unknown>();
    for (const layer of layers) {
        byId.set(layer.id, layer);
    }

    const palette: IncidentPalette = {
        outline: { ...FALLBACK_INCIDENT_PALETTE.outline },
        inner: { ...FALLBACK_INCIDENT_PALETTE.inner },
    };
    const nonLiteralLayerIds: string[] = [];

    for (const magnitude of MAGNITUDES) {
        const ids = LAYER_IDS[magnitude];
        const outline = readLineColor(byId.get(ids.outline), ids.outline, nonLiteralLayerIds);
        const inner = readLineColor(byId.get(ids.inner), ids.inner, nonLiteralLayerIds);
        if (outline) palette.outline[magnitude] = outline;
        if (inner) palette.inner[magnitude] = inner;
    }

    if (nonLiteralLayerIds.length > 0) {
        console.warn(
            '[TrafficIncidentOverlayModule] style layers have non-literal `line-color` ' +
                '(match/case/etc.); falling back to default colour for: ' +
                nonLiteralLayerIds.join(', '),
        );
    }

    return palette;
};

const readLineColor = (layer: unknown, layerId: string, nonLiteralSink: string[]): string | undefined => {
    if (!layer || typeof layer !== 'object') return undefined;
    const paint = (layer as { paint?: unknown }).paint;
    if (!paint || typeof paint !== 'object') return undefined;
    const color = (paint as { 'line-color'?: unknown })['line-color'];
    if (typeof color === 'string') return color;
    if (color !== undefined) nonLiteralSink.push(layerId);
    return undefined;
};
