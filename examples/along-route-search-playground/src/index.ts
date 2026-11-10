import { BBox, bboxFromGeoJSON, type Route, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { createDrivePainter, demoRoute, demoRoutes, fitInView, planDrive } from './drives';
import { mergePlaces } from './mergePlaces';
import { type SearchPanelParams, setupPanel } from './panel';
import { routeStretch } from './routeStretch';
import { initTogglePanel } from './togglePanel';

const RESULT_LIMIT = 20;

const searchAlong = async (
    placesModule: PlacesModule,
    latestSearch: ReturnType<typeof createLatestRequest>,
    route: Route,
    params: SearchPanelParams,
): Promise<string | undefined> => {
    if (!params.query && !params.filters?.poiCategories) return 'Add a query or a category.';

    const { polylines } = routeStretch(route, params.stretch);
    const search = latestSearch.run(async (signal) => {
        const pages = await Promise.all(
            polylines.map((polyline) =>
                discoverPlaces({
                    query: params.query,
                    filters: params.filters,
                    maxDetourTimeSeconds: params.maxDetourTimeSeconds,
                    route: polyline,
                    limit: RESULT_LIMIT,
                    signal,
                }),
            ),
        );
        return mergePlaces(pages, RESULT_LIMIT);
    });
    await placesModule.clear();
    const results = await search;
    if (!results.current) return undefined;
    if (results.value.features.length === 0) {
        await placesModule.clear();
        return 'No places on that stretch.';
    }
    await placesModule.show(results.value);
    return undefined;
};

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const firstDrive = await planDrive(demoRoutes[0].queries, new AbortController().signal);
    const waypointsBBox = bboxFromGeoJSON(firstDrive.waypoints) as BBox;
    const map = new TomTomMap({ mapLibre: { container: 'sdk-map', bounds: waypointsBBox } });
    fitInView(map, firstDrive.waypoints);

    const routingModule = await RoutingModule.create(map);
    const placesModule = await PlacesModule.create(map);
    // A new search or drive retires the one in flight, so a late answer cannot repaint the map.
    const latestSearch = createLatestRequest();
    const latestDrive = createLatestRequest();
    let route = firstDrive.route;
    const paintDrive = createDrivePainter(routingModule, map, (shown) => {
        route = shown;
    });
    await paintDrive(firstDrive);

    setupPanel(route, {
        onSearch: (params) => searchAlong(placesModule, latestSearch, route, params),
        onClear: () => {
            latestSearch.cancel();
            placesModule.clear();
        },
        onRoute: async (routeId) => {
            latestSearch.cancel();
            await placesModule.clear();
            const planned = await latestDrive.run((signal) => planDrive(demoRoute(routeId).queries, signal));
            if (!planned.current) return undefined;
            await paintDrive(planned.value);
            return route;
        },
    });

    initTogglePanel();
})();
