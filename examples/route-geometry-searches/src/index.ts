import './style.css';
import { bboxFromGeoJSON, TomTomConfig, type Waypoint } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne, search } from '@tomtom-org/maps-sdk/services';
import buffer from '@turf/buffer';
import type { Polygon } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

const inputs = ['Barcelona', 'Amsterdam'];
const waypoints: Waypoint[] = await Promise.all(inputs.map(geocodeOne));

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 100 },
    },
    { style: { type: 'standard', include: ['trafficIncidents'] } },
);

const routingModule = await RoutingModule.get(map);
routingModule.showWaypoints(waypoints);
const routes = await calculateRoute({ locations: waypoints });
routingModule.showRoutes(routes);

const extraWidePlacesModule = await PlacesModule.get(map, { icon: { style: 'poi-like' } });
const widePlacesModule = await PlacesModule.get(map, { icon: { style: 'poi-like' } });
const onRoadPlacesModule = await PlacesModule.get(map, { icon: { style: 'circle' } });

const route = routes.features[0];
extraWidePlacesModule.show(
    await search({
        poiCategories: ['TRUCK_REPAIR_AND_SERVICE', 'TRUCK_STOP', 'TRUCK_WASH'],
        geometries: [buffer(route, 10, { units: 'kilometers' })?.geometry as Polygon],
        limit: 100,
        query: 'Volvo',
    }),
);

widePlacesModule.show(
    await search({
        poiCategories: ['REST_AREA', 'PICNIC_AREA'],
        geometries: [buffer(route, 100, { units: 'meters' })?.geometry as Polygon],
        limit: 100,
        query: '',
    }),
);

onRoadPlacesModule.show(
    await search({
        poiCategories: ['ELECTRIC_VEHICLE_STATION'],
        geometries: [buffer(route, 25, { units: 'meters' })?.geometry as Polygon],
        minPowerKW: 50,
        limit: 20,
        query: '',
    }),
);
