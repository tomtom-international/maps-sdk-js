import type { LineString, MultiPoint, Point } from 'geojson';
import type { FetchInput, RouteType } from '../../shared';
import type { BatteryCurve, ChargingConnector } from '../../shared/types/vehicleEngineParams';

/**
 * Charging model sent in the POST body of the LDEVR endpoint.
 * @ignore
 */
export type ChargingParametersAPI = {
    batteryCurve?: BatteryCurve[];
    chargingConnectors?: ChargingConnector[];
    chargingTimeOffsetInSec?: number;
};

/**
 * @ignore
 */
export type RoutePlanningLocationsAPI = {
    origin: Point;
    destination: Point;
    waypoints?: MultiPoint;
};

/**
 * Avoid area rectangle expressed as a GeoJSON Feature with a bbox.
 * @ignore
 */
export type AvoidRectangleAPI = {
    type: 'Feature';
    bbox: [number, number, number, number];
    geometry: null;
};

/**
 * @ignore
 */
export type AvoidAreasAPI = {
    rectangles: AvoidRectangleAPI[];
};

/**
 * Per-stop request options, nested under the leg that arrives at the stop.
 * @ignore
 */
export type RouteStopRequestAPI = {
    pauseDurationInSeconds?: number;
    // The API takes candidate entry points as a GeoJSON MultiPoint; an array of Points is rejected.
    entryPoints?: MultiPoint;
    preferredEntryPointIndex?: number;
};

/**
 * Per-leg request, used in the `legs` array for route reconstruction and per-stop options.
 * @ignore
 */
export type LegRequestAPI = {
    path?: LineString;
    routeType?: RouteType;
    // Note the shape difference from the route-level `avoids`, which is a plain string array.
    avoids?: { name: string }[];
    routeStop?: RouteStopRequestAPI;
};

/**
 * POST body for /routing/routes/calculate and (partially) /routing/calculateLongDistanceEVRoute.
 * Consumption model parameters are sent as URL query params, not in the POST body.
 * @ignore
 */
export type CalculateRoutePOSTDataAPI = {
    routePlanningLocations: RoutePlanningLocationsAPI;
    path?: LineString;
    legs?: LegRequestAPI[];
    routeType?: RouteType;
    traffic?: string;
    avoids?: string[];
    travelMode?: string;
    maxPathAlternativeRoutes?: number;
    departureDateTime?: string;
    arrivalDateTime?: string;
    vehicleEngineType?: string;
    vehicleWeightInKilograms?: number;
    vehicleMaxSpeedInKilometersPerHour?: number;
    vehicleHeadingInDegrees?: number;
    // V3 spells this "Electronic"; the V2 reachable-range endpoint spells it "Electric".
    vehicleHasElectronicTollCollectionTransponder?: string;
    arrivalSidePreference?: 'anySide' | 'curbSide';
    // LDEVR charging model (POST body for calculateLongDistanceEVRoute)
    chargingParameters?: ChargingParametersAPI;
    guidance?: 'none' | 'instructions';
    instructionPhonetics?: 'ipa' | 'lhp';
    avoidAreas?: AvoidAreasAPI;
};

/**
 * @ignore
 */
export type CalculateRouteRequestAPI = FetchInput<CalculateRoutePOSTDataAPI>;
