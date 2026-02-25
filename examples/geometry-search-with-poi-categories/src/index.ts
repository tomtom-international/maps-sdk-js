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
        mapLibre: {
            container: 'sdk-map',
            fitBoundsOptions: { padding: 50 },
            bounds: bboxFromGeoJSON(areaToSearch),
        },
    });

    const areaGeometry = await geometryData({ geometries: areaToSearch });
    const geometryModule = await GeometriesModule.get(map, { theme: 'inverted' });
    geometryModule.show(areaGeometry);

    const restaurants = await search({
        query: '',
        poiCategories: ['ELECTRIC_VEHICLE_STATION', 'ITALIAN_RESTAURANT', 'SUSHI_RESTAURANT'],
        geometries: [areaGeometry],
        limit: 100,
    });

    const placesModule = await PlacesModule.get(map);
    placesModule.show(restaurants);
    (window as any).map = map;
})();
