import { z } from "zod";
import { connectorTypes } from "@anw/go-sdk-js/core";

const chargingAvailabilityRequestMandatory = z.object({
    id: z.string()
});

const chargingAvailabilityRequestOptional = z
    .object({
        connectorTypes: z.array(z.enum(connectorTypes)),
        minPowerKW: z.number(),
        maxPowerKW: z.number()
    })
    .partial();
/**
 * @ignore
 */
export const chargingAvailabilityRequestSchema = chargingAvailabilityRequestMandatory.merge(
    chargingAvailabilityRequestOptional
);
