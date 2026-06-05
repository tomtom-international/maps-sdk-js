import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { describe, expect, it } from 'vitest';
import { profileFeatureCollection } from '../profile';

const featureCollection = (features: FeatureCollection['features']): FeatureCollection => ({
    type: 'FeatureCollection',
    features,
});

// A point feature carrying arbitrary properties — geometry is irrelevant to the property profiling.
const pointWith = (properties: GeoJsonProperties): FeatureCollection['features'][number] => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties,
});

// Build a feature with an explicit geometry — lets a scenario mix Polygon / MultiPolygon /
// LineString in one collection. The profiler only reads `geometry.type`, so the coordinates
// are just plausible placeholders.
const featureWith = (geometry: Geometry, properties: GeoJsonProperties): FeatureCollection['features'][number] => ({
    type: 'Feature',
    geometry,
    properties,
});

describe('profileFeatureCollection', () => {
    it('reports feature count and distinct geometry types', () => {
        const profile = profileFeatureCollection(
            featureCollection([
                { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[0, 0]]] }, properties: {} },
            ]),
        );

        expect(profile).toEqual({ featureCount: 3, geometryTypes: ['Point', 'Polygon'], properties: [] });
    });

    it('profiles property types, coverage, and example values', () => {
        const profile = profileFeatureCollection(
            featureCollection([
                pointWith({ name: 'A', pop: 10 }),
                pointWith({ name: 'B', pop: 20 }),
                pointWith({ name: 'C' }),
            ]),
        );

        expect(profile).toEqual({
            featureCount: 3,
            geometryTypes: ['Point'],
            properties: [
                { name: 'name', types: ['string'], coverage: 1, examples: ['A', 'B', 'C'] },
                // `pop` is missing on the third feature → 2/3 coverage, rounded to 0.67.
                { name: 'pop', types: ['number'], coverage: 0.67, examples: [10, 20] },
            ],
        });
    });

    it('records null as a distinct type and orders by coverage', () => {
        const profile = profileFeatureCollection(
            featureCollection([pointWith({ rank: 1, note: null }), pointWith({ rank: 2 })]),
        );

        expect(profile).toEqual({
            featureCount: 2,
            geometryTypes: ['Point'],
            properties: [
                // `rank` (coverage 1) sorts before `note` (coverage 0.5); null carries no example value.
                { name: 'rank', types: ['number'], coverage: 1, examples: [1, 2] },
                { name: 'note', types: ['null'], coverage: 0.5, examples: [] },
            ],
        });
    });

    it('caps examples per property and truncates long strings', () => {
        const profile = profileFeatureCollection(
            featureCollection([
                pointWith({ tag: 'a' }),
                pointWith({ tag: 'b' }),
                pointWith({ tag: 'c' }),
                pointWith({ tag: 'd' }),
                pointWith({ blurb: 'x'.repeat(200) }),
            ]),
        );

        expect(profile).toEqual({
            featureCount: 5,
            geometryTypes: ['Point'],
            properties: [
                // Only the first 3 distinct examples are kept ('d' is dropped).
                { name: 'tag', types: ['string'], coverage: 0.8, examples: ['a', 'b', 'c'] },
                // Strings over 60 chars are truncated to 60 + an ellipsis.
                { name: 'blurb', types: ['string'], coverage: 0.2, examples: [`${'x'.repeat(60)}…`] },
            ],
        });
    });

    it('handles an empty collection without dividing by zero', () => {
        expect(profileFeatureCollection(featureCollection([]))).toEqual({
            featureCount: 0,
            geometryTypes: [],
            properties: [],
        });
    });

    it('caps the property list and reports how many keys were omitted', () => {
        // 41 distinct keys on a single feature → all coverage 1, sorted alphabetically. The profile
        // keeps the first MAX_PROPERTIES (40), drops the alphabetically-last ("key-40"), and records
        // the overflow via `propertiesOmitted`. Expected list is generated from the same rule.
        const wideProperties: GeoJsonProperties = {};
        for (let index = 0; index < 41; index++) {
            // Zero-pad so alphabetical order matches numeric order.
            wideProperties[`key-${String(index).padStart(2, '0')}`] = index;
        }

        const profile = profileFeatureCollection(featureCollection([pointWith(wideProperties)]));

        expect(profile).toEqual({
            featureCount: 1,
            geometryTypes: ['Point'],
            properties: Array.from({ length: 40 }, (_unused, index) => ({
                name: `key-${String(index).padStart(2, '0')}`,
                types: ['number'],
                coverage: 1,
                examples: [index],
            })),
            propertiesOmitted: 1,
        });
    });

    it('omits `propertiesOmitted` when the collection fits under the cap', () => {
        const profile = profileFeatureCollection(featureCollection([pointWith({ a: 1, b: 2 })]));

        expect(profile).toEqual({
            featureCount: 1,
            geometryTypes: ['Point'],
            properties: [
                { name: 'a', types: ['number'], coverage: 1, examples: [1] },
                { name: 'b', types: ['number'], coverage: 1, examples: [2] },
            ],
        });
    });

    it('profiles LineString features (a road network)', () => {
        const road = (properties: GeoJsonProperties) =>
            featureWith(
                {
                    type: 'LineString',
                    coordinates: [
                        [4.89, 52.37],
                        [4.9, 52.38],
                    ],
                },
                properties,
            );
        const profile = profileFeatureCollection(
            featureCollection([
                road({ ref: 'A10', lanes: 4, length_km: 12.5, surface: 'asphalt' }),
                road({ ref: 'N201', lanes: 2, length_km: 8, surface: 'asphalt' }),
                road({ ref: 'S100', lanes: 2, length_km: 3.2 }),
            ]),
        );

        expect(profile).toEqual({
            featureCount: 3,
            geometryTypes: ['LineString'],
            properties: [
                { name: 'lanes', types: ['number'], coverage: 1, examples: [4, 2] },
                { name: 'length_km', types: ['number'], coverage: 1, examples: [12.5, 8, 3.2] },
                { name: 'ref', types: ['string'], coverage: 1, examples: ['A10', 'N201', 'S100'] },
                // `surface` is missing on the third road → 2/3 coverage.
                { name: 'surface', types: ['string'], coverage: 0.67, examples: ['asphalt'] },
            ],
        });
    });

    it('profiles mixed Polygon / MultiPolygon features (administrative regions)', () => {
        const profile = profileFeatureCollection(
            featureCollection([
                featureWith(
                    {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.7, 52.3],
                                [5, 52.3],
                                [5, 52.5],
                                [4.7, 52.3],
                            ],
                        ],
                    },
                    { name: 'Noord-Holland', capital: 'Haarlem', population: 2879527, area_km2: 4092 },
                ),
                featureWith(
                    {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [3.4, 51.4],
                                    [3.9, 51.4],
                                    [3.9, 51.6],
                                    [3.4, 51.4],
                                ],
                            ],
                        ],
                    },
                    { name: 'Zeeland', capital: 'Middelburg', population: 385379, area_km2: 2933 },
                ),
                featureWith(
                    {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [5, 52],
                                [5.3, 52],
                                [5.3, 52.2],
                                [5, 52],
                            ],
                        ],
                    },
                    { name: 'Utrecht', capital: 'Utrecht', population: 1361093, area_km2: 1485 },
                ),
            ]),
        );

        expect(profile).toEqual({
            featureCount: 3,
            // Insertion order: Polygon (first feature), then MultiPolygon — the repeat Polygon is deduped.
            geometryTypes: ['Polygon', 'MultiPolygon'],
            properties: [
                { name: 'area_km2', types: ['number'], coverage: 1, examples: [4092, 2933, 1485] },
                { name: 'capital', types: ['string'], coverage: 1, examples: ['Haarlem', 'Middelburg', 'Utrecht'] },
                { name: 'name', types: ['string'], coverage: 1, examples: ['Noord-Holland', 'Zeeland', 'Utrecht'] },
                { name: 'population', types: ['number'], coverage: 1, examples: [2879527, 385379, 1361093] },
            ],
        });
    });
});
