import {
    BBox,
    bboxFromGeoJSON,
    type ChargingStop,
    type CountrySectionProps,
    type CurrentType,
    type DelayMagnitude,
    type DrivingSide,
    type Guidance,
    generateId,
    type ImportantRoadStretchProps,
    type Instruction,
    type Landmark,
    type LaneDirection,
    type LaneSectionProps,
    type LegSectionProps,
    type LegSummary,
    type Maneuver,
    type PossibleLaneDirection,
    type PossibleLaneSeparator,
    type RoadInformation,
    type RoadInformationProperty,
    type RoadShield,
    type RoadShieldReference,
    type RoadShieldSectionProps,
    type Route,
    type RouteSummary,
    type Routes,
    type SectionProps,
    type SectionsProps,
    type Signpost,
    type SpeedLimitSectionProps,
    type TextWithPhonetics,
    type TollPaymentType,
    type TrafficIncidentCategory,
    type TrafficIncidentTEC,
    type TrafficSectionProps,
} from '@tomtom-org/maps-sdk/core';
import type { LineString, Position } from 'geojson';
import { isNil, omit } from 'lodash-es';
import { toChargingSpeed } from '../shared/ev';
import { toIso3 } from '../shared/iso2ToIso3';
import { ExplicitVehicleModel } from '../shared/types/vehicleModel';
import type {
    BasicSectionAPI,
    CalculateRouteResponseAPI,
    ChargingStopAPI,
    CountrySectionAPI,
    CurrentTypeAPI,
    ImportantRoadStretchSectionAPI,
    InstructionAPI,
    InstructionRoadInformationAPI,
    InstructionRoadShieldAPI,
    LanesSectionAPI,
    LegAPI,
    ProgressPointAPI,
    RouteAPI,
    SpeedLimitSectionAPI,
    SummaryAPI,
    TextWithPhoneticsAPI,
    TrafficSectionAPI,
    TravelModeSectionAPI,
} from './types/apiResponseTypes';
import type { CalculateRouteParams } from './types/calculateRouteParams';

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
        travelTimeInSeconds: apiSummary.travelDurationInSeconds,
        trafficDelayInSeconds: apiSummary.trafficDelayDurationInSeconds ?? 0,
        trafficLengthInMeters: apiSummary.trafficLengthInMeters ?? 0,
        historicTrafficTravelTimeInSeconds: apiSummary.historicTrafficTravelTimeInSeconds,
        liveTrafficIncidentsTravelTimeInSeconds: apiSummary.liveTrafficIncidentsTravelTimeInSeconds,
        noTrafficTravelTimeInSeconds: apiSummary.noTrafficTravelTimeInSeconds,
        departureTime: new Date(apiSummary.departureDateTime),
        arrivalTime: new Date(apiSummary.arrivalDateTime),
        deviationDistanceInMeters: apiSummary.deviationDistanceInMeters,
        deviationTimeInSeconds: apiSummary.deviationDurationInSeconds,
        ...(apiSummary.deviationPoint && {
            deviationPoint: apiSummary.deviationPoint.coordinates,
        }),
        fuelConsumptionInLiters: apiSummary.fuelConsumptionInLiters,
        totalChargingTimeInSeconds: apiSummary.totalChargingTimeInSeconds,
        batteryConsumptionInkWh: apiSummary.batteryConsumptionInKilowattHours ?? apiSummary.batteryConsumptionInkWh,
        ...(maxChargeKWH &&
            (() => {
                const batteryConsumption =
                    apiSummary.batteryConsumptionInKilowattHours ?? apiSummary.batteryConsumptionInkWh;
                return batteryConsumption
                    ? { batteryConsumptionInPCT: (100 * batteryConsumption) / maxChargeKWH }
                    : undefined;
            })()),
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
    coordinates: apiRouteLegs.flatMap((leg) => leg.path.coordinates),
});

const parseLegSectionProps = (apiLegs: LegAPI[], params: CalculateRouteParams): LegSectionProps[] =>
    apiLegs.reduce<LegSectionProps[]>((accumulator, leg, legIndex) => {
        const legCoordinateCount = leg.path.coordinates.length;
        const lastEndIndex = legIndex === 0 ? 0 : accumulator[legIndex - 1]?.endPointIndex;
        let endPointIndex: number | undefined;
        if (!isNil(lastEndIndex)) {
            endPointIndex =
                lastEndIndex === 0 ? Math.max(legCoordinateCount - 1, 0) : lastEndIndex + legCoordinateCount;
        }
        accumulator.push({
            ...(!isNil(lastEndIndex) && { startPointIndex: lastEndIndex }),
            ...(endPointIndex !== undefined && { endPointIndex }),
            summary: parseSummary(leg.summary, params),
            id: generateId(),
        });
        return accumulator;
    }, []);

const toSectionProps = (section: BasicSectionAPI): SectionProps => ({
    id: generateId(),
    startPointIndex: section.startPathIndex,
    endPointIndex: section.endPathIndex,
});

/**
 * Map an OrbisV3 traffic section to the SDK's semantic traffic incident categories.
 * Uses TEC main cause codes when available, falling back to the API's coarser `iconCategory`.
 * @ignore
 */
export const toTrafficCategories = (section: TrafficSectionAPI): TrafficIncidentCategory[] => {
    if (section.tec?.causes?.length) {
        return section.tec.causes.map((cause) => {
            switch (cause.mainCauseCode) {
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
        });
    }
    switch (section.iconCategory) {
        case 'jam':
            return ['jam'];
        case 'accident':
            return ['accident'];
        case 'brokenDownVehicle':
            return ['broken-down-vehicle'];
        case 'dangerousConditions':
            return ['danger'];
        case 'flooding':
            return ['flooding'];
        case 'fog':
            return ['fog'];
        case 'ice':
            return ['frost'];
        case 'laneClosed':
            return ['lane-closed'];
        case 'rain':
            return ['rain'];
        case 'roadClosed':
            return ['road-closed'];
        case 'roadWorks':
            return ['roadworks'];
        case 'wind':
            return ['wind'];
        default:
            return ['other'];
    }
};

type BasicSectionKey =
    | 'carTrain'
    | 'ferry'
    | 'tunnel'
    | 'motorway'
    | 'pedestrian'
    | 'toll'
    | 'carpool'
    | 'urban'
    | 'unpaved'
    | 'lowEmissionZone';

const parseSpeedLimitSections = (speedLimitSections: SpeedLimitSectionAPI[]): SpeedLimitSectionProps[] =>
    // V3 carries speeds under `speedRestrictions`; the SDK exposes only the maximum limit.
    speedLimitSections
        .map((speedLimit): SpeedLimitSectionProps | undefined => {
            const max = speedLimit.speedRestrictions?.find((r) => r.type === 'maximum')?.inKilometersPerHour;
            return isNil(max) ? undefined : { ...toSectionProps(speedLimit), maxSpeedLimitInKmh: max };
        })
        .filter((speedLimit): speedLimit is SpeedLimitSectionProps => !!speedLimit);

const parseLaneSections = (laneSections: LanesSectionAPI[]): LaneSectionProps[] =>
    // V3 lane directions/separators are camelCase strings; map to the SDK's UPPER_SNAKE enums.
    laneSections.map(
        (lanesSection): LaneSectionProps => ({
            ...toSectionProps(lanesSection),
            lanes: (lanesSection.lanes ?? []).map(
                (lane): LaneDirection => ({
                    directions: lane.directions.map(
                        (direction) => V3_LANE_DIRECTION_MAP[direction] ?? (direction as PossibleLaneDirection),
                    ),
                    ...(lane.follow && {
                        follow: V3_LANE_DIRECTION_MAP[lane.follow] ?? (lane.follow as PossibleLaneDirection),
                    }),
                }),
            ),
            laneSeparators: (lanesSection.laneSeparators ?? []).map(
                (separator) => V3_LANE_SEPARATOR_MAP[separator] ?? (separator as PossibleLaneSeparator),
            ),
            properties: lanesSection.properties,
        }),
    );

const parseImportantRoadStretchSections = (
    importantRoadStretchSections: ImportantRoadStretchSectionAPI[],
): ImportantRoadStretchProps[] =>
    importantRoadStretchSections.map(
        (importantRoadStretch): ImportantRoadStretchProps => ({
            ...toSectionProps(importantRoadStretch),
            index: importantRoadStretch.importantRoadStretchIndex,
            ...(importantRoadStretch.streetName && { streetName: importantRoadStretch.streetName.text }),
            ...(importantRoadStretch.roadNumbers?.length && {
                roadNumbers: importantRoadStretch.roadNumbers.map((roadNumber) => roadNumber.text),
            }),
        }),
    );

// V3 always returns every section type when sections are requested. Restore the legacy filtering by
// dropping the section keys the caller did not ask for (the always-present `leg` is kept).
const applyRequestedSectionFilter = (
    result: SectionsProps,
    sectionTypes: CalculateRouteParams['sectionTypes'],
): void => {
    if (!sectionTypes) return;
    const requested = new Set<string>(sectionTypes);
    for (const key of Object.keys(result) as (keyof SectionsProps)[]) {
        if (key !== 'leg' && !requested.has(key)) {
            delete result[key];
        }
    }
};

const parseSections = (apiRoute: RouteAPI, params: CalculateRouteParams): SectionsProps => {
    const result: SectionsProps = {
        leg: parseLegSectionProps(apiRoute.legs, params),
    };

    const sections = apiRoute.sections;
    if (!sections) return result;

    const addBasic = (key: BasicSectionKey, items?: BasicSectionAPI[]) => {
        if (items?.length) result[key] = items.map(toSectionProps);
    };

    addBasic('carTrain', sections.carTrain);
    addBasic('ferry', sections.ferry);
    addBasic('tunnel', sections.tunnel);
    addBasic('motorway', sections.motorway);
    addBasic('pedestrian', sections.pedestrian);
    addBasic('toll', sections.toll);
    addBasic('carpool', sections.carpool);
    addBasic('urban', sections.urban);
    addBasic('unpaved', sections.unpaved);
    addBasic('lowEmissionZone', sections.lowEmissionZone);

    if (sections.country?.length) {
        result.country = sections.country.map((country: CountrySectionAPI) => ({
            ...toSectionProps(country),
            countryCodeISO3: toIso3(country.countryCodeIso2 ?? ''),
        }));
    }

    if (sections.travelMode?.length) {
        result.vehicleRestricted = sections.travelMode
            .filter((travelModeSection: TravelModeSectionAPI) => travelModeSection.travelMode === 'other')
            .map(toSectionProps);
    }

    if (sections.traffic?.length) {
        result.traffic = sections.traffic.map(
            (traffic: TrafficSectionAPI): TrafficSectionProps => ({
                ...toSectionProps(traffic),
                delayInSeconds: traffic.delayDurationInSeconds,
                effectiveSpeedInKmh: traffic.effectiveSpeedInKilometersPerHour,
                categories: toTrafficCategories(traffic),
                magnitudeOfDelay: (traffic.delayMagnitude === 'undefined'
                    ? 'indefinite'
                    : traffic.delayMagnitude) as DelayMagnitude,
                tec: traffic.tec as TrafficIncidentTEC,
            }),
        );
    }

    if (sections.speedLimit?.length) {
        result.speedLimit = parseSpeedLimitSections(sections.speedLimit);
    }

    if (sections.lanes?.length) {
        result.lanes = parseLaneSections(sections.lanes);
    }

    if (sections.roadShields?.length) {
        result.roadShields = sections.roadShields.map(
            (roadShield): RoadShieldSectionProps => ({
                ...toSectionProps(roadShield),
                roadShieldReferences: roadShield.roadShieldReferences as RoadShieldReference[],
            }),
        );
    }

    if (sections.tollVignette?.length) {
        result.tollVignette = sections.tollVignette.map(
            (tollVignette: CountrySectionAPI): CountrySectionProps => ({
                ...toSectionProps(tollVignette),
                countryCodeISO3: toIso3(tollVignette.countryCodeIso2 ?? ''),
            }),
        );
    }

    if (sections.importantRoadStretch?.length) {
        result.importantRoadStretch = parseImportantRoadStretchSections(sections.importantRoadStretch);
    }

    applyRequestedSectionFilter(result, params.sectionTypes);

    return result;
};

const DELTA = 0.0001;
const similar = (pointA: Position, pointB: Position): boolean =>
    Math.abs(pointA[0] - pointB[0]) < DELTA && Math.abs(pointA[1] - pointB[1]) < DELTA;

// V3 maneuver camelCase JSON values → SDK UPPER_SNAKE_CASE Maneuver type.
// The two renamed cases: continueStraight → STRAIGHT, passTollgate → TOLLGATE.
const V3_MANEUVER_MAP: Record<string, Maneuver> = {
    depart: 'DEPART',
    waypointLeft: 'WAYPOINT_LEFT',
    waypointRight: 'WAYPOINT_RIGHT',
    waypointReached: 'WAYPOINT_REACHED',
    waypointAhead: 'WAYPOINT_AHEAD',
    arrive: 'ARRIVE',
    arriveLeft: 'ARRIVE_LEFT',
    arriveRight: 'ARRIVE_RIGHT',
    arriveAhead: 'ARRIVE_AHEAD',
    continueStraight: 'STRAIGHT',
    keepLeft: 'KEEP_LEFT',
    keepRight: 'KEEP_RIGHT',
    turnSlightRight: 'SLIGHT_RIGHT',
    turnRight: 'TURN_RIGHT',
    turnSharpRight: 'SHARP_RIGHT',
    turnSlightLeft: 'SLIGHT_LEFT',
    turnLeft: 'TURN_LEFT',
    turnSharpLeft: 'SHARP_LEFT',
    makeUTurn: 'MAKE_UTURN',
    roundaboutStraight: 'ROUNDABOUT_STRAIGHT',
    roundaboutSharpRight: 'ROUNDABOUT_SHARP_RIGHT',
    roundaboutRight: 'ROUNDABOUT_RIGHT',
    roundaboutSlightRight: 'ROUNDABOUT_SLIGHT_RIGHT',
    roundaboutSlightLeft: 'ROUNDABOUT_SLIGHT_LEFT',
    roundaboutLeft: 'ROUNDABOUT_LEFT',
    roundaboutSharpLeft: 'ROUNDABOUT_SHARP_LEFT',
    roundaboutBack: 'ROUNDABOUT_BACK',
    exitRoundabout: 'EXIT_ROUNDABOUT',
    exitMotorwayLeft: 'EXIT_MOTORWAY_LEFT',
    exitMotorwayRight: 'EXIT_MOTORWAY_RIGHT',
    switchMotorwayLeft: 'SWITCH_MOTORWAY_LEFT',
    switchMotorwayRight: 'SWITCH_MOTORWAY_RIGHT',
    enterCarpoolLaneLeft: 'ENTER_CARPOOL_LANE_LEFT',
    enterCarpoolLaneRight: 'ENTER_CARPOOL_LANE_RIGHT',
    exitCarpoolLaneLeft: 'EXIT_CARPOOL_LANE_LEFT',
    exitCarpoolLaneRight: 'EXIT_CARPOOL_LANE_RIGHT',
    mergeLeftLane: 'MERGE_LEFT_LANE',
    mergeRightLane: 'MERGE_RIGHT_LANE',
    takeShipFerry: 'TAKE_SHIP_FERRY',
    takeCarTrain: 'TAKE_CAR_TRAIN',
    leaveShipFerry: 'LEAVE_SHIP_FERRY',
    leaveCarTrain: 'LEAVE_CAR_TRAIN',
    crossBorder: 'CROSS_BORDER',
    passTollgate: 'TOLLGATE',
};

const V3_ROAD_PROPERTY_MAP: Record<string, RoadInformationProperty> = {
    urban: 'URBAN',
    motorway: 'MOTORWAY',
    controlledAccess: 'CONTROLLED_ACCESS',
};

// V3 landmark camelCase JSON values → SDK UPPER_SNAKE_CASE Landmark type.
const V3_LANDMARK_MAP: Record<string, Landmark> = {
    endOfRoad: 'END_OF_ROAD',
    atTrafficLight: 'AT_TRAFFIC_LIGHT',
    onToBridge: 'ON_TO_BRIDGE',
    onBridge: 'ON_BRIDGE',
    afterBridge: 'AFTER_BRIDGE',
    intoTunnel: 'INTO_TUNNEL',
    insideTunnel: 'INSIDE_TUNNEL',
    afterTunnel: 'AFTER_TUNNEL',
};

// V3 toll payment camelCase JSON values → SDK UPPER_SNAKE_CASE TollPaymentType.
const V3_TOLL_PAYMENT_MAP: Record<string, TollPaymentType> = {
    cashCoinsAndBills: 'CASH_COINS_AND_BILLS',
    cashBillsOnly: 'CASH_BILLS_ONLY',
    cashCoinsOnly: 'CASH_COINS_ONLY',
    cashExactChange: 'CASH_EXACT_CHANGE',
    creditCard: 'CREDIT_CARD',
    debitCard: 'DEBIT_CARD',
    travelCard: 'TRAVEL_CARD',
    etc: 'ETC',
    etcTransponder: 'ETC_TRANSPONDER',
    etcVideoCamera: 'ETC_VIDEO_CAMERA',
    subscription: 'SUBSCRIPTION',
};

// V3 lane direction camelCase JSON values → SDK UPPER_SNAKE_CASE PossibleLaneDirection.
const V3_LANE_DIRECTION_MAP: Record<string, PossibleLaneDirection> = {
    straight: 'STRAIGHT',
    slightRight: 'SLIGHT_RIGHT',
    right: 'RIGHT',
    sharpRight: 'SHARP_RIGHT',
    rightUTurn: 'RIGHT_U_TURN',
    slightLeft: 'SLIGHT_LEFT',
    left: 'LEFT',
    sharpLeft: 'SHARP_LEFT',
    leftUTurn: 'LEFT_U_TURN',
};

// V3 lane separator camelCase JSON values → SDK UPPER_SNAKE_CASE PossibleLaneSeparator.
const V3_LANE_SEPARATOR_MAP: Record<string, PossibleLaneSeparator> = {
    unknown: 'UNKNOWN',
    noMarking: 'NO_MARKING',
    longDashed: 'LONG_DASHED',
    doubleSolid: 'DOUBLE_SOLID',
    singleSolid: 'SINGLE_SOLID',
    solidDashed: 'SOLID_DASHED',
    dashedSolid: 'DASHED_SOLID',
    shortDashed: 'SHORT_DASHED',
    shadedAreaMarking: 'SHADED_AREA_MARKING',
    dashedBlocks: 'DASHED_BLOCKS',
    doubleDashed: 'DOUBLE_DASHED',
    crossingAlert: 'CROSSING_ALERT',
    physicalDivider: 'PHYSICAL_DIVIDER',
    physicalDividerLessThan3m: 'PHYSICAL_DIVIDER_LESS_THAN_3M',
    physicalDividerGuardrail: 'PHYSICAL_DIVIDER_GUARDRAIL',
    curb: 'CURB',
};

const EMPTY_ROAD_INFO: RoadInformation = { properties: [] };

// V3 phonetic is an object keyed by alphabet ({lhp}|{ipa}); the SDK exposes a single flat string.
const toTextWithPhonetics = (t: TextWithPhoneticsAPI): TextWithPhonetics => {
    const phonetic = t.phonetic?.lhp ?? t.phonetic?.ipa;
    return {
        text: t.text,
        ...(phonetic && { phonetic }),
        ...(t.phoneticLanguageCode && { phoneticLanguageCode: t.phoneticLanguageCode }),
    };
};

const parseInstructionRoadInformation = (road: InstructionRoadInformationAPI): RoadInformation => ({
    properties: (road.properties ?? []).map(
        (p: string) => V3_ROAD_PROPERTY_MAP[p] ?? (p.toUpperCase() as RoadInformationProperty),
    ),
    ...(road.roadNames?.length && { streetName: toTextWithPhonetics(road.roadNames[0].identifier) }),
    ...(road.roadShields?.length && {
        roadShields: road.roadShields.map(
            (s: InstructionRoadShieldAPI): RoadShield => ({
                roadNumber: s.roadNumber ? toTextWithPhonetics(s.roadNumber) : { text: '' },
                countryCode: toIso3(s.countryCodeIso2 ?? ''),
                ...(s.countrySubdivisionCodeIso && { stateCode: s.countrySubdivisionCodeIso }),
                ...(s.iconReference && { roadShieldReference: s.iconReference }),
            }),
        ),
    }),
});

const parseSignpost = (signpost: NonNullable<InstructionAPI['signpost']>): Signpost | undefined => {
    if (!signpost.exitName && !signpost.exitNumber && !signpost.towardName) return undefined;
    return {
        ...(signpost.exitName && { exitName: toTextWithPhonetics(signpost.exitName) }),
        ...(signpost.exitNumber && { exitNumber: toTextWithPhonetics(signpost.exitNumber) }),
        // towardName is required on the SDK type; default to empty text when the API omits it.
        towardName: signpost.towardName ? toTextWithPhonetics(signpost.towardName) : { text: '' },
    };
};

// Tollgate + border-crossing fields, only present on the relevant maneuvers (kept separate to keep
// the main instruction builder's complexity in check).
const parseTollAndCrossing = (a: InstructionAPI): Partial<Instruction> => ({
    ...(a.tollgateName && { tollgateName: toTextWithPhonetics(a.tollgateName) }),
    ...(a.tollPaymentTypes?.length && {
        tollPaymentTypes: a.tollPaymentTypes.map((t) => V3_TOLL_PAYMENT_MAP[t] ?? (t as TollPaymentType)),
    }),
    ...(a.countryCrossingFromName && { countryCrossingFromName: toTextWithPhonetics(a.countryCrossingFromName) }),
    ...(a.countryCrossingFromCodeIso2 && { countryCrossingFromCode: toIso3(a.countryCrossingFromCodeIso2) }),
    ...(a.countryCrossingToName && { countryCrossingToName: toTextWithPhonetics(a.countryCrossingToName) }),
    ...(a.countryCrossingToCodeIso2 && { countryCrossingToCode: toIso3(a.countryCrossingToCodeIso2) }),
});

// Optional maneuver detail fields, only present on the relevant maneuver kinds.
const parseManeuverExtras = (a: InstructionAPI): Partial<Instruction> => ({
    ...(a.intersectionName && { intersectionName: toTextWithPhonetics(a.intersectionName) }),
    ...(a.drivingSide && { drivingSide: a.drivingSide.toUpperCase() as DrivingSide }),
    ...(a.landmark && { landmark: V3_LANDMARK_MAP[a.landmark] ?? (a.landmark as Landmark) }),
    ...(!isNil(a.distanceToPreviousTrafficLightInMeters) && {
        trafficLightOffsetInMeters: a.distanceToPreviousTrafficLightInMeters,
    }),
    ...(a.sideRoads && { sideRoads: a.sideRoads }),
    ...(!isNil(a.isManeuverObligatory) && { isManeuverObligatory: a.isManeuverObligatory }),
    ...(!isNil(a.changeOfAngleInDegrees) && { changeOfAngleInDegrees: a.changeOfAngleInDegrees }),
    ...(!isNil(a.ambiguousExitOffsetFromManeuverInMeters) && {
        offsetOfAmbiguousExitFromManeuverInMeters: a.ambiguousExitOffsetFromManeuverInMeters,
    }),
    ...(!isNil(a.roundaboutExitNumber) && { roundaboutExitNumber: a.roundaboutExitNumber }),
});

// Road-shield related fields: signpost, the atlas base URL, and the flat reference lists. V2 exposed
// a flat per-instruction road-shield list; V3 carries them under nextRoadInformation.
const parseRoadShieldFields = (a: InstructionAPI, roadShieldAtlasReference?: string): Partial<Instruction> => {
    const signpost = a.signpost ? parseSignpost(a.signpost) : undefined;
    const roadShieldReferences = (a.nextRoadInformation?.roadShields ?? [])
        .map((s) => s.iconReference)
        .filter((ref): ref is RoadShieldReference => !!ref);
    return {
        ...(signpost && { signpost }),
        ...(roadShieldAtlasReference && { roadShieldAtlasReference }),
        ...(roadShieldReferences.length && { roadShieldReferences }),
        ...(a.signpost?.exitIconReference && {
            signpostRoadShieldReferences: [a.signpost.exitIconReference],
        }),
    };
};

const parseInstruction = (
    a: InstructionAPI,
    maneuverPoint: [number, number],
    pathPointIndex: number,
    roadShieldAtlasReference?: string,
): Instruction => ({
    maneuverPoint,
    pathPointIndex,
    routeOffsetInMeters: a.routeOffsetInMeters,
    maneuver: (a.maneuver ? (V3_MANEUVER_MAP[a.maneuver] ?? a.maneuver) : a.maneuver) as Maneuver,
    routePath: (a.routePath ?? []).map((rp) => ({
        point: [rp.point.longitude, rp.point.latitude] as [number, number],
        distanceInMeters: rp.distanceFromRouteStartInMeters,
        travelTimeInSeconds: rp.travelTimeFromRouteStartInSeconds,
    })),
    nextRoadInfo: a.nextRoadInformation ? parseInstructionRoadInformation(a.nextRoadInformation) : EMPTY_ROAD_INFO,
    previousRoadInfo: a.previousRoadInformation
        ? parseInstructionRoadInformation(a.previousRoadInformation)
        : EMPTY_ROAD_INFO,
    ...parseManeuverExtras(a),
    ...parseRoadShieldFields(a, roadShieldAtlasReference),
    ...parseTollAndCrossing(a),
});

const parseGuidance = (
    instructions: InstructionAPI[],
    path: Position[],
    roadShieldAtlasReference?: string,
): Guidance => {
    const parsed: Instruction[] = [];
    let lastPathIndex = 0;

    for (const apiInstruction of instructions) {
        // V3 uses {latitude, longitude}, convert to GeoJSON [longitude, latitude] Position.
        const maneuverPoint: [number, number] = [
            apiInstruction.maneuverPoint.longitude,
            apiInstruction.maneuverPoint.latitude,
        ];

        for (let pathIndex = lastPathIndex; pathIndex < path.length; pathIndex++) {
            if (similar(path[pathIndex], maneuverPoint)) {
                lastPathIndex = pathIndex;
                break;
            }
        }

        parsed.push(parseInstruction(apiInstruction, maneuverPoint, lastPathIndex, roadShieldAtlasReference));
    }

    return { instructions: parsed };
};

const parseRoute = (
    apiRoute: RouteAPI,
    index: number,
    params: CalculateRouteParams,
    roadShieldAtlasReference?: string,
): Route => {
    const geometry = parseRoutePath(apiRoute.legs);
    return {
        type: 'Feature',
        geometry,
        id: generateId(),
        bbox: bboxFromGeoJSON(geometry) as BBox,
        properties: {
            index,
            summary: parseSummary(apiRoute.summary, params),
            sections: parseSections(apiRoute, params),
            ...(apiRoute.instructions?.length && {
                guidance: parseGuidance(apiRoute.instructions, geometry.coordinates, roadShieldAtlasReference),
            }),
            ...(apiRoute.progressPoints && {
                progress: apiRoute.progressPoints.map((progressPoint: ProgressPointAPI) => ({
                    pointIndex: progressPoint.pathIndex,
                    distanceInMeters: progressPoint.distanceInMeters,
                    travelTimeInSeconds: progressPoint.travelDurationInSeconds,
                })),
            }),
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
    const features = apiResponse.routes.map((apiRoute, index) =>
        parseRoute(apiRoute, index, params, apiResponse.roadShieldAtlasReference),
    );
    const bbox = bboxFromGeoJSON(features);
    return { type: 'FeatureCollection', ...(bbox && { bbox }), features };
};
