import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { bboxFromGeoJSON, defaultSectionTypes, type Routes, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { fitBetweenPanels } from '../map/coveringPanels';
import type { MapModules } from '../map/useMapModules';
import { useMapQueue } from '../map/useMapQueue';
import type { RouteOptions } from './routeOptions';
import { isDroppedPlace, type Stop, toPlanningWaypoints } from './stops';
import type { StopDrag } from './useStopDrag';

export type RoutePlan = {
    routes?: Routes;
    selectedIndex: number;
    calculating: boolean;
    error?: string;
    selectRoute: (index: number) => void;
    /** The route pointed at, on the map or in the panel, which the map draws as hovered. */
    pointedIndex?: number;
    /** The sections to ring on the route pointed at: those it was pointed at with, else the roads it has to itself. */
    pointedSectionIds?: string[];
    pointAtRoute: (index?: number, sectionIds?: string[]) => void;
    /** Points at a route whose line the map hovers, and so already draws as hovered. */
    pointAtRouteLine: (index: number) => void;
};

// Waits for a burst of edits (typing a weight, a drop's address) to settle before asking for a route.
const CALCULATE_DELAY_MS = 300;

// The curvy route type seeks the curves out, so its routes band them, over the curvy stretches that join
// them into one winding road when seen from afar.
export const seeksCurves = (options: RouteOptions): boolean => options.costModel?.routeType === 'thrilling';

/** The routes through `locations` with the planner's options, as both the query and a drag on the map plan them. */
export const planRoutes = async (locations: WaypointLike[], options: RouteOptions, signal: AbortSignal) => ({
    routes: await calculateRoute({
        ...options,
        locations,
        guidance: { type: 'coded' },
        sectionTypes: [...defaultSectionTypes, 'curve', 'curvyStretch'],
        signal,
    }),
    seeksCurves: seeksCurves(options),
});

export type PlannedRoutes = Awaited<ReturnType<typeof planRoutes>>;

export const useRoutePlan = (
    modules: MapModules | undefined,
    stops: Stop[],
    options: RouteOptions,
    drag: StopDrag,
): RoutePlan => {
    const waypoints = useMemo(() => toPlanningWaypoints(stops), [stops]);
    const [request] = useDebounce(
        useMemo(
            () => ({ locations: waypoints.filter((waypoint) => waypoint !== null), options }),
            [waypoints, options],
        ),
        CALCULATE_DELAY_MS,
    );
    const enabled = request.locations.length >= 2;
    // A drag on the map plans its own routes, so the query waits for the drop.
    const query = useQuery({
        queryKey: ['route', request],
        queryFn: ({ signal }) => planRoutes(request.locations, request.options, signal),
        enabled: enabled && !drag.dragging,
        placeholderData: keepPreviousData,
    });
    // The drag's routes hold until the query answers for the stops as dropped.
    const { plan: livePlan, droppedAt } = drag.live ?? {};
    const showsLive = livePlan && (droppedAt === undefined || query.dataUpdatedAt <= droppedAt);
    const plan = enabled ? (showsLive ? livePlan : query.data) : undefined;
    const routes = plan?.routes;
    // A pick holds for the routes it was made on; new routes start on their first.
    const [selection, setSelection] = useState<{ routes: Routes; index: number }>();
    const selectedIndex = selection && selection.routes === routes ? selection.index : 0;
    // A pointer, like a pick, holds for the routes it was made on.
    const [pointer, setPointer] = useState<{
        routes: Routes;
        index: number;
        sectionIds?: string[];
        lineHovered?: boolean;
    }>();
    const pointed = pointer && pointer.routes === routes ? pointer : undefined;
    const pointedIndex = pointed?.index;
    const lineHovered = pointed?.lineHovered;

    const draw = useMapQueue();
    useEffect(() => {
        if (modules) void draw(() => modules.routing.showWaypoints(waypoints));
    }, [modules, waypoints, draw]);
    // The bands follow the routes drawn, not the option picked, which a slow or failed request leaves behind.
    useEffect(() => {
        if (!modules) return;

        void draw(() => {
            if (!plan) return modules.routing.clearRoutes();

            const visible = plan.seeksCurves;
            modules.routing.updateConfig({ sections: { curve: { visible }, curvyStretch: { visible } } });
            return modules.routing.showRoutes(plan.routes);
        });
    }, [modules, plan, draw]);
    useEffect(() => {
        // Putting `hover` again on a line that holds it would redraw every route.
        if (!modules || lineHovered) return;
        void draw(async () =>
            pointedIndex === undefined
                ? modules.routing.clearEventStates({ states: ['hover'] })
                : modules.routing.setEventState({ index: pointedIndex, state: 'hover' }),
        );
    }, [modules, pointedIndex, lineHovered, draw]);

    useFitNewPlaces(modules, showsLive || query.isPlaceholderData ? undefined : routes, request.locations);

    return {
        routes,
        selectedIndex,
        calculating: query.isFetching,
        error: enabled ? query.error?.message : undefined,
        selectRoute: (index) => {
            // A click on the map can still land on a route the new routes, not yet drawn, no longer have.
            if (!routes?.features[index]) return;
            if (modules) void draw(() => modules.routing.selectRoute(index));
            setSelection({ routes, index });
        },
        pointedIndex,
        pointedSectionIds:
            pointed &&
            (pointed.sectionIds ??
                pointed.routes.features[pointed.index]?.properties.sections.distinct?.map((section) => section.id)),
        pointAtRoute: (index, sectionIds) =>
            setPointer(routes && index !== undefined ? { routes, index, sectionIds } : undefined),
        pointAtRouteLine: (index) => setPointer(routes && { routes, index, lineHovered: true }),
    };
};

/**
 * Only a place new to the route moves the camera: removals, options, stays, reordering and stops
 * dragged on the map keep the view. It runs after the commit that renders the routes, so the sections
 * bar a first route brings is there to keep clear.
 */
const useFitNewPlaces = (modules: MapModules | undefined, routes: Routes | undefined, places: WaypointLike[]) => {
    // The places of the routes last drawn.
    const routedPlaceIds = useRef(new Set<string>());
    const placesKey = places
        .flatMap((place) => ('id' in place && !isDroppedPlace(place) ? [String(place.id)] : []))
        .sort()
        .join('|');

    useEffect(() => {
        const toBeContainedBBox = routes && bboxFromGeoJSON(routes);
        if (!modules || !toBeContainedBBox) return;

        const placeIds = placesKey ? placesKey.split('|') : [];
        const hasNewPlace = placeIds.some((id) => !routedPlaceIds.current.has(id));
        routedPlaceIds.current = new Set(placeIds);
        if (hasNewPlace) fitBetweenPanels(modules.map, toBeContainedBBox);
    }, [modules, routes, placesKey]);
};
