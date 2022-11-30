import reverseGeocodeReqObjectsAndURLS from "./RequestBuilder.data.json";
import reverseGeocodeReqObjects from "./RequestBuilderPerf.data.json";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";
import { buildRevGeoRequest } from "../RequestBuilder";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";

describe("Reverse Geocoding request URL building functional tests", () => {
    test.each(reverseGeocodeReqObjectsAndURLS)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: ReverseGeocodingParams, url: string) => {
            expect(buildRevGeoRequest(params).toString()).toStrictEqual(url);
        }
    );
});

describe("Reverse Geocoding request URL building performance test", () => {
    test.each(reverseGeocodeReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: ReverseGeocodingParams) => {
            expect(assertExecutionTime(() => buildRevGeoRequest(params), 10, 2)).toBeTruthy();
        }
    );
});
