import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const location = await geocodeOne('Canary Islands');

    new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            fitBoundsOptions: { padding: 50 },
            bounds: location.bbox,
        },
        style: 'satellite',
    });
})();
