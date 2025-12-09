import type { Place } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type CostModel, calculateRoute, searchOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { updateTimeDisplay } from './updatePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const searchResults = await Promise.all([
        searchOne('Eiffel Tower, Paris, FR'),
        searchOne('Gare du Nord, Paris, FR'),
    ]);

    const locations = searchResults.filter((result): result is Place => result !== undefined);

    const map = new TomTomMap({
        container: 'sdk-map',
        bounds: bboxFromGeoJSON(locations),
        fitBoundsOptions: { padding: 100 },
    });

    const routingModule = await RoutingModule.get(map);
    routingModule.showWaypoints(locations);

    // The route path won't be based on current (live) traffic.
    // However, live traffic is still included and displayed on the route.
    const costModel: CostModel = { traffic: 'historical' };

    const originalRoute = (await calculateRoute({ locations, costModel })).features[0];
    routingModule.showRoutes(originalRoute);
    // Initial update
    updateTimeDisplay();

    // route re-calculation interval
    setInterval(async () => {
        const updatedRoutes = await calculateRoute({ locations: [originalRoute], costModel });
        routingModule.showRoutes(updatedRoutes);
        updateTimeDisplay();
    }, 60000); // 60000 ms = 1 minute
})();
