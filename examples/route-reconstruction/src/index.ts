import { bboxFromGeoJSON, RoutePlanningLocation, TomTomConfig, Waypoint } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, createLatestRequest, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import { GeoJSONSource, Map } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const state = {
        locations: [] as RoutePlanningLocation[],
        allDrawnCoordinates: [] as Position[],
        lastDrawnCoordinates: [] as Position[],
        drawnLineSource: undefined as GeoJSONSource | undefined,
        mouseDown: false,
        altKeyDown: false,
    };
    // A reset and a finished drawing each replan the route; the later one wins whatever answers first.
    const latestRoute = createLatestRequest();
    const showLatestRoute = async (routingModule: RoutingModule) => {
        const locations = [...state.locations];
        const route = await latestRoute.run((signal) => calculateRoute({ locations, signal }));
        if (route.current) routingModule.showRoutes(route.value);
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
        state.allDrawnCoordinates = [];
        state.lastDrawnCoordinates = [];
        state.locations = [...waypoints];
        routingModule.showWaypoints(waypoints);
        state.drawnLineSource?.setData({ type: 'LineString', coordinates: [] });
        await showLatestRoute(routingModule);
    };

    const initDrawUserEvents = (mapLibreMap: Map, routingModule: RoutingModule): void => {
        window.addEventListener('keydown', (event) => {
            if (event.key !== 'Alt') return;

            state.altKeyDown = true;
            mapLibreMap.getCanvas().style.cursor = 'pointer';
            if (state.mouseDown) mapLibreMap.dragPan.disable();
        });

        window.addEventListener('keyup', async (event) => {
            if (event.key === 'Alt') {
                state.altKeyDown = false;
                mapLibreMap.getCanvas().style.cursor = 'default';
                mapLibreMap.dragPan.enable();
                if (state.lastDrawnCoordinates.length) {
                    state.locations.splice(state.locations.length - 1, 0, state.lastDrawnCoordinates);
                    state.lastDrawnCoordinates = [];
                    await showLatestRoute(routingModule);
                }
            }
        });

        mapLibreMap.on('mousedown', () => {
            state.mouseDown = true;
            if (state.altKeyDown) {
                mapLibreMap.dragPan.disable();
            }
        });

        // The trail grows with every pointer move, so it is redrawn at most once per frame.
        let redrawPending = false;
        mapLibreMap.on('mousemove', (event) => {
            if (!state.mouseDown || !state.altKeyDown) return;

            const position = event.lngLat.toArray();
            state.allDrawnCoordinates.push(position);
            state.lastDrawnCoordinates.push(position);
            if (redrawPending) return;

            redrawPending = true;
            requestAnimationFrame(() => {
                redrawPending = false;
                state.drawnLineSource?.setData({ type: 'LineString', coordinates: state.allDrawnCoordinates });
            });
        });

        mapLibreMap.on('mouseup', async () => {
            state.mouseDown = false;
        });
    };

    const waypoints: Waypoint[] = await Promise.all([
        geocodeOne('W Houston St 51, NY'),
        geocodeOne('Terminal C Departures LaGuardia Airport, NY'),
    ]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(waypoints),
            fitBoundsOptions: { padding: 100 },
        },
    });

    const routingModule = await RoutingModule.create(map);
    initDrawMapStyle(map.mapLibreMap, routingModule);
    document.querySelector('#ui-resetButton')?.addEventListener('click', () => resetState(routingModule, waypoints));
    await resetState(routingModule, waypoints);
    initDrawUserEvents(map.mapLibreMap, routingModule);

    initTogglePanel();
})();
