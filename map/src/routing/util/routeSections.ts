import { generateId, Route, Routes, SectionProps, SectionType } from '@tomtom-org/maps-sdk/core';
import type { DisplayRouteProps } from '../types/displayRoutes';
import type { DisplaySectionProps, RouteSection, RouteSections } from '../types/routeSections';

const buildRouteSectionsFromRoute = <
    S extends SectionProps = SectionProps,
    D extends DisplaySectionProps = DisplaySectionProps,
>(
    route: Route<DisplayRouteProps>,
    sectionType: SectionType,
    displaySectionPropsBuilder?: (
        sectionProps: S,
        routeProps?: DisplayRouteProps,
    ) => Omit<D, 'routeState' | 'routeIndex'>,
): RouteSection<D>[] =>
    (route.properties.sections[sectionType] as S[])?.map((sectionProps) => {
        const id = sectionProps.id ?? generateId();
        return {
            type: 'Feature',
            id,
            geometry: {
                type: 'LineString',
                coordinates: route.geometry.coordinates.slice(
                    sectionProps.startPointIndex,
                    sectionProps.endPointIndex + 1,
                ),
            },
            properties: {
                ...(displaySectionPropsBuilder
                    ? displaySectionPropsBuilder(sectionProps, route.properties)
                    : sectionProps),
                routeState: route.properties.routeState,
                routeIndex: route.properties.index,
                id, // we need id in properties due to promoteId feature
            } as D,
        };
    }) || [];

/**
 * Builds display-ready LineString features to render the sections of a given type, from the given route.
 * @param routes The routes from which to extract the section props.
 * @param sectionType The type of the sections to extract.
 * @param displaySectionPropsBuilder An optional function which will convert each section props into an extended display-ready version.
 * @ignore
 */
export const toDisplayRouteSections = <
    S extends SectionProps = SectionProps,
    D extends DisplaySectionProps = DisplaySectionProps,
>(
    routes: Routes<DisplayRouteProps>,
    sectionType: SectionType,
    displaySectionPropsBuilder?: (
        sectionProps: S,
        routeProps?: DisplayRouteProps,
    ) => Omit<D, 'routeState' | 'routeIndex'>,
): RouteSections<D> => ({
    type: 'FeatureCollection',
    features: routes.features.flatMap((route) =>
        buildRouteSectionsFromRoute<S, D>(route, sectionType, displaySectionPropsBuilder),
    ),
});
