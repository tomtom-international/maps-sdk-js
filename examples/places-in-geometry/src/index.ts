import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode, geometryData, search } from '@cet/maps-sdk-js/services';
import { bboxPolygon, difference } from '@turf/turf';
import { LngLatBoundsLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const placeToSearchInside = await geocode({ query: 'Amsterdam, NL', limit: 1 });
    // (bounding box is also available directly in placeToSearchInside.bbox)
    const placeToSearchBBox = bboxFromGeoJSON(placeToSearchInside) as LngLatBoundsLike;
    const fitBoundsOptions = { padding: 50 };

    const map = new TomTomMap({
        container: 'maps-sdk-js-examples-map-container',
        fitBoundsOptions,
        bounds: placeToSearchBBox,
    });

    document
        .querySelector('#maps-sdk-js-examples-reCenter')
        ?.addEventListener('click', () => map.mapLibreMap.fitBounds(placeToSearchBBox, fitBoundsOptions));

    const geometryToSearch = await geometryData({ geometries: placeToSearchInside });
    // inverting for better look on the map
    const invertedGeometry = difference({
        type: 'FeatureCollection',
        features: [bboxPolygon([-180, 90, 180, -90]), geometryToSearch?.features?.[0]],
    });
    const geometriesModule = await GeometriesModule.init(map);
    geometriesModule.show(
        invertedGeometry ? { type: 'FeatureCollection', features: [invertedGeometry] } : geometryToSearch,
    );
    const placesInsideGeometry = await search({
        query: 'metro stop',
        geometries: [geometryToSearch],
        limit: 100,
    });

    const placesModule = await PlacesModule.init(map);
    placesModule.show(placesInsideGeometry);
    (window as any).map = map; // This has been done for automation test support
})();
