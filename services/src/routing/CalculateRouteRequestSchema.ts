import { z } from "zod";
import { inputSectionTypes, SectionType } from "@anw/go-sdk-js/core";
import { geometrySchema, hasLngLatSchema } from "../shared/GeometriesSchema";
import { instructionsTypes } from "./types/CalculateRouteParams";
import { vehicleParametersSchema } from "./VehicleSchema";

const calculateRouteRequestMandatory = z.object({
    locations: z.array(z.union([hasLngLatSchema, geometrySchema])).min(2)
});

const calculateRouteRequestOptional = z
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
    .partial();
/**
 * @ignore
 * @group Calculate Route
 * @category Variables
 */
export const calculateRouteRequestSchema = calculateRouteRequestMandatory.merge(calculateRouteRequestOptional);
