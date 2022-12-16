import geocode from "../Geocoding";
import { GeocodingParams } from "../types/GeocodingParams";
import { Polygon } from "geojson";
import geoCodingReqObjects from "../../geocode/tests/RequestBuilderPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { validateRequestSchema } from "../../shared/Validation";
import { geocodingRequestSchema } from "../GeocodingRequestSchema";

describe("Geocoding schema validation", () => {
    test("it should fail when view is an invalid param", async () => {
        const invalidParams: GeocodingParams = {
            query: "amsterdam",
            //@ts-ignore
            view: "MAA" // Invalid value, it should be of type View
        };

        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    received: "MAA",
                    code: "invalid_enum_value",
                    options: ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"],
                    path: ["view"],
                    message:
                        "Invalid enum value. " +
                        "Expected 'Unified' | 'AR' | 'IN' | 'PK' | 'IL' | 'MA' | 'RU' | 'TR' | 'CN', received 'MAA'"
                }
            ]
        });
    });

    test("it should fail when limit is invalid", async () => {
        const invalidParams: GeocodingParams = {
            query: "amsterdam",
            typeahead: true,
            limit: 1500 // Invalid value, limit <= 100
        };
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
                }
            ]
        });
    });

    test("it should fail when offset is invalid", async () => {
        const invalidParams: GeocodingParams = {
            query: "amsterdam",
            offset: 1901 // Invalid value, offset <= 1900
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "too_big",
                    maximum: 1900,
                    type: "number",
                    inclusive: true,
                    message: "Number must be less than or equal to 1900",
                    path: ["offset"]
                }
            ]
        });
    });

    test("it should fail when position is invalid", async () => {
        const invalidParams: GeocodingParams = {
            query: "amsterdam",
            // @ts-ignore
            position: "91,51.85925"
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_union",
                    message: "Invalid input",
                    path: ["position"]
                }
            ]
        });
    });

    test("it should fail when country format is invalid", async () => {
        const invalidParams: GeocodingParams = {
            query: "amsterdam",
            // @ts-ignore
            countries: "NLD"
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected array, received string",
                    path: ["countries"]
                }
            ]
        });
    });

    test("it should fail when query is missing in the request", async () => {
        // @ts-ignore
        const invalidParams: GeocodingParams = {
            limit: 100
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_type",
                    message: "Required",
                    path: ["query"]
                }
            ]
        });
    });

    test("it should fail when query is in an invalid format", async () => {
        const invalidParams: GeocodingParams = {
            // @ts-ignore
            query: 33601
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected string, received number",
                    path: ["query"]
                }
            ]
        });
    });

    test("it should fail when radius is incorrect", async () => {
        const invalidParams: GeocodingParams = {
            query: "London",
            boundingBox: {
                type: "Polygon",
                coordinates: [
                    [
                        [5.16905, 52.44009],
                        [5.16957, 52.44009],
                        [5.16957, 51.85925],
                        [5.16905, 51.85925],
                        [5.16905, 52.44009]
                    ]
                ]
            } as Polygon,
            // @ts-ignore
            radiusMeters: "1000"
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected number, received string",
                    path: ["radiusMeters"]
                }
            ]
        });
    });

    test("it should fail when extendedPostalCodesFor format is incorrect", async () => {
        const invalidParams: GeocodingParams = {
            query: "London",
            // @ts-ignore
            extendedPostalCodesFor: "Addr"
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected array, received string",
                    path: ["extendedPostalCodesFor"]
                }
            ]
        });
    });

    test("it should fail when mapcode format is incorrect", async () => {
        const invalidParams: GeocodingParams = {
            query: "London",
            // @ts-ignore
            mapcodes: "Local"
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected array, received string",
                    path: ["mapcodes"]
                }
            ]
        });
    });

    test("it should fail when geographyTypes format is incorrect", async () => {
        const invalidParams: GeocodingParams = {
            query: "London",
            // @ts-ignore
            geographyTypes: "Municipality"
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected array, received string",
                    path: ["geographyTypes"]
                }
            ]
        });
    });

    test("it should fail when position lat/lon is out of range", async () => {
        const invalidParams: GeocodingParams = {
            query: "Minnesota",
            position: [46.6144, -93.1432] //Inverted coords for Minnesota
        };
        await expect(geocode(invalidParams)).rejects.toMatchObject({
            message: "Validation error",
            service: "Geocode",
            errors: [
                {
                    code: "too_small",
                    message: "Number must be greater than or equal to -90",
                    path: ["position", 1]
                }
            ]
        });
    });
});

describe("Geocoding request schema performance tests", () => {
    test.each(geoCodingReqObjects)(
        "'%s'",
        // @ts-ignore
        (params: GeocodingParams) => {
            expect(bestExecutionTimeMS(() => validateRequestSchema(params, geocodingRequestSchema), 10)).toBeLessThan(
                7
            );
        }
    );
});
