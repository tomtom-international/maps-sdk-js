import { z } from "zod";
import { vehicleParametersSchema } from "./vehicleSchema";
import { avoidableTypes } from "@anw/maps-sdk-js/core";
import { routeTypes } from "./types/commonRoutingParams";

/**
 * @ignore
 */
export const commonRoutingRequestSchema = z
    .object({
        costModel: z
            .object({
                avoid: z.array(z.enum(avoidableTypes)),
                traffic: z.enum(["live", "historical"]).optional(),
                routeType: z.enum(routeTypes).optional(),
                thrillingParams: z
                    .object({
                        hilliness: z.enum(["low", "normal", "high"]).optional(),
                        windingness: z.enum(["low", "normal", "high"]).optional()
                    })
                    .optional()
            })
            .partial(),
        travelMode: z.string(),
        vehicle: vehicleParametersSchema,
        when: z.object({
            option: z.enum(["departAt", "arriveBy"]),
            date: z.date()
        })
    })
    .partial();
