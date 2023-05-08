import { Geometries } from "@anw/maps-sdk-js/core";
import apiAndParsedResponses from "./responseParser.data.json";
import { GeometryDataResponseAPI } from "../types/apiTypes";
import { parseGeometryDataResponse } from "../responseParser";

describe("Geometry Data response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: GeometryDataResponseAPI, parsedResponse: Geometries) => {
            expect(parseGeometryDataResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});
