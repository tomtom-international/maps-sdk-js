import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, search } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const areaToSearch = await geocode({ query: 'paris', limit: 1 });

    const map = new TomTomMap({
        container: 'sdk-map',
        fitBoundsOptions: { padding: 50 },
        bounds: bboxFromGeoJSON(areaToSearch),
    });

    const areaGeometry = await geometryData({ geometries: areaToSearch });
    const geometryModule = await GeometriesModule.get(map);
    geometryModule.show(areaGeometry);

    const parkingSpots = await search({
        query: '',
        poiCategories: ['OPEN_PARKING_AREA', 'PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA', 'RENT_A_CAR_PARKING'],
        geometries: [areaGeometry],
        limit: 100,
    });

    const placesModule = await PlacesModule.get(map);
    placesModule.show(parkingSpots);
})();
