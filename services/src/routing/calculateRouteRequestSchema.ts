import type { SectionType } from '@anw/maps-sdk-js/core';
import { getGeoInputType, inputSectionTypesWithGuidance } from '@anw/maps-sdk-js/core';
import { z } from 'zod/v4-mini';
import { commonRoutingRequestSchema } from '../shared/commonRoutingRequestSchema';
import { featureSchema, geometrySchema, hasLngLatSchema, lineStringCoordsSchema } from '../shared/geometriesSchema';
import type { SchemaRefinement } from '../shared/types/validation';
import type { CalculateRouteParams } from './types/calculateRouteParams';

const waypointLikeSchema = z.union([hasLngLatSchema, geometrySchema]);
const pathLikeSchema = z.union([lineStringCoordsSchema, featureSchema]);

const calculateRouteRequestSchemaMandatory = z.object({
    geoInputs: z.array(z.union([waypointLikeSchema, pathLikeSchema])).check(z.minLength(1)),
});

const calculateRouteRequestSchemaOptional = z.partial(
    z.object({
        computeAdditionalTravelTimeFor: z.enum(['none', 'all']),
        vehicleHeading: z.number().check(z.minimum(0), z.maximum(359.5)),
        // TODO add proper instructionsInfo check
        // instructionsType: z.enum(instructionsTypes),
        maxAlternatives: z.number().check(z.minimum(0), z.maximum(5)),
        sectionTypes: z.array(z.enum(inputSectionTypesWithGuidance as [SectionType, ...SectionType[]])),
    }),
);

const calculateRouteRequestSchema = z.extend(
    commonRoutingRequestSchema,
    z.extend(calculateRouteRequestSchemaMandatory, calculateRouteRequestSchemaOptional).shape,
).shape;

const calculateRouteGeoInputsRefinement: SchemaRefinement<CalculateRouteParams> = {
    check: (data: CalculateRouteParams): boolean => {
        const geoInputTypes = data.geoInputs.map(getGeoInputType);
        if (!geoInputTypes.includes('path')) {
            return data.geoInputs.length >= 2;
        }
        return true;
    },
    message:
        'When passing waypoints only: at least 2 must be defined. ' +
        'If passing also paths, at least one path must be defined',
};

/**
 * @ignore
 */
export const routeRequestValidationConfig = {
    schema: calculateRouteRequestSchema,
    refinements: [calculateRouteGeoInputsRefinement],
};
