import { TomTomConfig, placeTypes, SearchPlaceProps } from "@anw/maps-sdk-js/core";

export const putIntegrationTestsAPIKey = () => {
    TomTomConfig.instance.put({
        apiKey: process.env.API_KEY_TESTS
    });
};

export const baseSearchPOITestProps: SearchPlaceProps = {
    type: "POI",
    score: expect.any(Number),
    info: expect.any(String),
    address: expect.any(Object),
    entryPoints: expect.arrayContaining([expect.any(Object)]),
    poi: expect.objectContaining({
        name: expect.any(String),
        classifications: expect.any(Array),
        brands: expect.any(Array),
        categoryIds: expect.arrayContaining([expect.any(Number)])
    })
};

const placeRegex = new RegExp(placeTypes.join("|"));
export const baseSearchPlaceMandatoryProps: SearchPlaceProps = {
    type: expect.stringMatching(placeRegex),
    address: expect.any(Object)
};
