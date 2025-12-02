import { bboxFromGeoJSON, PolygonFeatures, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, search } from '@tomtom-org/maps-sdk/services';
import bboxPolygon from '@turf/bbox-polygon';
import difference from '@turf/difference';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    // inverts the polygon, so it looks like a hole on the map instead
    const invert = (geometry: PolygonFeatures): PolygonFeatures => {
        const invertedArea = difference({
            type: 'FeatureCollection',
            features: [bboxPolygon([-180, 90, 180, -90]), geometry?.features?.[0]],
        });
        return invertedArea ? ({ type: 'FeatureCollection', features: [invertedArea] } as PolygonFeatures) : geometry;
    };

    const areaToSearch = await geocode({ query: 'paris', limit: 1 });

    const map = new TomTomMap({
        container: 'sdk-map',
        fitBoundsOptions: { padding: 50 },
        bounds: bboxFromGeoJSON(areaToSearch),
    });

    const areaGeometry = await geometryData({ geometries: areaToSearch });
    const geometry = await GeometriesModule.get(map);
    geometry.show(invert(areaGeometry));

    const restaurants = await search({
        query: '',
        poiCategories: ['ELECTRIC_VEHICLE_STATION', 'ITALIAN_RESTAURANT', 'SUSHI_RESTAURANT'],
        geometries: [areaGeometry],
        limit: 100,
    });

    const places = await PlacesModule.get(map);
    places.show(restaurants);
    (window as any).map = map;
})();
