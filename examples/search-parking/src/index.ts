import { bboxFromGeoJSON, PolygonFeatures, TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode, geometryData, search } from '@cet/maps-sdk-js/services';
import bboxPolygon from '@turf/bbox-polygon';
import difference from '@turf/difference';
import { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

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

const areaToSearch = await geocode({ query: 'paris', limit: 1 });

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    fitBoundsOptions: { padding: 50 },
    bounds: bboxFromGeoJSON(areaToSearch) as LngLatBoundsLike,
});

const areaGeometry = await geometryData({ geometries: areaToSearch });
const geometry = await GeometriesModule.init(map);
geometry.show(invert(areaGeometry));

const parkingSpots = await search({
    query: '',
    poiCategories: ['OPEN_PARKING_AREA', 'PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA', 'RENT_A_CAR_PARKING'],
    geometries: [areaGeometry],
    limit: 100,
});

const places = await PlacesModule.init(map);
console.log('0000-p;aces.,', places);
places.show(parkingSpots);
(window as any).map = map;
