import type { SectionType } from '@tomtom-org/maps-sdk/core';
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

/**
 * @ignore
 */
export const routeRequestValidationConfig = {
    schema,
    refinements: [locationsRefinement, chargingStopsStrategyRefinement],
};
