import {
    bboxFromGeoJSON,
    getPositionStrict,
    getRoutePlanningLocationType,
    type HasBBox,
    type HasLngLat,
    type LegSectionProps,
    type PathLike,
    type RoutePlanningLocation,
    type TomTomAPIHeaders,
    type WaypointLike,
    type WaypointProps,
} from '@tomtom-org/maps-sdk/core';
import type { Feature, LineString, MultiPoint, Point } from 'geojson';
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
import type {
    AvoidAreasAPI,
    CalculateRoutePOSTDataAPI,
    LegRequestAPI,
    RouteStopRequestAPI,
} from './types/apiRequestTypes';
import type { CalculateRouteParams, GuidanceParams } from './types/calculateRouteParams';
import type { RouteStopOptions } from './types/routeStopOptions';

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

// Section types that are EXPLICIT — they must be individually listed in the Attributes header
// to be included in the response, even when the parent `sections` is already requested.
// `lanes` is also EXPLICIT but is guidance-only and handled separately below.
const EXPLICIT_SECTION_TYPES = ['tollVignette', 'tollRoad', 'roadShields', 'importantRoadStretch'] as const;

const buildAttributesHeader = (params: CalculateRouteParams): string => {
    const parts = ['summary', 'legs(summary,path)'];
    const sectionTypes = params.sectionTypes;
    // All non-EXPLICIT section types come back when sections is requested.
    // Omit sections only when the caller explicitly passes an empty sectionTypes array.
    const requestSections = !sectionTypes || sectionTypes.length > 0;
    if (requestSections) {
        parts.push('sections');
        // EXPLICIT section sub-attributes must be listed individually in the Attributes header.
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
    // There is no per-representation `extendedRouteRepresentation` parameter: `progressPoints`
    // is all-or-nothing, so a non-empty `extendedRouteRepresentations` array coarsens to "give me
    // progress points". An explicitly empty array is the caller opting out, and saves the payload.
    if (params.extendedRouteRepresentations?.length !== 0) parts.push('progressPoints');
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

// ─── Regular route (/routes/calculate) vehicle body + URL param helpers ───

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

    if (vehicle.restrictions?.tollTransponder)
        result.vehicleHasElectronicTollCollectionTransponder = vehicle.restrictions.tollTransponder;

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

// Charging preferences alone select this endpoint. `chargingStopsStrategy` deliberately does NOT:
// LDEVR also requires `minChargeAtDestinationInkWh`, which only the preferences supply, so
// triggering the endpoint on the strategy alone builds a request the API is guaranteed to reject.
// The pairing is enforced in the request schema instead, which calls this same predicate so that
// the endpoint the builder picks and the request the schema accepts can never disagree.
export const isLDEVRRequest = (params: CalculateRouteParams): boolean =>
    !!(params.vehicle as ElectricVehicleParams | undefined)?.preferences?.chargingPreferences;

// ─── Route reconstruction helpers ────────────────────────────────────────────

// The wait lives on core's `WaypointProps`, since the map reads it too; the rest is routing-only.
type StopOptions = WaypointProps & RouteStopOptions;

// The builder's own intermediate, not a wire shape — hence no `API` suffix and no place in
// apiRequestTypes.ts: the coordinate becomes `routePlanningLocations`, the options become part of
// `legs[]`, and only `legToNext` is already wire-shaped.
type Stop = { coordinate: [number, number]; legToNext?: LegRequestAPI; options?: StopOptions };

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

// Per-stop options ride on the `properties` of a waypoint Feature — see RouteStopOptions.
const getRouteStopOptions = (location: RoutePlanningLocation): StopOptions | undefined => {
    if (Array.isArray(location) || !('properties' in location)) return undefined;

    return (location as Feature<Point, StopOptions>).properties ?? undefined;
};

const flattenLocations = (
    locations: RoutePlanningLocation[],
    useEntryPoint?: CalculateRouteParams['useEntryPoints'],
): Stop[] => {
    const result: Stop[] = [];
    for (const location of locations) {
        if (getRoutePlanningLocationType(location) === 'waypoint') {
            const options = getRouteStopOptions(location);
            // Explicit candidate entry points are chosen between by the routing engine, so the
            // stop itself must stay the place center rather than a client-side entry point.
            const stopEntryPoint = options?.candidateEntryPoints?.length ? 'ignore' : useEntryPoint;
            const [longitude, latitude] = getPositionStrict(location as WaypointLike, {
                useEntryPoint: stopEntryPoint,
            });
            result.push({ coordinate: [longitude, latitude], ...(options && { options }) });
        } else {
            result.push(...expandPathToStops(location as PathLike));
        }
    }
    return result;
};

const toEntryPointsMultiPoint = (entryPoints: HasLngLat[]): MultiPoint => ({
    type: 'MultiPoint',
    coordinates: entryPoints.map((entryPoint) => getPositionStrict(entryPoint)),
});

// Builds the `legs[]` entry for the leg *arriving at* `arrivingStop`, from that stop's options.
const toLegRequest = (arrivingStop: Stop, isDestination: boolean): LegRequestAPI => {
    const options = arrivingStop.options;
    if (!options) return {};

    if (isDestination && options.pauseDurationSeconds)
        throw new Error(
            'pauseDurationSeconds is not supported on the destination: the routing API requires the pause on the last leg to be 0.',
        );

    const routeStop: RouteStopRequestAPI = {
        ...(options.pauseDurationSeconds && { pauseDurationInSeconds: options.pauseDurationSeconds }),
        ...(options.candidateEntryPoints?.length && {
            entryPoints: toEntryPointsMultiPoint(options.candidateEntryPoints),
            ...(!isNil(options.preferredEntryPointIndex) && {
                preferredEntryPointIndex: options.preferredEntryPointIndex,
            }),
        }),
    };

    return {
        ...(options.legCostModel?.routeType && { routeType: options.legCostModel.routeType }),
        // The route-level `avoids` is a string array; per-leg it takes objects.
        ...(options.legCostModel?.avoid?.length && {
            avoids: options.legCostModel.avoid.map((name) => ({ name })),
        }),
        ...(Object.keys(routeStop).length > 0 && { routeStop }),
    };
};

// `legs[]` carries route-reconstruction paths and per-stop options; both triggers share the one
// array, so it is emitted when either applies. Options belong to the stop the leg arrives at,
// which is what keeps them on the right stop when another stop is inserted earlier in the list.
const buildLegs = (allStops: Stop[], hasPathLocations: boolean): LegRequestAPI[] | undefined => {
    // One leg per stop that has something before it, so the index is the departing stop's.
    const arrivingStops = allStops.slice(1);
    const legs = arrivingStops.map((arrivingStop, index) => ({
        ...allStops[index].legToNext,
        ...toLegRequest(arrivingStop, index === arrivingStops.length - 1),
    }));

    if (!hasPathLocations && legs.every((leg) => Object.keys(leg).length === 0)) return undefined;

    return legs;
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
    ...(params.arrivalSide && {
        arrivalSidePreference: params.arrivalSide === 'curb' ? ('curbSide' as const) : ('anySide' as const),
    }),
});

const appendTravelTimeParam = (url: URL, params: CalculateRouteParams): void => {
    if (params.computeTravelTimeFor) url.searchParams.set('computeTravelTimeFor', params.computeTravelTimeFor);
};

const buildRequestHeaders = (params: CalculateRouteParams): TomTomAPIHeaders => ({
    ...buildCommonServiceRequestHeaders(params),
    Attributes: buildAttributesHeader(params),
});

const getLDEVRChargingModel = (params: CalculateRouteParams) =>
    params.vehicle?.model && !('variantId' in params.vehicle.model)
        ? ((params.vehicle.model as ExplicitVehicleModel<VehicleEngineType>).engine as ElectricEngineModel | undefined)
              ?.charging
        : undefined;

const buildLDEVRRequest = (
    params: CalculateRouteParams,
    sharedBody: CalculateRoutePOSTDataAPI,
    headers: TomTomAPIHeaders,
): FetchInput<CalculateRoutePOSTDataAPI> => {
    const baseURL =
        params.customServiceBaseURL ?? `${params.commonBaseURL}/maps/orbis/routing/calculateLongDistanceEVRoute`;
    const url = new URL(baseURL);
    appendLDEVRVehicleParams(url, params.vehicle);
    // A query parameter, not a body field — the body rejects it as an unknown JSON field.
    if (params.chargingStopsStrategy) url.searchParams.set('chargingStopsStrategy', params.chargingStopsStrategy);

    const chargingModel = getLDEVRChargingModel(params);
    const hasPredefinedModel = !!params.vehicle?.model && 'variantId' in params.vehicle.model;
    // `chargingParameters` is mandatory on this endpoint, but the endpoint itself is selected by
    // `vehicle.preferences.chargingPreferences` — a different part of the params. Without either a
    // predefined model (the API supplies the charging model for it) or explicit connectors, the
    // request is guaranteed to fail, so fail here with a message that names the actual cause.
    if (!hasPredefinedModel && !chargingModel?.chargingConnectors?.length)
        throw new Error(
            'Charging preferences require a charging model: set vehicle.model.engine.charging.chargingConnectors (or a predefined vehicle.model.variantId) to plan charging stops.',
        );

    // Only ever *adds* to the shared body: every field both endpoints take is built once, before
    // the branch, so a field added there cannot reach one endpoint and silently miss the other.
    const body: CalculateRoutePOSTDataAPI = {
        ...sharedBody,
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
        // This endpoint is electric by definition, whatever the vehicle body derived.
        vehicleEngineType: 'electric',
    };

    return { method: 'POST', url, data: body, headers };
};

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Default function for building calculate route request from {@link CalculateRouteParams}
 * targeting the Orbis routing API.
 * @param params The calculate route parameters, with global configuration already merged into them.
 */
export const buildCalculateRouteRequest = (params: CalculateRouteParams): FetchInput<CalculateRoutePOSTDataAPI> => {
    const hasPathLocations = params.locations.map(getRoutePlanningLocationType).includes('path');
    const allStops = flattenLocations(params.locations, params.useEntryPoints);
    const routePlanningLocations = buildRoutePlanningLocations(allStops);
    const commonBodyFields = buildCommonBodyFields(params);
    const headers = buildRequestHeaders(params);
    // Everything above, plus `legs` and the travel-time param below, is shared by both endpoints:
    // the same CalculateRouteParams must mean the same thing whether or not charging preferences
    // routed it to LDEVR.
    const legs = buildLegs(allStops, hasPathLocations);
    const sharedBody: CalculateRoutePOSTDataAPI = {
        routePlanningLocations,
        ...commonBodyFields,
        ...(legs && { legs }),
        ...(params.vehicle && buildVehicleBody(params.vehicle)),
    };
    if (isLDEVRRequest(params)) {
        const ldevrRequest = buildLDEVRRequest(params, sharedBody, headers);
        appendTravelTimeParam(ldevrRequest.url, params);
        return ldevrRequest;
    }

    // `vehicleModelId` is only supported by the LDEVR endpoint, which is reached by setting
    // `vehicle.preferences.chargingPreferences`. Sending it here returns
    // `400 parameter [vehicleModelId] not supported`, and dropping it silently would plan the
    // route for a default vehicle instead of the requested one.
    if (params.vehicle?.model && 'variantId' in params.vehicle.model)
        throw new Error(
            'vehicle.model.variantId is only supported for EV routes with charging stops: set vehicle.preferences.chargingPreferences, or describe the vehicle with vehicle.model.dimensions and vehicle.model.engine instead.',
        );

    const baseURL = params.customServiceBaseURL ?? `${params.commonBaseURL}/maps/orbis/routing/routes/calculate`;
    const url = new URL(baseURL);
    if (params.vehicle) appendConsumptionParams(url, params.vehicle);

    appendTravelTimeParam(url, params);

    return { method: 'POST', url, data: sharedBody, headers };
};
