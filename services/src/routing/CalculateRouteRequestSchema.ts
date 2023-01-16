import { z } from "zod";
import { getGeoInputType, inputSectionTypes, SectionType } from "@anw/go-sdk-js/core";
import { featureSchema, geometrySchema, hasLngLatSchema, lineStringCoordsSchema } from "../shared/GeometriesSchema";
import { CalculateRouteParams, instructionsTypes } from "./types/CalculateRouteParams";
import { vehicleParametersSchema } from "./VehicleSchema";
import { SchemaRefinement } from "../shared/types/Validation";

const waypointLikeSchema = z.union([hasLngLatSchema, geometrySchema]);
const pathLikeSchema = z.union([lineStringCoordsSchema, featureSchema]);

const calculateRouteRequestSchemaMandatory = z.object({
    geoInputs: z.array(z.union([waypointLikeSchema, pathLikeSchema])).min(1)
});

/**
 * @ignore
 * @group Calculate Route
 * @category Variables
 */
export const calculateRouteRequestSchema = calculateRouteRequestSchemaMandatory.merge(
    z
        .object({
            avoid: z.string().array(),
            computeAdditionalTravelTimeFor: z.enum(["none", "all"]),
            considerTraffic: z.boolean(),
            currentHeading: z.number().min(0).max(359.5),
            instructionsType: z.enum(instructionsTypes),
            maxAlternatives: z.number().min(1).max(5),
            routeRepresentation: z.enum(["polyline", "summaryOnly"]),
            routeType: z.string(),
            sectionTypes: z.array(z.enum(inputSectionTypes as [SectionType, ...SectionType[]])),
            thrillingParams: z.object({
                hilliness: z.enum(["low", "normal", "high"]).optional(),
                windingness: z.enum(["low", "normal", "high"]).optional()
            }),
            travelMode: z.string(),
            vehicle: vehicleParametersSchema,
            when: z.object({
                option: z.enum(["departAt", "arriveBy"]),
                date: z.date()
            })
        })
        .partial()
);

/**
 * @ignore
 * @group Calculate Route
 * @category Variables
 */
export const calculateRouteGeoInputsRefinement: SchemaRefinement<CalculateRouteParams> = {
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
