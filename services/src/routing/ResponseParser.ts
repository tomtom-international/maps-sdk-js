import {
    CountrySection,
    DelayMagnitude,
    LegSection,
    Guidance,
    Route,
    Section,
    Sections,
    SectionType,
    Summary,
    TrafficSection,
    TravelMode,
    TravelModeSection
} from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";
import { CalculateRouteResponse } from "./CalculateRoute";
import { CalculateRouteResponseAPI, GuidanceAPI, LegAPI, RouteAPI, SectionAPI, SummaryAPI } from "./types/APITypes";
import { LineString } from "geojson";

const parseSummary = (apiSummary: SummaryAPI): Summary => ({
    ...apiSummary,
    departureTime: new Date(apiSummary.departureTime),
    arrivalTime: new Date(apiSummary.arrivalTime)
});

const parseRoutePath = (apiRouteLegs: LegAPI[]): LineString => ({
    type: "LineString",
    coordinates: apiRouteLegs.flatMap((apiLeg) =>
        apiLeg.points?.map((apiPoint) => [apiPoint.longitude, apiPoint.latitude])
    )
});

const parseLegSections = (apiLegs: LegAPI[]): LegSection[] =>
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

const toSection = (apiSection: SectionAPI): Section => ({
    startPointIndex: apiSection.startPointIndex,
    endPointIndex: apiSection.endPointIndex
});

const toCountrySection = (apiSection: SectionAPI): CountrySection => ({
    ...toSection(apiSection),
    countryCodeISO3: apiSection.countryCode as string
});

const toTravelModeSection = (apiSection: SectionAPI): TravelModeSection => ({
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

const toTrafficSection = (apiSection: SectionAPI): TrafficSection => ({
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
    apiSection: SectionAPI
): { sectionType: SectionType; mappingFunction: (apiSection: SectionAPI) => Section } => {
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

const parseSectionsAndAppendToResult = (apiSections: SectionAPI[], result: Sections): void => {
    for (const apiSection of apiSections) {
        const sectionMapping = getSectionMapping(apiSection);
        ensureInit(sectionMapping.sectionType, result).push(sectionMapping.mappingFunction(apiSection));
    }
};

const parseSections = (apiRoute: RouteAPI): Sections => {
    const result = {
        leg: parseLegSections(apiRoute.legs)
        // (the rest of sections are parsed below)
    } as Sections;
    parseSectionsAndAppendToResult(apiRoute.sections, result);
    return result;
};

const parseGuidance = (apiGuidance: GuidanceAPI): Guidance => ({
    instructions: apiGuidance.instructions.map((apiInstruction) => ({
        ...apiInstruction,
        point: [apiInstruction.point.longitude, apiInstruction.point.latitude]
    })),
    instructionGroups: apiGuidance.instructionGroups
});

const parseRoute = (apiRoute: RouteAPI): Route => ({
    type: "Feature",
    geometry: parseRoutePath(apiRoute.legs),
    properties: {
        summary: parseSummary(apiRoute.summary),
        sections: parseSections(apiRoute),
        ...(apiRoute.guidance && { guidance: parseGuidance(apiRoute.guidance) })
    }
});

export const parseCalculateRouteResponse = (apiResponse: CalculateRouteResponseAPI): CalculateRouteResponse => ({
    routes: {
        type: "FeatureCollection",
        features: apiResponse.routes.map(parseRoute)
    }
});
