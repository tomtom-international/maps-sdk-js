import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const location = await geocodeOne('Amsterdam Centraal, NL');

    const map = new TomTomMap({
        container: 'sdk-map',
        center: location.geometry.coordinates as LngLatLike,
        zoom: 17,
    });

    const placesModule = await PlacesModule.get(map);
    await placesModule.show(location);
})();
