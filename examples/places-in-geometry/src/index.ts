import { type BBox, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { discoverPlaces, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
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
        .querySelector('#ui-reCenter')
        ?.addEventListener('click', () => map.mapLibreMap.fitBounds(bounds, fitBoundsOptions));

    const geometryToSearch = await geometryData({ geometries: [placeToSearchInside] });

    const geometriesModule = await GeometriesModule.create(map, { fill: { style: 'inverted' } });
    geometriesModule.show(geometryToSearch);
    const placesInsideGeometry = await discoverPlaces({
        query: 'metro stop',
        geometries: [geometryToSearch],
        limit: 100,
    });

    const placesModule = await PlacesModule.create(map);
    placesModule.show(placesInsideGeometry);
})();
