import { apiAndParsedResponses } from "./ResponseParser.data";
import { Feature, Point, Position } from "geojson";
import { parseResponse } from "../ResponseParser";
import { RevGeoAddressProps } from "core/src";

describe("ReverseGeocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        (
            name: string,
            lngLatInput: Position,
            apiResponse: any,
            expectedParsedResponse: Feature<Point, RevGeoAddressProps>
        ) => {
            expect(parseResponse(lngLatInput, apiResponse)).toStrictEqual(expectedParsedResponse);
        }
    );
});
