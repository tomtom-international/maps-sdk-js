import {
    bboxFromGeoJSON,
    CountrySectionProps,
    CurrentType,
    Guidance,
    indexedMagnitudes,
    LegSectionProps,
    LegSummary,
    Route,
    Routes,
    RouteSummary,
    SectionProps,
    SectionsProps,
    SectionType,
    TrafficCategory,
    TrafficIncidentTEC,
    TrafficSectionProps,
    LaneDirection,
    LaneSectionProps,
    PossibleLaneSeparator,
    RoadShieldReference,
    RoadShieldSectionProps,
    SpeedLimitSectionProps,
    Instruction
} from "@anw/maps-sdk-js/core";
import omit from "lodash/omit";
import isNil from "lodash/isNil";
import { LineString, Position } from "geojson";
import {
    CalculateRouteResponseAPI,
    CurrentTypeAPI,
    GuidanceAPI,
    LegAPI,
    RouteAPI,
    RoutePathPointAPI,
    SectionAPI,
    SummaryAPI,
    TrafficCategoryAPI
} from "./types/apiResponseTypes";
import { generateId } from "../shared/generateId";

const toCurrentType = (apiCurrentType: CurrentTypeAPI): CurrentType | undefined => {
    switch (apiCurrentType) {
        case "Direct_Current":
            return "DC";
        case "Alternating_Current_1_Phase":
            return "AC1";
        case "Alternating_Current_3_Phase":
            return "AC3";
        default:
            return undefined;
    }
};

const parseSummary = (apiSummary: SummaryAPI): RouteSummary | LegSummary => {
    const chargingConnectionInfo = apiSummary.chargingInformationAtEndOfLeg?.chargingConnectionInfo;
    const chargingParkLocation = apiSummary.chargingInformationAtEndOfLeg?.chargingParkLocation;
    return {
        ...apiSummary,
        departureTime: new Date(apiSummary.departureTime),
        arrivalTime: new Date(apiSummary.arrivalTime),
        ...(apiSummary.chargingInformationAtEndOfLeg && {
            chargingInformationAtEndOfLeg: {
                ...omit(apiSummary.chargingInformationAtEndOfLeg, ["chargingConnectionInfo", "chargingParkLocation"]),
                ...(chargingParkLocation && {
                    chargingParkLocation: {
                        ...omit(chargingParkLocation, "coordinate"),
                        coordinates: [
                            chargingParkLocation.coordinate.longitude,
                            chargingParkLocation.coordinate.latitude
                        ]
                    }
                }),
                ...(chargingConnectionInfo && {
                    chargingConnectionInfo: {
                        plugType: chargingConnectionInfo.chargingPlugType,
                        currentInA: chargingConnectionInfo.chargingCurrentInA,
                        voltageInV: chargingConnectionInfo.chargingVoltageInV,
                        chargingPowerInkW: chargingConnectionInfo.chargingPowerInkW,
                        currentType: toCurrentType(chargingConnectionInfo.chargingCurrentType)
                    }
                })
            }
        })
    };
};

const parseRoutePath = (apiRouteLegs: LegAPI[]): LineString => ({
    type: "LineString",
    coordinates: apiRouteLegs.flatMap((apiLeg) =>
        apiLeg.points?.map((apiPoint) => [apiPoint.longitude, apiPoint.latitude])
    )
});

const parseLegSectionProps = (apiLegs: LegAPI[] /*, params: CalculateRouteParams*/): LegSectionProps[] =>
    apiLegs.reduce<LegSectionProps[]>((accumulatedParsedLegs, nextApiLeg, currentIndex) => {
        const lastLegEndPointIndex = currentIndex === 0 ? 0 : accumulatedParsedLegs[currentIndex - 1]?.endPointIndex;
        let endPointIndex;
        if (!isNil(lastLegEndPointIndex)) {
            if (lastLegEndPointIndex === 0) {
                // in case of first or only leg, we reduce the length by one to be consistent with other sections
                // endPointIndex is inclusive
                endPointIndex = nextApiLeg.points?.length > 0 ? nextApiLeg.points.length - 1 : 0;
            } else {
                endPointIndex = lastLegEndPointIndex + nextApiLeg.points?.length;
            }
        }
        accumulatedParsedLegs.push({
            ...(!isNil(lastLegEndPointIndex) && { startPointIndex: lastLegEndPointIndex }),
            ...(endPointIndex && { endPointIndex }),
            summary: parseSummary(nextApiLeg.summary /*, params*/),
            id: generateId()
        });
        return accumulatedParsedLegs;
    }, []);

const toSectionProps = (apiSection: SectionAPI): SectionProps => ({
    id: generateId(),
    startPointIndex: apiSection.startPointIndex,
    endPointIndex: apiSection.endPointIndex
});

const toCountrySectionProps = (apiSection: SectionAPI): CountrySectionProps => ({
    ...toSectionProps(apiSection),
    countryCodeISO3: apiSection.countryCode as string
});

const toVehicleRestrictedSectionProps = (apiSection: SectionAPI): SectionProps | null =>
    apiSection.travelMode === "other" ? toSectionProps(apiSection) : null;

const toTrafficSectionProps = (apiSection: SectionAPI): TrafficSectionProps => ({
    ...toSectionProps(apiSection),
    delayInSeconds: apiSection.delayInSeconds,
    effectiveSpeedInKmh: apiSection.effectiveSpeedInKmh,
    simpleCategory: (apiSection.simpleCategory as TrafficCategoryAPI).toLowerCase() as TrafficCategory,
    magnitudeOfDelay: indexedMagnitudes[apiSection.magnitudeOfDelay as number],
    tec: apiSection.tec as TrafficIncidentTEC
});

const toLaneSectionProps = (apiSection: SectionAPI): LaneSectionProps => ({
    ...toSectionProps(apiSection),
    lanes: apiSection.lanes as LaneDirection[],
    laneSeparators: apiSection.laneSeparators as PossibleLaneSeparator[],
    properties: apiSection.properties
});

const toSpeedLimitSectionProps = (apiSection: SectionAPI): SpeedLimitSectionProps => ({
    ...toSectionProps(apiSection),
    maxSpeedLimitInKmh: apiSection.maxSpeedLimitInKmh as number
});

const toRoadShieldsSectionProps = (apiSection: SectionAPI): RoadShieldSectionProps => ({
    ...toSectionProps(apiSection),
    roadShieldReferences: apiSection.roadShieldReferences as RoadShieldReference[]
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
        case "LOW_EMISSION_ZONE":
            return { sectionType: "lowEmissionZone", mappingFunction: toSectionProps };
        case "LANES":
            return { sectionType: "lanes", mappingFunction: toLaneSectionProps };
        case "SPEED_LIMIT":
            return { sectionType: "speedLimit", mappingFunction: toSpeedLimitSectionProps };
        case "ROAD_SHIELDS":
            return { sectionType: "roadShields", mappingFunction: toRoadShieldsSectionProps };
    }
};

const parseSectionsAndAppendToResult = (apiSections: SectionAPI[], result: SectionsProps): void => {
    if (!Array.isArray(apiSections)) {
        return;
    }

    for (const apiSection of apiSections) {
        const sectionMapping = getSectionMapping(apiSection);
        const mappedSection = sectionMapping.mappingFunction(apiSection);
        if (mappedSection) {
            ensureInit(sectionMapping.sectionType, result).push(mappedSection);
        }
    }
};

const parseSections = (apiRoute: RouteAPI /*, params: CalculateRouteParams*/): SectionsProps => {
    const result = {
        leg: parseLegSectionProps(apiRoute.legs /*, params*/)
        // (the rest of sections are parsed below)
    } as SectionsProps;
    parseSectionsAndAppendToResult(apiRoute.sections, result);
    return result;
};

const parseGuidance = (apiGuidance: GuidanceAPI, path: Position[]): Guidance => {
    const instructions: Instruction[] = [];
    let lastInstructionPathIndex = 0;

    for (const apiInstruction of apiGuidance.instructions) {
        const maneuverPoint = [apiInstruction.maneuverPoint.longitude, apiInstruction.maneuverPoint.latitude];

        // we determine the path point index for the instruction by matching maneuverPoint to the path:
        for (let pathIndex = lastInstructionPathIndex; pathIndex < path.length; pathIndex++) {
            const pathPoint = path[pathIndex];
            if (
                (pathPoint[0] == maneuverPoint[0] && pathPoint[1] == maneuverPoint[1]) ||
                pathIndex == path.length - 1
            ) {
                lastInstructionPathIndex = pathIndex;
                break;
            }
        }
        instructions.push({
            ...apiInstruction,
            maneuverPoint,
            pathPointIndex: lastInstructionPathIndex,
            routePath: apiInstruction.routePath.map((apiPoint: RoutePathPointAPI) => ({
                ...apiPoint,
                point: [apiPoint.point.longitude, apiPoint.point.latitude]
            }))
        });
    }

    return { instructions };
};

const parseRoute = (
    apiRoute: RouteAPI,
    index: number,
    apiRoutes: RouteAPI[] /*, params: CalculateRouteParams*/
): Route => {
    const geometry = parseRoutePath(apiRoute.legs);
    const bbox = bboxFromGeoJSON(geometry);
    const id = generateId();
    return {
        type: "Feature",
        geometry,
        id,
        ...(bbox && { bbox }),
        properties: {
            id,
            summary: parseSummary(apiRoute.summary),
            sections: parseSections(apiRoute),
            ...(apiRoute.guidance && { guidance: parseGuidance(apiRoute.guidance, geometry.coordinates) }),
            ...(apiRoutes.length > 1 && { index })
        }
    };
};

/**
 * Default method for parsing calculate route response from {@link CalculateRouteResponseAPI}
 * @param apiResponse The Routing API response.
 * @param params The params used to calculate this route.
 */
export const parseCalculateRouteResponse = (
    apiResponse: CalculateRouteResponseAPI
    // TODO: cleanup or restore input params to parse routing responses. They were used at least to calculate battery % from KWH values and maxCharge input.
    /*params: CalculateRouteParams*/
): Routes => {
    const features = apiResponse.routes.map((apiRoute, index, apiRoutes) =>
        parseRoute(apiRoute, index, apiRoutes /*, params*/)
    );
    const bbox = bboxFromGeoJSON(features);
    return { type: "FeatureCollection", ...(bbox && { bbox }), features };
};
