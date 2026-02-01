import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, search } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const location = await geocodeOne('London Covent Garden');

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: location.bbox,
        },
    });

    const parkingSpots = await search({
        query: '',
        poiCategories: ['PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA', 'ELECTRIC_VEHICLE_STATION'],
        position: location,
        limit: 50,
    });

    const placesModule = await PlacesModule.get(map);
    placesModule.show(parkingSpots);
})();
