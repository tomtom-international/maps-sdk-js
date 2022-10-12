import geocode from "../Geocoding";
import { GeocodingParams } from "../types/GeocodingParams";

describe("Geocoding schema validation", () => {
    test("it should fail when passing invalid params", async () => {
        const invalidParams: GeocodingParams = {
            query: "amsterdam",
            typeahead: true,
            limit: 1500, // Invalid value, limit <= 100
            offset: 3,
            position: [4.81063, 51.85925],
            // Using ts-ignore as the view is an invalid value
            //@ts-ignore
            view: "MAA", // Invalid value, it should be of type View
            geographyTypes: ["Municipality", "MunicipalitySubdivision"],
            language: "en-GB",
            radiusMeters: 1000000
        };

        await expect(geocode(invalidParams)).rejects.toThrow("Validation error");
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "too_big",
                    maximum: 100,
                    type: "number",
                    inclusive: true,
                    message: "Number must be less than or equal to 100",
                    path: ["limit"]
                },
                {
                    received: "MAA",
                    code: "invalid_enum_value",
                    options: ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"],
                    path: ["view"],
                    message:
                        "Invalid enum value. Expected 'Unified' | 'AR' | 'IN' | 'PK' | 'IL' | 'MA' | 'RU' | 'TR' | 'CN', received 'MAA'"
                }
            ]
        });
    });
});
