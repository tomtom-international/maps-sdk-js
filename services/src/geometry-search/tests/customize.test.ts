import { customizeService } from "../../../index";

describe("Using customize obj", () => {
    test("Geometry Search request URL building tests using customize obj", () => {
        expect(
            JSON.parse(
                JSON.stringify(
                    customizeService.geometrySearch.buildGeometrySearchRequest({
                        apiKey: "API_KEY",
                        commonBaseURL: "https://api.tomtom.com",
                        geometries: [
                            {
                                type: "Polygon",
                                coordinates: [
                                    [
                                        [2.28266, 48.8828],
                                        [2.31842, 48.82377],
                                        [2.41268, 48.84003],
                                        [2.38927, 48.89776]
                                    ]
                                ]
                            },
                            {
                                type: "Circle",
                                coordinates: [2.30046, 48.37394],
                                radius: 2000
                            }
                        ],
                        query: "Electric Charging Station"
                    })
                )
            )
        ).toStrictEqual(
            JSON.parse(
                JSON.stringify({
                    url: "https://api.tomtom.com/search/2/geometrySearch/Electric%20Charging%20Station.json?key=API_KEY",
                    data: {
                        geometryList: [
                            {
                                type: "POLYGON",
                                vertices: [
                                    "48.8828,2.28266",
                                    "48.82377,2.31842",
                                    "48.84003,2.41268",
                                    "48.89776,2.38927"
                                ]
                            },
                            {
                                type: "CIRCLE",
                                radius: 2000,
                                position: "48.37394,2.30046"
                            }
                        ]
                    }
                })
            )
        );
    });
});
