import type { ScriptStep } from '@langwatch/scenario';
import { message, user } from '@langwatch/scenario';
import type { JSONValue, ModelMessage, ToolCallPart, ToolResultPart } from 'ai';
import type { z } from 'zod';
import {
    discoverPlacesOutputSchema,
    findReachableAreasOutputSchema,
    getTrafficAreaAnalyticsOutputSchema,
    getTrafficIncidentsOutputSchema,
    locatePlaceOutputSchema,
    setRouteOutputSchema,
} from '../../tools/services';
import {
    addByodSourceOutputSchema,
    analyseDataOutputSchema,
    processDataOutputSchema,
    setTrafficIncidentsMonitorOutputSchema,
    startRouteMonitorOutputSchema,
} from '../../tools/state';
import { toggleTilesTrafficIncidentsOutputSchema } from '../../tools/tomtom-map';

// Realistic prior-turn staging for the classification scenarios. Instead of narrating loaded state
// in crafted assistant prose ("Done — loaded restaurants (places-1)…"), these helpers replay a
// completed turn the way it actually appears in the model's history: an assistant tool-CALL message
// followed by a tool-RESULT message carrying each tool's real structured output. The agent under
// test then sees session state the way production surfaces it (entry IDs live in tool results, not
// in narrated text), so a pass means "given a real loaded session, the agent routes correctly".
//
// Each result payload is typed against the tool's OWN exported output schema (below). Evolve a
// schema and the seed literal stops type-checking — the failing test file is the changelog of what
// the staged turn must now look like.

// The tools we stage prior-turn results for, mapped to their concrete output schemas. Keep the
// registry minimal — add a tool here only when a seed actually replays it.
const SEED_OUTPUT_SCHEMAS = {
    discoverPlaces: discoverPlacesOutputSchema,
    setRoute: setRouteOutputSchema,
    getTrafficIncidents: getTrafficIncidentsOutputSchema,
    setTrafficIncidentsMonitor: setTrafficIncidentsMonitorOutputSchema,
    startRouteMonitor: startRouteMonitorOutputSchema,
    findReachableAreas: findReachableAreasOutputSchema,
    getTrafficAreaAnalytics: getTrafficAreaAnalyticsOutputSchema,
    addByodSource: addByodSourceOutputSchema,
    locatePlace: locatePlaceOutputSchema,
    toggleTilesTrafficIncidents: toggleTilesTrafficIncidentsOutputSchema,
    processData: processDataOutputSchema,
    analyseData: analyseDataOutputSchema,
} as const;

type SeedTool = keyof typeof SEED_OUTPUT_SCHEMAS;
// The structured output a given tool returns — derived from its own schema, so this is the single
// knob that breaks (at compile time) when a tool's output shape changes.
type SeedOutput<N extends SeedTool> = z.infer<(typeof SEED_OUTPUT_SCHEMAS)[N]>;

// One staged tool invocation: the call the assistant made plus the typed result it observed.
type SeededToolCall = { tool: SeedTool; input: Record<string, unknown>; output: JSONValue };

/**
 * Stage one tool call + its result, in call→result order: `tool`, the `input` the assistant called
 * it with, then the `output` it observed. `output` is checked against the tool's own output schema
 * at compile time (via {@link SeedOutput}) and again at runtime (`schema.parse`), so a drifted shape
 * fails loudly either way. `input` is the (best-effort) call arguments the model sees — kept
 * minimal; it only adds conversational realism, nothing asserts on it.
 */
export const toolCall = <N extends SeedTool>(
    tool: N,
    input: Record<string, unknown>,
    output: SeedOutput<N>,
): SeededToolCall => {
    // Runtime guard. The static `SeedOutput<N>` bound is the primary safety net; this catches
    // anything the structural type misses (e.g. refinements) when the suite runs with credentials.
    (SEED_OUTPUT_SCHEMAS[tool] as z.ZodType).parse(output);
    // `JSONValue` rejects `undefined`-valued optional fields, which tool outputs legitimately carry;
    // the result is JSON-serialisable in practice, so widen for the message envelope.
    return { tool, input, output: output as unknown as JSONValue };
};

/**
 * Replay a completed prior turn as message history: the user request, the assistant's tool-call
 * message, the matching tool-result message, and a short natural-language summary (which must NOT
 * enumerate internal entry IDs — those now live in the tool results). Returns the `ScriptStep[]` a
 * scenario's `priorTurns` expects.
 */
export const priorTurn = (request: string, calls: SeededToolCall[], summary: string): ScriptStep[] => {
    const toolCallParts: ToolCallPart[] = calls.map((call, index) => ({
        type: 'tool-call',
        toolCallId: `seed-${index}`,
        toolName: call.tool,
        input: call.input,
    }));
    const toolResultParts: ToolResultPart[] = calls.map((call, index) => ({
        type: 'tool-result',
        toolCallId: `seed-${index}`,
        toolName: call.tool,
        output: { type: 'json', value: call.output },
    }));
    const assistantCall: ModelMessage = { role: 'assistant', content: toolCallParts };
    const toolResults: ModelMessage = { role: 'tool', content: toolResultParts };
    const assistantSummary: ModelMessage = { role: 'assistant', content: summary };
    return [user(request), message(assistantCall), message(toolResults), message(assistantSummary)];
};

const AMS: [number, number] = [4.89, 52.37];

// ---------------------------------------------------------------------------
// Shared seeds reused across more than one per-tool file.
// ---------------------------------------------------------------------------

// A rich mid-session world — places, a route with alternatives, an incidents snapshot, loaded city
// boundaries, a reachable area and historical analytics — mirroring the entries the recall* mocks
// return (map-agent-adapter.ts). Used by analyse-data and process-data, whose prompts reference
// "these results" / "my route alternatives" / "the city areas I loaded" / "the analytics tiles".
export const loadedSessionSeed = (): ScriptStep[] =>
    priorTurn(
        'Search for restaurants and EV stations near the centre, plan a route from Amsterdam to Brussels with ' +
            'alternatives, load the Amsterdam traffic incidents, the Amsterdam & Utrecht city boundaries, a ' +
            '30-minute reachable area, and last week’s traffic analytics',
        [
            toolCall(
                'discoverPlaces',
                { query: 'restaurants', where: { near: 'centre' } },
                {
                    count: 8,
                    features: [{ id: 'rest-0', position: AMS, name: 'Restaurant' }],
                    placesEntryId: 'places-1',
                    label: 'restaurants',
                },
            ),
            toolCall(
                'discoverPlaces',
                { query: 'EV charging stations', where: { near: 'centre' } },
                {
                    count: 5,
                    features: [{ id: 'ev-0', position: AMS, name: 'EV charging station' }],
                    placesEntryId: 'places-2',
                    label: 'EV stations',
                },
            ),
            toolCall(
                'setRoute',
                { locations: ['Amsterdam', 'Brussels'], showOnMap: true },
                {
                    count: 3,
                    entryId: 'routes-0',
                    routes: [
                        { index: 0, summary: { travelTimeInSeconds: 7200, lengthInMeters: 210000 } },
                        { index: 1, summary: { travelTimeInSeconds: 7500, lengthInMeters: 215000 } },
                        { index: 2, summary: { travelTimeInSeconds: 7800, lengthInMeters: 220000 } },
                    ],
                },
            ),
            toolCall(
                'getTrafficIncidents',
                { where: { near: 'Amsterdam' } },
                {
                    count: 18,
                    entryId: 'incidents-0',
                    entries: [{ id: 'incidents-0', label: 'Amsterdam incidents', count: 18, timestamp: 0 }],
                },
            ),
            toolCall(
                'processData',
                { name: 'cityBoundaries' },
                {
                    customGeometriesEntryId: { kind: 'customGeometries', id: 'geometries-0' },
                    customGeometriesCount: 2,
                    label: 'Amsterdam & Utrecht city boundaries',
                },
            ),
            toolCall(
                'findReachableAreas',
                { origin: 'Amsterdam', budgets: [{ type: 'timeMinutes', value: 30 }] },
                {
                    rangesId: 'ranges-0',
                    ranges: [{ originName: 'Amsterdam', budgets: [{ type: 'timeMinutes', value: 30 }] }],
                },
            ),
            toolCall(
                'getTrafficAreaAnalytics',
                { where: { near: 'Amsterdam' }, dateRange: { start: '2026-06-08', end: '2026-06-14' } },
                {
                    entryId: 'tta-0',
                    name: 'Amsterdam',
                    dateRange: { start: '2026-06-08', end: '2026-06-14' },
                    baseData: {},
                    metrics: [],
                    tileCount: 24,
                    availableGranularities: [],
                },
            ),
        ],
        'Done — I searched restaurants and EV stations near the centre, planned the Amsterdam → Brussels route with ' +
            'two alternatives, and loaded the Amsterdam traffic incidents, the Amsterdam & Utrecht city boundaries, a ' +
            '30-minute reachable area, and last week’s traffic analytics.',
    );

// A loaded BYOD source from an earlier turn — a "Sales territories" entry carrying a categorical
// `region` and a numeric `revenue` property (the same profile addByodSource's mock returns). A
// standalone restyle prompt ("shade my sales territories by revenue") only routes to setByodLayers
// when an entry is already in state; without this staging the agent — in a cold session with no
// recallByod tool to discover it — correctly stops to ask what to load. Used by set-byod-layers.test.ts.
export const loadedByodSeed = (): ScriptStep[] =>
    priorTurn(
        'Load my sales-territories layer from https://example.com/territories.geojson',
        [
            toolCall(
                'addByodSource',
                { label: 'Sales territories', url: 'https://example.com/territories.geojson' },
                {
                    byodEntryId: 'byod-0',
                    label: 'Sales territories',
                    source: { kind: 'url', url: 'https://example.com/territories.geojson' },
                    profile: {
                        featureCount: 12,
                        geometryTypes: ['Polygon'],
                        properties: [
                            { name: 'region', types: ['string'], coverage: 1, examples: [] },
                            { name: 'revenue', types: ['number'], coverage: 1, examples: [12000, 48000] },
                        ],
                    },
                },
            ),
        ],
        'Loaded your sales-territories layer (12 polygons) and rendered it on the map.',
    );

// Origin + destination STAGED into the routing planning slots (via locatePlace's `waypointIndex`)
// but NOT calculated — the getCurrentWaypoints / updateWaypointsDisplay slice, distinct from a
// calculated route entry. Used by display.test.ts and route-edits.test.ts.
export const stagedWaypointsSeed = (): ScriptStep[] =>
    priorTurn(
        'Set up a trip starting at Amsterdam Centraal and ending at Schiphol Airport, but do not calculate it yet',
        [
            toolCall(
                'locatePlace',
                { query: 'Amsterdam Centraal', waypointIndex: 0 },
                {
                    id: 'ams-centraal',
                    position: AMS,
                    name: 'Amsterdam Centraal',
                    placesEntryId: 'places-0',
                    waypointIndex: 0,
                },
            ),
            toolCall(
                'locatePlace',
                { query: 'Schiphol Airport', waypointIndex: 1 },
                {
                    id: 'schiphol',
                    position: [4.76, 52.31],
                    name: 'Schiphol Airport',
                    placesEntryId: 'places-1',
                    waypointIndex: 1,
                },
            ),
        ],
        'Staged Amsterdam Centraal as the origin (slot 0) and Schiphol Airport as the destination (slot 1) for your ' +
            'next route — nothing calculated yet.',
    );

// A single calculated route from an EARLIER turn (no other entries). The route entry id is only
// implied by history — a follow-up that wants to analyse "that drive" must target `routes-0` (recall
// it, or reuse the id setRoute returned). Used to prove follow-up tools resolve an implied entry id.
export const routeOnlySeed = (): ScriptStep[] =>
    priorTurn(
        'Plan a route from Paris to Amsterdam',
        [
            toolCall(
                'setRoute',
                { locations: ['Paris', 'Amsterdam'], showOnMap: true },
                {
                    count: 1,
                    entryId: 'routes-0',
                    routes: [{ index: 0, summary: { travelTimeInSeconds: 18000, lengthInMeters: 500000 } }],
                },
            ),
        ],
        'Calculated and drew the Paris → Amsterdam route (entry routes-0).',
    );
