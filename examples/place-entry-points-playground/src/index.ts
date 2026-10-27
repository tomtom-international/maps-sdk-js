import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, calculatePaddedBBox, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces, reverseGeocode } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { initPanel, readEntryPointsConfig, showEntryPoint, showPlace, showZoom } from './panel';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const CLICKED_ADDRESS_ID = 'clicked-address';

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8872, 52.3637],
            zoom: 16,
        },
        style: 'monoLight',
    });

    const places = await PlacesModule.create(map, { entryPoints: readEntryPointsConfig() });

    let searchedPlaces: Place[] = [];
    let clickedAddress: Place | undefined;
    let clickedPlaceID: string | undefined;
    const showPlaces = async () => {
        await places.show(clickedAddress ? [...searchedPlaces, clickedAddress] : searchedPlaces);
        // `show` starts every place without an event state, so the clicked one is clicked again.
        if (clickedPlaceID) places.setEventState({ id: clickedPlaceID, state: 'click' });
    };

    // A newer map move or click retires the request still running for an earlier one.
    const latestSearch = createLatestRequest();
    const latestAddress = createLatestRequest();
    const searchView = async () => {
        // Null when the panel leaves too little of the map to search in.
        const boundingBox = calculatePaddedBBox({ map, surroundingElements: ['.ui-customPanel'] });
        if (!boundingBox) return;

        const results = await latestSearch.run((signal) =>
            discoverPlaces({
                filters: { poiCategories: ['MUSEUM', 'THEATER', 'HOTEL_OR_MOTEL', 'DEPARTMENT_STORE', 'MALL'] },
                geoBias: { boundingBox },
                limit: 50,
                signal,
            }),
        );
        if (!results.current) return;

        searchedPlaces = results.value.features;
        await showPlaces();
    };

    // Registering a handler is also what gives the pins their hover and click states.
    places.events.places.on('click', (place) => {
        clickedPlaceID = place.properties.id;
        showPlace(place);
    });
    places.events.entryPoints.on('click', (entryPoint) => {
        clickedPlaceID = entryPoint.properties.placeID;
        showEntryPoint(entryPoint);
    });

    const baseMap = await BaseMapModule.get(map);
    baseMap.events.on('click', async (_feature, lngLat) => {
        const lookup = await latestAddress.run((signal) => reverseGeocode({ position: lngLat.toArray(), signal }));
        if (!lookup.current) return;

        const address = lookup.value;
        if (!address.properties) return;
        // The result geometry is the clicked point; `originalPosition` is the address it matched.
        clickedAddress = {
            ...address,
            id: CLICKED_ADDRESS_ID,
            geometry: { ...address.geometry, coordinates: address.properties.originalPosition },
        };
        clickedPlaceID = CLICKED_ADDRESS_ID;
        await showPlaces();
    });

    initTogglePanel();
    initPanel((config) => {
        places.updateConfig({ entryPoints: config });
        showZoom(map.mapLibreMap.getZoom());
    });

    map.mapLibreMap.on('zoom', () => showZoom(map.mapLibreMap.getZoom()));
    map.mapLibreMap.on('moveend', searchView);
    showZoom(map.mapLibreMap.getZoom());
    await searchView();
})();
