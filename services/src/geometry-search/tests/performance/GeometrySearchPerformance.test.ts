import { GeometrySearchParams, GeometrySearchResponseAPI } from "../../types";
import { buildGeometrySearchRequest } from "../../RequestBuilder";
import geometrySearchReqObjects from "../performance/RequestBuilderForPerf.data.json";
import geometrySearchResponses from "../performance/ResponseParserForPerf.data.json";
import { parseGeometrySearchResponse } from "../../ResponseParser";

describe("Geometry Search request URL builder performance tests", () => {
    const MAX_EXEC_TIME_MS = 5; //5ms - needs to be agreed
    test.each(geometrySearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (params: GeometrySearchParams) => {
            const timeTakenToExec: number[] = [];
            //We run each test 10 times
            for (let i = 0; i < 10; i++) {
                const t0 = performance.now();
                buildGeometrySearchRequest(params);
                const t1 = performance.now();
                timeTakenToExec.push(Number(`${t1 - t0}`));
            }
            //smallest value is considered
            expect(timeTakenToExec.sort()[0]).toBeLessThanOrEqual(MAX_EXEC_TIME_MS);
        }
    );
});

describe("Geometry Search response parser performance tests", () => {
    const MAX_EXEC_TIME_MS = 5; //5ms - needs to be agreed
    test.each(geometrySearchResponses)(
        "'%s'",
        // @ts-ignore
        (_name: title, apiResponse: GeometrySearchResponseAPI) => {
            const timeTakenToExec: number[] = [];
            //We run each test 10 times
            for (let i = 0; i < 10; i++) {
                const t0 = performance.now();
                parseGeometrySearchResponse(apiResponse);
                const t1 = performance.now();
                timeTakenToExec.push(Number(`${t1 - t0}`));
            }
            //smallest value is considered
            expect(timeTakenToExec.sort()[0]).toBeLessThanOrEqual(MAX_EXEC_TIME_MS);
        }
    );
});
