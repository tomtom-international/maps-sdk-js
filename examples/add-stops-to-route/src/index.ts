import type { Route, Waypoint, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig, withInsertedWaypoint } from '@tomtom-org/maps-sdk/core';
import type { WaypointDisplayProps } from '@tomtom-org/maps-sdk/map';
import { BaseMapModule, MIDDLE_INDEX, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { LngLat, Popup } from 'maplibre-gl';
import { API_KEY } from './config';
import './style.css';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const [origin, destination] = await Promise.all([geocodeOne('Washington'), geocodeOne('New York')]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON([origin, destination]),
            fitBoundsOptions: { padding: 50 },
        },
    });

    const [routingModule, baseModule] = await Promise.all([RoutingModule.get(map), BaseMapModule.get(map)]);

    // --- State ---
    let stops: [number, number][] = [];
    let currentRoute: Route;
    let activePopup: Popup | null = null;
    let isUpdating = false;

    // --- Helpers ---

    const getLocations = (): WaypointLike[] => [origin, ...stops, destination];

    const closeActivePopup = () => {
        activePopup?.remove();
        activePopup = null;
    };

    const setLoading = (loading: boolean) => {
        isUpdating = loading;
        map.mapLibreMap.getCanvas().style.cursor = loading ? 'wait' : '';
    };

    const recalculate = async () => {
        const routeResult = await calculateRoute({ locations: getLocations() });
        currentRoute = routeResult.features[0];
        routingModule.showWaypoints(getLocations());
        routingModule.showRoutes(routeResult);
    };

    const addStop = async (pos: [number, number]) => {
        if (isUpdating) return;
        setLoading(true);
        try {
            const updated = withInsertedWaypoint(currentRoute, getLocations(), pos);
            stops = updated.slice(1, -1) as [number, number][];
            await recalculate();
        } finally {
            setLoading(false);
        }
    };

    const removeStop = async (index: number) => {
        if (isUpdating) return;
        setLoading(true);
        try {
            stops = stops.filter((_, i) => i !== index);
            await recalculate();
        } finally {
            setLoading(false);
        }
    };

    // --- Initial route ---
    const initialResult = await calculateRoute({ locations: [origin, destination] });
    currentRoute = initialResult.features[0];
    routingModule.showWaypoints([origin, destination]);
    routingModule.showRoutes(initialResult);

    // --- Waypoint click: show "Remove stop" popup for intermediate stops ---
    routingModule.events.waypoints.on('click', (waypoint: Waypoint<WaypointDisplayProps>, lngLat: LngLat) => {
        if (waypoint.properties.indexType !== MIDDLE_INDEX || isUpdating) return;

        closeActivePopup();

        // waypoint.properties.index is its position in [origin, ...stops, destination],
        // so the corresponding index in the stops array is index - 1.
        const stopIndex = waypoint.properties.index - 1;

        const popup = new Popup({
            closeButton: false,
            anchor: 'bottom',
            className: 'stop-action-popup',
        })
            .setLngLat(lngLat)
            .setHTML(
                `<button class="sdk-example-button sdk-example-button-secondary stop-popup-btn">Remove stop</button>`,
            )
            .addTo(map.mapLibreMap);

        activePopup = popup;

        popup
            .getElement()
            .querySelector('.stop-popup-btn')
            ?.addEventListener('click', () => {
                closeActivePopup();
                removeStop(stopIndex);
            });
    });

    // --- Map click: show "Add Stop" popup (or dismiss existing popup) ---
    baseModule.events.on('click', (_: unknown, lngLat: LngLat) => {
        if (isUpdating) return;

        if (activePopup) {
            closeActivePopup();
            return;
        }

        const popup = new Popup({
            offset: 15,
            closeButton: false,
            anchor: 'bottom',
            className: 'stop-action-popup',
        })
            .setLngLat(lngLat)
            .setHTML(`<button class="sdk-example-button stop-popup-btn">Add stop</button>`)
            .addTo(map.mapLibreMap);

        activePopup = popup;

        popup
            .getElement()
            .querySelector('.stop-popup-btn')
            ?.addEventListener('click', () => {
                closeActivePopup();
                addStop(lngLat.toArray());
            });
    });

    initTogglePanel();
})();
