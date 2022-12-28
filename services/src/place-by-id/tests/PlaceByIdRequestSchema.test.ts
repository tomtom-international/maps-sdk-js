import { PlaceByIdParams } from "../types";
import placeByIdReqObjects from "../../place-by-id/tests/RequestBuilderPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { validateRequestSchema } from "../../shared/Validation";
import { placeByIdRequestSchema } from "../PlaceByIdSchema";

describe("Place By Id API", () => {
    const apiKey = "APIKEY";
    const commonBaseURL = "https://api-test.tomtom.com";
    const entityId = 528009004250472; // Invalid value, entityId is a string
    const language = "en-GB";
    const view = "Unified";
    const timeZone = "iana";
    const openingHours = "nextSevenDays";

    test("it should throw Validation error with invalid entityId", () => {
        const invalidParams = {
            apiKey,
            commonBaseURL,
            entityId,
            language,
            view,
            timeZone,
            openingHours
        };

        expect(
            // @ts-ignore
            () => validateRequestSchema(invalidParams, placeByIdRequestSchema)
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "number",
                        path: ["entityId"],
                        message: "Expected string, received number"
                    }
                ]
            })
        );
    });

    test("it should throw Validation error when missing entityId", () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    language,
                    view,
                    timeZone,
                    openingHours
                },
                placeByIdRequestSchema
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "undefined",
                        path: ["entityId"],
                        message: "Required"
                    }
                ]
            })
        );
    });
});

describe("PlaceById request schema performance tests", () => {
    test.each(placeByIdReqObjects)(
        "'%s'",
        // @ts-ignore
        (params: PlaceByIdParams) => {
            expect(bestExecutionTimeMS(() => validateRequestSchema(params, placeByIdRequestSchema), 10)).toBeLessThan(
                2
            );
        }
    );
});
