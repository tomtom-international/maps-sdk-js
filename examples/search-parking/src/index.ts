import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, search } from '@tomtom-org/maps-sdk/services';
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
const geometry = await GeometriesModule.get(map);
geometry.show(areaGeometry);

const parkingSpots = await search({
    query: '',
    poiCategories: ['OPEN_PARKING_AREA', 'PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA', 'RENT_A_CAR_PARKING'],
    geometries: [areaGeometry],
    limit: 100,
});

const places = await PlacesModule.get(map);
places.show(parkingSpots);
(window as any).map = map;
