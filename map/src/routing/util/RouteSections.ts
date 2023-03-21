import isNil from "lodash/isNil";
import { Route, Routes, SectionProps, SectionType } from "@anw/maps-sdk-js/core";
import { DisplaySectionProps, RouteSection, RouteSections } from "../types/RouteSections";
import { DisplayRouteProps } from "../types/DisplayRoutes";
import { GeoJSONSourceWithLayers } from "../../shared";

const buildRouteSectionsFromRoute = <
    S extends SectionProps = SectionProps,
    D extends DisplaySectionProps = DisplaySectionProps
>(
    route: Route<DisplayRouteProps>,
    sectionType: SectionType,
    displaySectionPropsBuilder?: (
        sectionProps: S,
        routeProps?: DisplayRouteProps
    ) => Omit<D, "routeStyle" | "routeIndex">
): RouteSection<D>[] =>
    (route.properties.sections[sectionType] as S[])?.map((sectionProps) => ({
        type: "Feature",
        id: sectionProps.id,
        geometry: {
            type: "LineString",
            coordinates: route.geometry.coordinates.slice(sectionProps.startPointIndex, sectionProps.endPointIndex)
        },
        properties: {
            ...(displaySectionPropsBuilder ? displaySectionPropsBuilder(sectionProps, route.properties) : sectionProps),
            routeStyle: route.properties.routeStyle,
            ...(!isNil(route.properties.index) && { routeIndex: route.properties.index })
        } as D
    })) || [];

/**
 * Builds display-ready LineString features to render the sections of a given type, from the given route.
 * @param routes The routes from which to extract the section props.
 * @param sectionType The type of the sections to extract.
 * @param displaySectionPropsBuilder An optional function which will convert each section props into an extended display-ready version.
 * @ignore
 */
export const buildDisplayRouteSections = <
    S extends SectionProps = SectionProps,
    D extends DisplaySectionProps = DisplaySectionProps
>(
    routes: Routes<DisplayRouteProps>,
    sectionType: SectionType,
    displaySectionPropsBuilder?: (
        sectionProps: S,
        routeProps?: DisplayRouteProps
    ) => Omit<D, "routeStyle" | "routeIndex">
): RouteSections<D> => ({
    type: "FeatureCollection",
    features: routes.features.flatMap((route) =>
        buildRouteSectionsFromRoute<S, D>(route, sectionType, displaySectionPropsBuilder)
    )
});

/**
 * @ignore
 */
export const rebuildSectionsWithSelection = (
    routes: Routes<DisplayRouteProps>,
    sections: RouteSections
): RouteSections => ({
    ...sections,
    features: sections.features.map((section) => ({
        ...section,
        properties: {
            ...section.properties,
            routeStyle: routes.features[section.properties.routeIndex || 0].properties.routeStyle
        }
    }))
});

/**
 * @ignore
 */
export const showSectionsWithRouteSelection = (
    routesWithSelection: Routes<DisplayRouteProps>,
    sourceWithLayers: GeoJSONSourceWithLayers<RouteSections>
): void => sourceWithLayers.show(rebuildSectionsWithSelection(routesWithSelection, sourceWithLayers.shownFeatures));
