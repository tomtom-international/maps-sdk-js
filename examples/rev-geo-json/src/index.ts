import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { customizeService, reverseGeocode } from '@cet/maps-sdk-js/services';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const reverseGeocodeRequest = customizeService.reverseGeocode.buildRevGeoRequest({
        commonBaseURL: 'https://tomtom.com/aaa/',
        position: [0, 90],
        apiKey: 'abcdef',
    });
    console.log('reverseGeocodeRequest', reverseGeocodeRequest.toString());
    const revGeoResponse = await reverseGeocode({ position: [5.72884, 52.33499] });
    document.body.innerHTML = `<pre>${JSON.stringify(revGeoResponse, null, 4)}</pre>`;
})();
