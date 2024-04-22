import type { DelayMagnitude, DisplayUnits, Route, Routes, TrafficSectionProps } from "@anw/maps-sdk-js/core";
import { formatDistance, formatDuration } from "@anw/maps-sdk-js/core";
import type { DisplayRouteProps, DisplayRouteSummaries } from "../types/displayRoutes";

/**
 * Builds map display-ready routes, applying default style props.
 * @ignore
 */
export const buildDisplayRoutes = (routes: Routes, selectedIndex = 0): Routes<DisplayRouteProps> => ({
    ...routes,
    features: routes.features.map((route, index) => ({
        ...route,
        properties: {
            ...route.properties,
            routeStyle: index === selectedIndex ? "selected" : "deselected"
        }
    }))
});

const hasMagnitude = (sections: TrafficSectionProps[], magnitude: DelayMagnitude): boolean =>
    sections.some((section) => section.magnitudeOfDelay == magnitude);

const summaryDelayMagnitude = (route: Route): DelayMagnitude | undefined => {
    const trafficSections = route.properties.sections.traffic;
    if (!trafficSections?.length) {
        return undefined;
    }
    if (hasMagnitude(trafficSections, "major")) {
        return "major";
    }
    if (hasMagnitude(trafficSections, "moderate")) {
        return "moderate";
    }
    if (hasMagnitude(trafficSections, "minor")) {
        return "minor";
    }
    return undefined;
};

/**
 * Builds map display-ready route summaries based on display routes.
 * @ignore
 */
export const buildDisplayRouteSummaries = (
    routes: Routes<DisplayRouteProps>,
    displayUnits?: DisplayUnits
): DisplayRouteSummaries => ({
    type: "FeatureCollection",
    features: routes.features.map((route) => {
        const summary = route.properties.summary;
        const routeCoordinates = route.geometry.coordinates;
        const formattedTraffic = formatDuration(summary.trafficDelayInSeconds, displayUnits?.time);
        const magnitudeOfDelay = summaryDelayMagnitude(route);
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: routeCoordinates[Math.round(routeCoordinates.length / 2)]
            },
            properties: {
                routeIndex: route.properties.index,
                routeStyle: route.properties.routeStyle,
                formattedDistance: formatDistance(summary.lengthInMeters, displayUnits?.distance),
                formattedDuration: formatDuration(summary.travelTimeInSeconds, displayUnits?.time),
                ...(magnitudeOfDelay && { magnitudeOfDelay }),
                ...(formattedTraffic && { formattedTraffic })
            }
        };
    })
});
