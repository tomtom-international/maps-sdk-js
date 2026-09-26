import type { LayerSpecification, Map, SourceSpecification, TerrainSpecification } from 'maplibre-gl';
import { type Mock, vi } from 'vitest';
import type { StyleChangeContext, StyleChangeHandler, TomTomMap } from '../../TomTomMap';
import {
    BASE_MAP_SOURCE_ID,
    HILLSHADE_SOURCE_ID,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID,
} from '../layers/sourcesIDs';

// The sources a TomTom style ships for the style-owned modules.
const styleSourceSpecs: Record<string, SourceSpecification> = {
    [BASE_MAP_SOURCE_ID]: { type: 'vector', tiles: [] },
    [TRAFFIC_FLOW_SOURCE_ID]: { type: 'vector', tiles: [] },
    [TRAFFIC_INCIDENTS_SOURCE_ID]: { type: 'vector', tiles: [] },
    [HILLSHADE_SOURCE_ID]: { type: 'raster-dem', tiles: [] },
};

// What `setStyle(style)` tells the handlers when the caller doesn't ask for a clean switch.
const carriedOverSwitch: StyleChangeContext = { resetState: false };

/**
 * Enough of a TomTom style for every style-owned module to find its layers: a base-map layer per
 * group the tests care about, the two POI layers, a flow line, an incident line and icon, hillshade.
 */
const styleLayers = (): LayerSpecification[] => [
    { id: 'Water - Fill', type: 'fill', source: BASE_MAP_SOURCE_ID, metadata: { group: 'water' } },
    { id: 'Surface - Railway outline', type: 'line', source: BASE_MAP_SOURCE_ID, metadata: { group: 'road' } },
    {
        id: '3D - Building',
        type: 'fill-extrusion',
        source: BASE_MAP_SOURCE_ID,
        metadata: { group: 'area_3d' },
        layout: { visibility: 'none' },
    },
    { id: 'POI', type: 'symbol', source: BASE_MAP_SOURCE_ID, 'source-layer': 'poi', filter: ['all'] },
    { id: 'POI - Micro', type: 'symbol', source: BASE_MAP_SOURCE_ID, 'source-layer': 'poi', filter: ['all'] },
    { id: 'Flow - Motorway', type: 'line', source: TRAFFIC_FLOW_SOURCE_ID, filter: ['all'] },
    { id: 'Incidents - Line', type: 'line', source: TRAFFIC_INCIDENTS_SOURCE_ID, filter: ['all'] },
    { id: 'Incidents - Icon', type: 'symbol', source: TRAFFIC_INCIDENTS_SOURCE_ID, filter: ['all'] },
    { id: 'Hillshade', type: 'hillshade', source: HILLSHADE_SOURCE_ID },
];

type RuntimeSource = { id: string; type: string; setData: Mock };

/** What {@link mockTomTomMap} hands back. */
export type MockTomTomMap = {
    tomtomMap: TomTomMap;
    /** The MapLibre double, every method a spy. */
    mapLibreMap: Record<string, Mock>;
    /** Runs every style-change handler as the map does after `setStyle`; a carried-over switch by default. */
    fireStyleChange: (context?: StyleChangeContext) => Promise<void>;
};

/**
 * A TomTomMap double every map module can be built on: sources and layers are kept as state, so a
 * module that adds its own finds them again, and layout and filter writes read back the way a live
 * map answers. Style changes are fired through `fireStyleChange`, in the handlers' priority order.
 *
 * Test-only. Prefer this over a per-file mock when a test is about module behaviour rather than
 * about one module's private calls.
 */
export const mockTomTomMap = (): MockTomTomMap => {
    const layers = styleLayers();
    const sources: Record<string, SourceSpecification> = { ...styleSourceSpecs };
    const runtimeSources = new globalThis.Map<string, RuntimeSource>(
        Object.entries(sources).map(([id, spec]) => [id, { id, type: spec.type, setData: vi.fn() }]),
    );
    const layout: Record<string, unknown> = {};
    const filters: Record<string, unknown> = {};
    let terrain: TerrainSpecification | null = null;
    const key = (layerId: string, property: string) => `${layerId}|${property}`;
    const layerById = (id: string) => layers.find((layer) => layer.id === id);
    // Built on first use, so only a test that reaches it needs a DOM (`// @vitest-environment jsdom`).
    let container: HTMLElement | undefined;

    const mapLibreMap = {
        getStyle: vi.fn(() => ({ layers, sources })),
        getSource: vi.fn((id: string) => runtimeSources.get(id)),
        addSource: vi.fn((id: string, spec: SourceSpecification) => {
            sources[id] = spec;
            runtimeSources.set(id, { id, type: spec.type, setData: vi.fn() });
        }),
        removeSource: vi.fn((id: string) => {
            runtimeSources.delete(id);
            delete sources[id];
        }),
        isSourceLoaded: vi.fn(() => true),
        getLayer: vi.fn((id: string) => layerById(id)),
        addLayer: vi.fn((spec: LayerSpecification, beforeId?: string) => {
            const at = beforeId ? layers.findIndex((layer) => layer.id === beforeId) : -1;
            if (at === -1) layers.push(spec);
            else layers.splice(at, 0, spec);
        }),
        removeLayer: vi.fn((id: string) => {
            const at = layers.findIndex((layer) => layer.id === id);
            if (at !== -1) layers.splice(at, 1);
        }),
        moveLayer: vi.fn(),
        setLayoutProperty: vi.fn((id: string, property: string, value: unknown) => {
            layout[key(id, property)] = value;
        }),
        getLayoutProperty: vi.fn((id: string, property: string) => {
            if (key(id, property) in layout) return layout[key(id, property)];
            const layer = layerById(id);
            const layerLayout: Record<string, unknown> | undefined =
                layer && 'layout' in layer ? layer.layout : undefined;
            return layerLayout?.[property];
        }),
        setPaintProperty: vi.fn(),
        getPaintProperty: vi.fn(),
        setFilter: vi.fn((id: string, filter: unknown) => {
            filters[id] = filter;
        }),
        getFilter: vi.fn((id: string) => {
            const layer = layerById(id);
            return filters[id] ?? (layer && 'filter' in layer ? layer.filter : undefined);
        }),
        setLayerZoomRange: vi.fn(),
        getMinZoom: vi.fn(() => 0),
        getMaxZoom: vi.fn(() => 22),
        isStyleLoaded: vi.fn(() => true),
        once: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        off: vi.fn(),
        hasImage: vi.fn(() => false),
        addImage: vi.fn(),
        loadImage: vi.fn(() => Promise.resolve({ data: {} })),
        setSprite: vi.fn(),
        addSprite: vi.fn(),
        getSprite: vi.fn(() => []),
        queryRenderedFeatures: vi.fn(() => []),
        setFeatureState: vi.fn(),
        removeFeatureState: vi.fn(),
        setProjection: vi.fn(),
        setSky: vi.fn(),
        setTerrain: vi.fn((specification: TerrainSpecification | null) => {
            terrain = specification;
        }),
        getTerrain: vi.fn(() => terrain),
        getContainer: vi.fn(() => (container ??= document.body.appendChild(document.createElement('div')))),
        getZoom: vi.fn(() => 10),
        isMoving: vi.fn(() => false),
    };

    const styleChangeHandlers: StyleChangeHandler[] = [];
    const tomtomMap = {
        mapLibreMap: mapLibreMap as unknown as Map,
        _eventsProxy: {
            add: vi.fn(),
            ensureAdded: vi.fn(),
            updateIfRegistered: vi.fn(),
            addEventHandler: vi.fn(),
            removeHandler: vi.fn(),
            remove: vi.fn(),
        },
        _params: { commonBaseURL: 'https://test.invalid', apiKey: 'TEST' },
        styleLightDarkTheme: 'light',
        addStyleChangeHandler: vi.fn((handler: StyleChangeHandler) => {
            styleChangeHandlers.push(handler);
            return () => {
                const at = styleChangeHandlers.indexOf(handler);
                if (at !== -1) styleChangeHandlers.splice(at, 1);
            };
        }),
        mapReady: true,
    } as unknown as TomTomMap;

    // A style change as the map runs it: by ascending priority, then registration order.
    const fireStyleChange = async (context = carriedOverSwitch) => {
        const handlers = [...styleChangeHandlers].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
        for (const handler of handlers) await handler.onStyleAboutToChange?.(context);
        for (const handler of handlers) await handler.onStyleChanged?.(context);
    };

    return {
        tomtomMap,
        mapLibreMap,
        fireStyleChange,
    };
};
