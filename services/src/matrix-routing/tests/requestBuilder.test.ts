import { FetchInput } from "../../shared/types/fetch";
import { buildCalculateMatrixRouteRequest } from "../requestBuilder";
import { CalculateMatrixRoutePOSTDataAPI } from "../types/apiRequestTypes";
import { CalculateMatrixRouteParams } from "../types/calculateMatrixRouteParams";
import { sdkAndAPIRequests } from "./requestBuilder.data";

describe("Matrix Routing - Request builder", () => {
    test.each(sdkAndAPIRequests)(
        "'%s'",
        (
            _name: string,
            params: CalculateMatrixRouteParams,
            apiRequest: FetchInput<CalculateMatrixRoutePOSTDataAPI>
        ) => {
            expect(buildCalculateMatrixRouteRequest(params)).toBe(apiRequest);
        }
    );
});
