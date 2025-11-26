import type { Waypoint } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { defaultRoutingLayers, RoutingModule, SELECTED_ROUTE_FILTER, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints: Waypoint[] = await Promise.all([geocodeOne('Tarragona'), geocodeOne('Barcelona')]);

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
    fitBoundsOptions: { padding: 100 },
});

const routingModule = await RoutingModule.get(map, {
    theme: { mainColor: '#DF1B12' },
    layers: {
        mainLines: {
            routeOutline: {
                paint: {
                    'line-color': '#555555',
                    'line-width': ['interpolate', ['linear'], ['zoom'], 1, 6, 5, 8, 10, 12, 18, 20],
                },
            },
            // this is a new custom layer we are adding:
            additional: {
                customRouteMiddleLine: {
                    type: 'line',
                    filter: SELECTED_ROUTE_FILTER,
                    paint: { 'line-color': 'lightgrey', 'line-dasharray': [3, 2] },
                },
            },
        },
        sections: {
            tollRoad: {
                // hiding toll road icons:
                routeTollRoadSymbol: { layout: { visibility: 'none' } },
                routeTollRoadOutline: {
                    layout: { 'line-cap': 'butt' },
                    paint: {
                        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 10, 5, 18, 10, 20, 18, 40],
                        'line-color': '#29A2FFFF',
                        'line-opacity': 1,
                        'line-dasharray': [1, 0.2],
                    },
                },
            },
            tunnel: {
                routeTunnelLine: {
                    paint: {
                        // Reuse default tunnel props like width:
                        ...defaultRoutingLayers.sections.tunnel?.routeTunnelLine?.paint,
                        'line-opacity': 1,
                    },
                },
            },
        },
    },
});
routingModule.showWaypoints(waypoints);
routingModule.showRoutes(await calculateRoute({ locations: waypoints, maxAlternatives: 1 }));
