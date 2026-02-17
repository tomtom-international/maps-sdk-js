import { z } from 'zod';

/**
 * @ignore
 */
export const commonServiceRequestSchema = z.object({
    apiKey: z.string().optional().describe('TomTom API key for authentication'),
    commonBaseURL: z.string().optional().describe('Common base URL for all services'),
    customServiceBaseURL: z.string().optional().describe('Custom base URL for specific service'),
    language: z.string().optional().describe('Language code for response text (e.g., "en-US", "nl-NL")'),
});
