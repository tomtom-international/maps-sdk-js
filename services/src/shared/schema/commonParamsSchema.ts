import { z } from 'zod';

/**
 * @ignore
 */
export const commonServiceRequestSchema = z.object({
    apiKey: z.string().optional(),
    commonBaseURL: z.string().optional(),
    customServiceBaseURL: z.string().optional(),
    language: z.string().optional(),
});
