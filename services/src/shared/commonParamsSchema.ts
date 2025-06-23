import { z } from "zod/v4-mini";

/**
 * @ignore
 */
export const commonServiceRequestSchema = z.partial(
    z.object({
        apiKey: z.string(),
        commonBaseURL: z.string(),
        customServiceBaseURL: z.string(),
        language: z.string()
    })
);
