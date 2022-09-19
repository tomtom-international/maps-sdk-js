import { JSONSchemaType } from "ajv";
import { ReverseGeocodingParams } from "./types/ReverseGeocodingParams";

export const revGeocodeRequestSchema: JSONSchemaType<ReverseGeocodingParams> = {
    type: "object",
    properties: {
        apiKey: { type: "string", nullable: true },
        commonBaseURL: { type: "string", nullable: true },
        customServiceBaseURL: { type: "string", nullable: true },
        language: { type: "string", nullable: true },
        position: {
            type: "array",
            nullable: true,
            items: {
                type: "number"
            }
        },
        allowFreeformNewline: { type: "boolean", nullable: true },
        geographyType: { type: "array", nullable: true, items: { type: "string" } },
        heading: { type: "number", nullable: true },
        mapcodes: { type: "array", nullable: true, items: { type: "string" } },
        number: { type: "string", nullable: true },
        radius: { type: "number", nullable: true },
        returnMatchType: { type: "boolean", nullable: true },
        returnRoadUse: { type: "boolean", nullable: true },
        returnSpeedLimit: { type: "boolean", nullable: true },
        roadUses: { type: "array", items: { type: "string" }, nullable: true },
        view: { type: "string", nullable: true }
    },
    required: ["position"]
};
