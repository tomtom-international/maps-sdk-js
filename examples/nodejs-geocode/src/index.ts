import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocode } from '@tomtom-org/maps-sdk/services';

TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const result = await geocode({ query: 'Rue Pepin', limit: 3 });
    console.log(JSON.stringify(result, null, 4));
})();
