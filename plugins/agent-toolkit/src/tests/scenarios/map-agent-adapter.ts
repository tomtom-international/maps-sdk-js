import type { Place } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { LanguageModel } from 'ai';
import type { Position } from 'geojson';
import type { z } from 'zod';
import { createMapAgent } from '../../create-map-agent';
import { DEFAULT_TOOLS } from '../../tools';
import { recallStateSchema } from '../../tools/state';
import type { MapAgentInstance, ToolBuildOptions, ToolEntry } from '../../types';

// ---------------------------------------------------------------------------
// Mock TomTomMap — satisfies interface without real browser/map context
// ---------------------------------------------------------------------------

export const mockMap = {
    mapLibreMap: {
        getContainer: () => document.createElement('div'),
        // A small but realistic layer set so getMapStyleLayers returns something actionable — style
        // prompts (text size on building labels, road colour, country borders) can resolve a target
        // layer and call setLayoutProperties / setPaintProperties instead of finding nothing.
        getStyle: () => ({
            layers: [
                { id: 'background', type: 'background' },
                { id: 'road', type: 'line', paint: { 'line-color': '#ffffff' } },
                { id: 'admin-boundary', type: 'line', paint: { 'line-color': '#888888' } },
                { id: 'building', type: 'fill', paint: { 'fill-color': '#dddddd' } },
                { id: 'building-label', type: 'symbol', layout: { 'text-field': '{name}', 'text-size': 12 } },
                { id: 'place-label', type: 'symbol', layout: { 'text-field': '{name}', 'text-size': 14 } },
                {
                    id: 'country-label',
                    type: 'symbol',
                    layout: { 'text-field': '{name}' },
                    paint: { 'text-color': '#333333' },
                },
            ],
            sources: {},
        }),
        getZoom: () => 12,
        getCenter: () => ({ lng: 4.89, lat: 52.37 }),
        getBounds: () => ({
            getNorthEast: () => ({ lng: 5, lat: 52.4 }),
            getSouthWest: () => ({ lng: 4.8, lat: 52.3 }),
        }),
    },
    // Minimal stand-in: the scenarios only exercise tool classification, so the agent never touches
    // the full TomTomMap surface. Bridge through `unknown` to assert the partial shape as the real
    // type without widening to `any`.
} as unknown as TomTomMap;

// ---------------------------------------------------------------------------
// Specific mock responses for tools whose returned shape is consumed by the
// agent or asserted by a scenario. Anything not listed falls back to a generic
// `{ success: true }` response.
// ---------------------------------------------------------------------------

const MOCK_POSITION: Position = [4.89, 52.37];

const MOCK_PLACE: Place = {
    type: 'Feature',
    id: 'mock-place-1',
    geometry: { type: 'Point', coordinates: [4.89, 52.37] },
    properties: {
        type: 'Point Address',
        address: { freeformAddress: 'Amsterdam, Netherlands', country: 'Netherlands', municipality: 'Amsterdam' },
    },
};

const SPECIFIC_MOCKS: Record<string, (...args: any[]) => Promise<any>> = {
    locatePlace: async ({ query }: { query: string }) => ({
        // Echo the queried place into the address so the mock never contradicts the request. The
        // hardcoded "Amsterdam, Netherlands" address from MOCK_PLACE made attentive models reject a
        // query like "City of London" as "resolved to the wrong country" and abort the flow — a
        // nondeterministic source of scenario flakiness.
        places: [
            {
                ...MOCK_PLACE.properties,
                address: { ...MOCK_PLACE.properties.address, freeformAddress: query, municipality: query },
                position: MOCK_POSITION,
                name: query,
            },
        ],
        entryId: 'places-0',
        message: `Found location for "${query}"`,
    }),

    discoverPlaces: async ({ query }: { query: string }) => ({
        places: [
            { id: 'poi-1', name: `${query} - Location A`, position: MOCK_POSITION, distance: 200 },
            { id: 'poi-2', name: `${query} - Location B`, position: MOCK_POSITION, distance: 450 },
        ],
        entryId: 'places-1',
        message: `Found 2 places for "${query}"`,
    }),

    reverseGeocode: async () => ({
        address: MOCK_PLACE.properties.address,
    }),

    setRoute: async ({ waypoints }: { waypoints: any[] }) => ({
        success: true,
        waypointCount: waypoints?.length ?? 2,
        message: 'Route set',
    }),

    updateRoutesDisplay: async () => ({
        success: true,
        routeCount: 1,
        routeIds: ['routes-0'],
        summary: { travelTimeInSeconds: 1800, lengthInMeters: 25000 },
    }),

    addWaypointsToRoute: async () => ({
        success: true,
        message: 'Waypoint added to route',
    }),

    getTrafficIncidents: async () => ({
        count: 1,
        entryId: 'incidents-0',
        entries: [{ id: 'incidents-0', label: 'Amsterdam incidents', count: 1, timestamp: Date.now() }],
    }),

    findReachableAreas: async () => ({
        success: true,
        rangeId: 'ranges-0',
        area: { center: MOCK_POSITION, budgetType: 'time', budget: 30 },
    }),

    getStandardMapStyles: async () => ({
        styles: [
            { id: 'standardLight', name: 'Light' },
            { id: 'standardDark', name: 'Dark' },
            { id: 'satellite', name: 'Satellite' },
        ],
    }),

    // Return the actual layer list (matching mockMap.getStyle) so a "restyle the X layer" turn can pick a
    // target and proceed to setLayoutProperties / setPaintProperties — without this it returns the generic
    // { success: true }, the agent never sees a layer, and it loops calling getMapStyleLayers.
    getMapStyleLayers: async () => ({
        // Covers the layer names the style examplePrompts reference (water, road, road-label, poi-label,
        // building(-label), place-label, admin-boundary = country borders) so the agent can resolve a
        // target and call setPaint/setLayoutProperties instead of looping or reporting "no such layer".
        layers: [
            { id: 'background', type: 'background' },
            { id: 'water', type: 'fill' },
            { id: 'land', type: 'fill' },
            { id: 'park', type: 'fill' },
            { id: 'road', type: 'line' },
            { id: 'admin-boundary', type: 'line' },
            { id: 'building', type: 'fill' },
            { id: 'road-label', type: 'symbol' },
            { id: 'poi-label', type: 'symbol' },
            { id: 'building-label', type: 'symbol' },
            { id: 'place-label', type: 'symbol' },
            { id: 'country-label', type: 'symbol' },
        ],
    }),

    // The per-kind recall tools were consolidated into `recallState({ kind?, id? })`. This mock returns a
    // rich per-kind index for every recallable kind (places / routes / ranges / byod / geometries /
    // incidents / trafficAreaAnalytics) so updatePlacesDisplay / updateRoutesDisplay / updateByodDisplay /
    // analyseData prompts still resolve against real entries, and a full session snapshot when no `kind`
    // is given.
    recallState: async ({ kind }: z.infer<typeof recallStateSchema> = {}) => {
        switch (kind) {
            case 'places':
                return {
                    entries: [
                        { id: 'places-1', label: 'cafes near the centre', count: 8 },
                        { id: 'places-2', label: 'pubs near the centre', count: 5 },
                        { id: 'places-3', label: 'banks', count: 4 },
                        { id: 'places-4', label: 'hotels', count: 6 },
                        { id: 'places-6', label: 'parking', count: 7 },
                        { id: 'places-5', label: 'neighbourhood boundaries (Jordaan, De Pijp)', count: 2 },
                    ],
                };
            case 'routes':
                // routes-0 keeps 3 alternatives so "my route alternatives" prompts have something to
                // compare; the named routes let updateRoutesDisplay's "show the Edinburgh route" prompts
                // resolve to a real entry.
                return {
                    entries: [
                        { id: 'routes-0', label: `${MOCK_PLACE.properties.address.municipality} → Brussels`, count: 3 },
                        { id: 'routes-1', label: 'London → Edinburgh', count: 1 },
                        { id: 'routes-2', label: 'Paris → Lyon', count: 1 },
                    ],
                };
            case 'ranges':
                return {
                    entries: [
                        {
                            id: 'ranges-0',
                            label: `30-min from ${MOCK_PLACE.properties.address.municipality}`,
                            count: 1,
                        },
                    ],
                };
            case 'byod':
                return {
                    entries: [
                        {
                            id: 'byod-0',
                            label: 'Sales territories',
                            timestamp: Date.now(),
                            featureCount: 12,
                            geometryTypes: ['Polygon'],
                            propertyNames: ['region', 'revenue'],
                            source: { kind: 'url', url: 'https://example.com/territories.geojson' },
                            shown: true,
                        },
                        {
                            id: 'byod-1',
                            label: 'Customer pins',
                            timestamp: Date.now(),
                            featureCount: 40,
                            geometryTypes: ['Point'],
                            propertyNames: ['name', 'status'],
                            source: { kind: 'url', url: 'https://example.com/pins.geojson' },
                            shown: true,
                        },
                    ],
                    entryMode: 'multiple',
                };
            case 'geometries':
                return { entries: [{ id: 'geometries-0', label: 'Amsterdam & Utrecht city boundaries', count: 2 }] };
            case 'incidents':
                return {
                    entries: [
                        {
                            id: 'incidents-0',
                            label: 'Amsterdam ring incidents',
                            timestamp: Date.now(),
                            count: 18,
                            shown: true,
                            monitored: false,
                            focusedCount: 0,
                        },
                    ],
                    entryMode: 'multiple',
                };
            case 'trafficAreaAnalytics':
                return {
                    entries: [
                        {
                            id: 'tta-0',
                            label: 'Amsterdam analytics',
                            timestamp: Date.now(),
                            regionCount: 1,
                            metrics: ['congestionLevel', 'speed'],
                            shown: true,
                        },
                    ],
                    entryMode: 'multiple',
                };
            default:
                // Full snapshot — a realistic mid-session world so analyse/process prompts that reference
                // "my route", "the incidents", or "these areas" have something to operate on.
                return {
                    places: [
                        { id: 'places-0', label: MOCK_PLACE.properties.address.freeformAddress },
                        { id: 'places-6', label: 'parking' },
                    ],
                    routes: [{ id: 'routes-0', label: `${MOCK_PLACE.properties.address.municipality} → Brussels` }],
                    ranges: [{ id: 'ranges-0', label: `30-min from ${MOCK_PLACE.properties.address.municipality}` }],
                    incidents: [{ id: 'incidents-0', label: 'Amsterdam ring incidents' }],
                    trafficAreaAnalytics: [{ id: 'tta-0', label: 'Amsterdam analytics' }],
                    customGeometries: [{ id: 'geometries-0', label: 'Amsterdam & Utrecht city boundaries' }],
                    byod: [],
                    mapStyle: 'standardLight',
                };
        }
    },

    getCurrentLocation: async () => ({
        position: MOCK_POSITION,
        accuracy: 10,
        message: 'GPS location retrieved',
    }),

    // Merged analyse / process surface — every kind opt-in via *EntryIDs. Mocks return minimal
    // shapes that satisfy the structured output schemas without claiming to have run real code.
    analyseData: async ({ name }: { name: string }) => ({
        affectedEntries: [{ kind: 'places' as const, id: 'places-0' }],
        name,
        outputFormat: 'json' as const,
        analysis: { mocked: true },
    }),

    processData: async () => ({
        placesEntryId: 'places-2',
        count: 0,
        features: [],
    }),

    // BYOD surface (added by the unification PR). `addByodSource` writes a new entry;
    // the visibility tool toggles it on the map, `setByodLayers` restyles it. The profile carries
    // a categorical (`region`) and a numeric (`revenue`) property so a follow-up restyle has fields
    // to encode (colour-by-category / graduated size).
    addByodSource: async ({ label }: { label: string }) => ({
        byodEntryId: 'byod-0',
        label,
        source: { kind: 'url', url: 'https://example.com/territories.geojson' },
        profile: {
            featureCount: 12,
            geometryTypes: ['Polygon'],
            properties: [
                { name: 'region', types: ['string'], coverage: 1, examples: ['North', 'South', 'East'] },
                { name: 'revenue', types: ['number'], coverage: 1, examples: [12000, 48000] },
            ],
        },
    }),

    setByodLayers: async ({ byodEntryId, layers }: { byodEntryId?: string; layers?: { type?: string }[] }) => ({
        byodEntryId: byodEntryId ?? 'byod-0',
        label: 'Sales territories',
        layerCount: Array.isArray(layers) ? layers.length : 1,
        layerTypes: Array.isArray(layers) ? layers.map((layer) => layer?.type ?? 'fill') : ['fill'],
    }),

    updateByodDisplay: async ({ action }: { action: 'show' | 'hide' | 'remove' }) => ({
        action,
        affectedIds: ['byod-0'],
        shown: action === 'show' ? ['byod-0'] : [],
    }),

    // Traffic-area-analytics + incidents-focus / monitor — new since the merge.
    getTrafficAreaAnalytics: async () => ({
        entryId: 'tta-0',
        regionCount: 1,
        metrics: ['congestionLevel'],
    }),

    updateTrafficAreaAnalyticsDisplay: async () => ({
        success: true,
        shown: ['tta-0'],
    }),

    focusIncidents: async () => ({
        incidentsEntryID: 'incidents-0',
        focusedCount: 1,
        droppedIds: [],
    }),

    setTrafficIncidentsMonitor: async (args: { enabled?: boolean }) => ({
        incidentsEntryID: 'incidents-0',
        enabled: args?.enabled ?? true,
        alreadyInState: false,
    }),
};

// ---------------------------------------------------------------------------
// Build a mocked tool record for a specified subset of tool names. Keeps real
// descriptions/schemas, swaps executes. Filtering is required to keep the LLM
// request body under the gateway's payload cap.
// ---------------------------------------------------------------------------

export const buildMockedTools = (toolNames: readonly string[]): Record<string, ToolEntry> => {
    const wanted = new Set(toolNames);
    // Fail loudly on a misspelled / non-existent tool name rather than silently producing a smaller
    // tool set (which would make a scenario "pass" against the wrong tools).
    const unknown = [...wanted].filter((name) => !(name in DEFAULT_TOOLS));
    if (unknown.length > 0) {
        throw new Error(`buildMockedTools: unknown tool name(s): ${unknown.join(', ')}`);
    }
    return Object.fromEntries(
        Object.entries(DEFAULT_TOOLS)
            .filter(([name]) => wanted.has(name))
            .map(([name, entry]) => {
                const resolved = typeof entry === 'function' ? entry({} as ToolBuildOptions) : entry;
                const mockExecute = SPECIFIC_MOCKS[name] ?? (async () => ({ success: true }));
                return [name, { ...resolved, execute: mockExecute }];
            }),
    );
};

// ---------------------------------------------------------------------------
// Scenario agent
// ---------------------------------------------------------------------------

/**
 * Builds the map agent for a scenario run with the full default tool set — real
 * descriptions/schemas kept, executes mocked. Wrap it with `MapAgentToolCallAdapter`
 * from `@testing/agent-tool-calling` (see helpers.ts).
 */
export const createScenarioAgent = (model: LanguageModel): MapAgentInstance =>
    createMapAgent(mockMap, {
        model,
        maxSteps: 10,
        tools: buildMockedTools(Object.keys(DEFAULT_TOOLS)),
        includeDefaultTools: false,
    });
