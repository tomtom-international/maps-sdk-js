import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode, geometryData, search } from '@cet/maps-sdk-js/services';
import { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const areaToSearch = await geocode({ query: 'paris', limit: 1 });

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    fitBoundsOptions: { padding: 50 },
    bounds: bboxFromGeoJSON(areaToSearch) as LngLatBoundsLike,
});

const areaGeometry = await geometryData({ geometries: areaToSearch });
const geometry = await GeometriesModule.init(map);
geometry.show(areaGeometry);

const parkingSpots = await search({
    query: '',
    poiCategories: ['OPEN_PARKING_AREA', 'PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA', 'RENT_A_CAR_PARKING'],
    geometries: [areaGeometry],
    limit: 100,
});

const places = await PlacesModule.init(map);
places.show(parkingSpots);
(window as any).map = map;
