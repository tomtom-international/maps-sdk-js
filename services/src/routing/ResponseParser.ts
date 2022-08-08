import { DelayMagnitude, Route, Sections, SectionType, Summary, TravelMode } from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";
import { CalculateRouteResponse } from "./CalculateRoute";
import { APICalculateRouteResult, APIRoute, APIRouteLeg, APIRouteSection, APIRouteSummary } from "./types/APITypes";
import { LineString } from "geojson";
import { CountrySection, LegSection, Section, TrafficSection, TravelModeSection } from "core/src/types/route/Sections";

const parseSummary = (apiSummary: APIRouteSummary): Summary => ({
    ...apiSummary,
    departureTime: new Date(apiSummary.departureTime),
    arrivalTime: new Date(apiSummary.arrivalTime)
});

const parseRoutePath = (apiRouteLegs: APIRouteLeg[]): LineString => ({
    type: "LineString",
    coordinates: apiRouteLegs.flatMap((apiLeg) =>
        apiLeg.points?.map((apiPoint) => [apiPoint.longitude, apiPoint.latitude])
    )
});

const parseLegSections = (apiLegs: APIRouteLeg[]): LegSection[] =>
    apiLegs.reduce<LegSection[]>((accumulatedParsedLegs, nextApiLeg, currentIndex) => {
        const lastLegEndPointIndex = currentIndex === 0 ? 0 : accumulatedParsedLegs[currentIndex - 1]?.endPointIndex;
        const endPointIndex = !isNil(lastLegEndPointIndex) && lastLegEndPointIndex + nextApiLeg.points?.length;
        accumulatedParsedLegs.push({
            ...(!isNil(lastLegEndPointIndex) && { startPointIndex: lastLegEndPointIndex }),
            ...(endPointIndex && { endPointIndex }),
            summary: parseSummary(nextApiLeg.summary)
        });
        return accumulatedParsedLegs;
    }, []);

const toSection = (apiSection: APIRouteSection): Section => ({
    startPointIndex: apiSection.startPointIndex,
    endPointIndex: apiSection.endPointIndex
});

const toCountrySection = (apiSection: APIRouteSection): CountrySection => ({
    ...toSection(apiSection),
    countryCodeISO3: apiSection.countryCode as string
});

const toTravelModeSection = (apiSection: APIRouteSection): TravelModeSection => ({
    ...toSection(apiSection),
    travelMode: apiSection.travelMode as TravelMode
});

const parseMagnitudeOfDelay = (apiDelayMagnitude?: number): DelayMagnitude => {
    switch (apiDelayMagnitude) {
        case 0:
            return "UNKNOWN";
        case 1:
            return "MINOR";
        case 2:
            return "MODERATE";
        case 3:
            return "MAJOR";
        default:
            return "UNDEFINED";
    }
};

const toTrafficSection = (apiSection: APIRouteSection): TrafficSection => ({
    ...toSection(apiSection),
    delayInSeconds: apiSection.delayInSeconds,
    effectiveSpeedInKmh: apiSection.effectiveSpeedInKmh,
    simpleCategory: apiSection.simpleCategory,
    magnitudeOfDelay: parseMagnitudeOfDelay(apiSection.magnitudeOfDelay),
    tec: apiSection.tec
});

const ensureInit = <S extends Section>(sectionType: SectionType, result: Sections): S[] => {
    if (!result[sectionType]) {
        result[sectionType] = [];
    }
    return result[sectionType] as S[];
};

const getSectionMapping = (
    apiSection: APIRouteSection
): { sectionType: SectionType; mappingFunction: (apiSection: APIRouteSection) => Section } => {
    switch (apiSection.sectionType) {
        case "CAR_TRAIN":
            return { sectionType: "carTrain", mappingFunction: toSection };
        case "COUNTRY":
            return { sectionType: "country", mappingFunction: toCountrySection };
        case "FERRY":
            return { sectionType: "ferry", mappingFunction: toSection };
        case "MOTORWAY":
            return { sectionType: "motorway", mappingFunction: toSection };
        case "PEDESTRIAN":
            return { sectionType: "pedestrian", mappingFunction: toSection };
        case "TOLL_ROAD":
            return { sectionType: "tollRoad", mappingFunction: toSection };
        case "TOLL_VIGNETTE":
            return { sectionType: "tollVignette", mappingFunction: toCountrySection };
        case "TRAFFIC":
            return { sectionType: "traffic", mappingFunction: toTrafficSection };
        case "TRAVEL_MODE":
            return { sectionType: "travelMode", mappingFunction: toTravelModeSection };
        case "TUNNEL":
            return { sectionType: "tunnel", mappingFunction: toSection };
        case "UNPAVED":
            return { sectionType: "unpaved", mappingFunction: toSection };
        case "URBAN":
            return { sectionType: "urban", mappingFunction: toSection };
    }
};

const parseSectionsAndAppendToResult = (apiSections: APIRouteSection[], result: Sections): void => {
    for (const apiSection of apiSections) {
        const sectionMapping = getSectionMapping(apiSection);
        ensureInit(sectionMapping.sectionType, result).push(sectionMapping.mappingFunction(apiSection));
    }
};

const parseSections = (apiRoute: APIRoute): Sections => {
    const result = {
        leg: parseLegSections(apiRoute.legs)
        // (the rest of sections are parsed below)
    } as Sections;
    parseSectionsAndAppendToResult(apiRoute.sections, result);
    return result;
};

const parseRoute = (apiRoute: APIRoute): Route => ({
    type: "Feature",
    geometry: parseRoutePath(apiRoute.legs),
    properties: {
        summary: parseSummary(apiRoute.summary),
        sections: parseSections(apiRoute),
        guidance: apiRoute.guidance
    }
});

export const parseCalculateRouteResponse = (apiResponse: APICalculateRouteResult): CalculateRouteResponse => ({
    routes: {
        type: "FeatureCollection",
        features: apiResponse.routes.map(parseRoute)
    }
});
