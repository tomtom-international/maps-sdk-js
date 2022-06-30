import { apiAndParsedResponses } from "./ResponseParser.data";
import { Feature, Point, Position } from "geojson";
import { parseRevGeoResponse } from "../ResponseParser";
import { RevGeoAddressProps } from "core/src";
import { ReverseGeocodingOptions } from "../ReverseGeocodingOptions";

describe("ReverseGeocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        (
            name: string,
            lngLatInput: Position,
            apiResponse: any,
            options: ReverseGeocodingOptions,
            expectedParsedResponse: Feature<Point, RevGeoAddressProps>
        ) => {
            expect(parseRevGeoResponse(lngLatInput, apiResponse, options)).toStrictEqual(expectedParsedResponse);
        }
    );
});
