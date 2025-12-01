import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const revGeoResponse = await reverseGeocode({ position: [5.72884, 52.33499] });
    const htmlElement = document.getElementById('sdk-example-rev-geo-json-output') as HTMLElement;
    htmlElement.innerHTML = `<pre>${JSON.stringify(revGeoResponse, null, 4)}</pre>`;
})();
