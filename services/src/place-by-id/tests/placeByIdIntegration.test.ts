import { TomTomConfig, Place, SearchPlaceProps } from "@anw/maps-sdk-js/core";

import { placeById, PlaceByIdResponse, PlaceByIdResponseAPI } from "..";
import { baseSearchPOITestProps } from "../../shared/tests/integrationTestUtils";

describe("Place By Id API", () => {
    beforeAll(() => {
        TomTomConfig.instance.put({ apiKey: process.env.API_KEY });
    });

    test("placeById works", async () => {
        const entityId = "528009004250472";
        const language = "en-GB";
        const view = "Unified";
        const timeZone = "iana";
        const openingHours = "nextSevenDays";
        const res = await placeById({
            entityId,
            language,
            view,
            timeZone,
            openingHours
        });

        expect(res.features).toHaveLength(1);

        expect(res).toEqual(
            expect.objectContaining<PlaceByIdResponse>({
                type: "FeatureCollection",
                features: expect.arrayContaining<Place<SearchPlaceProps>>([
                    expect.objectContaining<Place<SearchPlaceProps>>({
                        type: "Feature",
                        geometry: expect.objectContaining({
                            coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
                            type: expect.any(String)
                        }),
                        id: expect.any(String),
                        properties: expect.objectContaining<SearchPlaceProps>(baseSearchPOITestProps)
                    })
                ])
            })
        );
    });

    test("PlaceById with API request and response callbacks", async () => {
        const entityId = "528009004250472";
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: PlaceByIdResponseAPI) => void;
        const result = await placeById({ entityId, onAPIRequest, onAPIResponse });
        expect(result).toBeDefined();
        expect(onAPIResponse).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });
});
