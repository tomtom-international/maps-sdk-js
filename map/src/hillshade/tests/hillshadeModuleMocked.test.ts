import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HILLSHADE_SOURCE_ID } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { HillshadeModule } from '../HillshadeModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Vector tiles Hillshade module tests', () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        tomtomMapMock = {
            mapLibreMap: {
                once: vi.fn().mockReturnValue(Promise.resolve()),
                getSource: vi.fn().mockReturnValue(hillshadeSource),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { hillshadeSourceID: {} } }),
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

    test('Initializing module with config', async () => {
        const hillshade = await HillshadeModule.get(tomtomMapMock, { visible: false });
        expect(hillshade).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        hillshade.setVisible(false);
        hillshade.isVisible();
    });

    test('Initializing module with no config', async () => {
        const hillshade = await HillshadeModule.get(tomtomMapMock);
        expect(hillshade).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });

    test('restoreDataAndConfigImpl re-runs init and re-applies config after a style change', async () => {
        const hillshade = await HillshadeModule.get(tomtomMapMock, { visible: false });
        const getSourceCallsBefore = (tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls
            .length;

        expect(() =>
            (hillshade as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl(),
        ).not.toThrow();

        expect((tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
            getSourceCallsBefore,
        );
        expect(hillshade.getConfig()).toMatchObject({ visible: false });
    });
});
