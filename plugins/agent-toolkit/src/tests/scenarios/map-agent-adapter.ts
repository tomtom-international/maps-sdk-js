import { AgentAdapter, type AgentInput, type AgentReturnTypes, AgentRole } from '@langwatch/scenario';
import type { Place } from '@tomtom-org/maps-sdk/core';
import type { LanguageModel } from 'ai';
import type { Position } from 'geojson';
import { createMapAgent } from '../../create-map-agent';
import { DEFAULT_TOOLS } from '../../tools';
import type { MapAgentInstance, ToolBuildOptions, ToolEntry } from '../../types';

// ---------------------------------------------------------------------------
// Mock TomTomMap — satisfies interface without real browser/map context
// ---------------------------------------------------------------------------

export const mockMap = {
    mapLibreMap: {
        getContainer: () => document.createElement('div'),
        getStyle: () => ({ layers: [], sources: {} }),
        getZoom: () => 12,
        getCenter: () => ({ lng: 4.89, lat: 52.37 }),
        getBounds: () => ({
            getNorthEast: () => ({ lng: 5.0, lat: 52.4 }),
            getSouthWest: () => ({ lng: 4.8, lat: 52.3 }),
        }),
    },
} as any;

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
        places: [{ ...MOCK_PLACE.properties, position: MOCK_POSITION, name: query }],
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

    recallPlaces: async () => ({
        entries: [{ id: 'places-0', label: MOCK_PLACE.properties.address.freeformAddress, count: 1 }],
    }),

    recallRoutes: async () => ({
        entries: [{ id: 'routes-0', label: `${MOCK_PLACE.properties.address.municipality} → Brussels`, count: 1 }],
    }),

    recallRanges: async () => ({
        entries: [{ id: 'ranges-0', label: `30-min from ${MOCK_PLACE.properties.address.municipality}`, count: 1 }],
    }),

    recallByod: async () => ({
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
        ],
        entryMode: 'multiple',
    }),

    recallGeometries: async () => ({
        entries: [],
    }),

    recallState: async () => ({
        places: [{ id: 'places-0', label: MOCK_PLACE.properties.address.freeformAddress }],
        routes: [],
        ranges: [],
        incidents: [],
        trafficAreaAnalytics: [],
        customGeometries: [],
        byod: [],
        mapStyle: 'standardLight',
    }),

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

    queryTrafficAnalytics: async () => ({
        entries: [{ id: 'tta-0', label: 'Amsterdam analytics', timestamp: Date.now() }],
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

    startTrafficIncidentsMonitor: async () => ({
        success: true,
        entryId: 'incidents-0',
        intervalMs: 30_000,
    }),

    stopTrafficIncidentsMonitor: async () => ({
        success: true,
        entryId: 'incidents-0',
    }),
};

// ---------------------------------------------------------------------------
// Build a mocked tool record for a specified subset of tool names. Keeps real
// descriptions/schemas, swaps executes. Filtering is required to keep the LLM
// request body under the gateway's payload cap.
// ---------------------------------------------------------------------------

export function buildMockedTools(toolNames: readonly string[]): Record<string, ToolEntry> {
    const wanted = new Set(toolNames);
    return Object.fromEntries(
        Object.entries(DEFAULT_TOOLS)
            .filter(([name]) => wanted.has(name))
            .map(([name, entry]) => {
                const resolved = typeof entry === 'function' ? entry({} as ToolBuildOptions) : entry;
                const mockExecute = SPECIFIC_MOCKS[name] ?? (async () => ({ success: true }));
                return [name, { ...resolved, execute: mockExecute }];
            }),
    );
}

// ---------------------------------------------------------------------------
// Scenario adapter
// ---------------------------------------------------------------------------

/**
 * Wraps createMapAgent for use with @langwatch/scenario.
 *
 * Each scenario passes the small set of tool names it expects the agent to
 * choose between. Real descriptions/schemas are kept; executes are mocked.
 */
export class MapAgentScenarioAdapter extends AgentAdapter {
    role = AgentRole.AGENT;
    name = 'MapAgent';

    private readonly agent: MapAgentInstance;

    constructor(model: LanguageModel) {
        super();
        this.agent = createMapAgent(mockMap, {
            model,
            maxSteps: 10,
            tools: buildMockedTools(Object.keys(DEFAULT_TOOLS)) as any,
            includeDefaultTools: false,
        });
    }

    async call(input: AgentInput): Promise<AgentReturnTypes> {
        const result = await this.agent.generate({ messages: input.messages } as any);
        // Return all response messages so @langwatch/scenario can detect tool calls
        // via state.hasToolCall() — includes assistant tool-call messages and tool results
        return result.response.messages as any;
    }
}
