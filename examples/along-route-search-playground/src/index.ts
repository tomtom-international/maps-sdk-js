import { BBox, bboxFromGeoJSON, TomTomConfig, type Waypoint } from '@tomtom-org/maps-sdk/core';
import { calculateFittingBBox, PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, createLatestRequest, discoverPlaces, geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { SearchPanelParams, setupPanel } from './panel';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const waypoints: Waypoint[] = await Promise.all(['Half Moon Bay', 'Santa Cruz'].map(geocodeOne));
    const waypointsBBox = bboxFromGeoJSON(waypoints) as BBox;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: waypointsBBox,
        },
    });

    // Null when the panel leaves too little of the map to fit the route in.
    const fittingBBox = calculateFittingBBox({
        map,
        toBeContainedBBox: waypointsBBox,
        surroundingElements: ['.ui-customPanel'],
        paddingPX: 40,
    });
    if (fittingBBox) map.mapLibreMap.fitBounds(fittingBBox);

    const routingModule = await RoutingModule.create(map);
    await routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({ locations: waypoints });
    await routingModule.showRoutes(routes);

    const placesModule = await PlacesModule.create(map);
    // Clear retires the search in flight, so it cannot repopulate the map
    const latestSearch = createLatestRequest();

    setupPanel(
        async (params: SearchPanelParams) => {
            if (!params.query && !params.filters?.poiCategories) return;

            const search = latestSearch.run((signal) =>
                discoverPlaces({ ...params, route: routes.features[0], limit: 20, signal }),
            );
            await placesModule.clear();
            const results = await search;
            if (results.current) await placesModule.show(results.value);
        },
        () => {
            latestSearch.cancel();
            placesModule.clear();
        },
    );

    initTogglePanel();
})();
