import type { Place } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type CostModel, calculateRoute, SDKAbortError, searchOne } from '@tomtom-org/maps-sdk/services';
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
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(locations),
            fitBoundsOptions: { padding: 100 },
        },
    });

    const routingModule = await RoutingModule.create(map);
    routingModule.showWaypoints(locations);

    // The route path won't be based on current (live) traffic.
    // However, live traffic is still included and displayed on the route.
    const costModel: CostModel = { traffic: 'historical' };

    const originalRoute = (await calculateRoute({ locations, costModel })).features[0];
    routingModule.showRoutes(originalRoute);
    // Initial update
    updateTimeDisplay();

    let controller: AbortController | undefined;

    // route re-calculation interval
    const intervalId = setInterval(async () => {
        // Cancel a recalculation that is somehow still running from the previous tick.
        // Without this, two responses race and the slower one paints last, so the panel
        // would stamp a fresh time onto older traffic.
        controller?.abort();
        controller = new AbortController();

        try {
            const updatedRoutes = await calculateRoute({
                locations: [originalRoute],
                costModel,
                signal: controller.signal,
            });
            routingModule.showRoutes(updatedRoutes);
            updateTimeDisplay();
        } catch (error) {
            // A superseded tick is expected to abort — the next one will repaint
            if (error instanceof SDKAbortError) return;
            throw error;
        }
    }, 60000); // 60000 ms = 1 minute

    // Stop monitoring (and cancel any request in flight) when the page goes away
    window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
        controller?.abort();
    });
})();
