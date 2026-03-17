import { BBox, bboxFromGeoJSON, TomTomConfig, type Waypoint } from '@tomtom-org/maps-sdk/core';
import { calculateFittingBBox, PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne, search } from '@tomtom-org/maps-sdk/services';
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

    map.mapLibreMap.fitBounds(
        calculateFittingBBox({
            map,
            toBeContainedBBox: waypointsBBox,
            surroundingElements: ['.sdk-example-customPanel'],
            paddingPX: 40,
        }) as BBox,
    );

    const routingModule = await RoutingModule.get(map);
    await routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({ locations: waypoints });
    await routingModule.showRoutes(routes);

    const placesModule = await PlacesModule.get(map);

    setupPanel(
        async (params: SearchPanelParams) => {
            if (!params.query && !params.poiCategories) return;
            await placesModule.clear();
            const results = await search({
                ...params,
                route: routes.features[0],
                limit: 20,
            });
            await placesModule.show(results);
        },
        () => placesModule.clear(),
    );

    initTogglePanel();
})();
