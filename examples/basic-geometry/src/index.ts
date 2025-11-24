import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
import './style.css';
import type { LngLatLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const location = await geocodeOne('Schiphol Airport, NL');
    const map = new TomTomMap(
        {
            container: 'maps-sdk-js-examples-map-container',
            zoom: 11,
            center: location.geometry.coordinates as LngLatLike,
        },
        { language: 'en-GB' },
    );
    const geometryModule = await GeometriesModule.get(map);

        const geometryToSearch = await geometryData({ geometries: location });
        geometryModule.show(geometryToSearch);
})();
