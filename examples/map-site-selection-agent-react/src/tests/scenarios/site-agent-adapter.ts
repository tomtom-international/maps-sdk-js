import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    createMapAgent,
    type ToolBuildOptions,
    type ToolEntry,
    type ToolEntryBuilder,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { LanguageModel } from 'ai';
import { buildSiteAgentOptions, buildSiteTools } from '../../agent/site-agent';

// ---------------------------------------------------------------------------
// Mock TomTomMap — satisfies the interface the agent touches without a browser.
// Tool executes are mocked, so nothing ever reads beyond the viewport getters.
// ---------------------------------------------------------------------------

export const mockMap = {
    mapLibreMap: {
        getContainer: () => ({}) as unknown as HTMLElement,
        getStyle: () => ({ layers: [], sources: {} }),
        getZoom: () => 12,
        getCenter: () => ({ lng: 4.9041, lat: 52.3676 }),
        getBounds: () => ({
            getNorthEast: () => ({ lng: 5, lat: 52.45 }),
            getSouthWest: () => ({ lng: 4.8, lat: 52.3 }),
        }),
    },
} as unknown as TomTomMap;

const MOCK_POSITION: [number, number] = [4.9041, 52.3676];

// Canned execute results for tools whose returned shape the model may read before deciding its next
// step. Anything not listed falls back to `{ success: true }`. These never run real geocoding /
// analysis / map mutation — they only keep multi-step flows from stalling on an empty result.
const SPECIFIC_MOCKS: Record<string, (...args: any[]) => Promise<unknown>> = {
    // Domain tools — terse summaries (the real tools write full results into on-screen panels).
    profileSite: async ({ address }: { address?: string } = {}) => ({
        summary: `Profiled ${address ?? 'the site'}`,
        areaMakeup: { retail: 12, food: 8, office: 5, residential: 20 },
    }),
    rankSites: async ({ sites }: { sites?: unknown[] } = {}) => ({
        summary: `Ranked ${Array.isArray(sites) ? sites.length : 0} sites`,
        ranking: [],
    }),
    findWhitespace: async () => ({ summary: 'Found opportunity pockets', pockets: [{ index: 1, colour: 'teal' }] }),
    compareCatchments: async () => ({ summary: 'Compared catchments', overlapPercent: 18 }),
    generateSiteReport: async () => ({ summary: 'Report generated and opened in the Report panel' }),
    clarifyIntent: async () => ({ status: 'awaiting_user_input', message: 'Form shown to the user' }),
    // Query-AWARE: the real tool resolves the query to matching category codes, so the mock must too.
    // A fixed café/fitness pair made the model believe the lookup was broken for any other concept
    // (e.g. "supermarket") and loop on lookupCategories until it gave up — so echo a plausible code
    // synthesised from the query instead.
    lookupCategories: async ({ query }: { query?: string } = {}) => {
        const term = (query ?? '').trim();
        const code =
            term
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'CATEGORY';
        return {
            categories: [{ code, name: term || 'Category' }],
            message: `Matched categories for "${term}"`,
        };
    },

    // BYOD ingestion — faithful enough that a follow-on analysis can chain on the result: a stable
    // entry id derived from the label (like the real state.byod.addEntry) plus a data profile. The
    // profile advertises a POLYGON layer with a numeric measure, so a merged "load this and rank it"
    // prompt exercises the geometry-flexible candidate path (polygons → centroids) and can pick a
    // demand property — without any real fetch happening.
    addByodSource: async ({ label, url }: { label?: string; url?: string } = {}) => {
        const byodEntryId =
            (label ?? 'byod-layer')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') || 'byod-layer';
        return {
            byodEntryId,
            label: label ?? 'BYOD layer',
            source: url ? { kind: 'url', url } : { kind: 'inline' },
            profile: {
                featureCount: 18,
                geometryTypes: ['Polygon'],
                properties: [
                    { name: 'name', types: ['string'], coverage: 1, examples: [] },
                    { name: 'E_E', types: ['number'], coverage: 1, examples: [1240, 980, 1620] },
                ],
            },
        };
    },
    setByodLayers: async () => ({ success: true, message: 'Layers set and drawn' }),

    // Generic built-ins the sanity suite exercises.
    locatePlace: async ({ query }: { query?: string } = {}) => ({
        places: [
            { name: query ?? 'Amsterdam', position: MOCK_POSITION, address: { freeformAddress: query ?? 'Amsterdam' } },
        ],
        message: `Found location for "${query ?? ''}"`,
    }),
    reverseGeocode: async () => ({ address: { freeformAddress: 'Amsterdam, Netherlands' } }),
    getCurrentLocation: async () => ({ position: MOCK_POSITION, accuracy: 10, message: 'GPS location retrieved' }),
    getViewport: async () => ({ center: MOCK_POSITION, zoom: 12, bbox: [4.8, 52.3, 5, 52.45] }),
    getStandardMapStyles: async () => ({
        styles: [
            { id: 'standardLight', name: 'Light' },
            { id: 'standardDark', name: 'Dark' },
            { id: 'satellite', name: 'Satellite' },
        ],
    }),
    calculateBBox: async () => ({ bbox: [4.8, 52.3, 5, 52.45] }),
};

const resolveEntry = (entry: ToolEntry | ToolEntryBuilder): ToolEntry =>
    typeof entry === 'function' ? entry({} as ToolBuildOptions) : entry;

// The real Site Selection tool set with every `execute` swapped for a mock — descriptions,
// classificationPrompts and inputSchemas are kept, so the classifier and model see the faithful
// surface and a failure means a genuine selection mistake.
export const buildMockedSiteTools = (): Record<string, ToolEntry> =>
    Object.fromEntries(
        Object.entries(buildSiteTools()).map(([name, entry]) => {
            const resolved = resolveEntry(entry);
            const mockExecute = SPECIFIC_MOCKS[name] ?? (async () => ({ success: true }));
            return [name, { ...resolved, execute: mockExecute }];
        }),
    );

/**
 * Builds the EXACT shipped Site Selection agent (same scoped prompt, classifier and tool set via
 * {@link buildSiteAgentOptions}) but against the mock map and with mocked tool executes. Wrap it with
 * `MapAgentToolCallAdapter` from `@testing/agent-tool-calling` for a scenario run.
 */
export const createScenarioSiteAgent = (model: LanguageModel): ReturnType<typeof createMapAgent> =>
    createMapAgent(mockMap, {
        ...buildSiteAgentOptions(model),
        tools: buildMockedSiteTools(),
    });
