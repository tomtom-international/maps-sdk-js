import { JSONSchemaType } from "ajv";
import { GeometrySearchRequest } from "./types";

export const geometrySearchRequestSchema: JSONSchemaType<GeometrySearchRequest> = {
    type: "object",
    properties: {
        apiKey: { type: "string", nullable: true },
        commonBaseURL: { type: "string", nullable: true },
        customServiceBaseURL: { type: "string", nullable: true },
        query: { type: "string" },
        limit: { type: "number", nullable: true, maximum: 100 },
        extendedPostalCodesFor: { type: "array", nullable: true, items: { type: "string" } },
        mapcodes: { type: "array", nullable: true, items: { type: "string" } },
        view: { type: "string", nullable: true, enum: ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"] },
        geographyType: { type: "array", nullable: true, items: { type: "string" } },
        language: { type: "string", nullable: true },
        indexes: { type: "array", items: { type: "string" }, nullable: true },
        categories: { type: "array", items: { type: "number" }, nullable: true },
        brands: { type: "array", items: { type: "string" }, nullable: true },
        connectors: { type: "array", items: { type: "string" }, nullable: true },
        openingHours: { type: "string", nullable: true },
        fuels: { type: "array", items: { type: "string" }, nullable: true },
        timeZone: { type: "string", nullable: true },
        relatedPois: { type: "string", nullable: true },
        minPowerKW: { type: "number", nullable: true },
        maxPowerKW: { type: "number", nullable: true },
        entityTypes: { type: "array", items: { type: "string" }, nullable: true },
        geometryList: {
            type: "array",
            items: {
                type: "object",
                required: ["coordinates", "type"],
                if: { properties: { type: { const: "Circle" } } },
                then: { required: ["radius"] }
            }
        }
    },
    required: ["query"]
};
