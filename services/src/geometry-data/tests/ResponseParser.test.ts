import apiAndParsedResponses from "./ResponseParser.data.json";
import { GeometryDataResponseAPI } from "../types/APITypes";
import { GeometryDataResponse } from "../types/GeometryDataResponse";
import { parseGeometryDataResponse } from "../ResponseParser";

describe("Geometry Data response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: GeometryDataResponseAPI, parsedResponse: GeometryDataResponse) => {
            expect(parseGeometryDataResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});
