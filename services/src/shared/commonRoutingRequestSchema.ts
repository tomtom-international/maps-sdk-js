import { z } from "zod";
import { vehicleParametersSchema } from "./vehicleSchema";

/**
 * @ignore
 */
export const commonRoutingRequestSchema = z
    .object({
        costModel: z
            .object({
                avoid: z.string().array().optional(),
                considerTraffic: z.boolean().optional(),
                routeType: z.string().optional(),
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
