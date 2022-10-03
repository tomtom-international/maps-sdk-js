import apiAndParsedResponses from "../../place-by-id/tests/ResponseParser.data.json"
import { PlaceByIdResponse, PlaceByIdResponseAPI } from "../types";
import { parsePlaceByIdResponse } from "../ResponseParser";

describe("Place By Is response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: PlaceByIdResponseAPI, parsedResponse: PlaceByIdResponse) => {
            expect(parsePlaceByIdResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});
