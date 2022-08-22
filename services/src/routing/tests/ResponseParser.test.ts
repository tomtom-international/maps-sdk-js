import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseCalculateRouteResponse } from "../ResponseParser";
import { CalculateRouteResultAPI } from "../types/APITypes";
import { CalculateRouteResponse } from "../CalculateRoute";

describe("Calculate Route response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (name: string, apiResponse: CalculateRouteResultAPI, parsedResponse: CalculateRouteResponse) => {
            expect(JSON.stringify(parseCalculateRouteResponse(apiResponse))).toStrictEqual(
                JSON.stringify(parsedResponse)
            );
        }
    );
});
