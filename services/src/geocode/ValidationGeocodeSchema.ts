import { JSONSchemaType } from "ajv";
import { GeocodingParams } from "./types/GeocodingParams";

export const validationGeocodeSchema: JSONSchemaType<GeocodingParams> = {
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
            items: {
                type: "number"
            }
        },
        countrySet: {
            type: "array",
            nullable: true,
            items: {
                type: "string"
            }
        },
        radius: { type: "number", nullable: true },
        boundingBox: {
            type: "object",
            properties: {
                coordinates: {
                    type: "array",
                    items: { type: "array", items: { type: "array", items: { type: "number" } } }
                },
                type: { type: "string" },
                bbox: {
                    type: "array",
                    nullable: true,
                    additionalItems: false,
                    items: [{ type: "number" }, { type: "number" }, { type: "number" }, { type: "number" }],
                    minItems: 4,
                    maxItems: 6
                }
            },
            nullable: true,
            required: ["coordinates", "type"]
        },
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
