import { GeometrySearchResponse, GeometrySearchResponseAPI } from "../types";
import apiAndParsedResponses from "../../geometry-search/tests/ResponseParser.data.json";
import { parseGeometrySearchResponse } from "../ResponseParser";

describe("Geometry Search response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: GeometrySearchResponseAPI, parsedResponse: GeometrySearchResponse) => {
            expect(parseGeometrySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});
