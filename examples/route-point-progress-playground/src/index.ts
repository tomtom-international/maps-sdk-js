import type { Route } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, getProgressAtNearestRoutePoint, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import { buildPopupHTML, createHoverPopup, createPinnedPopup } from './popup';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const locations = await Promise.all(['London', 'Paris'].map(geocodeOne));

    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', bounds: bboxFromGeoJSON(locations), fitBoundsOptions: { padding: 80 } },
    });

    const [routingModule, restOfTheMap] = await Promise.all([
        RoutingModule.get(map, { summaryBubbles: { visible: false } }),
        BaseMapModule.get(map, {
            layerGroupsFilter: { mode: 'include', names: ['land', 'water'] },
            events: { cursorOnHover: 'default' },
        }),
    ]);

    const routeResult = await calculateRoute({ locations });
    const route: Route = routeResult.features[0];

    routingModule.showWaypoints(locations);
    routingModule.showRoutes(routeResult);

    const hoverPopup = createHoverPopup();

    const departureTime = route.properties.summary.departureTime;

    const showHoverAt = (lngLat: [number, number]) => {
        const result = getProgressAtNearestRoutePoint(route, lngLat);
        if (!result) return;

        hoverPopup
            .setLngLat(result.position as [number, number])
            .setHTML(buildPopupHTML(result.distanceInMeters, result.travelTimeInSeconds, departureTime, false))
            .addTo(map.mapLibreMap);
    };

    const pinProgressAt = (lngLat: [number, number]) => {
        const result = getProgressAtNearestRoutePoint(route, lngLat);
        if (!result) return;

        const pinnedPopup = createPinnedPopup();

        pinnedPopup
            .setLngLat(result.position as [number, number])
            .setHTML(buildPopupHTML(result.distanceInMeters, result.travelTimeInSeconds, departureTime, true))
            .addTo(map.mapLibreMap);

        pinnedPopup
            .getElement()
            .querySelector('.progress-popup-close')
            ?.addEventListener('click', () => pinnedPopup.remove());
    };

    routingModule.events.user.mainLines.on('hover-move', (_, lngLat) => {
        showHoverAt(lngLat.toArray());
    });

    restOfTheMap.events.on('hover', () => {
        hoverPopup.remove();
    });

    restOfTheMap.events.on('click', () => {
        hoverPopup.remove();
    });

    routingModule.events.user.mainLines.on('click', (_, lngLat) => {
        pinProgressAt(lngLat.toArray());
    });
})();
