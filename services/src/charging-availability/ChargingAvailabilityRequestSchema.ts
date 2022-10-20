import { z } from "zod";

const chargingAvailabilityRequestMandatory = z.object({
    id: z.string()
});

const chargingAvailabilityRequestOptional = z
    .object({
        connectorTypes: z.array(
            z.enum([
                "StandardHouseholdCountrySpecific",
                "IEC62196Type1",
                "IEC62196Type1CCS",
                "IEC62196Type2CableAttached",
                "IEC62196Type2Outlet",
                "IEC62196Type2CCS",
                "IEC62196Type3",
                "Chademo",
                "GBT20234Part2",
                "GBT20234Part3",
                "IEC60309AC3PhaseRed",
                "IEC60309AC1PhaseBlue",
                "IEC60309DCWhite",
                "Tesla"
            ])
        ),
        minPowerKW: z.number(),
        maxPowerKW: z.number()
    })
    .partial();

export const chargingAvailabilityRequestSchema = chargingAvailabilityRequestMandatory.merge(
    chargingAvailabilityRequestOptional
);
