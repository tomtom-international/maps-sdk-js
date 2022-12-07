import { FuzzySearchResponse, FuzzySearchResponseAPI } from "../types";
import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseFuzzySearchResponse } from "../ResponseParser";

describe("Fuzzy Search response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: FuzzySearchResponseAPI, parsedResponse: FuzzySearchResponse) => {
            expect(parseFuzzySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});
