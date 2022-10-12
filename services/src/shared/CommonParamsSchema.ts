import { z } from "zod";

export const CommonServiceParamsSchema = z
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
