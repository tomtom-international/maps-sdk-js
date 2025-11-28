import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, search } from '@tomtom-org/maps-sdk/services';
import { bboxPolygon, difference } from '@turf/turf';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const fitBoundsOptions = { padding: 50 };

    const map = new TomTomMap({ container: 'sdk-map', zoom: 2 }, { language: 'en-GB' });
    const placesModule = await PlacesModule.get(map);
    const geometryModule = await GeometriesModule.get(map);

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
        const searchTextBox = document.querySelector('#sdk-example-searchTextBox') as HTMLInputElement;
        const inTextBox = document.querySelector('#sdk-example-inTextBox') as HTMLInputElement;
        const searchButton = document.querySelector('#sdk-example-searchButton') as HTMLButtonElement;

        searchButton.addEventListener('click', () => searchPlacesInGeometry(searchTextBox.value, inTextBox.value));
        searchTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());
        inTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());

        document
            .querySelector('#sdk-example-reCenter')
            ?.addEventListener('click', () => map.mapLibreMap.fitBounds(placeToSearchBBox, fitBoundsOptions));
    };

    listenToUserEvents();
})();
