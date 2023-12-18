import { parseCalculateMatrixRouteResponse } from "../responseParser";
import { CalculateMatrixRouteResponseAPI } from "../types/apiResponseTypes";
import { CalculateMatrixRouteParams } from "../types/calculateMatrixRouteParams";
import apiAndParsedResponses from "./responseParser.data.json";

describe("Matrix Route response parsing tests", () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponse: CalculateMatrixRouteResponseAPI,
            params: CalculateMatrixRouteParams,
            parsedResponse: CalculateMatrixRouteResponseAPI
        ) => {
            expect(
                JSON.parse(JSON.stringify(parseCalculateMatrixRouteResponse(apiResponse /*, params*/)))
            ).toMatchObject(JSON.parse(JSON.stringify(parsedResponse)));
        }
    );
});
