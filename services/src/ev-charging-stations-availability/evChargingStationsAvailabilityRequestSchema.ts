import { z } from "zod";

/**
 * @ignore
 */
export const evChargingStationsAvailabilityRequestSchema = z.object({
    id: z.string()
});
