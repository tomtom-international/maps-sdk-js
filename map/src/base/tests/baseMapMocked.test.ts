import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BASE_MAP_SOURCE_ID } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { BaseMapModule } from '../BaseMapModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('BaseMap module tests', () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValueOnce({ id: BASE_MAP_SOURCE_ID }),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { hillshadeSourceID: {} } }),
                setLayoutProperty: vi.fn(),
                getLayoutProperty: vi.fn(),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;
    });

    test('Initializing module with config', async () => {
        const basemap: BaseMapModule = await BaseMapModule.get(tomtomMapMock, {
            visible: false,
            layerGroupsFilter: { mode: 'include', names: ['borders', 'water', 'land'] },
        });
        const spySetVisible = vi.spyOn(basemap, 'setVisible');
        expect(basemap).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        basemap.applyConfig({ visible: true });
        expect(spySetVisible).toHaveBeenCalledWith(true);

        basemap.setVisible(false);
        expect(basemap.isVisible()).toBe(false);
    });

    test('Initializing module with no config', async () => {
        const basemap = await BaseMapModule.get(tomtomMapMock);
        expect(basemap).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });

    test('Throw if source runtime is not found', async () => {
        tomtomMapMock.mapLibreMap.getSource = vi.fn().mockReturnValueOnce(undefined);

        await expect(() => BaseMapModule.get(tomtomMapMock)).rejects.toThrow();
    });
});
