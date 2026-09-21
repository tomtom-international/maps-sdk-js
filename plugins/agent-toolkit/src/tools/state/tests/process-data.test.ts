import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { Feature, Point } from 'geojson';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomGeometriesState, PlacesState, RoutingState } from '../../../state';
import { makeMockRoute, makeMockState } from '../../../tests/constants';
import type { ToolState } from '../../../types';
import { resolveSandboxExecutor } from '../../shared/sandbox';
import { executeProcessData, validatePlaces } from '../process-data';

// A canonical processData-produced place: Point geometry, a `poi.name` display label, and a
// `type` from the PlaceType enum. Overrides let each test bend one part out of shape.
const makePlace = (overrides: Record<string, unknown> = {}): Feature<Point> =>
    ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [4.9, 52.4] },
        properties: { type: 'Cross Street', poi: { name: 'A1202 / A1211' } },
        ...overrides,
    }) as Feature<Point>;

const collection = (features: unknown[]) => ({ type: 'FeatureCollection', features });

describe('validatePlaces', () => {
    it('accepts a canonical Point feature with poi.name and an enum type', () => {
        const result = validatePlaces(collection([makePlace()]));
        expect('value' in result).toBe(true);
    });

    it('rejects a non-FeatureCollection envelope', () => {
        const result = validatePlaces({ features: [] });
        expect(result).toEqual({ error: expect.stringContaining('must be a `Places` FeatureCollection') });
    });

    it('rejects a non-Point geometry (e.g. an incident LineString copied verbatim)', () => {
        const line = makePlace({
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.4],
                    [4.91, 52.41],
                ],
            },
        });
        const result = validatePlaces(collection([line]));
        expect(result).toEqual({ error: expect.stringContaining('places[0]') });
    });

    it('rejects out-of-range / non-finite coordinates', () => {
        expect(
            validatePlaces(collection([makePlace({ geometry: { type: 'Point', coordinates: [200, 52.4] } })])),
        ).toEqual({ error: expect.stringContaining('places[0]') });
        expect(
            validatePlaces(collection([makePlace({ geometry: { type: 'Point', coordinates: [4.9, Number.NaN] } })])),
        ).toEqual({ error: expect.stringContaining('places[0]') });
    });

    it('rejects Infinity / -Infinity coordinates (e.g. a division-by-zero bug in generated code)', () => {
        // Number.isFinite rejects these distinctly from NaN above — a stray `x / 0` (as opposed to
        // `0 / 0`) is a realistic sandbox-code failure mode that lands here, not on the NaN check.
        expect(
            validatePlaces(
                collection([makePlace({ geometry: { type: 'Point', coordinates: [Number.POSITIVE_INFINITY, 52.4] } })]),
            ),
        ).toEqual({ error: expect.stringContaining('places[0]') });
        expect(
            validatePlaces(
                collection([makePlace({ geometry: { type: 'Point', coordinates: [4.9, Number.NEGATIVE_INFINITY] } })]),
            ),
        ).toEqual({ error: expect.stringContaining('places[0]') });
    });

    it('rejects a place whose name lives under a non-canonical key (the original bug)', () => {
        // Sandbox wrote a flat `properties.name` — neither poi.name nor address.freeformAddress.
        const flat = makePlace({ properties: { type: 'Cross Street', name: 'A1202 / A1211' } });
        const result = validatePlaces(collection([flat]));
        expect(result).toEqual({ error: expect.stringContaining('display name') });
    });

    it('accepts a non-POI whose name lives in address.freeformAddress (schema path for intersections)', () => {
        const crossStreet = makePlace({
            properties: { type: 'Cross Street', address: { freeformAddress: 'A1202 & Commercial St' } },
        });
        expect('value' in validatePlaces(collection([crossStreet]))).toBe(true);
    });

    it('rejects a missing or non-enum type', () => {
        const noType = makePlace({ properties: { poi: { name: 'A1202 / A1211' } } });
        expect(validatePlaces(collection([noType]))).toEqual({
            error: expect.stringContaining('places[0].properties.type'),
        });
        const badType = makePlace({ properties: { type: 'Intersection', poi: { name: 'A1202 / A1211' } } });
        expect(validatePlaces(collection([badType]))).toEqual({
            error: expect.stringContaining('places[0].properties.type'),
        });
    });

    it('pinpoints the offending index in a multi-feature collection', () => {
        const bad = makePlace({ properties: { type: 'Cross Street', poi: { name: '' } } });
        const result = validatePlaces(collection([makePlace(), bad]));
        expect(result).toEqual({ error: expect.stringContaining('places[1]') });
    });

    it('mints a deterministic id from coordinates AND output index when the place is id-less', () => {
        const result = validatePlaces(collection([makePlace()]));
        if (!('value' in result)) throw new Error('expected a valid result');
        expect(result.value.features[0].id).toBe('derived-4.900000_52.400000-0');
    });

    it('gives the same collection the same ids (stable handle across identical runs)', () => {
        const a = validatePlaces(collection([makePlace()]));
        const b = validatePlaces(collection([makePlace()]));
        if (!('value' in a) || !('value' in b)) throw new Error('expected valid results');
        expect(a.value.features[0].id).toBe(b.value.features[0].id);
    });

    it('gives two id-less places at the same point distinct ids (index disambiguates)', () => {
        // Same coords AND same name — coords or names alone would collide; the output index does not.
        const result = validatePlaces(collection([makePlace(), makePlace()]));
        if (!('value' in result)) throw new Error('expected a valid result');
        expect(result.value.features[0].id).not.toBe(result.value.features[1].id);
    });

    it('preserves a real id the sandbox carried over (never overwrites)', () => {
        const result = validatePlaces(collection([makePlace({ id: 'TTI-abc-123' })]));
        if (!('value' in result)) throw new Error('expected a valid result');
        expect(result.value.features[0].id).toBe('TTI-abc-123');
    });

    it('rejects model-authored duplicate explicit ids (the mint guard never sees these)', () => {
        const result = validatePlaces(collection([makePlace({ id: 'same-id' }), makePlace({ id: 'same-id' })]));
        // `a && b` on two matchers evaluates to just `b` (a truthy object) — the `places[1]` half was
        // never actually checked. A single regex pins both substrings in the right order.
        expect(result).toEqual({ error: expect.stringMatching(/places\[1\].*duplicates id "same-id"/) });
    });
});

// --- full executeProcessData integration tests (sandbox code execution + real state writes) ---

// A valid single-feature Places FeatureCollection the sandbox can hand back — passes validatePlaces
// (Point geometry, an enum `type`, and a `poi.name` display label).
const PLACES_RETURN = `return { places: { type: 'FeatureCollection', features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.4] },
      properties: { type: 'Cross Street', poi: { name: 'Test Place' } } }
] } };`;

// A valid Polygon Feature array.
const GEOMETRIES_RETURN = `return { geometries: [
    { type: 'Feature', id: 'poly-0', geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] }, properties: {} }
] };`;

describe('executeProcessData', () => {
    const places = new PlacesState({} as TomTomMap);
    const customGeometries = new CustomGeometriesState({} as TomTomMap);
    const routing = new RoutingState({} as TomTomMap);

    // A route entry gives prepareMultiInputs a valid input to resolve, so the sandbox runs even
    // though the returned data is computed fresh rather than derived from the input.
    const baseState = (overrides: Partial<ToolState> = {}): ToolState =>
        makeMockState({ places, customGeometries, routing, codeExecution: resolveSandboxExecutor(), ...overrides });

    const withRoute = { routesEntryIDs: ['routes-0'] };

    beforeEach(async () => {
        await routing.addRoutes({ type: 'FeatureCollection', features: [makeMockRoute()] }, [], 'route');
    });

    afterEach(() => {
        places.reset();
        customGeometries.reset();
        routing.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('writes a new places entry when the code returns places', async () => {
        const result = await executeProcessData({ ...withRoute, code: PLACES_RETURN }, baseState());
        if ('error' in result) expect.fail(`expected success, got: ${result.error}`);

        expect(places.entries).toHaveLength(1);
        expect(result).toMatchObject({ placesEntryId: expect.any(String) });
    });

    it('surfaces a validatePlaces failure as an error and writes no places entry', async () => {
        // No display name → validatePlaces rejects.
        const code = `return { places: { type: 'FeatureCollection', features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.4] }, properties: { type: 'Cross Street' } }
        ] } };`;
        const result = await executeProcessData({ ...withRoute, code }, baseState());

        expect(result).toHaveProperty('error');
        expect(places.entries).toHaveLength(0);
    });

    it('rejects a place whose coordinates resolve to Infinity/NaN via a division bug (0/0, 1/0)', async () => {
        // A realistic generated-code failure mode: an average/ratio computed over zero elements
        // (or a stray division) silently produces NaN/Infinity rather than throwing outright.
        const code = `return { places: { type: 'FeatureCollection', features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [1 / 0, 0 / 0] },
              properties: { type: 'Cross Street', poi: { name: 'Bad Point' } } }
        ] } };`;
        const result = await executeProcessData({ ...withRoute, code }, baseState());

        if (!('error' in result)) expect.fail('expected an error result');
        expect(result.error).toContain('places[0]');
        expect(places.entries).toHaveLength(0);
    });

    it('rejects a non-object return (a bare string/number instead of the expected shape)', async () => {
        const result = await executeProcessData({ ...withRoute, code: "return 'not an object';" }, baseState());
        expect(result).toEqual({
            error: 'Process code must return `{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`.',
        });
        expect(places.entries).toHaveLength(0);
    });

    it('rejects a null return', async () => {
        const result = await executeProcessData({ ...withRoute, code: 'return null;' }, baseState());
        expect(result).toEqual({
            error: 'Process code must return `{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`.',
        });
    });

    it('rejects an undefined return', async () => {
        const result = await executeProcessData({ ...withRoute, code: 'return undefined;' }, baseState());
        expect(result).toEqual({
            error: 'Process code must return `{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`.',
        });
    });

    it('treats an empty places FeatureCollection as no content produced (same as omitting it)', async () => {
        const code = "return { places: { type: 'FeatureCollection', features: [] } };";
        const result = await executeProcessData({ ...withRoute, code }, baseState());
        expect(result).toEqual({
            error:
                'At least one of `places`, `geometries`, `fitOnMap`, `byod` must produce content ' +
                '(empty arrays / FeatureCollections do not count).',
        });
        expect(places.entries).toHaveLength(0);
    });

    it('writes a new custom-geometries entry when the code returns geometries without places', async () => {
        const result = await executeProcessData({ ...withRoute, code: GEOMETRIES_RETURN }, baseState());
        if ('error' in result) expect.fail(`expected success, got: ${result.error}`);

        expect(result).toHaveProperty('customGeometriesEntryId');
        expect(customGeometries.entries).toHaveLength(1);
        expect(places.entries).toHaveLength(0);
    });

    // process-data.ts:440's `nonEmptyFeatureCollection` normalizes an empty `places` return to
    // `undefined` — without it, an empty `places` on the same call as a non-empty `geometries`
    // would count as "places was set", and the geometries would get silently dropped instead of
    // landing as their own entry (single-write-per-call semantics).
    it('writes geometries as a standalone entry when places comes back as an empty FeatureCollection alongside them', async () => {
        const code = `return {
            places: { type: 'FeatureCollection', features: [] },
            geometries: [
                { type: 'Feature', id: 'poly-0', geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] }, properties: {} }
            ]
        };`;
        const result = await executeProcessData({ ...withRoute, code }, baseState());
        if ('error' in result) expect.fail(`expected success, got: ${result.error}`);

        expect(result).toHaveProperty('customGeometriesEntryId');
        expect(customGeometries.entries).toHaveLength(1);
        // The empty `places` never became a places entry — geometries land standalone, not attached.
        expect(places.entries).toHaveLength(0);
    });

    it('rejects a Point feature smuggled into geometries (must be Polygon/MultiPolygon)', async () => {
        const code = `return { geometries: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.4] }, properties: {} }
        ] };`;
        const result = await executeProcessData({ ...withRoute, code }, baseState());
        expect(result).toEqual({
            error: '`geometries[0]` must be a GeoJSON Feature with Polygon or MultiPolygon geometry.',
        });
        expect(customGeometries.entries).toHaveLength(0);
    });

    it('rejects raw coordinate pairs in place of Feature objects (coordinates leaking through unwrapped)', async () => {
        // A recurring generated-code failure: handing back bare [lng, lat] pairs / coordinate rings
        // instead of GeoJSON Features. Must be rejected here, not leaked through to the map/chat UI.
        const code = 'return { geometries: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]] };';
        const result = await executeProcessData({ ...withRoute, code }, baseState());
        expect(result).toEqual({
            error: '`geometries[0]` must be a GeoJSON Feature with Polygon or MultiPolygon geometry.',
        });
        expect(customGeometries.entries).toHaveLength(0);
    });

    it('attaches geometries to the new places entry when both are returned', async () => {
        const code = `return {
            places: { type: 'FeatureCollection', features: [
                { type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.4] }, properties: { type: 'Cross Street', poi: { name: 'Test Place' } } }
            ] },
            geometries: [
                { type: 'Feature', id: 'poly-0', geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] }, properties: {} }
            ]
        };`;
        const result = await executeProcessData({ ...withRoute, code }, baseState());
        if ('error' in result) expect.fail(`expected success, got: ${result.error}`);

        expect(result).toHaveProperty('placesEntryId');
        expect(result).toMatchObject({ placesGeometryCount: 1 });
        expect(places.entries).toHaveLength(1);
        // Attached to the places entry — no standalone custom-geometries entry.
        expect(customGeometries.entries).toHaveLength(0);
    });

    it('errors when the code returns nothing usable', async () => {
        const result = await executeProcessData({ ...withRoute, code: 'return {};' }, baseState());
        expect(result).toEqual({
            error: 'At least one of `places`, `geometries`, `fitOnMap`, `byod` must produce content (empty arrays / FeatureCollections do not count).',
        });
    });

    it('catches a throwing code body and surfaces it as an error', async () => {
        const result = await executeProcessData({ ...withRoute, code: 'return undefinedVar.foo;' }, baseState());
        expect(result).toHaveProperty('error');
    });

    // KNOWN GAP: analyseData round-trips its sandbox result through JSON (`toJsonSafe`) before
    // returning, specifically to reject circular references / BigInt before they cross the AI SDK's
    // jsonValueSchema boundary. processData has no equivalent guard — validatePlaces/validateGeometries
    // only check the specific fields they read (geometry, type, display name); arbitrary properties the
    // sandbox attaches sail through unchecked. This pins the CURRENT behaviour (silent success, the
    // circular object persisted as-is) so a future fix intentionally changes this test, rather than an
    // unnoticed regression changing it.
    it('currently succeeds on a circular-reference place — no JSON-serializability guard yet (unlike analyseData)', async () => {
        const code = `
            const place = { type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.4] },
                properties: { type: 'Cross Street', poi: { name: 'Test Place' } } };
            place.properties.self = place;
            return { places: { type: 'FeatureCollection', features: [place] } };
        `;
        const result = await executeProcessData({ ...withRoute, code }, baseState());

        if ('error' in result) expect.fail(`expected the current (gap) behaviour to succeed, got: ${result.error}`);
        expect(places.entries).toHaveLength(1);
    });

    it('rejects an unknown input entry id before the sandbox runs', async () => {
        const result = await executeProcessData(
            { placesEntryIDs: ['does-not-exist'], code: 'throw new Error("should not run")' },
            baseState(),
        );
        if (!('error' in result)) expect.fail('expected an error result');

        expect(result.error).toContain('does-not-exist');
        expect(result.error).not.toContain('should not run');
    });
});
