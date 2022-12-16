import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import {
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    RoutingModule,
    WAYPOINTS_SOURCE_ID
} from "../RoutingModule";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Routing module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", () => {
        const waypointsSource = { id: WAYPOINTS_SOURCE_ID, setData: jest.fn() };
        const routesSource = { id: ROUTES_SOURCE_ID, setData: jest.fn() };
        const vehicleRestrictedSource = { id: ROUTE_VEHICLE_RESTRICTED_SOURCE_ID, setData: jest.fn() };
        const incidentsSource = { id: ROUTE_INCIDENTS_SOURCE_ID, setData: jest.fn() };
        const ferriesSource = { id: ROUTE_FERRIES_SOURCE_ID, setData: jest.fn() };
        const tollRoadsSource = { id: ROUTE_TOLL_ROADS_SOURCE_ID, setData: jest.fn() };
        const tunnelsSource = { id: ROUTE_TUNNELS_SOURCE_ID, setData: jest.fn() };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest
                    .fn()
                    .mockReturnValueOnce(waypointsSource)
                    .mockReturnValueOnce(waypointsSource)
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(vehicleRestrictedSource)
                    .mockReturnValueOnce(vehicleRestrictedSource)
                    .mockReturnValueOnce(incidentsSource)
                    .mockReturnValueOnce(incidentsSource)
                    .mockReturnValueOnce(ferriesSource)
                    .mockReturnValueOnce(ferriesSource)
                    .mockReturnValueOnce(tollRoadsSource)
                    .mockReturnValueOnce(tollRoadsSource)
                    .mockReturnValueOnce(tunnelsSource)
                    .mockReturnValueOnce(tunnelsSource),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockReturnValue(true),
                hasImage: jest.fn().mockReturnValue(false),
                loadImage: jest.fn(),
                setLayoutProperty: jest.fn()
            } as unknown as Map
        } as GOSDKMap;

        const routing = new RoutingModule(goSDKMapMock);
        routing.showRoutes({ type: "FeatureCollection", features: [] });
        routing.selectRoute(0);
        routing.clearRoutes();
        routing.showWaypoints([]);
        routing.showWaypoints({ type: "FeatureCollection", features: [] });
        routing.clearWaypoints();
    });
});
