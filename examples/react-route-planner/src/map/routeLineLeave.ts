import type { MapModules } from './useMapModules';

/**
 * No event says the pointer left a route line, so a hover on anything else the map draws, or leaving
 * the map for a panel, is what ends it. Returns what unsubscribes `leave`.
 */
export const onRouteLineLeave = (
    { map, searchResults, pois, baseMap, routing }: MapModules,
    leave: () => void,
): (() => void)[] => {
    map.mapLibreMap.on('mouseout', leave);
    return [
        () => void map.mapLibreMap.off('mouseout', leave),
        searchResults.events.places.on('hover', leave),
        pois.events.on('hover', leave),
        baseMap.events.on('hover', leave),
        routing.events.waypoints.on('hover', leave),
    ];
};
