import type { Waypoint } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { defaultRoutingLayers, RoutingModule, SELECTED_ROUTE_FILTER, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import type { RoutePlaygroundState } from './controls';
import { initControls } from './controls';
import './style.css';

TomTomConfig.instance.put({ apiKey: API_KEY });

// The tunnel's own opacity, which the opacity slider fades along with the route.
const tunnelOpacity = defaultRoutingLayers.sections.tunnel?.routeTunnelLine?.paint?.['line-opacity'];
const TUNNEL_OPACITY = typeof tunnelOpacity === 'number' ? tunnelOpacity : 1;

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
        visible: true,
        color: undefined,
        waypointLabelColor: undefined,
        width: 'm',
        widthFactor: 1,
        waypointSize: 'm',
        waypointSizeFactor: 1,
        centerDash: false,
        routeOpacity: 1,
        highlight: { outline: {}, section: { outline: {} } },
    };

    const buildConfig = () => ({
        visible: state.visible,
        color: state.color,
        widthPreset: state.width,
        widthFactor: state.widthFactor,
        opacity: state.routeOpacity,
        // Sections keep their own opacity, faded here with the route.
        sections: {
            tollRoad: { opacity: state.routeOpacity },
            tunnel: { opacity: TUNNEL_OPACITY * state.routeOpacity },
        },
        waypoints: {
            sizePreset: state.waypointSize,
            sizeFactor: state.waypointSizeFactor,
            label: { color: state.waypointLabelColor },
        },
        highlight: {
            outline: { ...state.highlight.outline },
            section: { outline: { ...state.highlight.section.outline } },
        },
        ...(state.centerDash && {
            layers: {
                mainLines: {
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
                },
            },
        }),
    });

    const routingModule = await RoutingModule.create(map, buildConfig());
    routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({ locations: waypoints });
    routingModule.showRoutes(routes);
    const tollRoadIDs = (routes.features[0]?.properties.sections.tollRoad ?? []).map((section) => section.id);

    const apply = () => routingModule.applyConfig(buildConfig());

    // A click state lasts through applyConfig, so the clicked route repaints in place as the factor moves
    initControls(
        state,
        apply,
        (visible) => routingModule.setVisible(visible),
        (clicked) =>
            clicked ? routingModule.setEventState({ index: 0, state: 'click' }) : routingModule.clearEventStates(),
        (ringed) => routingModule.setSectionFocus(ringed ? tollRoadIDs : null),
    );
})();
