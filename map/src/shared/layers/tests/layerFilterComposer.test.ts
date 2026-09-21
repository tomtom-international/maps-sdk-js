import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { StyleChangeHandler, TomTomMap } from '../../../TomTomMap';
import { LayerFilterComposer } from '../layerFilterComposer';

const STYLE_FILTER = ['<=', ['get', 'display_class'], ['-', ['zoom'], 1]];
const STYLE_FILTERS_BY_LAYER: Record<string, unknown> = { POI: STYLE_FILTER };

// A MapLibre map over one layer whose filter the style defines, with every write recorded.
const makeMapLibreMock = (filtersByLayer = STYLE_FILTERS_BY_LAYER) => ({
    getLayer: vi.fn((id: string) => (id in filtersByLayer ? { id } : undefined)),
    getFilter: vi.fn((id: string) => filtersByLayer[id]),
    setFilter: vi.fn(),
});

type MapLibreMock = ReturnType<typeof makeMapLibreMock>;

const makeTomTomMapMock = (mapLibre: MapLibreMock) => {
    const styleChangeHandlers: StyleChangeHandler[] = [];
    const tomtomMap = {
        mapLibreMap: mapLibre as unknown as Map,
        addStyleChangeHandler: vi.fn((handler: StyleChangeHandler) => {
            styleChangeHandlers.push(handler);
            return () => undefined;
        }),
        mapReady: true,
    } as unknown as TomTomMap;
    return { tomtomMap, styleChangeHandlers };
};

const lastFilterSetFor = (mapLibre: MapLibreMock, layerId: string) =>
    mapLibre.setFilter.mock.calls.findLast((call) => call[0] === layerId)?.[1];

describe('LayerFilterComposer', () => {
    let mapLibre: MapLibreMock;
    let tomtomMap: TomTomMap;
    let styleChangeHandlers: StyleChangeHandler[];

    beforeEach(() => {
        mapLibre = makeMapLibreMock();
        ({ tomtomMap, styleChangeHandlers } = makeTomTomMapMock(mapLibre));
    });

    test('is one instance per map', () => {
        expect(LayerFilterComposer.for(tomtomMap)).toBe(LayerFilterComposer.for(tomtomMap));
        expect(LayerFilterComposer.for(makeTomTomMapMock(mapLibre).tomtomMap)).not.toBe(
            LayerFilterComposer.for(tomtomMap),
        );
    });

    test('a transform rewrites the filter the style gave the layer', () => {
        LayerFilterComposer.for(tomtomMap).setTransform('POI', 'styling.zoomShift', () => ['==', ['get', 'a'], 1]);

        expect(lastFilterSetFor(mapLibre, 'POI')).toStrictEqual(['==', ['get', 'a'], 1]);
        // The style's own filter, not a filter another contributor had already written.
        expect(mapLibre.getFilter).toHaveBeenCalledWith('POI');
    });

    test('a clause is and-ed with the filter the style gave the layer', () => {
        LayerFilterComposer.for(tomtomMap).setClause('POI', 'pois.categories', ['==', ['get', 'category'], 'cafe']);

        expect(lastFilterSetFor(mapLibre, 'POI')).toStrictEqual([
            'all',
            ['==', ['get', 'category'], 'cafe'],
            STYLE_FILTER,
        ]);
    });

    // The regression this class exists for: each contributor used to rebuild the filter from its own
    // snapshot of the style, so whichever wrote last dropped the other's work.
    test.each([
        ['transform first', ['transform', 'clause']],
        ['clause first', ['clause', 'transform']],
    ])('a transform and a clause compose, %s', (_name, order) => {
        const composer = LayerFilterComposer.for(tomtomMap);
        const register = {
            transform: () =>
                composer.setTransform('POI', 'styling.zoomShift', () => [
                    '<=',
                    ['get', 'display_class'],
                    ['-', ['zoom'], 3],
                ]),
            clause: () => composer.setClause('POI', 'pois.categories', ['==', ['get', 'category'], 'cafe']),
        };
        for (const step of order) register[step as keyof typeof register]();

        expect(lastFilterSetFor(mapLibre, 'POI')).toStrictEqual([
            'all',
            ['==', ['get', 'category'], 'cafe'],
            ['<=', ['get', 'display_class'], ['-', ['zoom'], 3]],
        ]);
    });

    test('clauses of two contributors both narrow the layer', () => {
        const composer = LayerFilterComposer.for(tomtomMap);
        composer.setClause('POI', 'pois.categories', ['==', ['get', 'category'], 'cafe']);
        composer.setClause('POI', 'someone.else', ['has', 'name']);

        expect(lastFilterSetFor(mapLibre, 'POI')).toStrictEqual([
            'all',
            ['==', ['get', 'category'], 'cafe'],
            ['has', 'name'],
            STYLE_FILTER,
        ]);
    });

    test('withdrawing one contribution leaves the others in place', () => {
        const composer = LayerFilterComposer.for(tomtomMap);
        composer.setTransform('POI', 'styling.zoomShift', () => ['has', 'shifted']);
        composer.setClause('POI', 'pois.categories', ['==', ['get', 'category'], 'cafe']);

        composer.setClause('POI', 'pois.categories', undefined);
        expect(lastFilterSetFor(mapLibre, 'POI')).toStrictEqual(['has', 'shifted']);

        composer.setTransform('POI', 'styling.zoomShift', undefined);
        expect(lastFilterSetFor(mapLibre, 'POI')).toStrictEqual(STYLE_FILTER);
    });

    // MapLibre rejects a filter that mixes the deprecated syntax with the expression syntax, and a
    // current style can still hold a deprecated node.
    test('converts a deprecated style filter to expression syntax before a clause joins it', () => {
        const legacyMap = makeMapLibreMock({ POI: ['all', ['==', 'category', 'cafe'], ['has', 'name']] });
        const composer = LayerFilterComposer.for(makeTomTomMapMock(legacyMap).tomtomMap);
        composer.setClause('POI', 'pois.categories', ['in', ['get', 'category'], ['literal', ['cafe']]]);

        expect(lastFilterSetFor(legacyMap, 'POI')).toStrictEqual([
            'all',
            ['in', ['get', 'category'], ['literal', ['cafe']]],
            ['all', ['==', ['get', 'category'], 'cafe'], ['has', 'name']],
        ]);
    });

    test('a single clause stands alone when the style filters the layer by nothing', () => {
        const unfilteredMap = makeMapLibreMock({ POI: undefined });
        LayerFilterComposer.for(makeTomTomMapMock(unfilteredMap).tomtomMap).setClause('POI', 'pois.categories', [
            'has',
            'name',
        ]);

        expect(lastFilterSetFor(unfilteredMap, 'POI')).toStrictEqual(['has', 'name']);
    });

    test('clears the filter when the last contribution is withdrawn from an unfiltered layer', () => {
        const unfilteredMap = makeMapLibreMock({ POI: undefined });
        const composer = LayerFilterComposer.for(makeTomTomMapMock(unfilteredMap).tomtomMap);
        composer.setClause('POI', 'pois.categories', ['has', 'name']);
        composer.setClause('POI', 'pois.categories', undefined);

        expect(lastFilterSetFor(unfilteredMap, 'POI')).toBeNull();
    });

    test('leaves a layer the loaded style does not have alone', () => {
        LayerFilterComposer.for(tomtomMap).setClause('Absent', 'pois.categories', ['has', 'name']);

        expect(mapLibre.setFilter).not.toHaveBeenCalled();
    });

    test('drops snapshot and contributions when a new style arrives', () => {
        const composer = LayerFilterComposer.for(tomtomMap);
        composer.setClause('POI', 'pois.categories', ['==', ['get', 'category'], 'cafe']);

        for (const handler of styleChangeHandlers) handler.onStyleAboutToChange?.({ resetState: false });
        mapLibre.getFilter.mockReturnValue(['has', 'brand_new_style']);
        composer.setTransform('POI', 'styling.zoomShift', (filter) => ['all', filter, ['has', 'shifted']]);

        // The withdrawn category clause is gone, and the base is the new style's own filter.
        expect(lastFilterSetFor(mapLibre, 'POI')).toStrictEqual([
            'all',
            ['has', 'brand_new_style'],
            ['has', 'shifted'],
        ]);
    });

    test('clears before every module restores itself', () => {
        LayerFilterComposer.for(tomtomMap).setClause('POI', 'pois.categories', ['has', 'name']);

        expect(styleChangeHandlers[0].priority).toBe(Number.NEGATIVE_INFINITY);
    });
});
