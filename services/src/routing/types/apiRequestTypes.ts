import type { LineString, MultiPoint, Point } from 'geojson';
import type { FetchInput } from '../../shared';
import type { BatteryCurve, ChargingConnector } from '../../shared/types/vehicleEngineParams';

/**
 * V3 charging model sent in the POST body of the LDEVR endpoint.
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
 * V3 avoid area rectangle expressed as a GeoJSON Feature with a bbox.
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
 * V3 per-leg request (used in the `legs` array for route reconstruction).
 * @ignore
 */
export type LegRequestAPI = {
    path?: LineString;
};

/**
 * V3 POST body for /routing/routes/calculate and (partially) /routing/calculateLongDistanceEVRoute.
 * Consumption model parameters are sent as URL query params, not in the POST body.
 * @ignore
 */
export type CalculateRoutePOSTDataAPI = {
    routePlanningLocations: RoutePlanningLocationsAPI;
    path?: LineString;
    legs?: LegRequestAPI[];
    routeType?: string;
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
