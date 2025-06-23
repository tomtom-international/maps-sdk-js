import { z } from "zod/v4-mini";

/**
 * @ignore
 */
export const evChargingStationsAvailabilityRequestSchema = z.object({
    id: z.string()
});
