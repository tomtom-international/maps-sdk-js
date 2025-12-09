import { bboxFromGeoJSON, type Place, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, searchOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const destination = (await searchOne('Schiphol airport, Amsterdam')) as Place;

    const origins = (await Promise.all([
        searchOne('Amsterdam Centraal'),
        searchOne('Leiden Centraal'),
        searchOne('Utrecht Centraal'),
    ])) as Place[];

    const map = new TomTomMap(
        {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON([...origins, destination]),
            fitBoundsOptions: { padding: 100 },
        },
        { style: 'monoLight' },
    );

    // Show a single place for the common destination:
    (await PlacesModule.get(map)).show(destination);

    // Create routing modules dynamically based on the number of origins
    const routeColors = ['#0066CC', '#00BBDD', '#33AA33', '#99BB00'];
    const routingModules = await Promise.all(
        origins.map((_, index) =>
            RoutingModule.get(map, { theme: { mainColor: routeColors[index % routeColors.length] } }),
        ),
    );

    for (const origin of origins) {
        const routingModule = routingModules[origins.indexOf(origin)];
        await routingModule.showWaypoints([origin]);
        const route = await calculateRoute({
            locations: [origin, destination],
            costModel: { traffic: 'historical' },
        });
        await routingModule.showRoutes(route);
    }
})();
