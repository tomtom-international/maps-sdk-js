import { type BBox, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, search } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const placeToSearchInside = await geocodeOne('Amsterdam, NL');
    const fitBoundsOptions = { padding: 50 };
    const bounds = placeToSearchInside.bbox as BBox;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            fitBoundsOptions,
            bounds,
        },
    });

    document
        .querySelector('#sdk-example-reCenter')
        ?.addEventListener('click', () => map.mapLibreMap.fitBounds(bounds, fitBoundsOptions));

    const geometryToSearch = await geometryData({ geometries: [placeToSearchInside] });

    const geometriesModule = await GeometriesModule.get(map, { theme: 'inverted' });
    geometriesModule.show(geometryToSearch);
    const placesInsideGeometry = await search({
        query: 'metro stop',
        geometries: [geometryToSearch],
        limit: 100,
    });

    const placesModule = await PlacesModule.get(map);
    placesModule.show(placesInsideGeometry);
})();
