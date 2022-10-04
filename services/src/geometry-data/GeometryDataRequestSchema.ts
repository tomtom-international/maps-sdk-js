import { JSONSchemaType } from "ajv";
import { GeometryDataParams } from "./types/GeometryDataParams";

export const geometryDataRequestSchema: JSONSchemaType<GeometryDataParams> = {
    type: "object",
    required: ["geometries"],
    oneOf: [{ required: ["commonBaseURL"] }, { required: ["customServiceBaseURL"] }],
    properties: {
        apiKey: { type: "string", nullable: true },
        commonBaseURL: { type: "string", nullable: true },
        customServiceBaseURL: { type: "string", nullable: true },
        language: { type: "string", nullable: true },
        geometries: {
            type: "array",
            maxItems: 20,
            items: { type: "string" }
        },
        zoom: {
            type: "integer",
            nullable: true,
            minimum: 0,
            maximum: 22
        }
    }
};
