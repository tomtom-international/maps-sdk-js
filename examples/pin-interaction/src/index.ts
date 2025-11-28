import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import type { LngLatLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const position = [4.8907, 52.37311];
    const map = new TomTomMap({
        container: 'sdk-map',
        center: position as LngLatLike,
        zoom: 17,
    });

    const places = await PlacesModule.get(map);
    places.events.on('click', () => alert('pin clicked'));

    places.show(await reverseGeocode({ position }));
})();
