import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { Popup } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const position = [4.8907, 52.37311];
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: position as [number, number],
            zoom: 17,
        },
    });

    const places = await PlacesModule.create(map);
    // The SDK tells which place was clicked; the card shown for it is the app's own
    const popup = new Popup({ closeButton: false, offset: 35, className: 'ui-maplibre-popup' });
    places.events.places.on('click', (place) => {
        popup
            .setLngLat(place.geometry.coordinates as [number, number])
            .setText(place.properties.address.freeformAddress)
            .addTo(map.mapLibreMap);
    });

    places.show(await reverseGeocode({ position }));
})();
