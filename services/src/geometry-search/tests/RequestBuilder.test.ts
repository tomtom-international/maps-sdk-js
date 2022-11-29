import { buildGeometrySearchRequest } from "../RequestBuilder";
import geometrySearchReqObjectsAndURLs from "./RequestBuilder.data.json";
import geometrySearchReqObjects from "./RequestBuilderPerf.data.json";
import { GeometrySearchParams, SearchByGeometryPayloadAPI } from "../types";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";

describe("Calculate Geometry Search request URL building tests", () => {
    test.each(geometrySearchReqObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: GeometrySearchParams, requestData: SearchByGeometryPayloadAPI) => {
            // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
            // (We reparse the objects to compare them ignoring the order of properties)
            expect(JSON.parse(JSON.stringify(buildGeometrySearchRequest(params)))).toStrictEqual(
                JSON.parse(JSON.stringify(requestData))
            );
        }
    );

    const expectToThrow = (type: string): void => {
        expect(() =>
            buildGeometrySearchRequest({
                query: "whatever",
                commonBaseURL: "https://api.tomtom.com",
                geometries: [{ type, coordinates: [0, 0] } as never]
            })
        ).toThrow();
    };

    // eslint-disable-next-line jest/expect-expect
    test("Incorrect geometry type supplied", () => {
        expectToThrow("Point");
        expectToThrow("MultiPoint");
        expectToThrow("LineString");
        expectToThrow("MultiLineString");
    });
});

describe("Geometry Search request URL builder performance tests", () => {
    test.each(geometrySearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (title: string, params: GeometrySearchParams) => {
            expect(assertExecutionTime(() => buildGeometrySearchRequest(params), 10, 2)).toBeTruthy();
        }
    );
});
