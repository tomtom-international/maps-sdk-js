import {
    bboxFromGeoJSON,
    getPositionStrict,
    getRoutePlanningLocationType,
    type HasBBox,
    type LegSectionProps,
    type PathLike,
    type RoutePlanningLocation,
    type TomTomAPIHeaders,
    type WaypointLike,
} from '@tomtom-org/maps-sdk/core';
import type { LineString, Point } from 'geojson';
import { isNil } from 'lodash-es';
import type {
    ChargingPreferencesKWH,
    ChargingPreferencesPCT,
    CombustionVehicleState,
    ElectricVehicleParams,
    ElectricVehicleStateKWH,
    ElectricVehicleStatePCT,
    FetchInput,
    VehicleParameters,
} from '../shared';
import { buildCommonServiceRequestHeaders } from '../shared/request/requestBuildingUtils';
import type {
    CombustionEngineModel,
    ConsumptionModelEfficiency,
    ElectricEngineModel,
    SpeedToConsumptionRate,
    VehicleEngineType,
} from '../shared/types/vehicleEngineParams';
import type { ExplicitVehicleModel } from '../shared/types/vehicleModel';
import type { AvoidAreasAPI, CalculateRoutePOSTDataAPI, LegRequestAPI } from './types/apiRequestTypes';
import type { CalculateRouteParams, GuidanceParams } from './types/calculateRouteParams';

const buildAvoidAreas = (avoidAreas: HasBBox[]): AvoidAreasAPI => ({
    rectangles: avoidAreas.map((rectangle) => {
        const bbox = bboxFromGeoJSON(rectangle);
        if (!bbox) throw new Error('Could not derive a bounding box from an avoidAreas rectangle');

        const [minLon, minLat, maxLon, maxLat] = bbox;
        return { type: 'Feature' as const, bbox: [minLon, minLat, maxLon, maxLat], geometry: null };
    }),
});

const toGuidanceBody = (
    guidance: GuidanceParams,
): { guidance: 'instructions'; instructionPhonetics: 'ipa' | 'lhp' } => ({
    guidance: 'instructions',
    instructionPhonetics: guidance.phonetics ? (guidance.phonetics.toLowerCase() as 'ipa' | 'lhp') : 'ipa',
});

const buildSpeedConsumptionString = (rates: SpeedToConsumptionRate[]): string =>
    rates.map((rate) => `${rate.speedKMH},${rate.consumptionUnitsPer100KM}`).join(':');

// V3 section types that are EXPLICIT — they must be individually listed in the Attributes header
// to be included in the response, even when the parent `sections` is already requested.
// `lanes` is also EXPLICIT but is guidance-only and handled separately below.
const EXPLICIT_SECTION_TYPES = ['tollVignette', 'roadShields', 'importantRoadStretch'] as const;

const buildAttributesHeader = (params: CalculateRouteParams): string => {
    const parts = ['summary', 'legs(summary,path)'];
    const sectionTypes = params.sectionTypes;
    // V3 returns all non-EXPLICIT section types when sections is requested.
    // Omit sections only when the caller explicitly passes an empty sectionTypes array.
    const requestSections = !sectionTypes || sectionTypes.length > 0;
    if (requestSections) {
        parts.push('sections');
        // EXPLICIT V3 section sub-attributes must be listed individually in the Attributes header.
        // When sectionTypes is undefined the customer wants everything, so request all EXPLICIT types
        // (preserving V2 behavior). When sectionTypes is a specific list, only add the requested ones.
        const wantAll = !sectionTypes;
        for (const type of EXPLICIT_SECTION_TYPES) {
            if (wantAll || sectionTypes.includes(type)) {
                parts.push(`sections.${type}`);
            }
        }
        // sections.lanes is EXPLICIT and only available with guidance.
        if (params.guidance && (wantAll || sectionTypes.includes('lanes'))) {
            parts.push('sections.lanes');
        }
    }
    parts.push('progressPoints');
    // When guidance is requested, include the EXPLICIT instruction sub-attributes that back
    // fields the V2 SDK exposed: road-shield icon references, signpost exit icon
    // (→ signpostRoadShieldReferences), and the traffic-light offset.
    if (params.guidance) {
        parts.push(
            'instructions(*,nextRoadInformation.roadShields.iconReference,previousRoadInformation.roadShields.iconReference,signpost.exitIconReference,distanceToPreviousTrafficLightInMeters)',
        );
    }
    // `roadShieldAtlasReference` is an EXPLICIT top-level attribute (sibling of `routes`), used to
    // build road-shield images; request it whenever guidance instructions are requested.
    const routesAttr = `routes(${parts.join(',')})`;
    return params.guidance ? `roadShieldAtlasReference,${routesAttr}` : routesAttr;
};

// ─── Regular route (V3 /routes/calculate) vehicle body + URL param helpers ───

const buildVehicleBody = (vehicle: VehicleParameters): Partial<CalculateRoutePOSTDataAPI> => {
    const result: Partial<CalculateRoutePOSTDataAPI> = {};
    const isElectric = (vehicle as ElectricVehicleParams).engineType === 'electric';
    if (isElectric) result.vehicleEngineType = 'electric';

    if (vehicle.model && !('variantId' in vehicle.model)) {
        const model = vehicle.model as ExplicitVehicleModel<VehicleEngineType>;
        if (model.dimensions?.weightKG) result.vehicleWeightInKilograms = model.dimensions.weightKG;
    }

    if (vehicle.state?.heading) result.vehicleHeadingInDegrees = vehicle.state.heading;

    if (vehicle.restrictions?.maxSpeedKMH) result.vehicleMaxSpeedInKilometersPerHour = vehicle.restrictions.maxSpeedKMH;

    return result;
};

const setEfficiencyParams = (url: URL, efficiency: ConsumptionModelEfficiency): void => {
    if (!isNil(efficiency.acceleration))
        url.searchParams.set('accelerationEfficiency', String(efficiency.acceleration));

    if (!isNil(efficiency.deceleration))
        url.searchParams.set('decelerationEfficiency', String(efficiency.deceleration));

    if (!isNil(efficiency.uphill)) url.searchParams.set('uphillEfficiency', String(efficiency.uphill));

    if (!isNil(efficiency.downhill)) url.searchParams.set('downhillEfficiency', String(efficiency.downhill));
};

// Electric consumption + max-charge URL params shared by the regular (/routes/calculate) and LDEVR
// (/calculateLongDistanceEVRoute) request builders.
const appendElectricConsumptionParams = (url: URL, engine: ElectricEngineModel): void => {
    const consumption = engine.consumption;
    if (consumption.speedsToConsumptionsKWH?.length)
        url.searchParams.set(
            'constantSpeedConsumptionInkWhPerHundredkm',
            buildSpeedConsumptionString(consumption.speedsToConsumptionsKWH),
        );

    if (!isNil(consumption.auxiliaryPowerInkW))
        url.searchParams.set('auxiliaryPowerInkW', String(consumption.auxiliaryPowerInkW));

    if (!isNil(consumption.consumptionInKWHPerKMAltitudeGain))
        url.searchParams.set(
            'consumptionInkWhPerkmAltitudeGain',
            String(consumption.consumptionInKWHPerKMAltitudeGain),
        );

    if (!isNil(consumption.recuperationInKWHPerKMAltitudeLoss))
        url.searchParams.set(
            'recuperationInkWhPerkmAltitudeLoss',
            String(consumption.recuperationInKWHPerKMAltitudeLoss),
        );

    if (consumption.efficiency) setEfficiencyParams(url, consumption.efficiency);

    if (engine.charging?.maxChargeKWH) url.searchParams.set('maxChargeInkWh', String(engine.charging.maxChargeKWH));
};

const appendElectricParams = (url: URL, engine: ElectricEngineModel, vehicle: VehicleParameters): void => {
    appendElectricConsumptionParams(url, engine);

    const kwhState = vehicle.state as ElectricVehicleStateKWH;
    const pctState = vehicle.state as ElectricVehicleStatePCT;
    if (kwhState?.currentChargeInkWh) {
        url.searchParams.set('currentChargeInkWh', String(kwhState.currentChargeInkWh));
    } else if (pctState?.currentChargePCT && engine.charging?.maxChargeKWH) {
        url.searchParams.set(
            'currentChargeInkWh',
            String((engine.charging.maxChargeKWH * pctState.currentChargePCT) / 100),
        );
    }
};

const appendCombustionParams = (url: URL, engine: CombustionEngineModel, vehicle: VehicleParameters): void => {
    const consumption = engine.consumption;
    if (consumption.speedsToConsumptionsLiters?.length)
        url.searchParams.set(
            'constantSpeedConsumptionInLitersPerHundredkm',
            buildSpeedConsumptionString(consumption.speedsToConsumptionsLiters),
        );

    if (!isNil(consumption.auxiliaryPowerInLitersPerHour))
        url.searchParams.set('auxiliaryPowerInLitersPerHour', String(consumption.auxiliaryPowerInLitersPerHour));

    if (!isNil(consumption.fuelEnergyDensityInMJoulesPerLiter))
        url.searchParams.set(
            'fuelEnergyDensityInMJoulesPerLiter',
            String(consumption.fuelEnergyDensityInMJoulesPerLiter),
        );

    if (consumption.efficiency) setEfficiencyParams(url, consumption.efficiency);

    const combustionState = vehicle.state as CombustionVehicleState;
    if (combustionState?.currentFuelInLiters)
        url.searchParams.set('currentFuelInLiters', String(combustionState.currentFuelInLiters));
};

const appendConsumptionParams = (url: URL, vehicle: VehicleParameters): void => {
    if (!vehicle.model || 'variantId' in vehicle.model) return;

    const model = vehicle.model as ExplicitVehicleModel<VehicleEngineType>;
    if (!model.engine) return;

    if ((vehicle as ElectricVehicleParams).engineType === 'electric') {
        appendElectricParams(url, model.engine as ElectricEngineModel, vehicle);
    } else {
        appendCombustionParams(url, model.engine as CombustionEngineModel, vehicle);
    }
};

// ─── LDEVR (/calculateLongDistanceEVRoute) URL param helpers ─────────────────

const getLDEVRMaxCharge = (vehicle: VehicleParameters): number | undefined => {
    if (!vehicle.model || 'variantId' in vehicle.model) return undefined;

    return ((vehicle.model as ExplicitVehicleModel<VehicleEngineType>).engine as ElectricEngineModel | undefined)
        ?.charging?.maxChargeKWH;
};

const appendLDEVRStateParams = (url: URL, vehicle: VehicleParameters): void => {
    if (!vehicle.state) return;

    const kwhState = vehicle.state as ElectricVehicleStateKWH;
    const pctState = vehicle.state as ElectricVehicleStatePCT;
    if (kwhState.currentChargeInkWh) {
        url.searchParams.set('currentChargeInkWh', String(kwhState.currentChargeInkWh));
        return;
    }

    if (!pctState.currentChargePCT) return;

    const maxCharge = getLDEVRMaxCharge(vehicle);
    if (maxCharge) url.searchParams.set('currentChargeInkWh', String((maxCharge * pctState.currentChargePCT) / 100));
};

const appendLDEVRChargingPrefParams = (url: URL, vehicle: VehicleParameters): void => {
    const chargingPrefs = (vehicle as ElectricVehicleParams).preferences?.chargingPreferences;
    if (!chargingPrefs) return;

    const kwhPrefs = chargingPrefs as ChargingPreferencesKWH;
    const pctPrefs = chargingPrefs as ChargingPreferencesPCT;
    if (!isNil(kwhPrefs.minChargeAtDestinationInkWh) || !isNil(kwhPrefs.minChargeAtChargingStopsInkWh)) {
        if (!isNil(kwhPrefs.minChargeAtDestinationInkWh))
            url.searchParams.set('minChargeAtDestinationInkWh', String(kwhPrefs.minChargeAtDestinationInkWh));

        if (!isNil(kwhPrefs.minChargeAtChargingStopsInkWh))
            url.searchParams.set('minChargeAtChargingStopsInkWh', String(kwhPrefs.minChargeAtChargingStopsInkWh));

        return;
    }

    const maxCharge = getLDEVRMaxCharge(vehicle);
    if (!maxCharge) return;

    if (!isNil(pctPrefs.minChargeAtDestinationPCT))
        url.searchParams.set(
            'minChargeAtDestinationInkWh',
            String((maxCharge * pctPrefs.minChargeAtDestinationPCT) / 100),
        );

    if (!isNil(pctPrefs.minChargeAtChargingStopsPCT))
        url.searchParams.set(
            'minChargeAtChargingStopsInkWh',
            String((maxCharge * pctPrefs.minChargeAtChargingStopsPCT) / 100),
        );
};

const appendLDEVRVehicleParams = (url: URL, vehicle: VehicleParameters | undefined): void => {
    if (!vehicle) return;

    if (!vehicle.model) return;

    if ('variantId' in vehicle.model) {
        url.searchParams.set('vehicleModelId', vehicle.model.variantId);
    } else {
        const model = vehicle.model as ExplicitVehicleModel<VehicleEngineType>;
        if (model.engine) appendElectricConsumptionParams(url, model.engine as ElectricEngineModel);
    }
    appendLDEVRStateParams(url, vehicle);
    appendLDEVRChargingPrefParams(url, vehicle);
};

const isLDEVRRequest = (params: CalculateRouteParams): boolean =>
    !!(params.vehicle as ElectricVehicleParams | undefined)?.preferences?.chargingPreferences;

// ─── Route reconstruction helpers ────────────────────────────────────────────

type Stop = { coordinate: [number, number]; legToNext?: LegRequestAPI };

const getPathCoordinates = (pathLike: PathLike): [number, number][] => {
    if (Array.isArray(pathLike)) return pathLike as [number, number][];

    return pathLike.geometry.coordinates as [number, number][];
};

const getPathLegSections = (pathLike: PathLike): LegSectionProps[] | undefined => {
    if (Array.isArray(pathLike)) return undefined;

    return pathLike.properties?.sections?.leg;
};

const expandPathToStops = (pathLike: PathLike): Stop[] => {
    const coordinates = getPathCoordinates(pathLike);
    const legSections = getPathLegSections(pathLike);
    if (
        legSections &&
        legSections.length > 1 &&
        legSections.every((section) => section.startPointIndex != null && section.endPointIndex != null)
    ) {
        const stops: Stop[] = legSections.map((section) => {
            const start = section.startPointIndex ?? 0;
            const end = section.endPointIndex ?? 0;
            return {
                coordinate: coordinates[start],
                legToNext: {
                    path: {
                        type: 'LineString',
                        coordinates: coordinates.slice(start, end + 1),
                    },
                },
            };
        });
        stops.push({
            coordinate: coordinates[legSections.at(-1)?.endPointIndex ?? coordinates.length - 1],
        });
        return stops;
    }
    return [
        {
            coordinate: coordinates[0],
            legToNext: { path: { type: 'LineString', coordinates } as LineString },
        },
        { coordinate: coordinates.at(-1) ?? coordinates[0] },
    ];
};

const flattenLocations = (
    locations: RoutePlanningLocation[],
    useEntryPoint?: CalculateRouteParams['useEntryPoints'],
): Stop[] => {
    const result: Stop[] = [];
    for (const location of locations) {
        if (getRoutePlanningLocationType(location) === 'waypoint') {
            const [longitude, latitude] = getPositionStrict(location as WaypointLike, { useEntryPoint });
            result.push({ coordinate: [longitude, latitude] });
        } else {
            result.push(...expandPathToStops(location as PathLike));
        }
    }
    return result;
};

const buildRoutePlanningLocations = (allStops: Stop[]) => {
    const origin: Point = { type: 'Point', coordinates: allStops[0].coordinate };
    const destination: Point = {
        type: 'Point',
        coordinates: (allStops.at(-1) ?? allStops[0]).coordinate,
    };
    const middleStops = allStops.slice(1, -1);
    return {
        origin,
        destination,
        ...(middleStops.length && {
            waypoints: {
                type: 'MultiPoint' as const,
                coordinates: middleStops.map((stop) => stop.coordinate),
            },
        }),
    };
};

// ─── Main exported function helpers ──────────────────────────────────────────

type CommonBodyFields = ReturnType<typeof buildCommonBodyFields>;

const buildCommonBodyFields = (params: CalculateRouteParams) => ({
    ...(params.costModel?.routeType && { routeType: params.costModel.routeType }),
    ...(params.costModel?.traffic && { traffic: params.costModel.traffic }),
    ...(params.costModel?.avoid?.length && { avoids: params.costModel.avoid as string[] }),
    ...(params.travelMode && { travelMode: params.travelMode }),
    ...(params.maxAlternatives && { maxPathAlternativeRoutes: params.maxAlternatives }),
    ...(params.when?.option === 'departAt' &&
        params.when.date && { departureDateTime: params.when.date.toISOString() }),
    ...(params.when?.option === 'arriveBy' && params.when.date && { arrivalDateTime: params.when.date.toISOString() }),
    ...(params.guidance && toGuidanceBody(params.guidance)),
    ...(params.costModel?.avoidAreas?.length && { avoidAreas: buildAvoidAreas(params.costModel.avoidAreas) }),
});

const buildRequestHeaders = (params: CalculateRouteParams): TomTomAPIHeaders => ({
    ...buildCommonServiceRequestHeaders(params),
    Attributes: buildAttributesHeader(params),
});

const buildLDEVRRequest = (
    params: CalculateRouteParams,
    routePlanningLocations: ReturnType<typeof buildRoutePlanningLocations>,
    commonBodyFields: CommonBodyFields,
    headers: TomTomAPIHeaders,
): FetchInput<CalculateRoutePOSTDataAPI> => {
    const baseURL =
        params.customServiceBaseURL ?? `${params.commonBaseURL}/maps/orbis/routing/calculateLongDistanceEVRoute`;
    const url = new URL(baseURL);
    appendLDEVRVehicleParams(url, params.vehicle);

    const chargingModel =
        params.vehicle?.model && !('variantId' in params.vehicle.model)
            ? (
                  (params.vehicle.model as ExplicitVehicleModel<VehicleEngineType>).engine as
                      | ElectricEngineModel
                      | undefined
              )?.charging
            : undefined;

    const body: CalculateRoutePOSTDataAPI = {
        routePlanningLocations,
        ...commonBodyFields,
        ...(chargingModel && {
            chargingParameters: {
                ...(chargingModel.batteryCurve?.length && { batteryCurve: chargingModel.batteryCurve }),
                ...(chargingModel.chargingConnectors?.length && {
                    chargingConnectors: [...chargingModel.chargingConnectors],
                }),
                ...(!isNil(chargingModel.chargingTimeOffsetInSec) && {
                    chargingTimeOffsetInSec: chargingModel.chargingTimeOffsetInSec,
                }),
            },
        }),
        vehicleEngineType: 'electric',
        ...(params.vehicle?.model &&
            !('variantId' in params.vehicle.model) && {
                vehicleWeightInKilograms: (params.vehicle.model as ExplicitVehicleModel<VehicleEngineType>).dimensions
                    ?.weightKG,
            }),
        ...(params.vehicle?.state?.heading && { vehicleHeadingInDegrees: params.vehicle.state.heading }),
    };

    return { method: 'POST', url, data: body, headers };
};

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Default function for building calculate route request from {@link CalculateRouteParams}
 * targeting the OrbisV3 routing API.
 * @param params The calculate route parameters, with global configuration already merged into them.
 */
export const buildCalculateRouteRequest = (params: CalculateRouteParams): FetchInput<CalculateRoutePOSTDataAPI> => {
    const hasPathLocations = params.locations.map(getRoutePlanningLocationType).includes('path');
    const allStops = flattenLocations(params.locations, params.useEntryPoints);
    const routePlanningLocations = buildRoutePlanningLocations(allStops);
    const commonBodyFields = buildCommonBodyFields(params);
    const headers = buildRequestHeaders(params);

    if (isLDEVRRequest(params)) {
        return buildLDEVRRequest(params, routePlanningLocations, commonBodyFields, headers);
    }

    const baseURL = params.customServiceBaseURL ?? `${params.commonBaseURL}/maps/orbis/routing/routes/calculate`;
    const url = new URL(baseURL);
    if (params.vehicle) appendConsumptionParams(url, params.vehicle);
    // V3 renamed computeAdditionalTravelTimeFor → computeTravelTimeFor
    if (params.computeAdditionalTravelTimeFor) {
        url.searchParams.set('computeTravelTimeFor', params.computeAdditionalTravelTimeFor);
    }

    const legs = hasPathLocations ? allStops.slice(0, -1).map((stop) => stop.legToNext ?? {}) : undefined;

    const body: CalculateRoutePOSTDataAPI = {
        routePlanningLocations,
        ...commonBodyFields,
        ...(legs && { legs }),
        ...(params.vehicle && buildVehicleBody(params.vehicle)),
    };

    return { method: 'POST', url, data: body, headers };
};
