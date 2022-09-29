import { JSONSchemaType } from "ajv";
import { GeocodingParams } from "./types/GeocodingParams";

export const geocodingRequestSchema: JSONSchemaType<Omit<GeocodingParams, "boundingBox">> = {
    type: "object",
    properties: {
        apiKey: { type: "string", nullable: true },
        query: { type: "string", nullable: true },
        typeahead: { type: "boolean", nullable: true },
        limit: { type: "number", nullable: true, maximum: 100 },
        offset: { type: "number", nullable: true },
        position: {
            type: "array",
            nullable: true,
            items: { type: "number" }
        },
        countries: {
            type: "array",
            nullable: true,
            items: { type: "string" }
        },
        radiusMeters: { type: "number", nullable: true },
        extendedPostalCodesFor: { type: "array", nullable: true, items: { type: "string" } },
        mapcodes: { type: "array", nullable: true, items: { type: "string" } },
        view: { type: "string", nullable: true, enum: ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"] },
        geographyTypes: { type: "array", nullable: true, items: { type: "string" } },
        commonBaseURL: { type: "string", nullable: true },
        customServiceBaseURL: { type: "string", nullable: true },
        language: { type: "string", nullable: true }
    },
    required: ["query"]
};
