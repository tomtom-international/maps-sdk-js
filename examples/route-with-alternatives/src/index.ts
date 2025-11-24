import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const waypoints = await Promise.all([geocodeOne('London'), geocodeOne('Paris')]);
    const bounds = bboxFromGeoJSON(waypoints) as LngLatBoundsLike;
    const fitBoundsOptions = { padding: 150 };

    const map = new TomTomMap({ bounds, fitBoundsOptions, container: 'maps-sdk-js-examples-map-container' });

    const routingModule = await RoutingModule.get(map);
    routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({
        locations: waypoints,
        maxAlternatives: 2,
        guidance: { type: 'coded' },
    });
    routingModule.showRoutes(routes);

    const routeSelector = document.querySelector('#maps-sdk-js-examples-routeSelection') as HTMLSelectElement;
    for (let index = 0; index < routes.features.length; index++) {
        const routeTitle = index == 0 ? 'Recommended' : `Alternative ${index}`;
        routeSelector.add(new Option(routeTitle, index + ''));
    }

    routeSelector.addEventListener('change', (event) =>
        routingModule.selectRoute(Number((event.target as HTMLOptionElement).value)),
    );
})();
