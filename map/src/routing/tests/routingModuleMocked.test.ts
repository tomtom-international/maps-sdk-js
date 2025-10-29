import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { EventsModule, mapStyleLayerIDs } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { routeDeselectedOutline } from '../layers/routeMainLineLayers';
import { RoutingModule } from '../RoutingModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Routing module tests', () => {
    test('Basic flows', async () => {
        const waypointsSource = { id: 'routeWaypoints', setData: vi.fn() };
        const routesSource = { id: 'routeMainLines', setData: vi.fn() };
        const vehicleRestrictedSource = { id: 'routeVehicleRestricted', setData: vi.fn() };
        const incidentsSource = { id: 'routeIncidents', setData: vi.fn() };
        const ferriesSource = { id: 'routeFerries', setData: vi.fn() };
        const tollRoadsSource = { id: 'routeTollRoads', setData: vi.fn() };
        const tunnelsSource = { id: 'routeTunnels', setData: vi.fn() };
        const instructionLinesSource = { id: 'routeInstructionLines', setData: vi.fn() };
        const instructionArrowsSource = { id: 'routeInstructionArrows', setData: vi.fn() };
        const summaryBubblesSource = { id: 'routeSummaryBubbles', setData: vi.fn() };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: vi
                    .fn()
                    .mockReturnValueOnce(waypointsSource)
                    .mockReturnValueOnce(waypointsSource)
                    .mockReturnValueOnce(waypointsSource)
                    .mockReturnValueOnce(waypointsSource)
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(vehicleRestrictedSource)
                    .mockReturnValueOnce(vehicleRestrictedSource)
                    .mockReturnValueOnce(vehicleRestrictedSource)
                    .mockReturnValueOnce(vehicleRestrictedSource)
                    .mockReturnValueOnce(incidentsSource)
                    .mockReturnValueOnce(incidentsSource)
                    .mockReturnValueOnce(incidentsSource)
                    .mockReturnValueOnce(incidentsSource)
                    .mockReturnValueOnce(ferriesSource)
                    .mockReturnValueOnce(ferriesSource)
                    .mockReturnValueOnce(ferriesSource)
                    .mockReturnValueOnce(ferriesSource)
                    .mockReturnValueOnce(tollRoadsSource)
                    .mockReturnValueOnce(tollRoadsSource)
                    .mockReturnValueOnce(tollRoadsSource)
                    .mockReturnValueOnce(tollRoadsSource)
                    .mockReturnValueOnce(tunnelsSource)
                    .mockReturnValueOnce(tunnelsSource)
                    .mockReturnValueOnce(tunnelsSource)
                    .mockReturnValueOnce(tunnelsSource)
                    .mockReturnValueOnce(instructionLinesSource)
                    .mockReturnValueOnce(instructionLinesSource)
                    .mockReturnValueOnce(instructionLinesSource)
                    .mockReturnValueOnce(instructionLinesSource)
                    .mockReturnValueOnce(instructionArrowsSource)
                    .mockReturnValueOnce(instructionArrowsSource)
                    .mockReturnValueOnce(instructionArrowsSource)
                    .mockReturnValueOnce(instructionArrowsSource)
                    .mockReturnValueOnce(summaryBubblesSource)
                    .mockReturnValueOnce(summaryBubblesSource)
                    .mockReturnValueOnce(summaryBubblesSource)
                    .mockReturnValueOnce(summaryBubblesSource),
                getLayer: vi.fn().mockReturnValue({}),
                addLayer: vi.fn(),
                removeLayer: vi.fn(),
                hasImage: vi.fn().mockReturnValue(false),
                addImage: vi.fn(),
                loadImage: vi.fn().mockResolvedValue(vi.fn()),
                setLayoutProperty: vi.fn(),
                setFilter: vi.fn(),
                setPaintProperty: vi.fn(),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            once: vi.fn().mockReturnValue(Promise.resolve()),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const routing = await RoutingModule.get(tomtomMapMock);
        routing.showRoutes({ type: 'FeatureCollection', features: [] });
        routing.selectRoute(0);
        routing.clearRoutes();
        routing.showWaypoints([]);
        routing.showWaypoints({ type: 'FeatureCollection', features: [] });
        routing.clearWaypoints();
        expect(routing.getLayerToRenderLinesUnder()).toEqual(mapStyleLayerIDs.lowestLabel);
        routing.applyConfig({
            layers: {
                mainLines: {
                    additional: {
                        'a-different-id': {
                            ...routeDeselectedOutline,
                            beforeID: mapStyleLayerIDs.lowestLabel,
                        },
                    },
                },
            },
        });

        expect(routing.events.mainLines).toBeInstanceOf(EventsModule);
        expect(routing.events.waypoints).toBeInstanceOf(EventsModule);
        expect(routing.events.vehicleRestricted).toBeInstanceOf(EventsModule);
        expect(routing.events.incidents).toBeInstanceOf(EventsModule);
        expect(routing.events.ferries).toBeInstanceOf(EventsModule);
        expect(routing.events.tollRoads).toBeInstanceOf(EventsModule);
        expect(routing.events.tunnels).toBeInstanceOf(EventsModule);
        expect(routing.events.instructionLines).toBeInstanceOf(EventsModule);
        expect(routing.events.summaryBubbles).toBeInstanceOf(EventsModule);
    });
});
