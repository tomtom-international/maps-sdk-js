'use strict';
require('dotenv').config({ path: '../.env' });

const { TomTomConfig } = require('@tomtom-org/maps-sdk/core');
const { geocode } = require('@tomtom-org/maps-sdk/services');
const customizeService = require('@tomtom-org/maps-sdk/services').customizeService;
const parseGeocodingResponse = customizeService.geocode.parseGeocodingResponse;
const buildGeocodingRequest = customizeService.geocode.buildGeocodingRequest;

console.log(
    '====== using customize object ====',
    buildGeocodingRequest({
        commonBaseURL: 'https://tomtom.com/',
        position: [0, 90],
        query: 'amsterdam',
        apiKey: 'abcdef',
    }).toString(),
);
TomTomConfig.instance.put({
    apiKey: process.env.API_KEY_EXAMPLES,
});
geocode(
    { query: 'Reckhammerweg Essen' },
    {
        parseResponse: (apiResponse) => ({
            ...parseGeocodingResponse(apiResponse),
            features: [
                ...parseGeocodingResponse(apiResponse).features.map((feat) => ({
                    ...feat,
                    properties: {
                        ...feat.properties,
                        newAddedProp: 'Prop',
                    },
                })),
            ],
            customizedField: 'any text',
        }),
    },
).then((response) =>
    console.log('Example for 1 specific result with customized parser:\n', JSON.stringify(response, null, 4)),
);
