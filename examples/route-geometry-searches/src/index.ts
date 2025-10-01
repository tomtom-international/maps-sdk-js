import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { bboxFromGeoJSON, TomTomConfig, type Waypoints } from '@cet/maps-sdk-js/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocode, search } from '@cet/maps-sdk-js/services';
import buffer from '@turf/buffer';
import type { Polygon } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

const inputs = ['Barcelona', 'Amsterdam'];
const waypoints: Waypoints = {
    type: 'FeatureCollection',
    features: await Promise.all(inputs.map(async (query) => (await geocode({ query, limit: 1 })).features[0])),
};

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 100 },
    },
    { style: { type: 'published', include: ['trafficIncidents'] } },
);

const routes = await calculateRoute({ geoInputs: waypoints.features });

const extraWidePlacesModule = await PlacesModule.init(map, { iconConfig: { iconStyle: 'poi-like' } });
const widePlacesModule = await PlacesModule.init(map, { iconConfig: { iconStyle: 'poi-like' } });
const onRoadPlacesModule = await PlacesModule.init(map, { iconConfig: { iconStyle: 'circle' } });
const routingModule = await RoutingModule.init(map);
routingModule.showRoutes(routes);
routingModule.showWaypoints(waypoints);

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
