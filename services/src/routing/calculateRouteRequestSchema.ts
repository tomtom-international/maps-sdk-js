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

const waypointLikeSchema = z.union([hasLngLatSchema, geometrySchema]).describe('Waypoint as position or geometry');
const pathLikeSchema = z
    .union([lineStringCoordsSchema, featureSchema])
    .describe('Path as line string coordinates or feature');

const mandatorySchema = z.object({
    locations: z
        .array(z.union([waypointLikeSchema, pathLikeSchema]))
        .min(1)
        .describe('Array of route locations (waypoints or paths) - minimum 2 waypoints or 1 path required'), // see calculateRouteLocationsRefinement
});

const optionalSchema = z.object({
    computeAdditionalTravelTimeFor: z
        .enum(['none', 'all'])
        .optional()
        .describe('Calculate additional travel time estimates for different traffic scenarios (none or all)'),
    vehicleHeading: z
        .number()
        .min(0)
        .max(359.5)
        .optional()
        .describe('Vehicle heading in degrees (0-359.5) at departure'),
    // TODO add proper instructionsInfo check
    // instructionsType: z.enum(instructionsTypes),
    maxAlternatives: z
        .number()
        .min(0)
        .max(5)
        .optional()
        .describe('Maximum number of alternative routes to calculate (0-5)'),
    sectionTypes: z
        .array(z.enum(inputSectionTypesWithGuidance as [SectionType, ...SectionType[]]))
        .optional()
        .describe('Types of route sections to include in response (toll, ferry, traffic, etc.)'),
});

const schema = commonRoutingRequestSchema.extend(mandatorySchema.extend(optionalSchema.shape).shape);

const locationsRefinement: SchemaRefinement<CalculateRouteParams> = {
    check: (data: CalculateRouteParams): boolean => {
        const routePlanningLocationTypes = data.locations.map(getRoutePlanningLocationType);
        if (!routePlanningLocationTypes.includes('path')) {
            return data.locations.length >= 2;
        }
        return true; // see calculateRouteRequestSchemaMandatory
    },
    message:
        'When passing waypoints only: at least 2 must be defined. ' +
        'If passing also paths, at least one path must be defined',
};

/**
 * @ignore
 */
export const routeRequestValidationConfig = { schema, refinements: [locationsRefinement] };
