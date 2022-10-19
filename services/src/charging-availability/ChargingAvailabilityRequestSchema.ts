import { z } from "zod";

const chargingAvailabilityRequestMandatory = z.object({
    id: z.string()
});

const chargingAvailabilityRequestOptional = z
    .object({
        connectorTypes: z.string().array(),
        minPowerKW: z.number(),
        maxPowerKW: z.number()
    })
    .partial();

export const chargingAvailabilityRequestSchema = chargingAvailabilityRequestMandatory.merge(
    chargingAvailabilityRequestOptional
);
