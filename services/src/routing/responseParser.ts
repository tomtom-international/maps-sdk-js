import {
    bboxFromGeoJSON,
    type ChargingStop,
    type CountrySectionProps,
    type CurrentType,
    type Guidance,
    generateId,
    type ImportantRoadStretchProps,
    type Instruction,
    indexedMagnitudes,
    type LaneDirection,
    type LaneSectionProps,
    type LegSectionProps,
    type LegSummary,
    type PossibleLaneSeparator,
    type RoadShieldReference,
    type RoadShieldSectionProps,
    type Route,
    type RouteSummary,
    type Routes,
    type SectionProps,
    type SectionsProps,
    type SectionType,
    type SpeedLimitSectionProps,
    type TrafficCategory,
    type TrafficIncidentTEC,
    type TrafficSectionProps,
} from '@tomtom-org/maps-sdk/core';
import type { LineString, Position } from 'geojson';
import { isNil, omit } from 'lodash-es';
import { toChargingSpeed } from '../shared/ev';
import { ExplicitVehicleModel } from '../shared/types/vehicleModel';
import {
    CalculateRouteResponseAPI,
    ChargingStopAPI,
    CurrentTypeAPI,
    GuidanceAPI,
    LegAPI,
    RouteAPI,
    RoutePathPointAPI,
    SectionAPI,
    SummaryAPI,
} from './types/apiResponseTypes';
import { CalculateRouteParams } from './types/calculateRouteParams';

const toCurrentType = (apiCurrentType: CurrentTypeAPI): CurrentType | undefined => {
    switch (apiCurrentType) {
        case 'Direct_Current':
            return 'DC';
        case 'Alternating_Current_1_Phase':
            return 'AC1';
        case 'Alternating_Current_3_Phase':
            return 'AC3';
        default:
            return undefined;
    }
};

const toChargingStop = (
    chargingInformationAtEndOfLeg: ChargingStopAPI,
    maxChargeKWH: number | undefined,
): ChargingStop => {
    const chargingConnectionInfo = chargingInformationAtEndOfLeg.chargingConnectionInfo;
    const chargingParkLocation = chargingInformationAtEndOfLeg.chargingParkLocation;
    const coordinates = [chargingParkLocation.coordinate.longitude, chargingParkLocation.coordinate.latitude];

    // Build freeformAddress from available components
    const addressParts = [chargingParkLocation.street, chargingParkLocation.houseNumber].filter(Boolean);
    const freeformAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

    return {
        type: 'Feature',
        id: chargingInformationAtEndOfLeg.chargingParkId,
        geometry: { type: 'Point', coordinates },
        properties: {
            ...omit(chargingInformationAtEndOfLeg, ['chargingConnectionInfo', 'chargingParkLocation']),
            type: 'POI',
            address: {
                freeformAddress,
                ...(chargingParkLocation.street && { streetName: chargingParkLocation.street }),
                ...(chargingParkLocation.houseNumber && { streetNumber: chargingParkLocation.houseNumber }),
                ...(chargingParkLocation.city && { municipality: chargingParkLocation.city }),
                ...(chargingParkLocation.region && { countrySubdivision: chargingParkLocation.region }),
                ...(chargingParkLocation.postalCode && { postalCode: chargingParkLocation.postalCode }),
                ...(chargingParkLocation.country && { country: chargingParkLocation.country }),
            },
            ...(chargingConnectionInfo && {
                chargingConnectionInfo: {
                    plugType: chargingConnectionInfo.chargingPlugType,
                    currentInA: chargingConnectionInfo.chargingCurrentInA,
                    voltageInV: chargingConnectionInfo.chargingVoltageInV,
                    chargingPowerInkW: chargingConnectionInfo.chargingPowerInkW,
                    currentType: toCurrentType(chargingConnectionInfo.chargingCurrentType),
                    chargingSpeed: toChargingSpeed(chargingConnectionInfo.chargingPowerInkW),
                },
            }),
            ...(maxChargeKWH && {
                targetChargeInPCT: (100 * chargingInformationAtEndOfLeg.targetChargeInkWh) / maxChargeKWH,
            }),
            ...(chargingInformationAtEndOfLeg.chargingParkPowerInkW && {
                chargingParkSpeed: toChargingSpeed(chargingInformationAtEndOfLeg.chargingParkPowerInkW),
            }),
        },
    };
};

const parseSummary = (apiSummary: SummaryAPI, params: CalculateRouteParams): RouteSummary | LegSummary => {
    const maxChargeKWH = (params?.vehicle?.model as ExplicitVehicleModel<'electric'>)?.engine?.charging?.maxChargeKWH;
    return {
        lengthInMeters: apiSummary.lengthInMeters,
        historicTrafficTravelTimeInSeconds: apiSummary.historicTrafficTravelTimeInSeconds,
        liveTrafficIncidentsTravelTimeInSeconds: apiSummary.liveTrafficIncidentsTravelTimeInSeconds,
        noTrafficTravelTimeInSeconds: apiSummary.noTrafficTravelTimeInSeconds,
        trafficDelayInSeconds: apiSummary.trafficDelayInSeconds,
        trafficLengthInMeters: apiSummary.trafficLengthInMeters,
        travelTimeInSeconds: apiSummary.travelTimeInSeconds,
        departureTime: new Date(apiSummary.departureTime),
        arrivalTime: new Date(apiSummary.arrivalTime),
        deviationDistanceInMeters: apiSummary.deviationDistance,
        fuelConsumptionInLiters: apiSummary.fuelConsumptionInLiters,
        ...(apiSummary.deviationPoint && {
            deviationPoint: [apiSummary.deviationPoint.longitude, apiSummary.deviationPoint.latitude],
        }),
        // EV-specific fields:
        totalChargingTimeInSeconds: apiSummary.totalChargingTimeInSeconds,
        batteryConsumptionInkWh: apiSummary.batteryConsumptionInkWh,
        ...(maxChargeKWH &&
            apiSummary.batteryConsumptionInkWh && {
                batteryConsumptionInPCT: (100 * apiSummary.batteryConsumptionInkWh) / maxChargeKWH,
            }),
        remainingChargeAtArrivalInkWh: apiSummary.remainingChargeAtArrivalInkWh,
        ...(maxChargeKWH &&
            apiSummary.remainingChargeAtArrivalInkWh && {
                remainingChargeAtArrivalInPCT: (100 * apiSummary.remainingChargeAtArrivalInkWh) / maxChargeKWH,
            }),
        ...(apiSummary.chargingInformationAtEndOfLeg && {
            chargingInformationAtEndOfLeg: toChargingStop(apiSummary.chargingInformationAtEndOfLeg, maxChargeKWH),
        }),
    };
};

const parseRoutePath = (apiRouteLegs: LegAPI[]): LineString => ({
    type: 'LineString',
    coordinates: apiRouteLegs.flatMap((apiLeg) =>
        apiLeg.points?.map((apiPoint) => [apiPoint.longitude, apiPoint.latitude]),
    ),
});

const parseLegSectionProps = (apiLegs: LegAPI[], params: CalculateRouteParams): LegSectionProps[] =>
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
            summary: parseSummary(nextApiLeg.summary, params),
            id: generateId(),
        });
        return accumulatedParsedLegs;
    }, []);

const toSectionProps = (apiSection: SectionAPI): SectionProps => ({
    id: generateId(),
    startPointIndex: apiSection.startPointIndex,
    endPointIndex: apiSection.endPointIndex,
});

const toRoadStretchSectionProps = (apiSection: SectionAPI): ImportantRoadStretchProps => ({
    ...toSectionProps(apiSection),
    index: apiSection.importantRoadStretchIndex as number,
    streetName: apiSection.streetName?.text,
    roadNumbers: apiSection.roadNumbers?.map((roadNumber) => roadNumber.text),
});

const toCountrySectionProps = (apiSection: SectionAPI): CountrySectionProps => ({
    ...toSectionProps(apiSection),
    countryCodeISO3: apiSection.countryCode as string,
});

const toVehicleRestrictedSectionProps = (apiSection: SectionAPI): SectionProps | null =>
    apiSection.travelMode === 'other' ? toSectionProps(apiSection) : null;

const calculateTrafficCategory = (tecMainCauseCode: number | undefined): TrafficCategory => {
    switch (tecMainCauseCode) {
        case 1:
            return 'jam';
        case 2:
            return 'accident';
        case 3:
            return 'roadworks';
        case 4:
            return 'narrow-lanes';
        case 5:
            return 'road-closed';
        case 9:
            return 'danger';
        case 11:
            return 'animals-on-road';
        case 13:
            return 'broken-down-vehicle';
        case 16:
            return 'lane-closed';
        case 17:
            return 'wind';
        case 18:
            return 'fog';
        case 19:
            return 'rain';
        case 22:
            return 'frost';
        case 23:
            return 'flooding';
        default:
            return 'other';
    }
};

/**
 * @ignore
 */
export const toTrafficCategories = (apiSection: SectionAPI): TrafficCategory[] => {
    if (apiSection.tec?.causes?.length) {
        return apiSection.tec.causes.map((cause) => calculateTrafficCategory(cause.mainCauseCode));
    }
    // else
    switch (apiSection.simpleCategory) {
        case 'JAM':
            return ['jam'];
        case 'ROAD_WORK':
            return ['roadworks'];
        case 'ROAD_CLOSURE':
            return ['road-closed'];
        default:
            return ['other'];
    }
};

const toTrafficSectionProps = (apiSection: SectionAPI): TrafficSectionProps => ({
    ...toSectionProps(apiSection),
    delayInSeconds: apiSection.delayInSeconds,
    effectiveSpeedInKmh: apiSection.effectiveSpeedInKmh,
    categories: toTrafficCategories(apiSection),
    magnitudeOfDelay: indexedMagnitudes[apiSection.magnitudeOfDelay as number],
    tec: apiSection.tec as TrafficIncidentTEC,
});

const toLaneSectionProps = (apiSection: SectionAPI): LaneSectionProps => ({
    ...toSectionProps(apiSection),
    lanes: apiSection.lanes as LaneDirection[],
    laneSeparators: apiSection.laneSeparators as PossibleLaneSeparator[],
    properties: apiSection.properties,
});

const toSpeedLimitSectionProps = (apiSection: SectionAPI): SpeedLimitSectionProps => ({
    ...toSectionProps(apiSection),
    maxSpeedLimitInKmh: apiSection.maxSpeedLimitInKmh as number,
});

const toRoadShieldsSectionProps = (apiSection: SectionAPI): RoadShieldSectionProps => ({
    ...toSectionProps(apiSection),
    roadShieldReferences: apiSection.roadShieldReferences as RoadShieldReference[],
});

const ensureInit = <S extends SectionProps>(sectionType: SectionType, result: SectionsProps): S[] => {
    if (!result[sectionType]) {
        result[sectionType] = [];
    }
    return result[sectionType] as S[];
};

const getSectionMapping = (
    apiSection: SectionAPI,
): { sectionType: SectionType; mappingFunction: (apiSection: SectionAPI) => SectionProps | null } => {
    switch (apiSection.sectionType) {
        case 'CAR_TRAIN':
            return { sectionType: 'carTrain', mappingFunction: toSectionProps };
        case 'COUNTRY':
            return { sectionType: 'country', mappingFunction: toCountrySectionProps };
        case 'FERRY':
            return { sectionType: 'ferry', mappingFunction: toSectionProps };
        case 'MOTORWAY':
            return { sectionType: 'motorway', mappingFunction: toSectionProps };
        case 'PEDESTRIAN':
            return { sectionType: 'pedestrian', mappingFunction: toSectionProps };
        case 'TOLL_VIGNETTE':
            return { sectionType: 'tollVignette', mappingFunction: toCountrySectionProps };
        case 'TOLL':
            return { sectionType: 'toll', mappingFunction: toSectionProps };
        case 'TRAFFIC':
            return { sectionType: 'traffic', mappingFunction: toTrafficSectionProps };
        case 'TRAVEL_MODE':
            // NOTE: vehicleRestricted sections come from TRAVEL_MODE "other" ones:
            return { sectionType: 'vehicleRestricted', mappingFunction: toVehicleRestrictedSectionProps };
        case 'TUNNEL':
            return { sectionType: 'tunnel', mappingFunction: toSectionProps };
        case 'UNPAVED':
            return { sectionType: 'unpaved', mappingFunction: toSectionProps };
        case 'URBAN':
            return { sectionType: 'urban', mappingFunction: toSectionProps };
        case 'CARPOOL':
            return { sectionType: 'carpool', mappingFunction: toSectionProps };
        case 'LOW_EMISSION_ZONE':
            return { sectionType: 'lowEmissionZone', mappingFunction: toSectionProps };
        case 'LANES':
            return { sectionType: 'lanes', mappingFunction: toLaneSectionProps };
        case 'SPEED_LIMIT':
            return { sectionType: 'speedLimit', mappingFunction: toSpeedLimitSectionProps };
        case 'ROAD_SHIELDS':
            return { sectionType: 'roadShields', mappingFunction: toRoadShieldsSectionProps };
        case 'IMPORTANT_ROAD_STRETCH':
            return { sectionType: 'importantRoadStretch', mappingFunction: toRoadStretchSectionProps };
    }
};

const parseSectionsAndAppendToResult = (apiSections: SectionAPI[], result: SectionsProps): void => {
    if (!Array.isArray(apiSections)) {
        return;
    }

    for (const apiSection of apiSections) {
        const sectionMapping = getSectionMapping(apiSection);
        const mappedSection = sectionMapping?.mappingFunction(apiSection);
        if (mappedSection) {
            ensureInit(sectionMapping.sectionType, result).push(mappedSection);
        }
    }
};

const parseSections = (apiRoute: RouteAPI, params: CalculateRouteParams): SectionsProps => {
    const result = {
        leg: parseLegSectionProps(apiRoute.legs, params),
        // (the rest of sections are parsed below)
    } as SectionsProps;
    parseSectionsAndAppendToResult(apiRoute.sections, result);
    return result;
};

const DELTA = 0.0001;

const similar = (a: Position, b: Position): boolean => Math.abs(a[0] - b[0]) < DELTA && Math.abs(a[1] - b[1]) < DELTA;

const parseGuidance = (apiGuidance: GuidanceAPI, path: Position[]): Guidance => {
    const instructions: Instruction[] = [];
    let lastInstructionPathIndex = 0;

    for (const apiInstruction of apiGuidance.instructions) {
        const maneuverPoint = [apiInstruction.maneuverPoint.longitude, apiInstruction.maneuverPoint.latitude];

        // we determine the path point index for the instruction by matching maneuverPoint to the path:
        for (let pathIndex = lastInstructionPathIndex; pathIndex < path.length; pathIndex++) {
            if (similar(path[pathIndex], maneuverPoint)) {
                lastInstructionPathIndex = pathIndex;
                break;
            }
            if (pathIndex === path.length - 1) {
                // (we do not advance lastInstructionPathIndex here to prevent missing a whole path section while mapping following instructions)
                break;
            }
        }
        instructions.push({
            ...apiInstruction,
            maneuverPoint,
            pathPointIndex: lastInstructionPathIndex,
            routePath: apiInstruction.routePath.map((apiPoint: RoutePathPointAPI) => ({
                ...apiPoint,
                point: [apiPoint.point.longitude, apiPoint.point.latitude],
            })),
        });
    }

    return { instructions };
};

const parseRoute = (apiRoute: RouteAPI, index: number, params: CalculateRouteParams): Route => {
    const geometry = parseRoutePath(apiRoute.legs);
    const bbox = bboxFromGeoJSON(geometry);
    const id = generateId();
    return {
        type: 'Feature',
        geometry,
        id,
        ...(bbox && { bbox }),
        properties: {
            id,
            index,
            summary: parseSummary(apiRoute.summary, params),
            sections: parseSections(apiRoute, params),
            ...(apiRoute.guidance && { guidance: parseGuidance(apiRoute.guidance, geometry.coordinates) }),
            ...(apiRoute.progress && { progress: apiRoute.progress }),
        },
    };
};

/**
 * Default method for parsing calculate route response from {@link CalculateRouteResponseAPI}
 * @param apiResponse The Routing API response.
 * @param params The params used to calculate this route.
 */
export const parseCalculateRouteResponse = (
    apiResponse: CalculateRouteResponseAPI,
    params: CalculateRouteParams,
): Routes => {
    const features = apiResponse.routes.map((apiRoute, index) => parseRoute(apiRoute, index, params));
    const bbox = bboxFromGeoJSON(features);
    return { type: 'FeatureCollection', ...(bbox && { bbox }), features };
};
