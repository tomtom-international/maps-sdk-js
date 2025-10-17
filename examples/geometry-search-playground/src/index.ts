import type { PolygonFeatures } from '@cet/maps-sdk-js/core';
import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode, geometryData, search } from '@cet/maps-sdk-js/services';
import { bboxPolygon, difference } from '@turf/turf';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const fitBoundsOptions = { padding: 50 };

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', zoom: 2 }, { language: 'en-GB' });
const placesModule = await PlacesModule.init(map);
const geometryModule = await GeometriesModule.init(map);

let placeToSearchBBox: LngLatBoundsLike;

// inverts the polygon, so it looks like a hole on the map instead
const invert = (geometry: PolygonFeatures): PolygonFeatures => {
    const invertedArea = difference({
        type: 'FeatureCollection',
        features: [bboxPolygon([-180, 90, 180, -90]), geometry?.features?.[0]],
    });
    return invertedArea ? ({ type: 'FeatureCollection', features: [invertedArea] } as PolygonFeatures) : geometry;
};

const searchPlacesInGeometry = async (placesQuery: string, geometryQuery: string) => {
    const placeToSearchInside = await geocode({ query: geometryQuery, limit: 1 });
    // (bounding box is also available directly in placeToSearchInside.bbox)
    placeToSearchBBox = bboxFromGeoJSON(placeToSearchInside) as LngLatBoundsLike;

    const geometryToSearch = await geometryData({ geometries: placeToSearchInside });
    geometryModule.show(invert(geometryToSearch));

    // Searching within the obtained geometry:
    const places = await search({
        query: placesQuery,
        geometries: [geometryToSearch],
        limit: 100,
    });
    placesModule.show(places);
    map.mapLibreMap.fitBounds(placeToSearchBBox, fitBoundsOptions);
};

const listenToUserEvents = () => {
    const searchTextBox = document.querySelector('#maps-sdk-js-examples-searchTextBox') as HTMLInputElement;
    const inTextBox = document.querySelector('#maps-sdk-js-examples-inTextBox') as HTMLInputElement;
    const searchButton = document.querySelector('#maps-sdk-js-examples-searchButton') as HTMLButtonElement;

    searchButton.addEventListener('click', () => searchPlacesInGeometry(searchTextBox.value, inTextBox.value));
    searchTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());
    inTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());

    document
        .querySelector('#maps-sdk-js-examples-reCenter')
        ?.addEventListener('click', () => map.mapLibreMap.fitBounds(placeToSearchBBox, fitBoundsOptions));
};

listenToUserEvents();
