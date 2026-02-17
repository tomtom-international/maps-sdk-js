import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';

/**
 * @ignore
 */
export const evChargingStationsAvailabilityRequestSchema = commonServiceRequestSchema.extend({
    id: z.string().describe('Unique identifier of the EV charging station'),
});
