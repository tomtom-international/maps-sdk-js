import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    PlacesModule,
    POIsModule,
    RoutingModule,
    StylingFoundationsModule,
    TomTomMap,
    TrafficIncidentDetailsModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import { calculateRoute, discoverPlaces, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { initKnobPanel } from './knobs';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const CENTRAL_LONDON: [number, number, number, number] = [-0.19, 51.49, -0.03, 51.53];

(async () => {
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', bounds: CENTRAL_LONDON },
    });
    const [styling, pois, trafficIncidents] = await Promise.all([
        StylingFoundationsModule.get(map),
        POIsModule.get(map),
        TrafficIncidentsModule.get(map),
    ]);

    // Each of the three draws its own layers, in a look it reads off the style.
    const restaurants = await PlacesModule.create(map, { markerType: 'base-map' });
    const incidents = await TrafficIncidentDetailsModule.create(map);
    const route = await RoutingModule.create(map);

    const [restaurantPlaces, incidentDetails, routes] = await Promise.all([
        discoverPlaces({
            filters: { poiCategories: ['RESTAURANT'] },
            geoBias: { position: [-0.1276, 51.5072] },
            limit: 40,
        }),
        trafficIncidentDetails({ bbox: CENTRAL_LONDON, timeValidityFilter: ['present'] }),
        calculateRoute({
            locations: [
                [-0.1759, 51.5154],
                [-0.0759, 51.5081],
            ],
        }),
    ]);
    await restaurants.show(restaurantPlaces);
    await incidents.show(incidentDetails);
    await route.showRoutes(routes);

    initKnobPanel({ styling, pois, incidents: trafficIncidents });
    initTogglePanel();
})();
