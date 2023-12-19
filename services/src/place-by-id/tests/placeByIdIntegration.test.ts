import { TomTomConfig } from "@anw/maps-sdk-js/core";

import { placeById, PlaceByIdResponseAPI } from "..";
import {
    expectPlaceTestFeature,
    basePOITestProps,
    evStationWithOpeningHoursTestProps
} from "../../shared/tests/integrationTestUtils";

describe("Place By Id API", () => {
    beforeAll(() => TomTomConfig.instance.put({ apiKey: process.env.API_KEY }));

    test("placeById not found", async () => {
        const place = await placeById({ entityId: "NOT_HERE" });
        expect(place).toBeUndefined();
    });

    test("placeById works", async () => {
        const entityId = "528009004250472";
        const place = await placeById({
            entityId,
            language: "en-GB",
            view: "Unified",
            timeZone: "iana",
            openingHours: "nextSevenDays"
        });

        expect(place).toBeDefined();
        expect(place).toEqual(expectPlaceTestFeature(basePOITestProps));
    });

    test("placeById for EV charging station with opening hours", async () => {
        const place = await placeById({
            entityId: "IiD0PMyr5YVswOHZME6nmQ",
            openingHours: "nextSevenDays"
        });

        expect(place).toBeDefined();
        expect(place).toEqual(expectPlaceTestFeature(evStationWithOpeningHoursTestProps));
    });

    test("placeById with API request and response callbacks", async () => {
        const entityId = "528009004250472";
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: PlaceByIdResponseAPI) => void;
        const place = await placeById({ entityId, onAPIRequest, onAPIResponse });
        expect(place).toBeDefined();
        expect(onAPIResponse).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });
});
