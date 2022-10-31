import { z } from "zod";

export const geometrySchema = z
    .object({
        type: z.string(),
        coordinates: z.union([
            z.array(z.number()),
            z.array(z.array(z.number())),
            z.array(z.array(z.array(z.number())))
        ]),
        radius: z.number().optional(),
        radiusMeters: z.number().optional()
    })
    .refine(
        (data) => (data.type === "Circle" ? Boolean(data.radius) : true),
        'type: "Circle" must have radius property'
    );

export const hasLngLatSchema = z.union([
    z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
    z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180), z.number()]),
    z.object({
        type: z.literal("Point"),
        coordinates: z.number().array()
    }),
    z.object({
        type: z.literal("Feature"),
        geometry: geometrySchema,
        id: z.union([z.string(), z.number()]).optional(),
        properties: z.any()
    })
]);
