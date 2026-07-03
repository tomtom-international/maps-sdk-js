import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { DataDrivenPropertyValueSpecification, Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mapStyleLayerIDs } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { GeometriesModule } from '../GeometriesModule';
import amsterdamGeometryData from './geometriesModuleMocked.test.data';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Geometry module tests', () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        const geometrySource = { id: 'sourceID', setData: vi.fn() };
        tomtomMapMock = {
            mapLibreMap: {
                once: vi.fn().mockReturnValue(Promise.resolve()),
                getSource: vi.fn().mockReturnValue(geometrySource),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { geometrySourceID: {} } }),
                getLayer: vi.fn(),
                addLayer: vi.fn(),
                isStyleLoaded: vi.fn().mockReturnValue(true),
                setLayoutProperty: vi.fn(),
                setPaintProperty: vi.fn(),
                setFilter: vi.fn(),
                moveLayer: vi.fn(),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
                updateIfRegistered: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(true),
        } as unknown as TomTomMap;
    });

    test('Basic flows', async () => {
        const geometryConfig = { fill: { color: 'warm' }, textConfig: { textField: 'title' } };

        const textField: DataDrivenPropertyValueSpecification<string> = ['get', 'country'];

        const testGeometryData = amsterdamGeometryData as PolygonFeatures;
        let geometry = await GeometriesModule.get(tomtomMapMock, geometryConfig);
        // to be able to spy on private methods
        const geometryAny: any = geometry;
        vi.spyOn(geometryAny, 'applyConfig');
        vi.spyOn(geometryAny, 'applyTextConfig');
        vi.spyOn(geometryAny, 'updateLayerAndData');
        vi.spyOn(geometryAny, 'moveLayersBefore');
        expect(geometry.getConfig()).toMatchObject(geometryConfig);
        geometry.applyTextConfig({ textField });
        expect(geometryAny.applyTextConfig).toHaveBeenCalledWith({ textField });
        expect(geometryAny.updateLayerAndData).toHaveBeenCalledTimes(1);
        expect(geometry.getConfig()).toEqual({ ...geometryConfig, textConfig: { textField } });

        // A scalar layerConfig moves every geometry-layer group before the resolved layer id.
        geometry.moveBeforeLayer('top');
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(
            expect.any(Array),
            expect.stringMatching(/^geometry-\d+_Title$/),
        );
        geometry.moveBeforeLayer('country');
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(expect.any(Array), mapStyleLayerIDs.country);
        geometry.moveBeforeLayer('lowestPlaceLabel');
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(expect.any(Array), mapStyleLayerIDs.lowestPlaceLabel);
        geometry.moveBeforeLayer('poi');
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(expect.any(Array), mapStyleLayerIDs.poi);
        geometry.moveBeforeLayer('lowestLabel');
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(expect.any(Array), mapStyleLayerIDs.lowestLabel);
        geometry.moveBeforeLayer('lowestRoadLine');
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(expect.any(Array), mapStyleLayerIDs.lowestRoadLine);
        geometry.moveBeforeLayer('lowestBuilding');
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(expect.any(Array), mapStyleLayerIDs.lowestBuilding);

        // The object form positions fill and border independently.
        geometry.moveBeforeLayer({ fill: 'lowestRoadLine', line: 'top' });
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(
            [expect.stringMatching(/^geometry-\d+_Fill$/)],
            mapStyleLayerIDs.lowestRoadLine,
        );
        expect(geometryAny.moveLayersBefore).toHaveBeenCalledWith(
            expect.arrayContaining([expect.stringMatching(/^geometry-\d+_Outline$/)]),
            expect.stringMatching(/^geometry-\d+_Title$/),
        );

        geometry.show(testGeometryData);
        geometry.clear();
        geometry = await GeometriesModule.get(tomtomMapMock);
        geometry.show(testGeometryData);
        geometry.clear();
        expect(geometry.events).toBeDefined();
    });

    test('restoreDataAndConfigImpl keeps source and layer IDs stable across a style change', async () => {
        const geometry = await GeometriesModule.get(tomtomMapMock);
        const before = structuredClone(geometry.sourceAndLayerIDs);

        (geometry as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect(geometry.sourceAndLayerIDs).toEqual(before);
    });
});
