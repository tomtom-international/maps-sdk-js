import { bboxFromGeoJSON, TomTomConfig, type Waypoint, withInsertedWaypoints } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, discoverPlaces, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import './style.css';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const initialWaypoints: Waypoint[] = await Promise.all(['Paris', 'Amsterdam'].map(geocodeOne));

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(initialWaypoints),
            fitBoundsOptions: { padding: 80 },
        },
    });

    const routingModule = await RoutingModule.create(map);
    routingModule.showWaypoints(initialWaypoints);
    const initialRoutes = await calculateRoute({ locations: initialWaypoints });

    routingModule.showRoutes(initialRoutes);
    const initialRoute = initialRoutes.features[0];

    const stopsAlongRoute = await discoverPlaces({
        filters: { poiCategories: ['CHARGING_LOCATION'], minPowerKW: 150 },
        route: initialRoute,
        maxDetourTimeSeconds: 60,
        limit: 10,
    });
    const placesModule = await PlacesModule.create(map);
    placesModule.show(stopsAlongRoute);

    // Insert all charging stops at their optimal along-route positions in one call.
    // `withInsertedWaypoints` projects every existing and new waypoint once against the
    // route, then sorts the new ones into along-route order — independent of input order.
    const updatedWaypoints = withInsertedWaypoints(initialRoute, initialWaypoints, stopsAlongRoute.features);
    const updatedRoutes = await calculateRoute({ locations: updatedWaypoints });

    placesModule.clear();
    routingModule.showWaypoints(updatedWaypoints);
    routingModule.showRoutes(updatedRoutes);
})();
