import {
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    type Route,
    type Routes,
} from '@tomtom-org/maps-sdk/core';
import type { DisplayRouteProps } from '@tomtom-org/maps-sdk/map';
import { type LngLat, Popup } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { addSeconds, clockTime, progressInto } from '../format';
import type { RouteCursorStore } from './routeCursor';
import { onRouteLineLeave } from './routeLineLeave';
import type { MapModules } from './useMapModules';
import './useRouteHoverProgress.css';

/**
 * Hovering a route line, or the sections bar, shows how far into the trip that point is and when you
 * would pass it.
 */
export const useRouteHoverProgress = (
    modules: MapModules | undefined,
    routes: Routes | undefined,
    cursorStore: RouteCursorStore,
) => {
    const routesRef = useRef(routes);
    useEffect(() => {
        routesRef.current = routes;
        cursorStore.set(undefined);
    }, [routes, cursorStore]);

    useEffect(() => {
        if (!modules) return;

        const { map, routing, baseMapUnderRoutes } = modules;
        const popup = new Popup({
            className: 'ui-maplibre-popup ui-progress-popup',
            closeButton: false,
            closeOnClick: false,
            focusAfterOpen: false,
            offset: 12,
        });
        const content = document.createElement('div');
        popup.setDOMContent(content);

        const showCursor = () => {
            const cursor = cursorStore.get();
            const route = cursor && routesRef.current?.features[cursor.routeIndex];
            const progress =
                route && getCoordinateAtRouteProgress(route, { traveledDistanceInMeters: cursor.distanceInMeters });
            if (!progress) {
                popup.remove();
                return;
            }

            const passingAt = addSeconds(route.properties.summary.departureTime, progress.travelTimeInSeconds);
            content.innerHTML = `<strong>${clockTime(passingAt)}</strong><span>${progressInto(progress)}</span>`;
            popup.setLngLat([progress.position[0], progress.position[1]]).addTo(map.mapLibreMap);
        };

        const hoverLine = (line: Route<DisplayRouteProps>, lngLat: LngLat) => {
            const routeIndex = line.properties.index;
            const route = routesRef.current?.features[routeIndex];
            const progress = route && getProgressAtNearestRoutePoint(route, lngLat.toArray());
            if (progress) cursorStore.set({ routeIndex, distanceInMeters: progress.distanceInMeters, from: 'map' });
        };
        const leave = () => cursorStore.set(undefined);

        const unsubscribes = [
            cursorStore.subscribe(showCursor),
            routing.events.mainLines.on('hover', hoverLine),
            routing.events.mainLines.on('hover-move', hoverLine),
            ...onRouteLineLeave(modules, leave),
            baseMapUnderRoutes.on('click', leave),
        ];
        return () => {
            for (const unsubscribe of unsubscribes) unsubscribe();
            popup.remove();
        };
    }, [modules, cursorStore]);
};
