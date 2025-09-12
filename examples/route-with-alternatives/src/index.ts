import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { RoutingModule, TomTomMap, TrafficIncidentsModule } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocode } from '@cet/maps-sdk-js/services';
import { LngLatBoundsLike } from 'maplibre-gl';
import '../style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const waypoints = (
        await Promise.all([geocode({ query: 'London', limit: 1 }), geocode({ query: 'Paris', limit: 1 })])
    ).map((result) => result.features[0]);

    const bounds = bboxFromGeoJSON(waypoints) as LngLatBoundsLike;
    const fitBoundsOptions = { padding: 150 };

    const map = new TomTomMap(
        { bounds, fitBoundsOptions, container: 'maps-sdk-js-examples-map-container' },
        { style: { type: 'published', include: ['trafficIncidents'] } },
    );
    await TrafficIncidentsModule.get(map, { visible: false });

    const routingModule = await RoutingModule.init(map);
    routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({
        geoInputs: waypoints,
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

    document
        .querySelector('#maps-sdk-js-examples-reCenter')
        ?.addEventListener('click', () => map.mapLibreMap.fitBounds(bounds, fitBoundsOptions));

    (window as any).map = map; // This has been done for automation test support
})();
