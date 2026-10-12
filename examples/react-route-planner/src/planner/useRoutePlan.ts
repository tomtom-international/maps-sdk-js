import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { bboxFromGeoJSON, type Routes, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { fitBetweenPanels } from '../map/coveringPanels';
import type { MapModules } from '../map/useMapModules';
import { useMapQueue } from '../map/useMapQueue';
import type { RouteOptions } from './routeOptions';
import { type Stop, toPlanningWaypoints } from './stops';

export type RoutePlan = {
    routes?: Routes;
    selectedIndex: number;
    calculating: boolean;
    error?: string;
    selectRoute: (index: number) => void;
};

// Waits for a burst of edits (a drag, typing a weight) to settle before asking for a route.
const CALCULATE_DELAY_MS = 300;

export const useRoutePlan = (modules: MapModules | undefined, stops: Stop[], options: RouteOptions): RoutePlan => {
    const waypoints = useMemo(() => toPlanningWaypoints(stops), [stops]);
    const [request] = useDebounce(
        useMemo(
            () => ({ locations: waypoints.filter((waypoint) => waypoint !== null), options }),
            [waypoints, options],
        ),
        CALCULATE_DELAY_MS,
    );
    const enabled = request.locations.length >= 2;
    const query = useQuery({
        queryKey: ['route', request],
        queryFn: ({ signal }) =>
            calculateRoute({ ...request.options, locations: request.locations, guidance: { type: 'coded' }, signal }),
        enabled,
        placeholderData: keepPreviousData,
    });
    const routes = enabled ? query.data : undefined;
    // A pick holds for the routes it was made on; new routes start on their first.
    const [selection, setSelection] = useState<{ routes: Routes; index: number }>();
    const selectedIndex = selection && selection.routes === routes ? selection.index : 0;

    const draw = useMapQueue();
    useEffect(() => {
        if (modules) void draw(() => modules.routing.showWaypoints(waypoints));
    }, [modules, waypoints, draw]);
    useEffect(() => {
        if (modules) void draw(() => (routes ? modules.routing.showRoutes(routes) : modules.routing.clearRoutes()));
    }, [modules, routes, draw]);

    useFitNewPlaces(modules, query.isPlaceholderData ? undefined : routes, request.locations);

    return {
        routes,
        selectedIndex,
        calculating: query.isFetching,
        error: enabled ? query.error?.message : undefined,
        selectRoute: (index) => {
            if (modules) void draw(() => modules.routing.selectRoute(index));
            if (routes) setSelection({ routes, index });
        },
    };
};

/**
 * Only a new set of places moves the camera: options, stays and reordering keep the view. It runs
 * after the commit that renders the routes, so the sections bar a first route brings is there to keep clear.
 */
const useFitNewPlaces = (modules: MapModules | undefined, routes: Routes | undefined, places: WaypointLike[]) => {
    const fittedPlaces = useRef('');
    const placesKey = places
        .flatMap((place) => ('id' in place ? [String(place.id)] : []))
        .sort()
        .join('|');

    useEffect(() => {
        const toBeContainedBBox = routes && bboxFromGeoJSON(routes);
        if (!modules || !toBeContainedBBox || placesKey === fittedPlaces.current) return;

        fittedPlaces.current = placesKey;
        fitBetweenPanels(modules.map, toBeContainedBBox);
    }, [modules, routes, placesKey]);
};
