import { getProgressAtNearestRoutePoint, type Place, type Route } from '@tomtom-org/maps-sdk/core';
import type { DisplayRouteProps, RoutingModule } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, getPlaceDetails, reverseGeocode } from '@tomtom-org/maps-sdk/services';
import type { LngLat } from 'maplibre-gl';
import { type RefObject, useEffect, useRef } from 'react';
import { errorMessage } from '../format';
import { keysOf } from '../keysOf';
import { type LaneId, sectionAt } from '../sections/routeLanes';
import { onRouteLeave, onRouteLineLeave } from './routeLineLeave';
import type { MapModules } from './useMapModules';

export type MapInteractionHandlers = {
    /** A search result, a map POI or a clicked spot, ready to join the route. */
    onPlace: (place: Place) => void;
    /** A stop's pin, by its row in the planner. */
    onStop: (index: number) => void;
    /** A route line or its summary bubble, by its index among the alternatives. */
    onRoute: (index: number) => void;
    /** The summary bubble under the pointer, by its route's index among the alternatives, or none when the pointer moves off a route. */
    onRouteHover: (index?: number) => void;
    /** The route line under the pointer, by its index among the alternatives, which the map already draws as hovered. */
    onRouteLineHover: (index: number) => void;
    onSearchResultHover: (place?: Place) => void;
    /** A route section drawn on the map, by its id, or none when the pointer moves off. */
    onSectionHover: (sectionId?: string) => void;
    /** A route section drawn on the map, by its id. */
    onSectionClick: (sectionId: string) => void;
    /**
     * A click on the rest of the map: closes what such a click dismisses, and says whether there was
     * anything. Only a click that dismissed nothing looks up the place clicked.
     */
    dismiss: () => boolean;
    onError: (message: string) => void;
};

/** The lanes of the sections bar the routing module draws by default, by their event scope. */
const laneScopes = {
    traffic: 'incidents',
    toll: 'tollRoads',
    tunnel: 'tunnels',
    ferry: 'ferries',
    carTrain: 'carTrainSections',
    lowEmissionZone: 'lowEmissionZoneSections',
} as const satisfies Partial<Record<LaneId, keyof RoutingModule['events']>>;

const drawnLanes = keysOf(laneScopes);
const sectionScopes = Object.values(laneScopes);

/**
 * The drawn section under the pointer on the selected route's line. Sections drawn as a halo lie
 * under the line, which takes the pointer from them.
 */
const sectionUnder = (route: Route<DisplayRouteProps>, lngLat: LngLat): string | undefined => {
    if (route.properties.routeState !== 'selected') return undefined;

    const progress = getProgressAtNearestRoutePoint(route, lngLat.toArray());
    return progress && sectionAt(route, progress.distanceInMeters, drawnLanes)?.id;
};

/**
 * The route lines, the sections drawn on them and the summary bubbles. A click on a line's section picks
 * the section, and one on a line or its bubble the route.
 */
const listenToRouteLines = (routing: RoutingModule, handlersRef: RefObject<MapInteractionHandlers>) => [
    routing.events.summaryBubbles.on('click', (summary) => handlersRef.current.onRoute(summary.properties.routeIndex)),
    routing.events.summaryBubbles.on('hover', (summary) =>
        handlersRef.current.onRouteHover(summary.properties.routeIndex),
    ),
    routing.events.mainLines.on('click', (route, lngLat) => {
        const sectionId = sectionUnder(route, lngLat);
        if (sectionId) handlersRef.current.onSectionClick(sectionId);
        else handlersRef.current.onRoute(route.properties.index);
    }),
    routing.events.mainLines.on('hover', (route) => handlersRef.current.onRouteLineHover(route.properties.index)),
    ...(['hover', 'hover-move'] as const).map((type) =>
        routing.events.mainLines.on(type, (route, lngLat) =>
            handlersRef.current.onSectionHover(sectionUnder(route, lngLat)),
        ),
    ),
    ...sectionScopes.flatMap((scope) => [
        // A section above the line takes `hover` off it, so pointing at its route puts the outline back.
        routing.events[scope].on('hover', (section) => {
            handlersRef.current.onRouteHover(section.properties.routeIndex);
            handlersRef.current.onSectionHover(section.properties.id);
        }),
        routing.events[scope].on('click', (section) => handlersRef.current.onSectionClick(section.properties.id)),
    ]),
];

/**
 * Listens to the modules once. The handlers are read through a ref, so they always see the
 * latest React state without re-registering.
 */
export const useMapInteractions = (modules: MapModules | undefined, handlers: MapInteractionHandlers) => {
    const handlersRef = useRef(handlers);
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        if (!modules) return;

        const { routing, searchResults, baseMapUnderRoutes, pois } = modules;
        // A newer click supersedes a lookup still in flight.
        const lookup = createLatestRequest();
        const lookUp = async (request: (signal: AbortSignal) => Promise<Place | undefined>) => {
            try {
                const result = await lookup.run(request);
                if (result.current && result.value) handlersRef.current.onPlace(result.value);
            } catch (error) {
                handlersRef.current.onError(`Couldn't look up that place: ${errorMessage(error)}`);
            }
        };

        const unsubscribes = [
            ...onRouteLineLeave(modules, () => handlersRef.current.onSectionHover(undefined)),
            ...onRouteLeave(modules, () => handlersRef.current.onRouteHover(undefined)),
            searchResults.events.places.on('click', (place) => handlersRef.current.onPlace(place)),
            searchResults.events.places.on('hover', (place) => handlersRef.current.onSearchResultHover(place)),
            pois.events.on('click', (poi) =>
                lookUp((signal) => getPlaceDetails({ entityId: poi.properties.id, signal })),
            ),
            baseMapUnderRoutes.on('click', (_, lngLat) => {
                if (!handlersRef.current.dismiss()) {
                    void lookUp((signal) =>
                        reverseGeocode({ position: lngLat.toArray(), signal }).then((place) =>
                            place.properties ? place : undefined,
                        ),
                    );
                }
            }),
            baseMapUnderRoutes.on('hover', () => handlersRef.current.onSearchResultHover(undefined)),
            routing.events.waypoints.on('click', (waypoint) => handlersRef.current.onStop(waypoint.properties.index)),
            ...listenToRouteLines(routing, handlersRef),
        ];
        return () => {
            lookup.cancel();
            for (const unsubscribe of unsubscribes) unsubscribe();
        };
    }, [modules]);
};
