import { GOSDKConfig, Place, SearchPlaceProps } from "@anw/go-sdk-js/core";

import { placeById, PlaceByIdResponse } from "..";

describe("Place By Id API", () => {
    beforeAll(() => {
        GOSDKConfig.instance.put({ apiKey: process.env.API_KEY });
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
                        properties: expect.objectContaining<SearchPlaceProps>({
                            type: "POI",
                            address: expect.any(Object),
                            entryPoints: expect.arrayContaining([expect.any(Object)]),
                            poi: expect.objectContaining({
                                name: expect.any(String),
                                classifications: expect.any(Array),
                                brands: expect.any(Array),
                                categoryIds: expect.arrayContaining([expect.any(Number)])
                            })
                        })
                    })
                ])
            })
        );
    });
});
