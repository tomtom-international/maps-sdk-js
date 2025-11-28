import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { customizeService, geocode } from '@tomtom-org/maps-sdk/services';

const { parseGeocodingResponse } = customizeService.geocode;

TomTomConfig.instance.put({
    apiKey: process.env.API_KEY_EXAMPLES ?? '',
});

(async () => {
    const response = await geocode(
        { query: 'Reckhammerweg Essen' },
        {
            parseResponse: (apiResponse: any) => ({
                ...parseGeocodingResponse(apiResponse),
                features: [
                    parseGeocodingResponse(apiResponse).features.map((feat: any) => ({
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
    );
    console.log('Example for 1 specific result with customized parser:\n', JSON.stringify(response, null, 4));
})();
