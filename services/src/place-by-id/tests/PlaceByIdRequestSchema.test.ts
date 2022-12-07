import { GOSDKConfig } from "@anw/go-sdk-js/core";
import { placeById } from "..";

describe("Place By Id API", () => {
    beforeAll(() => {
        GOSDKConfig.instance.put({ apiKey: process.env.API_KEY });
    });

    const entityId = 528009004250472; // Invalid value, entityId is a string
    const language = "en-GB";
    const view = "Unified";
    const timeZone = "iana";
    const openingHours = "nextSevenDays";

    test("it should throw Validation error with invalid entityId", async () => {
        const invalidParams = {
            entityId,
            language,
            view,
            timeZone,
            openingHours
        };

        await expect(
            // @ts-ignore
            placeById(invalidParams)
        ).rejects.toThrow();

        await expect(
            // @ts-ignore
            placeById(invalidParams)
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "PlaceById",
            errors: [
                {
                    code: "invalid_type",
                    expected: "string",
                    received: "number",
                    path: ["entityId"],
                    message: "Expected string, received number"
                }
            ]
        });
    });

    test("it should throw Validation error when missing entityId", async () => {
        await expect(
            // @ts-ignore
            placeById({
                language,
                view,
                timeZone,
                openingHours
            })
        ).rejects.toThrow();

        await expect(
            // @ts-ignore
            placeById({
                language,
                view,
                timeZone,
                openingHours
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "PlaceById",
            errors: [
                {
                    code: "invalid_type",
                    expected: "string",
                    received: "undefined",
                    path: ["entityId"],
                    message: "Required"
                }
            ]
        });
    });
});
