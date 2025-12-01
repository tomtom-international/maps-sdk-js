import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const response = await reverseGeocode({ position: [5.72884, 52.33499] });
    console.log(response);
})();
