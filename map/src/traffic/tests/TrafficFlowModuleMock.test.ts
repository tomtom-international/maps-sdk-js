import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { TRAFFIC_FLOW_SOURCE_ID } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { TrafficFlowModule } from '../TrafficFlowModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Vector tiles traffic flow module tests', () => {
    function createMockMap(flowSource: { id: string }): TomTomMap {
        return {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValue(flowSource),
                getStyle: vi
                    .fn()
                    .mockReturnValue({ layers: [{}], sources: { incidentsSourceID: {}, flowSourceID: {} } }),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;
    }

    test('Initializing module with config', async () => {
        const flowSource = { id: TRAFFIC_FLOW_SOURCE_ID };
        const tomtomMapMock = createMockMap(flowSource);

        const trafficFlowModule = await TrafficFlowModule.get(tomtomMapMock, {
            visible: true,
            filters: { any: [{ roadCategories: { show: 'only', values: ['motorway', 'trunk'] } }] },
        });
        expect(trafficFlowModule).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        trafficFlowModule.setVisible(false);
        trafficFlowModule.setVisible(true);
        trafficFlowModule.filter();
        trafficFlowModule.filter({ any: [{ roadCategories: { show: 'only', values: ['primary'] } }] });

        // (see note on top of test file)
        trafficFlowModule.applyConfig(undefined);
        trafficFlowModule.applyConfig({});
        trafficFlowModule.applyConfig({ visible: false });
    });

    test('Initializing module with no config and no flow in style', async () => {
        const flowSource = { id: TRAFFIC_FLOW_SOURCE_ID };
        const tomtomMapMock = createMockMap(flowSource);

        const trafficFlowModule = await TrafficFlowModule.get(tomtomMapMock);
        expect(trafficFlowModule).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });
});
