import { TomTomConfig } from '@tomtom-org/maps-sdk-js/core';
import { reverseGeocode } from '@tomtom-org/maps-sdk-js/services';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const revGeoResponse = await reverseGeocode({ position: [5.72884, 52.33499] });
const htmlElement = document.getElementById('maps-sdk-js-examples-rev-geo-json-output') as HTMLElement;
htmlElement.innerHTML = `<pre>${JSON.stringify(revGeoResponse, null, 4)}</pre>`;
