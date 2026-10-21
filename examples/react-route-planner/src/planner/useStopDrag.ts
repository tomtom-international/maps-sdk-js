import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { RouteDragging } from '@tomtom-org/maps-sdk-plugin-route-dragging';
import { type Dispatch, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../format';
import type { MapModules } from '../map/useMapModules';
import type { RouteOptions } from './routeOptions';
import { insertDroppedStopAction, type Stop, type StopsAction } from './stops';
import { type PlannedRoutes, planRoutes, seeksCurves } from './useRoutePlan';

/** A drag on the map, and the routes planned while it lasted. */
export type StopDrag = {
    dragging: boolean;
    /** The routes the last drag planned, and when its stop was dropped. */
    live?: { plan?: PlannedRoutes; droppedAt?: number };
};

/**
 * Moves the stop a drag on the map holds, a pin's own or one the route-dragging plugin pulled off a
 * route line. The plugin re-plans as the stop moves, and the drop looks up its address.
 */
export const useStopDrag = (
    modules: MapModules | undefined,
    stops: Stop[],
    options: RouteOptions,
    dispatch: Dispatch<StopsAction>,
    onError: (message: string) => void,
): StopDrag => {
    const [dragging, setDragging] = useState(false);
    const [live, setLive] = useState<StopDrag['live']>();
    const latest = useRef({ stops, options, onError });
    useEffect(() => {
        latest.current = { stops, options, onError };
    });

    useEffect(() => {
        if (!modules) return;

        let draggedId: string | undefined;
        // The planner draws the stops and routes itself, through its own queue.
        const routeDragging = new RouteDragging(modules.routing, {
            showOnMap: false,
            plan: async (locations, signal) => (await planRoutes(locations, latest.current.options, signal)).routes,
            onRoutes: (routes) =>
                setLive((current) => ({
                    ...current,
                    plan: { routes, seeksCurves: seeksCurves(latest.current.options) },
                })),
            onError: (error) => latest.current.onError(`Couldn't plan the route: ${errorMessage(error)}`),
            onWaypointsChange: (_, { type, kind, waypointIndex, position }) => {
                if (type === 'dragstart') {
                    setDragging(true);
                    setLive({});
                    if (kind === 'insert') {
                        const insert = insertDroppedStopAction(waypointIndex, position);
                        dispatch(insert);
                        draggedId = insert.stop.id;
                    } else {
                        draggedId = latest.current.stops[waypointIndex]?.id;
                    }
                    return;
                }

                const id = draggedId;
                if (!id) return;

                dispatch({ type: 'drop', id, position });
                if (type !== 'dragend') return;

                draggedId = undefined;
                setDragging(false);
                setLive((current) => ({ ...current, droppedAt: Date.now() }));
                reverseGeocode({ position })
                    // A spot with no address match comes back with no properties, and keeps its coordinates.
                    .then((place) => place.properties && dispatch({ type: 'name', id, position, place }))
                    .catch((error) => latest.current.onError(`Couldn't look up that place: ${errorMessage(error)}`));
            },
        });
        return () => routeDragging.remove();
    }, [modules, dispatch]);

    return { dragging, live };
};
