import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, search } from '@tomtom-org/maps-sdk/services';
import { bboxPolygon, difference } from '@turf/turf';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const placeToSearchInside = await geocode({ query: 'Amsterdam, NL', limit: 1 });
    const fitBoundsOptions = { padding: 50 };

    const map = new TomTomMap({
        container: 'sdk-map',
        fitBoundsOptions,
        bounds: placeToSearchInside.bbox,
    });

    document
        .querySelector('#sdk-example-reCenter')
        ?.addEventListener('click', () => map.mapLibreMap.fitBounds(placeToSearchInside.bbox, fitBoundsOptions));

    const geometryToSearch = await geometryData({ geometries: placeToSearchInside });
    // inverting for better look on the map
    const invertedGeometry = difference({
        type: 'FeatureCollection',
        features: [bboxPolygon([-180, 90, 180, -90]), geometryToSearch?.features?.[0]],
    });
    const geometriesModule = await GeometriesModule.get(map);
    geometriesModule.show(
        invertedGeometry ? { type: 'FeatureCollection', features: [invertedGeometry] } : geometryToSearch,
    );
    const placesInsideGeometry = await search({
        query: 'metro stop',
        geometries: [geometryToSearch],
        limit: 100,
    });

    const placesModule = await PlacesModule.get(map);
    placesModule.show(placesInsideGeometry);
})();
