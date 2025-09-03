import { bboxFromGeoJSON, PolygonFeatures, TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode, geometryData, search } from '@cet/maps-sdk-js/services';
import bboxPolygon from '@turf/bbox-polygon';
import difference from '@turf/difference';
import { LngLatBoundsLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

// inverts the polygon, so it looks like a hole on the map instead
const invert = (geometry: PolygonFeatures): PolygonFeatures => {
    const invertedArea = difference({
        type: 'FeatureCollection',
        features: [bboxPolygon([-180, 90, 180, -90]), geometry?.features?.[0]],
    });
    return invertedArea ? ({ type: 'FeatureCollection', features: [invertedArea] } as PolygonFeatures) : geometry;
};

const initMapSearchWithPOICategories = async () => {
    const areaToSearch = await geocode({ query: 'paris', limit: 1 });

    const map = new TomTomMap({
        container: 'map',
        fitBoundsOptions: { padding: 50 },
        bounds: bboxFromGeoJSON(areaToSearch) as LngLatBoundsLike,
    });

    const areaGeometry = await geometryData({ geometries: areaToSearch });
    const geometry = await GeometriesModule.init(map);
    geometry.show(invert(areaGeometry));

    const restaurants = await search({
        query: '',
        poiCategories: ['ELECTRIC_VEHICLE_STATION', 'ITALIAN_RESTAURANT', 'SUSHI_RESTAURANT'],
        geometries: [areaGeometry],
        limit: 100,
    });

    const places = await PlacesModule.init(map);
    places.show(restaurants);
    (window as any).map = map; // This has been done for automation test support
};

window.addEventListener('load', initMapSearchWithPOICategories);
