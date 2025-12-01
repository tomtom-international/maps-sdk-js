import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';

TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const response = await reverseGeocode({ position: [5.72884, 52.33499] });
    console.log(response);
})();
