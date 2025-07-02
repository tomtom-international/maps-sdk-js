import type { Map } from 'maplibre-gl';
import {
    EventsModule,
    mapStyleLayerIDs,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID,
    ROUTE_INSTRUCTIONS_SOURCE_ID,
    ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    WAYPOINTS_SOURCE_ID,
} from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { RoutingModule } from '../RoutingModule';
import { routeDeselectedOutline } from '../layers/routeMainLineLayers';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Routing module tests', () => {
    test('Basic flows', async () => {
        const waypointsSource = { id: WAYPOINTS_SOURCE_ID, setData: jest.fn() };
        const routesSource = { id: ROUTES_SOURCE_ID, setData: jest.fn() };
        const vehicleRestrictedSource = { id: ROUTE_VEHICLE_RESTRICTED_SOURCE_ID, setData: jest.fn() };
        const incidentsSource = { id: ROUTE_INCIDENTS_SOURCE_ID, setData: jest.fn() };
        const ferriesSource = { id: ROUTE_FERRIES_SOURCE_ID, setData: jest.fn() };
        const tollRoadsSource = { id: ROUTE_TOLL_ROADS_SOURCE_ID, setData: jest.fn() };
        const tunnelsSource = { id: ROUTE_TUNNELS_SOURCE_ID, setData: jest.fn() };
        const instructionLinesSource = { id: ROUTE_INSTRUCTIONS_SOURCE_ID, setData: jest.fn() };
        const instructionArrowsSource = { id: ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID, setData: jest.fn() };
        const summaryBubblesSource = { id: ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID, setData: jest.fn() };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest
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
                getLayer: jest.fn().mockReturnValue({}),
                addLayer: jest.fn(),
                removeLayer: jest.fn(),
                hasImage: jest.fn().mockReturnValue(false),
                addImage: jest.fn(),
                loadImage: jest.fn().mockResolvedValue(jest.fn()),
                setLayoutProperty: jest.fn(),
                setFilter: jest.fn(),
                setPaintProperty: jest.fn(),
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn(),
            },
            addStyleChangeHandler: jest.fn(),
            once: jest.fn().mockReturnValue(Promise.resolve()),
            mapReady: jest.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const routing = await RoutingModule.init(tomtomMapMock);
        routing.showRoutes({ type: 'FeatureCollection', features: [] });
        routing.selectRoute(0);
        routing.clearRoutes();
        routing.showWaypoints([]);
        routing.showWaypoints({ type: 'FeatureCollection', features: [] });
        routing.clearWaypoints();
        expect(routing.getLayerToRenderLinesUnder()).toEqual(mapStyleLayerIDs.lowestLabel);
        routing.applyConfig({
            layers: {
                mainLines: [
                    {
                        id: 'a different id',
                        layerSpec: routeDeselectedOutline,
                        beforeID: mapStyleLayerIDs.lowestLabel,
                    },
                ],
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
