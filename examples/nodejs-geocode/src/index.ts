import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocode } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const result = await geocode({ query: 'Rue Pepin', limit: 3 });
    console.log(JSON.stringify(result, null, 4));
})();
