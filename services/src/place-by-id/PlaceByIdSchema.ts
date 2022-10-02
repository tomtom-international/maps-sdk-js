import { JSONSchemaType } from "ajv";
import { PlaceByIdParams } from "./types";

export const placeByIdRequestSchema: JSONSchemaType<PlaceByIdParams> = {
    type: "object",
    required: ["entityId"],
    oneOf: [{ required: ["commonBaseURL"] }, { required: ["customServiceBaseURL"] }],
    properties: {
        apiKey: { type: "string", nullable: true },
        commonBaseURL: { type: "string", nullable: true },
        customServiceBaseURL: { type: "string", nullable: true },
        language: { type: "string", nullable: true },
        entityId: { type: "string" },
        mapcodes: { type: "array", nullable: true, items: { type: "string" } },
        view: { type: "string", nullable: true, enum: ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"] },
        openingHours: { type: "string", nullable: true },
        timeZone: { type: "string", nullable: true },
        relatedPois: { type: "string", nullable: true }
    }
};
