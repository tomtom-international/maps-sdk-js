import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocode } from '@tomtom-org/maps-sdk/services';

TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES ?? '' });

(async () => {
    const result1 = await geocode({ query: 'Reckhammerweg Essen' });
    console.log('Example for 1 specific result:\n', JSON.stringify(result1, null, 4));

    const result2 = await geocode({ query: 'Rue Pepin' });
    console.log('Example for multiple results returned:\n', JSON.stringify(result2, null, 4));

    const result3 = await geocode({ query: 'amsterdam' });
    console.log(JSON.stringify(result3, null, 4));
    console.log('Results count', result3.features?.length);

    const result4 = await geocode({ query: 'amsterdam', limit: 5 });
    console.log('Results count with limit specified', result4.features?.length);

    const result5 = await geocode({
        query: 'amsterdam',
        limit: 50,
        geographyTypes: ['Municipality'],
    });
    console.log('Results count with big limit specified and strict filter', result5.features?.length);

    const result6 = await geocode({
        query: 'amsterdam',
        limit: 50,
        geographyTypes: ['Municipality'],
        countrySet: ['NL'],
    });
    console.log('Results count with big limit specified and more strict filter', result6.features?.length);
})();
