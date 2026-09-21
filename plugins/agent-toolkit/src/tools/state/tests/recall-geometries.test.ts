import type { CommonPlaceProps, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Analyses, CustomGeometriesState, PlacesState, RangeState } from '../../../state';
import { makeMockPlace, makeMockPlaces, makeMockState } from '../../../tests/constants';
import type { GeometriesId } from '../../shared';
import { executeRecallGeometries } from '../recall-geometries';

const polygonFeature = (id: string): PolygonFeature<CommonPlaceProps> =>
    ({
        type: 'Feature',
        id,
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 0],
                ],
            ],
        },
        properties: {},
    }) as unknown as PolygonFeature<CommonPlaceProps>;

describe('executeRecallGeometries', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('indexes across slices and excludes places entries without geometries', async () => {
        const places = new PlacesState({} as TomTomMap);
        const withGeom = await places.addPlaceResult(makeMockPlace(), 'with geom', undefined, undefined, [
            polygonFeature('g1'),
        ]);
        await places.addPlaceResult(makeMockPlace(), 'no geom');

        const customGeometries = new CustomGeometriesState({} as TomTomMap);
        const customId = await customGeometries.addEntry([polygonFeature('c1')], { sourceIds: [] }, 'custom');

        const result = await executeRecallGeometries(
            {},
            makeMockState({ places, customGeometries, analyses: new Analyses() }),
        );
        if (!('entries' in result)) expect.fail('expected an index result');

        const placesRefs = result.entries.filter((e) => e.id.kind === 'places');
        expect(placesRefs).toHaveLength(1);
        expect(placesRefs[0].id.id).toBe(withGeom);
        expect(result.entries.some((e) => e.id.kind === 'customGeometries' && e.id.id === customId)).toBe(true);
    });

    it('errors when a places detail has no cached footprints', async () => {
        const { places, placeId: id } = await makeMockPlaces();

        const result = await executeRecallGeometries(
            { id: { kind: 'places', id } },
            makeMockState({ places, analyses: new Analyses() }),
        );

        expect(result).toEqual({
            error: `Places entry "${id}" has no cached footprints. Call discoverPlaces / locatePlace with \`withGeometries: true\` first.`,
        });
    });

    it('errors when a ranges detail has zero polygon features', async () => {
        const ranges = new RangeState({} as TomTomMap);
        const id = await ranges.addEntry({
            label: 'empty range',
            data: [
                {
                    origin: { position: [4.9, 52.4] },
                    budgets: [],
                    polygon: { type: 'FeatureCollection', features: [] },
                },
            ],
        });

        const result = await executeRecallGeometries(
            { id: { kind: 'ranges', id } },
            makeMockState({ ranges, analyses: new Analyses() }),
        );

        expect(result).toEqual({ error: `Ranges entry "${id}" has no polygons.` });
    });

    it('errors on an invalid detail kind', async () => {
        const result = await executeRecallGeometries(
            { id: { kind: 'place', id: 'x' } as unknown as GeometriesId },
            makeMockState({ analyses: new Analyses() }),
        );

        expect(result).toEqual({
            error: '`{ kind: "place" }` is not a recallable detail target. Pass a places-entry id (`recallState({ kind: "places", id })`) to inspect a single place.',
        });
    });

    it('returns custom-geometries detail with provenance fields when present', async () => {
        const customGeometries = new CustomGeometriesState({} as TomTomMap);
        const sourceIds: GeometriesId[] = [{ kind: 'places', id: 'places-0' }];
        const id = await customGeometries.addEntry(
            [polygonFeature('c1')],
            { operation: 'union', sourceIds },
            'derived',
        );

        const result = await executeRecallGeometries(
            { id: { kind: 'customGeometries', id } },
            makeMockState({ customGeometries, analyses: new Analyses() }),
        );
        if (!('features' in result)) expect.fail('expected a detail result');

        expect(result.operation).toBe('union');
        expect(result.sourceIds).toEqual(sourceIds);
        expect(result.featureCount).toBe(1);
    });
});
