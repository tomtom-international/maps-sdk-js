import type { FetchInput } from "../../shared";
import { buildCalculateMatrixRouteRequest } from "../requestBuilder";
import type { CalculateMatrixRoutePOSTDataAPI } from "../types/apiRequestTypes";
import type { CalculateMatrixRouteParams } from "../types/calculateMatrixRouteParams";
import { sdkAndAPIRequests } from "./requestBuilder.data";

describe("Matrix Routing - Request builder", () => {
    test.each(sdkAndAPIRequests)(
        "'%s'",
        (
            _name: string,
            params: CalculateMatrixRouteParams,
            apiRequest: FetchInput<CalculateMatrixRoutePOSTDataAPI>
        ) => {
            expect(buildCalculateMatrixRouteRequest(params)).toEqual(apiRequest);
        }
    );
});
