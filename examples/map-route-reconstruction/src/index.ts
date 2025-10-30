import { bboxFromGeoJSON, RoutePlanningLocation, TomTomConfig, Waypoint } from '@tomtom-org/maps-sdk-js/core';
import { RoutingModule, TomTomMap, TrafficIncidentsModule } from '@tomtom-org/maps-sdk-js/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk-js/services';
import type { Position } from 'geojson';
import { GeoJSONSource, LngLatBoundsLike, Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const state = {
    locations: [] as RoutePlanningLocation[],
    allDrawnCoords: [] as Position[],
    lastDrawnCoords: [] as Position[],
    drawnLineSource: undefined as GeoJSONSource | undefined,
    mouseDown: false,
    controlKeyDown: false,
};

const initDrawMapStyle = (mapLibreMap: Map, routingModule: RoutingModule) => {
    mapLibreMap.once('styledata', () => {
        mapLibreMap.addSource('drawnLine', {
            type: 'geojson',
            data: { type: 'LineString', coordinates: [] },
        });

        mapLibreMap.addLayer(
            {
                id: 'drawnPoints',
                type: 'circle',
                source: 'drawnLine',
                paint: {
                    'circle-color': 'green',
                    'circle-radius': 6,
                },
            },
            routingModule.getLayerToRenderLinesUnder(),
        );

        state.drawnLineSource = mapLibreMap.getSource('drawnLine') as GeoJSONSource;
    });
};

const resetState = async (routingModule: RoutingModule, waypoints: Waypoint[]) => {
    state.allDrawnCoords = [];
    state.lastDrawnCoords = [];
    state.locations = [...waypoints];
    routingModule.showWaypoints(waypoints);
    routingModule.showRoutes(await calculateRoute({ locations: state.locations }));
    state.drawnLineSource?.setData({ type: 'LineString', coordinates: [] });
};

const initDrawUserEvents = (mapLibreMap: Map, routingModule: RoutingModule): void => {
    window.addEventListener('keydown', (ev) => {
        if (ev.key === 'Alt') {
            state.controlKeyDown = true;
            mapLibreMap.getCanvas().style.cursor = 'pointer';
        }
        if (state.mouseDown) {
            mapLibreMap.dragPan.disable();
        }
    });

    window.addEventListener('keyup', async (ev) => {
        if (ev.key === 'Alt') {
            state.controlKeyDown = false;
            mapLibreMap.getCanvas().style.cursor = 'default';
            mapLibreMap.dragPan.enable();
            if (state.lastDrawnCoords.length) {
                state.locations.splice(state.locations.length - 1, 0, state.lastDrawnCoords);
                state.lastDrawnCoords = [];
                routingModule.showRoutes(await calculateRoute({ locations: state.locations }));
            }
        }
    });

    mapLibreMap.on('mousedown', () => {
        state.mouseDown = true;
        if (state.controlKeyDown) {
            mapLibreMap.dragPan.disable();
        }
    });

    mapLibreMap.on('mousemove', (ev) => {
        if (state.mouseDown && state.controlKeyDown) {
            state.allDrawnCoords.push(ev.lngLat.toArray());
            state.lastDrawnCoords.push(ev.lngLat.toArray());
            state.drawnLineSource?.setData({ type: 'LineString', coordinates: state.allDrawnCoords });
        }
    });

    mapLibreMap.on('mouseup', async () => {
        state.mouseDown = false;
    });
};

const waypoints: Waypoint[] = await Promise.all([
    geocodeOne('W Houston St 51, NY'),
    geocodeOne('Terminal C Departures LaGuardia Airport, NY'),
]);

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 150 },
    },
    { style: { type: 'standard', include: ['trafficIncidents'] } },
);
await TrafficIncidentsModule.get(map, { visible: false });

const routingModule = await RoutingModule.get(map);
initDrawMapStyle(map.mapLibreMap, routingModule);
document
    .querySelector('#maps-sdk-js-examples-reset')
    ?.addEventListener('click', () => resetState(routingModule, waypoints));
await resetState(routingModule, waypoints);
initDrawUserEvents(map.mapLibreMap, routingModule);
