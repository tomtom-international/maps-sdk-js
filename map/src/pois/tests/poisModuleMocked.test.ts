import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { POI_SOURCE_ID } from '../../shared';
import { LayerFilterComposer } from '../../shared/layers/layerFilterComposer';
import type { TomTomMap } from '../../TomTomMap';
import { POIsModule } from '../POIsModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Vector tiles POI module tests', () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        const poiSource = { id: POI_SOURCE_ID };
        tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValueOnce(poiSource),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { poiSourceID: {} } }),
                setFilter: vi.fn(),
                getFilter: vi.fn(),
                getLayer: vi.fn(),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
                updateIfRegistered: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;
    });

    test('Initializing module with config', async () => {
        const pois = await POIsModule.get(tomtomMapMock, {
            visible: false,
        });
        expect(pois).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        pois.setVisible(false);
        pois.isVisible();
    });

    test('Initializing module with no config', async () => {
        const pois = await POIsModule.get(tomtomMapMock);
        expect(pois).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });

    test('restoreDataAndConfigImpl re-runs init and re-applies config after a style change', async () => {
        const pois = await POIsModule.get(tomtomMapMock, { visible: false });
        (tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mockReturnValue({ id: POI_SOURCE_ID });
        const getSourceCallsBefore = (tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls
            .length;

        (pois as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect((tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
            getSourceCallsBefore,
        );
        expect(pois.getConfig()).toMatchObject({ visible: false });
    });

    test('filter methods while initializing module with filter config', async () => {
        const pois = await POIsModule.get(tomtomMapMock, {
            filters: {
                categories: {
                    show: 'all_except',
                    values: ['FOOD_DRINKS_GROUP', 'ENTERTAINMENT'],
                },
            },
        });

        vi.spyOn(pois, 'filterCategories');
        expect(pois).toBeDefined();
        pois.filterCategories({
            show: 'all_except',
            values: ['ACCOMMODATION_GROUP'],
        });
        expect(pois.filterCategories).toHaveBeenCalledTimes(1);
        expect(pois.filterCategories).toHaveBeenCalledWith({
            show: 'all_except',
            values: ['ACCOMMODATION_GROUP'],
        });
    });

    // The category filter shares the POI layer with the styling knob `pois.zoomShift`, which
    // rewrites the same filter. Both write through the composer, so neither drops the other.
    test('the category filter composes with another contributor on the same layer', async () => {
        const styleFilter = ['<=', ['get', 'display_class'], ['-', ['zoom'], 1]];
        const mapLibre = tomtomMapMock.mapLibreMap as unknown as Record<string, ReturnType<typeof vi.fn>>;
        mapLibre.getLayer.mockImplementation((id: string) => (id === 'POI' ? { id } : undefined));
        mapLibre.getFilter.mockReturnValue(styleFilter);

        const pois = await POIsModule.get(tomtomMapMock);
        LayerFilterComposer.for(tomtomMapMock).setTransform('POI', 'styling.zoomShift', () => [
            '<=',
            ['get', 'display_class'],
            ['-', ['zoom'], 3],
        ]);

        pois.filterCategories({ show: 'only', values: ['RESTAURANT'] });
        const filtered = JSON.stringify(mapLibre.setFilter.mock.lastCall?.[1]);
        expect(filtered).toContain('["-",["zoom"],3]');
        expect(filtered).toContain('"category"');

        // Resetting the categories withdraws that clause only.
        pois.filterCategories();
        expect(mapLibre.setFilter.mock.lastCall?.[1]).toStrictEqual([
            '<=',
            ['get', 'display_class'],
            ['-', ['zoom'], 3],
        ]);
    });
});
