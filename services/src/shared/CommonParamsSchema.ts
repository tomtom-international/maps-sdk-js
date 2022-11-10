import { z } from "zod";

/**
 * @ignore
 */
export const CommonServiceRequestSchema = z
    .object({
        apiKey: z.string(),
        commonBaseURL: z.string(),
        customServiceBaseURL: z.string(),
        language: z.string().optional()
    })
    .partial({
        commonBaseURL: true,
        customServiceBaseURL: true
    });
