import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { ViewportPlaces } from '@tomtom-org/maps-sdk-plugin-viewport-places';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [4.9041, 52.3676], zoom: 14 },
    });

    const placesLayers = new ViewportPlaces(map);
    await placesLayers.addPOICategories({
        minZoom: 12,
        categories: ['PARKING_GARAGE', 'OPEN_PARKING_AREA', 'ELECTRIC_VEHICLE_STATION'],
    });
    // These categories will show up on top of (higher priority) the previous ones:
    await placesLayers.addPOICategories({
        minZoom: 10,
        categories: ['SUPERMARKETS_HYPERMARKETS'],
    });
    await placesLayers.add({
        minZoom: 8,
        searchOptions: { query: 'Lidl', poiCategories: ['SUPERMARKETS_HYPERMARKETS'], limit: 20 },
        placesModuleConfig: { theme: 'pin' },
    });
})();
