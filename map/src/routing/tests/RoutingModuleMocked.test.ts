import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { ROUTES_SOURCE_ID, RoutingModule, WAYPOINTS_SOURCE_ID } from "../RoutingModule";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Routing module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", () => {
        const routesSource = { id: ROUTES_SOURCE_ID, setData: jest.fn() };
        const waypointsSource = { id: WAYPOINTS_SOURCE_ID, setData: jest.fn() };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest
                    .fn()
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(routesSource)
                    .mockReturnValueOnce(waypointsSource)
                    .mockReturnValueOnce(waypointsSource),
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
        routing.clearRoutes();
        routing.showWaypoints([]);
        routing.showWaypoints({ type: "FeatureCollection", features: [] });
        routing.clearWaypoints();
    });
});
