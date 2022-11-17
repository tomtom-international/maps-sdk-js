import { GOSDKConfig, SearchPlaceProps } from "@anw/go-sdk-js/core";

export const putIntegrationTestsAPIKey = () => {
    GOSDKConfig.instance.put({
        apiKey: process.env.API_KEY_TESTS
    });
};

export const baseSearchPlaceTestProps: SearchPlaceProps = {
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
