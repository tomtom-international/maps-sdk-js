import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    new TomTomMap(
        {
            container: 'maps-sdk-js-examples-map-container',
            fitBoundsOptions: { padding: 50 },
            bounds: (await geocodeOne('Canary Islands')).bbox as LngLatBoundsLike,
        },
        { style: 'satellite' },
    );
})();
