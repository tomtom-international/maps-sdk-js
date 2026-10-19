import type { MapModules } from './useMapModules';

/**
 * No event says the pointer left a route, so a hover on anything else the map draws but the routes'
 * bubbles, or leaving the map for a panel, is what ends it. Returns what unsubscribes `leave`.
 */
export const onRouteLeave = (
    { map, searchResults, pois, baseMapUnderRoutes, routing }: MapModules,
    leave: () => void,
): (() => void)[] => {
    map.mapLibreMap.on('mouseout', leave);
    return [
        () => void map.mapLibreMap.off('mouseout', leave),
        searchResults.events.places.on('hover', leave),
        pois.events.on('hover', leave),
        baseMapUnderRoutes.on('hover', leave),
        routing.events.waypoints.on('hover', leave),
    ];
};

/** As {@link onRouteLeave}, for a route's line: a hover on a bubble, which covers the line, ends it too. */
export const onRouteLineLeave = (modules: MapModules, leave: () => void): (() => void)[] => [
    ...onRouteLeave(modules, leave),
    modules.routing.events.summaryBubbles.on('hover', leave),
];
