import { bboxFromGeoJSON, GeoInput, TomTomConfig, Waypoint } from '@cet/maps-sdk-js/core';
import { RoutingModule, TomTomMap, TrafficIncidentsModule } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocode } from '@cet/maps-sdk-js/services';
import type { Position } from 'geojson';
import { GeoJSONSource, LngLatBoundsLike, Map } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const state = {
    geoInputs: [] as GeoInput[],
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
    state.geoInputs = [...waypoints];
    routingModule.showWaypoints(waypoints);
    routingModule.showRoutes(await calculateRoute({ geoInputs: state.geoInputs }));
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
                state.geoInputs.splice(state.geoInputs.length - 1, 0, state.lastDrawnCoords);
                state.lastDrawnCoords = [];
                routingModule.showRoutes(await calculateRoute({ geoInputs: state.geoInputs }));
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

(async () => {
    const waypoints: Waypoint[] = (
        await Promise.all([
            geocode({ query: 'W Houston St 51, NY', limit: 1 }),
            geocode({ query: 'Terminal C Departures LaGuardia Airport, NY', limit: 1 }),
        ])
    ).map((result) => result.features[0]);

    const map = new TomTomMap(
        {
            container: 'map',
            bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
            fitBoundsOptions: { padding: 150 },
        },
        { style: { type: 'published', include: ['trafficIncidents'] } },
    );
    await TrafficIncidentsModule.get(map, { visible: false });

    const routingModule = await RoutingModule.init(map);
    initDrawMapStyle(map.mapLibreMap, routingModule);
    document.querySelector('#reset')?.addEventListener('click', () => resetState(routingModule, waypoints));
    await resetState(routingModule, waypoints);
    initDrawUserEvents(map.mapLibreMap, routingModule);
    (window as any).map = map; // This has been done for automation test support
})();
