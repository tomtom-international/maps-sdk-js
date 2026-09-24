import type { SectionType, Waypoint } from '@tomtom-org/maps-sdk/core';
import { getRoutePlanningLocationType, inputSectionTypesWithGuidance } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { commonRoutingRequestSchema } from '../shared/schema/commonRoutingRequestSchema';
import {
    featureSchema,
    geometrySchema,
    hasLngLatSchema,
    lineStringCoordsSchema,
} from '../shared/schema/geometriesSchema';
import type { SchemaRefinement } from '../shared/types/validation';
import { isLDEVRRequest } from './requestBuilder';
import { arrivalSides, type CalculateRouteParams, chargingStopsStrategies } from './types/calculateRouteParams';

const waypointLikeSchema = z.union([hasLngLatSchema, geometrySchema]);
const pathLikeSchema = z.union([lineStringCoordsSchema, featureSchema]);

const mandatorySchema = z.object({
    locations: z.array(z.union([waypointLikeSchema, pathLikeSchema])).min(1), // see calculateRouteLocationsRefinement
});

const optionalSchema = z.object({
    arrivalSide: z.enum(arrivalSides).optional(),
    chargingStopsStrategy: z.enum(chargingStopsStrategies).optional(),
    computeTravelTimeFor: z.enum(['none', 'all']).optional(),
    maxAlternatives: z.number().min(0).max(5).optional(),
    sectionTypes: z.array(z.enum(inputSectionTypesWithGuidance as [SectionType, ...SectionType[]])).optional(),
});

const schema = commonRoutingRequestSchema.extend(mandatorySchema.extend(optionalSchema.shape).shape);

const locationsRefinement: SchemaRefinement<CalculateRouteParams> = {
    check: (data: CalculateRouteParams): boolean => {
        const types = data.locations.map(getRoutePlanningLocationType);
        const waypointCount = types.filter((type) => type === 'waypoint').length;
        const pathCount = types.filter((type) => type === 'path').length;
        // At least 2 waypoints, OR at least 1 path (reconstruction)
        return waypointCount >= 2 || pathCount >= 1;
    },
    message: 'At least 2 waypoints or 1 path (route reconstruction) is required.',
};

// The strategy only reaches the wire on the LDEVR endpoint, and only charging preferences select
// that endpoint. A strategy on its own would be dropped by the request builder, so ask the builder's
// own predicate rather than re-deciding here: a `chargingPreferences: undefined` that satisfied a
// key check would pass validation and then silently lose the strategy.
const chargingStopsStrategyRefinement: SchemaRefinement<CalculateRouteParams> = {
    check: (data: CalculateRouteParams): boolean => !data.chargingStopsStrategy || isLDEVRRequest(data),
    message:
        'chargingStopsStrategy: set vehicle.preferences.chargingPreferences as well — an EV route needs a minimum charge at the destination, which only the charging preferences provide.',
};

// A variant identifies a vehicle in TomTom's database, which only the LDEVR endpoint looks up —
// elsewhere the builder sends it and the API plans for a default vehicle instead. The rule is the
// endpoint's, not the vehicle's: `calculateReachableRange` takes the same `VehicleParameters` and
// accepts a variant with no charging preferences at all, so it cannot live on the type.
const predefinedModelRefinement: SchemaRefinement<CalculateRouteParams> = {
    check: (data: CalculateRouteParams): boolean =>
        !(data.vehicle?.model && 'variantId' in data.vehicle.model) || isLDEVRRequest(data),
    message:
        'vehicle.model.variantId is only supported for EV routes with charging stops: set vehicle.preferences.chargingPreferences, or describe the vehicle with vehicle.model.dimensions and vehicle.model.engine instead.',
};

// The routing API requires the last leg's wait to be 0, so a pause on the destination is rejected.
// Which location is the destination is positional, and `locations` is an array rather than a tuple —
// callers build it dynamically — so the type cannot carry this and validation does.
const destinationPauseRefinement: SchemaRefinement<CalculateRouteParams> = {
    check: (data: CalculateRouteParams): boolean => {
        const destination = data.locations.at(-1);
        if (!destination || getRoutePlanningLocationType(destination) !== 'waypoint') return true;

        // A waypoint and a route are both Point/LineString Features, so which one this is cannot be
        // narrowed structurally — the check above is what decides it.
        return !(destination as Waypoint).properties?.pauseDurationSeconds;
    },
    message:
        'pauseDurationSeconds is not supported on the destination: the routing API requires the wait on the last leg to be 0.',
};

/**
 * @ignore
 */
export const routeRequestValidationConfig = {
    schema,
    refinements: [
        locationsRefinement,
        chargingStopsStrategyRefinement,
        predefinedModelRefinement,
        destinationPauseRefinement,
    ],
};
