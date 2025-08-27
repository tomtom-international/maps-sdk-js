import type { PolygonFeatures } from '@cet/maps-sdk-js/core';
import type { DataDrivenPropertyValueSpecification, Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { mapStyleLayerIDs } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { GeometriesModule } from '../GeometriesModule';
import amsterdamGeometryData from './geometriesModuleMocked.test.data.json';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Geometry module tests', () => {
    test('Basic flows', async () => {
        const geometrySource = { id: 'sourceID', setData: vi.fn() };
        const tomtomMapMock = {
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
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const geometryConfig = { colorConfig: { fillColor: 'warm' }, textConfig: { textField: 'title' } };

        const textField: DataDrivenPropertyValueSpecification<string> = ['get', 'country'];

        const testGeometryData = amsterdamGeometryData as PolygonFeatures;
        let geometry = await GeometriesModule.init(tomtomMapMock, geometryConfig);
        // to be able to spy on private methods
        const geometryAny: any = geometry;
        vi.spyOn(geometryAny, 'applyConfig');
        vi.spyOn(geometryAny, 'applyTextConfig');
        vi.spyOn(geometryAny, 'updateLayerAndData');
        vi.spyOn(geometryAny, 'moveBeforeLayerID');
        expect(geometry.getConfig()).toMatchObject(geometryConfig);
        geometry.applyTextConfig({ textField });
        expect(geometryAny.applyTextConfig).toHaveBeenCalledWith({ textField });
        expect(geometryAny.updateLayerAndData).toHaveBeenCalledTimes(1);
        expect(geometry.getConfig()).toEqual({ ...geometryConfig, textConfig: { textField } });

        geometry.moveBeforeLayer('top');
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith('geometry-0_Title');
        geometry.moveBeforeLayer('country');
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.country);
        geometry.moveBeforeLayer('lowestPlaceLabel');
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.lowestPlaceLabel);
        geometry.moveBeforeLayer('poi');
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.poi);
        geometry.moveBeforeLayer('lowestLabel');
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.lowestLabel);
        geometry.moveBeforeLayer('lowestRoadLine');
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.lowestRoadLine);
        geometry.moveBeforeLayer('lowestBuilding');
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.lowestBuilding);

        geometry.show(testGeometryData);
        geometry.clear();
        geometry = await GeometriesModule.init(tomtomMapMock);
        geometry.show(testGeometryData);
        geometry.clear();
        expect(geometry.events).toBeDefined();
    });
});
