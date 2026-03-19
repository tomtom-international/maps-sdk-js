import type { Waypoint } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, SELECTED_ROUTE_FILTER, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import type { RoutePlaygroundState } from './controls';
import { initControls } from './controls';
import './style.css';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const waypoints: Waypoint[] = await Promise.all([geocodeOne('London'), geocodeOne('Paris')]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(waypoints),
            fitBoundsOptions: { padding: 100 },
        },
    });

    const state: RoutePlaygroundState = {
        mainColor: undefined,
        outlineColor: undefined,
        routeWidth: 'm',
        waypointSize: 'm',
        centerDash: false,
        routeOpacity: 1,
    };

    const buildConfig = () => ({
        theme: { mainColor: state.mainColor, routeWidth: state.routeWidth, waypointSize: state.waypointSize },
        layers: {
            mainLines: {
                routeLine: {
                    paint: { 'line-opacity': state.routeOpacity },
                },
                routeOutline: {
                    paint: {
                        ...(state.outlineColor && { 'line-color': state.outlineColor }),
                        'line-opacity': state.routeOpacity,
                    },
                },
                ...(state.centerDash && {
                    additional: {
                        routeCenterDash: {
                            type: 'line' as const,
                            filter: SELECTED_ROUTE_FILTER,
                            paint: {
                                'line-color': 'white',
                                'line-dasharray': [3, 2],
                                'line-opacity': state.routeOpacity,
                            },
                            beforeID: 'routeIncidentBackgroundLine',
                        },
                    },
                }),
            },
            sections: {
                tollRoad: {
                    routeTollRoadOutline: {
                        paint: { 'line-opacity': state.routeOpacity },
                    },
                },
                tunnel: {
                    routeTunnelLine: {
                        paint: { 'line-opacity': 0.3 * state.routeOpacity },
                    },
                },
            },
        },
    });

    const routingModule = await RoutingModule.get(map, buildConfig());
    routingModule.showWaypoints(waypoints);
    routingModule.showRoutes(await calculateRoute({ locations: waypoints }));

    const apply = () => routingModule.applyConfig(buildConfig());

    initControls(state, apply);
})();
