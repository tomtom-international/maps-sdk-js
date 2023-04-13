import { Map } from "maplibre-gl";
import {
    EventsModule,
    mapStyleLayerIDs,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    WAYPOINTS_SOURCE_ID
} from "../../shared";
import { TomTomMap } from "../../TomTomMap";
import { RoutingModule } from "../RoutingModule";
import { routeDeselectedOutline } from "../layers/routeMainLineLayers";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Routing module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", async () => {
        const waypointsSource = { id: WAYPOINTS_SOURCE_ID, setData: jest.fn() };
        const routesSource = { id: ROUTES_SOURCE_ID, setData: jest.fn() };
        const vehicleRestrictedSource = { id: ROUTE_VEHICLE_RESTRICTED_SOURCE_ID, setData: jest.fn() };
        const incidentsSource = { id: ROUTE_INCIDENTS_SOURCE_ID, setData: jest.fn() };
        const ferriesSource = { id: ROUTE_FERRIES_SOURCE_ID, setData: jest.fn() };
        const tollRoadsSource = { id: ROUTE_TOLL_ROADS_SOURCE_ID, setData: jest.fn() };
        const tunnelsSource = { id: ROUTE_TUNNELS_SOURCE_ID, setData: jest.fn() };
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
                    .mockReturnValueOnce(tunnelsSource),
                getLayer: jest
                    .fn()
                    .mockImplementation((id: string) => (id === mapStyleLayerIDs.lowestLabel ? {} : undefined)),
                addLayer: jest.fn(),
                removeLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockReturnValue(true),
                hasImage: jest.fn().mockReturnValue(false),
                loadImage: jest.fn(),
                setLayoutProperty: jest.fn(),
                setFilter: jest.fn(),
                setPaintProperty: jest.fn()
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            },
            _addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        const routing = await RoutingModule.init(tomtomMapMock);
        routing.showRoutes({ type: "FeatureCollection", features: [] });
        routing.selectRoute(0);
        routing.clearRoutes();
        routing.showWaypoints([]);
        routing.showWaypoints({ type: "FeatureCollection", features: [] });
        routing.clearWaypoints();
        expect(routing.getLayerToRenderLinesUnder()).toStrictEqual(mapStyleLayerIDs.lowestLabel);
        routing.applyConfig({
            routeLayers: {
                mainLine: {
                    layers: [
                        {
                            id: "a different id",
                            layerSpec: routeDeselectedOutline,
                            beforeID: mapStyleLayerIDs.lowestLabel
                        }
                    ]
                }
            }
        });

        expect(routing.events.routeLines).toBeInstanceOf(EventsModule);
        expect(routing.events.waypoints).toBeInstanceOf(EventsModule);
        expect(routing.events.vehicleRestricted).toBeInstanceOf(EventsModule);
        expect(routing.events.incidents).toBeInstanceOf(EventsModule);
        expect(routing.events.ferries).toBeInstanceOf(EventsModule);
        expect(routing.events.tollRoads).toBeInstanceOf(EventsModule);
        expect(routing.events.tunnels).toBeInstanceOf(EventsModule);
    });
});
