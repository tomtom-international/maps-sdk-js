import {
    bboxFromGeoJSON,
    CountrySectionProps,
    DelayMagnitude,
    Guidance,
    LegSectionProps,
    Route,
    SectionProps,
    SectionsProps,
    SectionType,
    Summary,
    TrafficCategory,
    TrafficIncidentTEC,
    TrafficSectionProps
} from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";
import { LineString } from "geojson";

import { CalculateRouteResponse } from "./CalculateRoute";
import { CalculateRouteResponseAPI, GuidanceAPI, LegAPI, RouteAPI, SectionAPI, SummaryAPI } from "./types/APITypes";

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

const parseLegSectionProps = (apiLegs: LegAPI[]): LegSectionProps[] =>
    apiLegs.reduce<LegSectionProps[]>((accumulatedParsedLegs, nextApiLeg, currentIndex) => {
        const lastLegEndPointIndex = currentIndex === 0 ? 0 : accumulatedParsedLegs[currentIndex - 1]?.endPointIndex;
        const endPointIndex = !isNil(lastLegEndPointIndex) && lastLegEndPointIndex + nextApiLeg.points?.length;
        accumulatedParsedLegs.push({
            ...(!isNil(lastLegEndPointIndex) && { startPointIndex: lastLegEndPointIndex }),
            ...(endPointIndex && { endPointIndex }),
            summary: parseSummary(nextApiLeg.summary)
        });
        return accumulatedParsedLegs;
    }, []);

const toSectionProps = (apiSection: SectionAPI): SectionProps => ({
    startPointIndex: apiSection.startPointIndex,
    endPointIndex: apiSection.endPointIndex
});

const toCountrySectionProps = (apiSection: SectionAPI): CountrySectionProps => ({
    ...toSectionProps(apiSection),
    countryCodeISO3: apiSection.countryCode as string
});

const toVehicleRestrictedSectionProps = (apiSection: SectionAPI): SectionProps | null =>
    apiSection.travelMode === "other" ? toSectionProps(apiSection) : null;

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

const toTrafficSectionProps = (apiSection: SectionAPI): TrafficSectionProps => ({
    ...toSectionProps(apiSection),
    delayInSeconds: apiSection.delayInSeconds,
    effectiveSpeedInKmh: apiSection.effectiveSpeedInKmh,
    simpleCategory: apiSection.simpleCategory as TrafficCategory,
    magnitudeOfDelay: parseMagnitudeOfDelay(apiSection.magnitudeOfDelay),
    tec: apiSection.tec as TrafficIncidentTEC
});

const ensureInit = <S extends SectionProps>(sectionType: SectionType, result: SectionsProps): S[] => {
    if (!result[sectionType]) {
        result[sectionType] = [];
    }
    return result[sectionType] as S[];
};

const getSectionMapping = (
    apiSection: SectionAPI
): { sectionType: SectionType; mappingFunction: (apiSection: SectionAPI) => SectionProps | null } => {
    switch (apiSection.sectionType) {
        case "CAR_TRAIN":
            return { sectionType: "carTrain", mappingFunction: toSectionProps };
        case "COUNTRY":
            return { sectionType: "country", mappingFunction: toCountrySectionProps };
        case "FERRY":
            return { sectionType: "ferry", mappingFunction: toSectionProps };
        case "MOTORWAY":
            return { sectionType: "motorway", mappingFunction: toSectionProps };
        case "PEDESTRIAN":
            return { sectionType: "pedestrian", mappingFunction: toSectionProps };
        case "TOLL_ROAD":
            return { sectionType: "tollRoad", mappingFunction: toSectionProps };
        case "TOLL_VIGNETTE":
            return { sectionType: "tollVignette", mappingFunction: toCountrySectionProps };
        case "TRAFFIC":
            return { sectionType: "traffic", mappingFunction: toTrafficSectionProps };
        case "TRAVEL_MODE":
            // NOTE: vehicleRestricted sections come from TRAVEL_MODE "other" ones:
            return { sectionType: "vehicleRestricted", mappingFunction: toVehicleRestrictedSectionProps };
        case "TUNNEL":
            return { sectionType: "tunnel", mappingFunction: toSectionProps };
        case "UNPAVED":
            return { sectionType: "unpaved", mappingFunction: toSectionProps };
        case "URBAN":
            return { sectionType: "urban", mappingFunction: toSectionProps };
        case "CARPOOL":
            return { sectionType: "carpool", mappingFunction: toSectionProps };
    }
};

const parseSectionsAndAppendToResult = (apiSections: SectionAPI[], result: SectionsProps): void => {
    for (const apiSection of apiSections) {
        const sectionMapping = getSectionMapping(apiSection);
        const mappedSection = sectionMapping.mappingFunction(apiSection);
        if (mappedSection) {
            ensureInit(sectionMapping.sectionType, result).push(mappedSection);
        }
    }
};

const parseSections = (apiRoute: RouteAPI): SectionsProps => {
    const result = {
        leg: parseLegSectionProps(apiRoute.legs)
        // (the rest of sections are parsed below)
    } as SectionsProps;
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

const parseRoute = (apiRoute: RouteAPI, index: number, apiRoutes: RouteAPI[]): Route => {
    const geometry = parseRoutePath(apiRoute.legs);
    const bbox = bboxFromGeoJSON(geometry);
    return {
        type: "Feature",
        geometry,
        ...(bbox && { bbox }),
        properties: {
            summary: parseSummary(apiRoute.summary),
            sections: parseSections(apiRoute),
            ...(apiRoute.guidance && { guidance: parseGuidance(apiRoute.guidance) }),
            ...(apiRoutes.length > 1 && { index })
        }
    };
};

/**
 * Default method for parsing calculate route request from {@link CalculateRouteResponse}
 * @group Calculate Route
 * @category Functions
 * @param apiResponse
 */
export const parseCalculateRouteResponse = (apiResponse: CalculateRouteResponseAPI): CalculateRouteResponse => {
    const features = apiResponse.routes.map(parseRoute);
    const bbox = bboxFromGeoJSON(features);
    return {
        routes: {
            type: "FeatureCollection",
            ...(bbox && { bbox }),
            features
        }
    };
};
