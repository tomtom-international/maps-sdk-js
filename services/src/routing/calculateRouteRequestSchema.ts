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
import type { CalculateRouteParams } from './types/calculateRouteParams';

const waypointLikeSchema = z.union([hasLngLatSchema, geometrySchema]);
const pathLikeSchema = z.union([lineStringCoordsSchema, featureSchema]);

const mandatorySchema = z.object({
    locations: z.array(z.union([waypointLikeSchema, pathLikeSchema])).min(1), // see calculateRouteLocationsRefinement
});

const optionalSchema = z.object({
    computeAdditionalTravelTimeFor: z.enum(['none', 'all']).optional(),
    vehicleHeading: z.number().min(0).max(359.5).optional(),
    // TODO add proper instructionsInfo check
    // instructionsType: z.enum(instructionsTypes),
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

/**
 * @ignore
 */
export const routeRequestValidationConfig = { schema, refinements: [locationsRefinement] };
