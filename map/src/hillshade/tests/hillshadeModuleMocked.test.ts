import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { HILLSHADE_SOURCE_ID } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { HillshadeModule } from '../HillshadeModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Vector tiles Hillshade module tests', () => {
    test('Initializing module with config', async () => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        const tomtomMapMock = {
            mapLibreMap: {
                once: vi.fn().mockReturnValue(Promise.resolve()),
                getSource: vi.fn().mockReturnValue(hillshadeSource),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { hillshadeSourceID: {} } }),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const hillshade = await HillshadeModule.get(tomtomMapMock, {
            visible: false,
        });
        expect(hillshade).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        hillshade.setVisible(false);
        hillshade.isVisible();
    });

    test('Initializing module with no config', async () => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValue(hillshadeSource),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { hillshadeSourceID: {} } }),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const hillshade = await HillshadeModule.get(tomtomMapMock);
        expect(hillshade).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });
});
