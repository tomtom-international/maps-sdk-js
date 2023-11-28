import { customizeService } from "../../../index";

describe("Using customize obj", () => {
    test("calc route request URL building tests using customize obj", () => {
        expect(
            customizeService.calculateRoute.buildCalculateRouteRequest({
                apiKey: "API_KEY",
                commonBaseURL: "https://api.tomtom.com",
                geoInputs: [
                    [4.88066, 52.37319],
                    [4.49015, 52.16109]
                ]
            })
        ).toMatchObject({
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37319,4.88066:52.16109,4.49015/json?" +
                    "key=API_KEY&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway" +
                    "&sectionType=pedestrian&sectionType=tollRoad&sectionType=tollVignette&sectionType=country" +
                    "&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            )
        });
    });
});
