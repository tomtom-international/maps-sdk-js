import { bboxFromGeoJSON, TomTomConfig, type Waypoint } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, discoverPlaces, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { buffer } from '@turf/turf';
import type { Polygon } from 'geojson';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const inputs = ['Barcelona', 'Amsterdam'];
    const waypoints: Waypoint[] = await Promise.all(inputs.map(geocodeOne));

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(waypoints),
            fitBoundsOptions: { padding: 100 },
        },
    });

    const routingModule = await RoutingModule.create(map);
    routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({ locations: waypoints });
    routingModule.showRoutes(routes);

    const extraWidePlacesModule = await PlacesModule.create(map, { markerType: 'base-map' });
    const widePlacesModule = await PlacesModule.create(map, { markerType: 'base-map' });
    const onRoadPlacesModule = await PlacesModule.create(map, { markerType: 'circle-icon' });

    const route = routes.features[0];
    extraWidePlacesModule.show(
        await discoverPlaces({
            filters: { poiCategories: ['TRUCK_REPAIR_AND_SERVICE', 'TRUCK_STOP'] },
            geometries: [buffer(route, 10, { units: 'kilometers' })?.geometry as Polygon],
            limit: 100,
            query: 'Volvo',
        }),
    );

    widePlacesModule.show(
        await discoverPlaces({
            filters: { poiCategories: ['REST_AREA', 'PICNIC_AREA'] },
            geometries: [buffer(route, 100, { units: 'meters' })?.geometry as Polygon],
            limit: 100,
        }),
    );

    onRoadPlacesModule.show(
        await discoverPlaces({
            filters: { poiCategories: ['CHARGING_LOCATION'], minPowerKW: 50 },
            geometries: [buffer(route, 25, { units: 'meters' })?.geometry as Polygon],
            limit: 20,
        }),
    );
})();
