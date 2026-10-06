import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { discoverPlaces, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const areaToSearch = await geocodeOne('London Covent Garden');

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            fitBoundsOptions: { padding: 50 },
            bounds: areaToSearch.bbox,
        },
    });

    const areaGeometry = await geometryData({ geometries: [areaToSearch] });
    const geometryModule = await GeometriesModule.create(map, {
        line: { color: 'red' },
        fill: { opacity: 0 },
    });
    geometryModule.show(areaGeometry);

    const parkingSpots = await discoverPlaces({
        filters: { poiCategories: ['PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA', 'CHARGING_LOCATION'] },
        geometries: [areaGeometry],
        limit: 50,
    });

    const placesModule = await PlacesModule.create(map);
    placesModule.show(parkingSpots);
})();
