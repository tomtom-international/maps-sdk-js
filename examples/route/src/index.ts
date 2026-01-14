import type { Waypoint } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const locations: Waypoint[] = await Promise.all([
        geocodeOne('W Houston St 51, NY'),
        geocodeOne('Lincoln Square, NY'),
        geocodeOne('Carnegie Hill, NY'),
        geocodeOne('Terminal C Departures LaGuardia Airport, NY'),
    ]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(locations),
            fitBoundsOptions: { padding: 100 },
        },
    });

    const routingModule = await RoutingModule.get(map);
    routingModule.showWaypoints(locations);
    routingModule.showRoutes(
        await calculateRoute({
            locations,
            costModel: { traffic: 'historical' },
        }),
    );
})();
