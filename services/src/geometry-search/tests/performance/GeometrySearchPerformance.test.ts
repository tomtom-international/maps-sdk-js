import { GeometrySearchParams, GeometrySearchResponseAPI } from "../../types";
import { buildGeometrySearchRequest } from "../../RequestBuilder";
import geometrySearchReqObjects from "../performance/RequestBuilderForPerf.data.json";
import geometrySearchResponses from "../performance/ResponseParserForPerf.data.json";
import { parseGeometrySearchResponse } from "../../ResponseParser";

describe("Geometry Search request URL builder performance tests", () => {
    const maxExecTimeMS = 2; //2ms - needs to be agreed
    test.each(geometrySearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (_name: name, params: GeometrySearchParams) => {
            const timeTakenToExec = [];
            //We run each test 10 times
            for (let i = 0; i < 10; i++) {
                const t0 = performance.now();
                buildGeometrySearchRequest(params);
                const t1 = performance.now();
                timeTakenToExec.push(`${t1 - t0}`);
            }
            timeTakenToExec.sort();
            const p90Index = Math.round(0.9 * timeTakenToExec.length) - 1;
            //90th Percentile is considered
            expect(Number(timeTakenToExec[p90Index])).toBeLessThanOrEqual(maxExecTimeMS);
        }
    );
});

describe("Geometry Search response parser performance tests", () => {
    const maxExecTimeMS = 5; //5ms - needs to be agreed
    test.each(geometrySearchResponses)(
        "'%s'",
        // @ts-ignore
        (_name: title, apiResponse: GeometrySearchResponseAPI) => {
            const timeTakenToExec = [];
            //We run each test 10 times
            for (let i = 0; i < 10; i++) {
                const t0 = performance.now();
                parseGeometrySearchResponse(apiResponse);
                const t1 = performance.now();
                timeTakenToExec.push(`${t1 - t0}`);
            }
            timeTakenToExec.sort();
            const p90Index = Math.round(0.9 * timeTakenToExec.length) - 1;
            //90th Percentile is considered
            expect(Number(timeTakenToExec[p90Index])).toBeLessThanOrEqual(maxExecTimeMS);
        }
    );
});
