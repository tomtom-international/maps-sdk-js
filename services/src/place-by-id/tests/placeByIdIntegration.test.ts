import { TomTomConfig } from "@anw/maps-sdk-js/core";

import type { PlaceByIdResponseAPI } from "..";
import { placeById } from "..";
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
        const entityId = "8dDUmb0BqTQcdNzkYuAoFA";
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

    // TODO: opening hours not yet available in Orbis. Once POI TimeZones are available they should become supported again. ETA end of Q2 2024.
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip("placeById for EV charging station with opening hours", async () => {
        const place = await placeById({
            entityId: "40z9pjn_fZGYFuLAeEeXvQ",
            openingHours: "nextSevenDays"
        });

        expect(place).toBeDefined();
        expect(place).toEqual(expectPlaceTestFeature(evStationWithOpeningHoursTestProps));
    });

    test("placeById with API request and response callbacks", async () => {
        const entityId = "8dDUmb0BqTQcdNzkYuAoFA";
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: PlaceByIdResponseAPI) => void;
        const place = await placeById({ entityId, onAPIRequest, onAPIResponse });
        expect(place).toBeDefined();
        expect(onAPIResponse).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    test("placeById with API request and error response callbacks", async () => {
        const entityId = "8dDUmb0BqTQcdNzkYuAoFA";
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: PlaceByIdResponseAPI) => void;
        await expect(() =>
            placeById({ entityId, view: "INCORRECT" as never, validateRequest: false, onAPIRequest, onAPIResponse })
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 400 }));
    });
});
