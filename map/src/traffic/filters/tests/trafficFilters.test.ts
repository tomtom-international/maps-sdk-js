import type { ExpressionFilterSpecification, LayerSpecification } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import type { LayerFilterComposer } from '../../../shared/layers/layerFilterComposer';
import { applyFilter, buildMapLibreFlowFilters, buildMapLibreIncidentFilters } from '../trafficFilters';

describe('Traffic filter tests', () => {
    test('build MapLibre incident filters: empty filters', () => {
        expect(buildMapLibreIncidentFilters(undefined as never)).toBeNull();
        expect(buildMapLibreIncidentFilters({} as never)).toBeNull();
        expect(buildMapLibreIncidentFilters({ any: [] })).toBeNull();
        expect(buildMapLibreIncidentFilters({ any: [{}] })).toBeNull();
        expect(buildMapLibreIncidentFilters({ any: [{ delays: {} }] })).toBeNull();
    });

    test('build MapLibre incident filters: simple filters', () => {
        expect(
            buildMapLibreIncidentFilters({ any: [{ incidentCategories: { show: 'only', values: ['jam'] } }] }),
        ).toStrictEqual(['==', ['get', 'icon_category_0'], 6]);
        expect(
            buildMapLibreIncidentFilters({ any: [{ roadCategories: { show: 'only', values: ['motorway'] } }] }),
        ).toStrictEqual(['==', ['get', 'road_category'], 'motorway']);
        expect(
            buildMapLibreIncidentFilters({ any: [{ roadSubCategories: { show: 'only', values: ['residential'] } }] }),
        ).toStrictEqual(['==', ['get', 'road_subcategory'], 'residential']);
        expect(
            buildMapLibreIncidentFilters({
                any: [{ roadCategories: { show: 'all_except', values: ['secondary', 'tertiary'] } }],
            }),
        ).toStrictEqual(['!', ['in', ['get', 'road_category'], ['literal', ['secondary', 'tertiary']]]]);
        expect(
            buildMapLibreIncidentFilters({ any: [{ magnitudes: { show: 'only', values: ['major'] } }] }),
        ).toStrictEqual(['==', ['get', 'magnitude_of_delay'], 3]);
        expect(
            buildMapLibreIncidentFilters({ any: [{ magnitudes: { show: 'only', values: ['moderate', 'major'] } }] }),
        ).toStrictEqual(['in', ['get', 'magnitude_of_delay'], ['literal', [2, 3]]]);
        expect(buildMapLibreIncidentFilters({ any: [{ delays: { mustHaveDelay: true } }] })).toStrictEqual([
            '>',
            ['get', 'delay'],
            0,
        ]);
        expect(
            buildMapLibreIncidentFilters({ any: [{ delays: { mustHaveDelay: true, minDelayMinutes: 10 } }] }),
        ).toStrictEqual(['>=', ['get', 'delay'], 600]);
        expect(buildMapLibreIncidentFilters({ any: [{ delays: { minDelayMinutes: 10 } }] })).toStrictEqual([
            'any',
            ['!', ['has', 'delay']],
            ['==', ['get', 'delay'], 0],
            ['>=', ['get', 'delay'], 600],
        ]);
    });

    test('build MapLibre incident filters: complex filters', () => {
        expect(
            buildMapLibreIncidentFilters({
                any: [
                    {
                        incidentCategories: {
                            show: 'only',
                            values: ['jam', 'accident', 'danger'],
                        },
                        roadCategories: {
                            show: 'all_except',
                            values: ['secondary', 'tertiary'],
                        },
                        magnitudes: {
                            show: 'only',
                            values: ['moderate', 'major'],
                        },
                        delays: {
                            minDelayMinutes: 5,
                        },
                    },
                    {
                        incidentCategories: {
                            show: 'only',
                            values: ['road-closed'],
                        },
                    },
                ],
            }),
        ).toStrictEqual([
            'any',
            [
                'all',
                ['!', ['in', ['get', 'road_category'], ['literal', ['secondary', 'tertiary']]]],
                ['in', ['get', 'icon_category_0'], ['literal', [6, 1, 3]]],
                ['in', ['get', 'magnitude_of_delay'], ['literal', [2, 3]]],
                ['any', ['!', ['has', 'delay']], ['==', ['get', 'delay'], 0], ['>=', ['get', 'delay'], 300]],
            ],
            ['==', ['get', 'icon_category_0'], 8],
        ]);
    });

    test('build MapLibre flow filters: empty filters', () => {
        expect(buildMapLibreFlowFilters(undefined as never)).toBeNull();
        expect(buildMapLibreFlowFilters({} as never)).toBeNull();
        expect(buildMapLibreFlowFilters({ any: [] })).toBeNull();
        expect(buildMapLibreFlowFilters({ any: [{}] })).toBeNull();
    });

    test('build MapLibre flow filters: simple filters', () => {
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        roadCategories: {
                            show: 'only',
                            values: ['motorway', 'trunk'],
                        },
                    },
                ],
            }),
        ).toStrictEqual(['in', ['get', 'road_category'], ['literal', ['motorway', 'trunk']]]);
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        roadSubCategories: {
                            show: 'all_except',
                            values: ['residential', 'driveway'],
                        },
                    },
                ],
            }),
        ).toStrictEqual(['!', ['in', ['get', 'road_subcategory'], ['literal', ['residential', 'driveway']]]]);
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        showRoadClosures: 'only',
                    },
                ],
            }),
        ).toStrictEqual(['==', ['get', 'road_closure'], true]);
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        showRoadClosures: 'all_except',
                    },
                ],
            }),
        ).toStrictEqual(['!=', ['get', 'road_closure'], true]);
    });

    test('build MapLibre flow filters: complex filters', () => {
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        roadCategories: {
                            show: 'only',
                            values: ['motorway', 'trunk', 'primary'],
                        },
                        roadSubCategories: {
                            show: 'only',
                            values: ['residential'],
                        },
                    },
                    {
                        showRoadClosures: 'only',
                    },
                ],
            }),
        ).toStrictEqual([
            'any',
            [
                'all',
                ['in', ['get', 'road_category'], ['literal', ['motorway', 'trunk', 'primary']]],
                ['==', ['get', 'road_subcategory'], 'residential'],
            ],
            ['==', ['get', 'road_closure'], true],
        ]);
    });
    describe('applyFilter', () => {
        const makeComposer = () =>
            ({ setClause: vi.fn() }) as unknown as LayerFilterComposer & { setClause: ReturnType<typeof vi.fn> };
        const layers = [{ id: 'Traffic - Slow flow' }, { id: 'Traffic - Slow flow outline' }] as LayerSpecification[];
        const clause: ExpressionFilterSpecification = ['==', ['get', 'road_closure'], true];

        test('registers the filter on every layer under the module key', () => {
            const composer = makeComposer();
            applyFilter(clause, layers, composer, 'traffic.flow');

            expect(composer.setClause.mock.calls).toStrictEqual([
                ['Traffic - Slow flow', 'traffic.flow', clause],
                ['Traffic - Slow flow outline', 'traffic.flow', clause],
            ]);
        });

        test('withdraws the module key when the filter is dropped, leaving the rest of the filter alone', () => {
            const composer = makeComposer();
            applyFilter(undefined, layers, composer, 'traffic.flow');

            expect(composer.setClause.mock.calls.every((call) => call[2] === undefined)).toBe(true);
        });
    });
});
