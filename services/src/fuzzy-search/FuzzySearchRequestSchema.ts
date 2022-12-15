import { z } from "zod";
import { commonSearchParamsSchema } from "../search/CommonSearchParamsSchema";

const simpleBBoxSchema = z.array(z.number()).length(4).or(z.array(z.number()).length(6));
const geoJsonObjectSchema = z.object({
    type: z.enum([
        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
        "Polygon",
        "MultiPolygon",
        "GeometryCollection",
        "Feature",
        "FeatureCollection"
    ])
});
const fuzzySearchRequestOptional = z
    .object({
        typeahead: z.boolean(),
        offset: z.number(),
        countries: z.string().array(),
        radiusMeters: z.number(),
        boundingBox: simpleBBoxSchema.or(geoJsonObjectSchema).or(z.array(geoJsonObjectSchema)),
        minFuzzyLevel: z.number().min(1).max(4),
        mixFuzzyLevel: z.number().min(1).max(4)
    })
    .partial();

/**
 * @ignore
 * @group Fuzzy Search
 * @category Types
 */
export const fuzzySearchRequestSchema = commonSearchParamsSchema.merge(fuzzySearchRequestOptional);
