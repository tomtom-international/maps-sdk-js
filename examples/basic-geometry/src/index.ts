import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode, geometryData } from '@cet/maps-sdk-js/services';
import { type LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

// we initialize the map directly in the first search content:
const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', zoom: 2 }, { language: 'en-GB' });
const placesModule = await PlacesModule.init(map);
const geometryModule = await GeometriesModule.init(map);

const location = await geocode({ query: 'Schiphol Airport, Netherlands', limit: 1 });
placesModule.show(location);

// (bounding box is also available directly in location.bbox)
const placeToSearchBBox = bboxFromGeoJSON(location) as LngLatBoundsLike;
map.mapLibreMap.fitBounds(placeToSearchBBox, { padding: 50 });

const geometryToSearch = await geometryData({ geometries: location });
geometryModule.show(geometryToSearch);

(window as any).map = map; // This has been done for automation test support
