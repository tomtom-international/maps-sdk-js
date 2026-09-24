import { type CountrySectionProps, generateId, type Route, type Routes } from '@tomtom-org/maps-sdk/core';
import { bearing as bearingBetween } from '@turf/turf';
import type { Position } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type {
    CountryCrossingFeature,
    DisplayCountryCrossing,
    DisplayCountryCrossings,
    DisplayRouteProps,
} from '../types/displayRoutes';

/** The glyph between the two country codes on a crossing label, stating the direction of travel. */
const CROSSING_ARROW = '\u2192';

/**
 * Bearing of the route as it crosses, in degrees clockwise from north.
 *
 * @remarks
 * Taken from the points either side of the seam rather than from the seam forward, so a crossing
 * that lands on a bend reads the direction of travel through it instead of the first step out.
 * Turf reports -180..180; the layer's rotation expects 0..360.
 */
const bearingAtCrossing = (coordinates: Position[], index: number): number => {
    const before = coordinates[index - 1] ?? coordinates[index];
    const after = coordinates[index + 1] ?? coordinates[index];
    if (before === after) return 0;

    return (bearingBetween(before, after) + 360) % 360;
};

const toCrossingFeature = (
    departed: CountrySectionProps,
    entered: CountrySectionProps,
    coordinates: Position[],
    routeProps: DisplayRouteProps,
): DisplayCountryCrossing => {
    const id = generateId();

    return {
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: coordinates[entered.startPointIndex] },
        properties: {
            id,
            fromCountryCode: departed.countryCodeISO2,
            toCountryCode: entered.countryCodeISO2,
            label: `${departed.countryCodeISO2} ${CROSSING_ARROW} ${entered.countryCodeISO2}`,
            bearing: bearingAtCrossing(coordinates, entered.startPointIndex),
            fromSectionStartPointIndex: departed.startPointIndex,
            toSectionStartPointIndex: entered.startPointIndex,
            routeState: routeProps.routeState,
            routeIndex: routeProps.index,
        },
    };
};

/**
 * The crossings along one route: the boundary between each pair of consecutive country sections.
 *
 * @remarks
 * Country sections partition a route end to end — each one ends where the next begins — so every
 * seam between two of them is a border, and a route has one crossing fewer than it has sections.
 * Two consecutive sections always name different countries; one country over two sections would be
 * a single section.
 */
const crossingsOfRoute = (route: Route<DisplayRouteProps>): DisplayCountryCrossing[] => {
    const countries = route.properties.sections.country;
    if (!countries?.length) return [];

    // Sorted rather than paired in response order, so a crossing cannot read backwards.
    const ordered = [...countries].sort((left, right) => left.startPointIndex - right.startPointIndex);
    const coordinates = route.geometry.coordinates;

    return ordered.slice(1).flatMap((entered, index) => {
        if (!coordinates[entered.startPointIndex]) return [];

        return [toCrossingFeature(ordered[index], entered, coordinates, route.properties)];
    });
};

/**
 * Turns the shown routes into the border crossings along them.
 *
 * @remarks
 * Reads the routes' own `country` sections, so a caller who did not ask for them gets no crossings
 * and the module issues no request of its own.
 * @see countryCrossingLayers
 * @ignore
 */
export const toDisplayCountryCrossings = (routes: Routes<DisplayRouteProps>): DisplayCountryCrossings => ({
    type: 'FeatureCollection',
    features: routes.features.flatMap(crossingsOfRoute),
});

/**
 * Turns a clicked crossing back into the two `country` sections it joins.
 *
 * @remarks
 * MapLibre hands back feature properties as scalars, so the sections cannot ride on the feature and
 * are looked up on the route instead — by `startPointIndex`, which tells apart two sections of the
 * same country on a route that re-enters it.
 * @ignore
 */
export const toCountryCrossingEventFeature = (
    feature: MapGeoJSONFeature,
    shownRoutes: Routes<DisplayRouteProps>,
): CountryCrossingFeature => {
    const properties = feature.properties as CountryCrossingFeature['properties'];
    const countries = shownRoutes.features[properties.routeIndex]?.properties.sections.country ?? [];
    const sectionAt = (startPointIndex: number) =>
        countries.find((country) => country.startPointIndex === startPointIndex);

    return {
        type: 'Feature',
        id: feature.id,
        geometry: feature.geometry as CountryCrossingFeature['geometry'],
        properties: {
            ...properties,
            fromSection: sectionAt(properties.fromSectionStartPointIndex),
            toSection: sectionAt(properties.toSectionStartPointIndex),
        },
    };
};
