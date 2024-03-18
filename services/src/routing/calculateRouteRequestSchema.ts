import { z } from "zod";
import type { SectionType } from "@anw/maps-sdk-js/core";
import { getGeoInputType, inputSectionTypesWithGuidance } from "@anw/maps-sdk-js/core";
import { featureSchema, geometrySchema, hasLngLatSchema, lineStringCoordsSchema } from "../shared/geometriesSchema";
import type { CalculateRouteParams } from "./types/calculateRouteParams";
import type { SchemaRefinement } from "../shared/types/validation";
import { commonRoutingRequestSchema } from "../shared/commonRoutingRequestSchema";

const waypointLikeSchema = z.union([hasLngLatSchema, geometrySchema]);
const pathLikeSchema = z.union([lineStringCoordsSchema, featureSchema]);

const calculateRouteRequestSchemaMandatory = z.object({
    geoInputs: z.array(z.union([waypointLikeSchema, pathLikeSchema])).min(1)
});

const calculateRouteRequestSchemaOptional = z
    .object({
        computeAdditionalTravelTimeFor: z.enum(["none", "all"]),
        vehicleHeading: z.number().min(0).max(359.5),
        // TODO add proper instructionsInfo check
        // instructionsType: z.enum(instructionsTypes),
        maxAlternatives: z.number().min(0).max(5),
        sectionTypes: z.array(z.enum(inputSectionTypesWithGuidance as [SectionType, ...SectionType[]]))
    })
    .partial();

const calculateRouteRequestSchema = commonRoutingRequestSchema
    .merge(calculateRouteRequestSchemaMandatory)
    .merge(calculateRouteRequestSchemaOptional);

const calculateRouteGeoInputsRefinement: SchemaRefinement<CalculateRouteParams> = {
    check: (data: CalculateRouteParams): boolean => {
        const geoInputTypes = data.geoInputs.map(getGeoInputType);
        if (!geoInputTypes.includes("path")) {
            return data.geoInputs.length >= 2;
        }
        return true;
    },
    message:
        "When passing waypoints only: at least 2 must be defined. " +
        "If passing also paths, at least one path must be defined"
};

/**
 * @ignore
 */
export const routeRequestValidationConfig = {
    schema: calculateRouteRequestSchema,
    refinements: [calculateRouteGeoInputsRefinement]
};
