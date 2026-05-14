import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TRAFFIC_INCIDENTS_SOURCE_ID } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { TrafficIncidentsModule } from '../TrafficIncidentsModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Vector tiles traffic module tests', () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        const incidentsSource = { id: TRAFFIC_INCIDENTS_SOURCE_ID };
        tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValue(incidentsSource),
                getStyle: vi
                    .fn()
                    .mockReturnValue({ layers: [{}], sources: { incidentsSourceID: {}, flowSourceID: {} } }),
                isStyleLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn().mockReturnValue(Promise.resolve()),
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
        const trafficIncidentsModule = await TrafficIncidentsModule.get(tomtomMapMock, {
            visible: true,
            filters: { any: [{ roadCategories: { show: 'only', values: ['motorway', 'trunk'] } }] },
            icons: {
                visible: false,
                filters: { any: [{ roadCategories: { show: 'only', values: ['motorway'] } }] },
            },
        });
        expect(trafficIncidentsModule).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        trafficIncidentsModule.setVisible(true);
        trafficIncidentsModule.setIconsVisible(true);
        trafficIncidentsModule.setVisible(false);
        trafficIncidentsModule.setIconsVisible(false);
        trafficIncidentsModule.filter();
        trafficIncidentsModule.filter({ any: [{ roadCategories: { show: 'only', values: ['primary'] } }] });

        // (see note on top of test file)
        trafficIncidentsModule.applyConfig(undefined);
        trafficIncidentsModule.applyConfig({});
        trafficIncidentsModule.applyConfig({ visible: true });
        trafficIncidentsModule.applyConfig({ visible: false });
        trafficIncidentsModule.applyConfig({ visible: false, icons: { visible: true } });
    });

    test('restoreDataAndConfigImpl re-runs init and re-applies config after a style change', async () => {
        const mod = await TrafficIncidentsModule.get(tomtomMapMock, { visible: true });
        const getSourceCallsBefore = (tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls
            .length;

        expect(() => (mod as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl()).not.toThrow();

        expect((tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
            getSourceCallsBefore,
        );
        expect(mod.getConfig()).toMatchObject({ visible: true });
    });
});
