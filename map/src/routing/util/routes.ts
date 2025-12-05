import {
    DelayMagnitude,
    DisplayUnits,
    formatDistance,
    formatDuration,
    generateId,
    Route,
    Routes,
    TrafficSectionProps,
} from '@tomtom-org/maps-sdk/core';
import type { DisplayRouteProps, DisplayRouteSummaries } from '../types/displayRoutes';

/**
 * Builds map display-ready routes, applying default style props.
 * @ignore
 */
export const toDisplayRoutes = (routes: Route | Routes, selectedIndex = 0): Routes<DisplayRouteProps> => {
    const routesCollection: Routes = 'features' in routes ? routes : { type: 'FeatureCollection', features: [routes] };
    return {
        ...routesCollection,
        features: routesCollection.features.map((route, index) => {
            const id = route.id ?? generateId();
            return {
                ...route,
                id,
                properties: {
                    ...route.properties,
                    id, // we need id in properties due to promoteId feature
                    routeState: index === selectedIndex ? 'selected' : 'deselected',
                },
            };
        }),
    };
};

const hasMagnitude = (sections: TrafficSectionProps[], magnitude: DelayMagnitude): boolean =>
    sections.some((section) => section.magnitudeOfDelay === magnitude);

const summaryDelayMagnitude = (route: Route): DelayMagnitude | undefined => {
    const trafficSections = route.properties.sections.traffic;
    if (!trafficSections?.length) {
        return undefined;
    }
    if (hasMagnitude(trafficSections, 'major')) {
        return 'major';
    }
    if (hasMagnitude(trafficSections, 'moderate')) {
        return 'moderate';
    }
    if (hasMagnitude(trafficSections, 'minor')) {
        return 'minor';
    }
    return undefined;
};
/**
 * Builds map display-ready route summaries based on display routes.
 * @ignore
 */
export const toDisplayRouteSummaries = (
    routes: Routes<DisplayRouteProps>,
    displayUnits?: DisplayUnits,
): DisplayRouteSummaries => ({
    type: 'FeatureCollection',
    features: routes.features.map((route) => {
        const summary = route.properties.summary;
        const routeCoordinates = route.geometry.coordinates;
        const formattedTraffic = formatDuration(summary.trafficDelayInSeconds, displayUnits?.time);
        const magnitudeOfDelay = summaryDelayMagnitude(route);
        const id = route.id ?? generateId();
        return {
            type: 'Feature',
            id,
            geometry: {
                type: 'Point',
                coordinates: routeCoordinates[Math.round(routeCoordinates.length / 2)],
            },
            properties: {
                id, // we need id in properties due to promoteId feature
                routeIndex: route.properties.index,
                routeState: route.properties.routeState,
                formattedDistance: formatDistance(summary.lengthInMeters, displayUnits?.distance),
                ...(magnitudeOfDelay && { magnitudeOfDelay }),
                ...(formattedTraffic && { formattedTraffic }),
                formattedDuration: formatDuration(summary.travelTimeInSeconds, displayUnits?.time),
            },
        };
    }),
});
