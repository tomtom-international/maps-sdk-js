import { Route, Routes, SectionProps, SectionType } from "@anw/go-sdk-js/core";
import { RouteSection, RouteSections } from "../types/RouteSections";

const buildRouteSectionsFromRoute = <S extends SectionProps = SectionProps, D extends S = S>(
    route: Route,
    sectionType: SectionType,
    displaySectionPropsBuilder?: (section: S) => D
): RouteSection<D>[] =>
    (route.properties.sections[sectionType] as S[])?.map((section) => ({
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: route.geometry.coordinates.slice(section.startPointIndex, section.endPointIndex)
        },
        properties: displaySectionPropsBuilder ? displaySectionPropsBuilder(section) : (section as D)
    })) || [];

/**
 * Builds display-ready LineString features to render the sections of a given type, from the given route.
 * @param routes The routes from which to extract the section props.
 * @param sectionType The type of the sections to extract.
 * @param displaySectionPropsBuilder An optional function which will convert each section props into an extended display-ready version.
 * @ignore
 */
export const buildRouteSections = <S extends SectionProps = SectionProps, D extends S = S>(
    routes: Routes,
    sectionType: SectionType,
    displaySectionPropsBuilder?: (section: S) => D
): RouteSections<D> => ({
    type: "FeatureCollection",
    features: routes.features.flatMap((route) =>
        buildRouteSectionsFromRoute<S, D>(route, sectionType, displaySectionPropsBuilder)
    )
});
