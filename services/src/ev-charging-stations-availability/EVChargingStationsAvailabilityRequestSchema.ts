import { z } from "zod";
import { connectorTypes } from "@anw/maps-sdk-js/core";

const evChargingStationsAvailabilityRequestMandatory = z.object({
    id: z.string()
});

const evChargingStationsAvailabilityRequestOptional = z
    .object({
        connectorTypes: z.array(z.enum(connectorTypes)),
        minPowerKW: z.number(),
        maxPowerKW: z.number()
    })
    .partial();
/**
 * @ignore
 */
export const evChargingStationsAvailabilityRequestSchema = evChargingStationsAvailabilityRequestMandatory.merge(
    evChargingStationsAvailabilityRequestOptional
);
