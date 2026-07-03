import type { CommonPlaceProps, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { type CustomGeoJSONLayerSpec, type GeometriesModule, mapStyleLayerIDs } from '@tomtom-org/maps-sdk/map';
import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from 'geojson';
import { type DataDrivenPropertyValueSpecification, type Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import sitePinSvg from './assets/site-pin.svg?raw';

// Shared rich map visuals for the site tools. Markers + connector lines (with distance labels) are
// drawn as ONE BYOD overlay via a CustomGeoJSONModule, which gives full per-feature control the
// higher-level places/ranges slices don't: per-point colour, dashed connectors, and a label rendered
// ALONG each connector line (the nearest-competitor / parking distance). Numbered, region-clipped
// hexes use the customGeometries slice (fill colour + centred title number).

const GLYPH_FONT = 'Noto-Bold'; // the style's bundled glyph set (matches the SDK's own symbol layers)

// CSS font shorthands for the HTML overlays (popups, badges, pins) — the Playbook titles the panels
// use, sharable here because these elements render outside React.
const FONT_STACK = 'var(--pb-font-primary),system-ui,sans-serif';
const TITLE_3_FONT = `700 14px/20px ${FONT_STACK}`;
const TITLE_4_FONT = `700 12px/16px ${FONT_STACK}`;

export type OverlayKind = 'site' | 'competitor' | 'parking' | 'anchor' | 'target';

// Colours double as the legend the panels show, so map ↔ panel agree on what each marker means.
export const KIND_COLOR: Record<OverlayKind, string> = {
    site: '#111827', // near-black — the subject site (now drawn as an HTML pin, not a circle)
    competitor: '#E60000', // design dot red — rivals
    parking: '#255AA0', // blue — parking
    anchor: '#6B7280', // grey — demand anchors / area make-up POIs
    target: '#7C3AED', // violet — whitespace target peers
};
// Dots are shrunk ~1/3 from the design size (POI dot radius 6 → 4) so dense scans with many markers stay
// legible without an arbitrary draw cap; whitespace anchor dots stay a touch smaller still.
const KIND_RADIUS: Record<OverlayKind, number> = { site: 4, competitor: 4, parking: 4, anchor: 3, target: 4 };

// Figma catchment "Area-polygon" (node 975:36672): translucent blue fill + a solid 3px blue border.
const CATCHMENT_COLOR = '#4689C4';

// Cannibalization shared-catchment fill (Figma). Doubles as the CatchmentOverlapPanel accent so the
// pink overlap on the map matches the panel's bars + headline %.
export const OVERLAP_COLOR = '#ce5e95';

// Site-selection polygons are split across the layer stack: the translucent FILL sinks beneath the
// road network (`lowestRoadLine`) so streets stay readable through it, while the crisp BORDER/OUTLINE
// sits higher — below the text labels (`lowestLabel`) — so it reads over the roads without hiding
// place names. Markers, connectors and hex numbers stay on top.
//
// Two positioning APIs, one intent: the raw CustomGeoJSON overlay layers below take a resolved layer
// id via `beforeID` (hence `mapStyleLayerIDs.*`), while GeometriesModule takes the `mapStyleLayerIDs`
// KEY name in its config (the SDK resolves it) — see `positionPolygonLayers`.
const FILL_BEFORE_ID = mapStyleLayerIDs.lowestRoadLine;
const LINE_BEFORE_ID = mapStyleLayerIDs.lowestLabel;
const FILL_BEFORE_LAYER = 'lowestRoadLine';
const LINE_BEFORE_LAYER = 'lowestLabel';

// Split a module's fill/border across the layer stack. `moveBeforeLayer({ fill, line })` is a straight
// two-move (no config diff), and GeometriesModule persists the order across style restores itself. It's
// cheap and idempotent to re-run, so we call it after every show rather than guarding with a WeakSet —
// that also means a module re-themed via `applyConfig` (which replaces the whole config, wiping any
// per-section `beforeLayerConfig`) simply gets re-split on its next draw.
export const positionPolygonLayers = (module: GeometriesModule): void => {
    module.moveBeforeLayer({ fill: FILL_BEFORE_LAYER, line: LINE_BEFORE_LAYER });
};

// Paint expression: each feature's own `properties.color`, so multi-colour sets paint themselves.
const PER_FEATURE_COLOR = ['get', 'color'] as DataDrivenPropertyValueSpecification<string>;

const SCAN_AREA_COLOR = '#5B4FA8'; // whitespace scan purple — distinct from the catchment blue

/** Style the whitespace scan-area polygon (faint fill + boundary, split under roads/labels). */
export const styleScanArea = (module: GeometriesModule): void => {
    const config = module.getConfig();
    module.applyConfig({
        ...config,
        fill: { ...config?.fill, color: SCAN_AREA_COLOR, opacity: 0.08, beforeLayerConfig: FILL_BEFORE_LAYER },
        line: { ...config?.line, color: SCAN_AREA_COLOR, width: 3, opacity: 0.9, beforeLayerConfig: LINE_BEFORE_LAYER },
    });
};

/**
 * Style a themed catchment module (ranges slice). `perFeatureColor` reads each polygon's own
 * `properties.color` (rankSites stamps its score colours); otherwise the single catchment blue.
 */
export const styleCatchment = (module: GeometriesModule, perFeatureColor = false): void => {
    const config = module.getConfig();
    const color = perFeatureColor ? PER_FEATURE_COLOR : CATCHMENT_COLOR;
    module.applyConfig({
        ...config,
        fill: { ...config?.fill, color, opacity: 0.1, beforeLayerConfig: FILL_BEFORE_LAYER },
        line: { ...config?.line, color, width: 3, opacity: 1, beforeLayerConfig: LINE_BEFORE_LAYER },
        // Silence the module's auto budget labels (border + centred) — the pins/panels carry that info.
        textConfig: { ...config?.textConfig, textField: ['literal', ''] },
        lineLabelConfig: { ...config?.lineLabelConfig, textOpacity: 0 },
    });
};

// Categorical palette for colour-by-category overlays (e.g. demand POIs in findWhitespace). Avoids
// the competitor red (#DF1B12) so the two never read as the same thing. Cycled by category index.
export const CATEGORY_PALETTE = [
    '#2F6FB0', // blue
    '#1F9D55', // green
    '#E8761A', // orange
    '#7C3AED', // violet
    '#0E9AA7', // teal
    '#B45309', // brown
    '#DB2777', // pink
    '#6366F1', // indigo
];
export const CATEGORY_OTHER_COLOR = '#9CA3AF'; // grey — overflow / uncategorised

// `label` = a small text under the dot (used sparingly). `name`/`info` are shown in a click popup —
// the real POI name + category, so markers are interrogable, not just dots. `color` overrides the
// kind colour (used to colour points by category).
export type OverlayPoint = {
    position: [number, number];
    kind: OverlayKind;
    label?: string;
    name?: string;
    info?: string;
    color?: string;
};
export type OverlayLine = { from: [number, number]; to: [number, number]; label: string; kind: OverlayKind };

// MapLibre layers for the overlay source: catchment fill + border (bottom) → connector line → its
// centred distance label → markers → optional marker labels. Geometry-type filters keep each layer to
// the right features, and array order is z-order (catchment first = beneath everything).
const OVERLAY_LAYERS: CustomGeoJSONLayerSpec[] = [
    {
        type: 'fill',
        filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
        paint: { 'fill-color': CATCHMENT_COLOR, 'fill-opacity': 0.1 },
        beforeID: FILL_BEFORE_ID,
    },
    {
        type: 'line',
        filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
        paint: { 'line-color': CATCHMENT_COLOR, 'line-width': 3, 'line-opacity': 1 },
        beforeID: LINE_BEFORE_ID,
    },
    {
        type: 'line',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-dasharray': [2, 1.5], 'line-opacity': 0.9 },
    },
    {
        type: 'symbol',
        filter: ['==', ['geometry-type'], 'LineString'],
        layout: {
            'symbol-placement': 'line-center',
            'text-field': ['get', 'label'],
            'text-font': [GLYPH_FONT],
            'text-size': 12,
        },
        paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
    },
    {
        type: 'circle',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
            'circle-radius': ['get', 'radius'],
            'circle-color': ['get', 'color'],
            'circle-stroke-color': '#000000',
            'circle-stroke-opacity': 0.2,
            'circle-stroke-width': 1,
        },
    },
    {
        type: 'symbol',
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['!=', ['get', 'label'], '']],
        layout: {
            'text-field': ['get', 'label'],
            'text-font': [GLYPH_FONT],
            'text-size': 11,
            'text-offset': [0, 1.1],
            'text-anchor': 'top',
        },
        paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
    },
];

// MapLibre's addLayer silently DROPS a layer whose `beforeID` target is missing (see `addLayers` in the
// SDK — it parks the layer as an unmet dependency and never adds it). The satellite style has no
// `lowestRoadLine` / `lowestLabel` layer, so on a style the agent can switch to via
// `setMapStandardStyle('satellite')` a hard-coded anchor would make the catchment fill + border vanish
// entirely. Strip the anchor when it's absent (the polygon then renders on top — visible, just not
// tucked under roads/labels) and keep it where present so the split still holds on the default style.
const resolveOverlayLayers = (map: MapLibreMap): CustomGeoJSONLayerSpec[] =>
    OVERLAY_LAYERS.map((layer) => {
        if (layer.beforeID && !map.getLayer(layer.beforeID)) {
            const { beforeID: _absent, ...withoutAnchor } = layer;
            return withoutAnchor;
        }
        return layer;
    });

const buildOverlay = (
    points: OverlayPoint[],
    lines: OverlayLine[],
    catchment?: Polygon | MultiPolygon | null,
): FeatureCollection => {
    // The catchment polygon (when present) renders via the fill + border layers beneath the markers.
    const catchmentFeatures: Feature<Polygon | MultiPolygon>[] = catchment
        ? [{ type: 'Feature', id: 'catchment', geometry: catchment, properties: { kind: 'catchment' } }]
        : [];
    const lineFeatures: Feature<LineString>[] = lines.map((line, index) => ({
        type: 'Feature',
        id: `line-${index}`,
        geometry: { type: 'LineString', coordinates: [line.from, line.to] },
        properties: { kind: line.kind, color: KIND_COLOR[line.kind], label: line.label },
    }));
    const pointFeatures: Feature<Point>[] = points.map((point, index) => ({
        type: 'Feature',
        id: `point-${index}`,
        geometry: { type: 'Point', coordinates: point.position },
        properties: {
            kind: point.kind,
            color: point.color ?? KIND_COLOR[point.kind],
            radius: KIND_RADIUS[point.kind],
            label: point.label ?? '',
            name: point.name ?? '',
            info: point.info ?? '',
        },
    }));
    return { type: 'FeatureCollection', features: [...catchmentFeatures, ...lineFeatures, ...pointFeatures] };
};

// One reused popup so clicking marker → marker just moves it, never stacks.
let activePopup: Popup | null = null;

const closeActivePopup = (): void => {
    activePopup?.remove();
    activePopup = null;
};

const cap = (value: string): string => (value ? value[0].toUpperCase() + value.slice(1) : value);

const CLOSE_ICON =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>';

// Marker popup body, built as real DOM so the close button gets a live handler. Chrome, radius,
// shadow and the tip come from the `.site-popup` class in style.css.
const buildPopupCard = (name: string, info: string, kind: string): HTMLElement => {
    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:flex-start;padding:12px';

    const title = document.createElement('div');
    title.textContent = name;
    // padding-right keeps long names clear of the corner close button
    title.style.cssText = `padding-right:24px;font:${TITLE_3_FONT};color:var(--pb-text-high)`;
    body.appendChild(title);

    const subtitle = [info, cap(kind)].filter(Boolean).join(' · ');
    if (subtitle) {
        const sub = document.createElement('div');
        sub.textContent = subtitle;
        sub.style.cssText = `max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:${TITLE_4_FONT};color:var(--pb-text-low)`;
        body.appendChild(sub);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = CLOSE_ICON;
    close.style.cssText =
        'position:absolute;top:0;right:0;display:flex;align-items:center;justify-content:center;padding:8px;border:0;background:transparent;border-radius:40px;cursor:pointer;color:var(--pb-text-high)';
    close.addEventListener('click', closeActivePopup);
    body.appendChild(close);

    return body;
};

// Background ("rest of the map") clicks close the open popup; marker layers sit above the base map,
// so their clicks never reach this handler. Bound once for the app's lifetime.
let backgroundCloseBound = false;
const bindBackgroundClose = async (state: ToolState): Promise<void> => {
    if (backgroundCloseBound) return;
    backgroundCloseBound = true;
    const baseMap = await state.baseMap.getBaseMapModule();
    baseMap.events.on('click', closeActivePopup);
};

// Raise the dot/connector/label layers to the top of the stack so they read over every polygon
// fill, whatever drew last. Indexes 0-1 (catchment fill + border) stay tucked under roads/labels.
const raiseOverlayMarkerLayers = async (state: ToolState, entryId: string): Promise<void> => {
    const module = await state.byod.getEntryModule(entryId);
    const map = state.baseMap.mapLibreMap;
    for (const layerId of module.sourceAndLayerIDs.data.layerIDs.slice(2)) {
        if (map.getLayer(layerId)) map.moveLayer(layerId);
    }
};

// Click a marker → popup with its POI name + category. CustomGeoJSONModule gives per-source click
// events (and auto pointer-cursor on hover); the source is named 'data' in the BYOD slice.
const attachMarkerPopups = async (state: ToolState, entryId: string): Promise<void> => {
    const module = await state.byod.getEntryModule(entryId);
    const events = (
        module.events as Record<
            string,
            {
                on?: (
                    type: 'click',
                    handler: (
                        feature: { properties: Record<string, unknown> | null },
                        lngLat: { lng: number; lat: number },
                    ) => void,
                ) => void;
            }
        >
    ).data;
    events?.on?.('click', (feature, lngLat) => {
        const props = feature.properties ?? {};
        const name = typeof props.name === 'string' ? props.name : '';
        if (!name) return; // connectors / unlabelled points: nothing to show
        const info = typeof props.info === 'string' ? props.info : '';
        const kind = typeof props.kind === 'string' ? props.kind : '';
        closeActivePopup();
        activePopup = new Popup({ offset: 12, closeButton: false, className: 'site-popup' })
            .setLngLat([lngLat.lng, lngLat.lat])
            .setDOMContent(buildPopupCard(name, info, kind))
            .addTo(state.baseMap.mapLibreMap);
    });
    await bindBackgroundClose(state);
};

// The site marker: the Figma "Location Map Marker" (node 975:36620) — a teardrop pin with a white
// dot (in `./assets/site-pin.svg`), and a two-line shadowed "Label Light" address beneath it. It's a
// single-site cue, so any new catchment / overlay clears it (only profileSite re-adds it). A plain
// MapLibre HTML Marker — no SDK internals, pointer-events:none so it never intercepts map drags or
// marker clicks. profileSite suppresses the ranges slice's own origin pin (drawCatchment
// showOriginPin=false) so this is the only pin/label for the profiled site.
const SITE_PIN_HEIGHT = 47; // px — must match the svg's height; the tip sits at the bottom, on the coordinate.

let activeSiteMarker: Marker | null = null;

export const clearSiteMarker = (): void => {
    activeSiteMarker?.remove();
    activeSiteMarker = null;
};

export const drawSiteMarker = (state: ToolState, position: [number, number], text: string): void => {
    clearSiteMarker();
    const el = document.createElement('div');
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;pointer-events:none';

    const pin = document.createElement('div');
    pin.innerHTML = sitePinSvg;
    el.appendChild(pin);

    if (text.trim()) {
        const label = document.createElement('div');
        label.textContent = text;
        label.style.cssText = [
            'max-width:220px',
            'text-align:center',
            'white-space:normal',
            "font-family:'Noto Sans',var(--pb-font-primary),system-ui,sans-serif",
            'font-weight:600',
            'font-size:20px',
            'line-height:28px',
            'color:#18212a',
            // White halo for map legibility (paint-order:stroke keeps the dark glyph on top of the
            // white stroke), plus the design's subtle drop shadow.
            'paint-order:stroke',
            '-webkit-text-stroke:4px #ffffff',
            'text-shadow:0px 1px 3px rgba(0,0,0,0.3)',
            'margin-top:2px',
        ].join(';');
        el.appendChild(label);
    }

    // anchor:'top' + offset up by the pin height places the pin's tip on the coordinate (body above),
    // with the label flowing just beneath — the design's pin-then-label stack.
    activeSiteMarker = new Marker({ element: el, anchor: 'top', offset: [0, -SITE_PIN_HEIGHT] })
        .setLngLat(position)
        .addTo(state.baseMap.mapLibreMap);
};

// Ranked-site pins: the site-pin teardrop per site, fill + lighter ring in the site's catchment
// colour, rank number centred in the pin's head. HTML markers — the map's glyph set can't render
// the webfont or per-site tints.
const PIN_PATH =
    'M20 0C31.0457 0 40 8.95431 40 20C40 26.7231 36.6825 32.6706 31.5954 36.2961C27.6837 39.0838 23.5022 41.8878 21.3164 46.165C20.7479 47.2777 19.2521 47.2777 18.6836 46.165C16.4972 41.8877 12.3152 39.0837 8.40348 36.2955C3.31696 32.6698 0 26.7226 0 20C0 8.95431 8.95431 0 20 0Z';

export type RankedPin = { position: [number, number]; color: string; number: number | null };

let rankedPinMarkers: Marker[] = [];

export const clearRankedPins = (): void => {
    for (const marker of rankedPinMarkers) marker.remove();
    rankedPinMarkers = [];
};

/** Draw (or replace) one numbered, colour-matched pin per ranked site. `number: null` = excluded ("–"). */
export const drawRankedPins = (state: ToolState, pins: RankedPin[]): void => {
    clearRankedPins();
    for (const pin of pins) {
        const el = document.createElement('div');
        el.style.cssText = 'pointer-events:none';
        el.innerHTML =
            '<svg width="40" height="47" viewBox="0 0 40 47" fill="none" xmlns="http://www.w3.org/2000/svg" ' +
            'style="display:block;overflow:visible;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">' +
            // color-mix() is CSS-only — as an svg attribute some engines drop it, so the stroke lives in style
            `<path d="${PIN_PATH}" fill="${pin.color}" stroke-width="2.5" style="stroke:color-mix(in srgb, ${pin.color} 45%, white)"/>` +
            '<text x="20" y="20" text-anchor="middle" dominant-baseline="central" fill="#ffffff" ' +
            `style="font:700 14px ${FONT_STACK}">${pin.number ?? '–'}</text>` +
            '</svg>';
        rankedPinMarkers.push(
            // anchor:'bottom' puts the pointer tip on the site coordinate
            new Marker({ element: el, anchor: 'bottom' }).setLngLat(pin.position).addTo(state.baseMap.mapLibreMap),
        );
    }
};

// One shared overlay id across all the site tools, so a new analysis REPLACES the previous markers
// rather than stacking a stale profile overlay under a fresh ranking.
const SITE_OVERLAY_ID = 'site-overlay';

/**
 * Draw (or replace) the single rich overlay: the catchment polygon (styled per Figma), connector
 * lines, and markers — all one BYOD entry, so re-running any analysis swaps it atomically. Pass
 * empty arrays (and no catchment) to clear it.
 */
export const drawRichOverlay = async (
    state: ToolState,
    label: string,
    points: OverlayPoint[],
    lines: OverlayLine[],
    catchment?: Polygon | MultiPolygon | null,
): Promise<void> => {
    closeActivePopup();
    clearSiteMarker();
    for (const entry of [...state.byod.entries]) {
        if (entry.id === SITE_OVERLAY_ID || entry.id.startsWith(`${SITE_OVERLAY_ID}-`)) {
            await state.byod.removeEntry(entry.id);
        }
    }
    if (points.length === 0 && lines.length === 0 && !catchment) return;
    const entryId = await state.byod.addEntry(buildOverlay(points, lines, catchment), label, {
        explicitId: SITE_OVERLAY_ID,
        layers: resolveOverlayLayers(state.baseMap.mapLibreMap),
    });
    await state.byod.showEntry(entryId);
    await raiseOverlayMarkerLayers(state, entryId);
    await attachMarkerPopups(state, entryId);
};

type AreaGeometry = Polygon | MultiPolygon;

/**
 * Clip a hex to the region so partial cells are trimmed at the boundary (no hexes spilling outside).
 * Returns the clipped polygon, or null when the hex doesn't overlap the area at all.
 */
export const clipHexToArea = (hex: Feature<Polygon>, area: AreaGeometry): Feature<Polygon | MultiPolygon> | null => {
    try {
        const clipped = turf.intersect(turf.featureCollection([hex, turf.feature(area)]));
        return clipped ? (clipped as Feature<Polygon | MultiPolygon>) : null;
    } catch {
        return null;
    }
};

export type NumberedHex = { feature: Feature<Polygon | MultiPolygon>; color: string; number: number; label: string };

// Circular pocket-number badges at each hex's centre of mass. HTML markers — the map's glyph set
// can't render the webfont or a filled round badge, and markers always sit above the polygon fills.
let hexNumberMarkers: Marker[] = [];

const clearHexNumberMarkers = (): void => {
    for (const marker of hexNumberMarkers) marker.remove();
    hexNumberMarkers = [];
};

const addHexNumberMarkers = (state: ToolState, hexes: NumberedHex[]): void => {
    for (const hex of hexes) {
        const badge = document.createElement('div');
        badge.textContent = String(hex.number);
        badge.style.cssText =
            'display:flex;align-items:center;justify-content:center;width:24px;height:24px;' +
            `border-radius:100px;background:${hex.color};pointer-events:none;` +
            `font:${TITLE_4_FONT};color:#ffffff`;
        const centre = turf.centerOfMass(hex.feature).geometry.coordinates;
        hexNumberMarkers.push(
            new Marker({ element: badge })
                .setLngLat([centre[0], centre[1]])
                .addTo(state.baseMap.mapLibreMap),
        );
    }
};

/** Draw (or replace) coloured hexes, each numbered by an HTML badge at its centre. */
export const drawNumberedHexes = async (state: ToolState, label: string, hexes: NumberedHex[]): Promise<void> => {
    for (const entry of [...state.customGeometries.entries]) {
        if (entry.provenance.operation === 'whitespace') await state.customGeometries.removeEntry(entry.id);
    }
    clearHexNumberMarkers();
    if (hexes.length === 0) return;
    const features = hexes.map(
        (hex, index) =>
            ({
                ...hex.feature,
                id: `whitespace-${index}`,
                properties: { name: hex.label, color: hex.color },
            }) as unknown as PolygonFeature<CommonPlaceProps>,
    );
    const entryId = await state.customGeometries.addEntry(features, { operation: 'whitespace', sourceIds: [] }, label);
    // Configured before showing — no default-theme flash.
    const geometriesModule = await state.customGeometries.getEntryGeometriesModule(entryId, 'filled');
    const config = geometriesModule.getConfig();
    geometriesModule.applyConfig({
        ...config,
        fill: { ...config?.fill, color: PER_FEATURE_COLOR, opacity: 0.5, beforeLayerConfig: LINE_BEFORE_LAYER },
        line: { ...config?.line, color: PER_FEATURE_COLOR, width: 3, opacity: 1, beforeLayerConfig: LINE_BEFORE_LAYER },
    });
    await state.customGeometries.showEntry(entryId, 'filled');
    addHexNumberMarkers(state, hexes);
};

// Subtle backdrop colour for the full scan grid — visible but recedes behind the coloured pockets.
const HEX_GRID_OUTLINE_COLOR = '#94A3B8'; // slate grey

/**
 * Draw (or replace) every scanned hex as a plain, thin outline (no fill, no number) via the
 * customGeometries slice — the "here's the whole grid" backdrop under the coloured opportunity pockets
 * that {@link drawNumberedHexes} fills on top. The themed `'outline'` border is 5px (fine for one
 * boundary, far too heavy for a grid of hundreds of cells), so this overrides the line to a hairline
 * grey and keeps the fill transparent.
 */
export const drawHexOutlineGrid = async (
    state: ToolState,
    label: string,
    hexes: Feature<Polygon | MultiPolygon>[],
): Promise<void> => {
    for (const entry of [...state.customGeometries.entries]) {
        if (entry.provenance.operation === 'whitespace-grid') await state.customGeometries.removeEntry(entry.id);
    }
    if (hexes.length === 0) return;
    const features = hexes.map(
        (hex, index) =>
            ({ ...hex, id: `whitespace-grid-${index}`, properties: {} }) as unknown as PolygonFeature<CommonPlaceProps>,
    );
    const entryId = await state.customGeometries.addEntry(
        features,
        { operation: 'whitespace-grid', sourceIds: [] },
        label,
    );
    // Configure the module before showing, so the grid renders straight to a hairline grey outline with
    // a transparent fill (no 5px flash), split across the layer stack: fill below roads, line below labels.
    const module = await state.customGeometries.getEntryGeometriesModule(entryId, 'outline');
    const config = module.getConfig();
    module.applyConfig({
        ...config,
        fill: { ...config?.fill, opacity: 0, beforeLayerConfig: FILL_BEFORE_LAYER },
        line: {
            ...config?.line,
            color: HEX_GRID_OUTLINE_COLOR,
            width: 1,
            opacity: 0.55,
            beforeLayerConfig: LINE_BEFORE_LAYER,
        },
    });
    await state.customGeometries.showEntry(entryId, 'outline');
};
