import revgeocode from "../ReverseGeocoding";
import {ReverseGeocodingParams} from "../types/ReverseGeocodingParams";

describe("ReverseGeocoding schema validation", () => {
    test("it should fail when position is an invalid param - case 1", async () => {
        const invalidParams: ReverseGeocodingParams = {
            // @ts-ignore
            position: {lon: -122.420679, lat: 37.772537}
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_union",
                    path: ["position"],
                    message: "Invalid input"
                }
            ]
        });
    });

    test("it should fail when latitude/longitude is out of range", async () => {
        await expect(
            revgeocode({
                position: [200, -95]
            })
        ).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "too_big",
                    maximum: 180,
                    type: "number",
                    inclusive: true,
                    message: "Number must be less than or equal to 180",
                    path: ["position", 0]
                },
                {
                    code: "too_small",
                    minimum: -90,
                    type: "number",
                    inclusive: true,
                    message: "Number must be greater than or equal to -90",
                    path: ["position", 1]
                }
            ]
        });
    });

    test("it should fail when position is an invalid param - case 2", async () => {
        const invalidParams: ReverseGeocodingParams = {
            // @ts-ignore
            position: (-122.420679, 37.772537)
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_union",
                    path: ["position"],
                    message: "Invalid input",
                }
            ]
        });
    });

    test("it should fail when position is an invalid param - case 3", async () => {
        const invalidParams: ReverseGeocodingParams = {
            // @ts-ignore
            position: "-122.420679, 37.772537"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_union",
                    path: ["position"],
                    message: "Invalid input",
                }
            ]
        });
    });

    test("it should fail when position is absent", async () => {
        // @ts-ignore
        const invalidParams: ReverseGeocodingParams = {
            geographyType: ["Country"]
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_union",
                    path: ["position"],
                    message: "Invalid input"
                }
            ]
        });
    });

    test("it should fail when heading isn't less than or equal to 360", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            heading: 361
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "too_big",
                    path: ["heading"],
                    message: "Number must be less than or equal to 360"
                }
            ]
        });
    });

    test("it should fail when heading isn't greater than or equal to -360", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            heading: -361
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "too_small",
                    path: ["heading"],
                    message: "Number must be greater than or equal to -360"
                }
            ]
        });
    });

    test("it should fail when heading isn't in number format", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            heading: "180"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["heading"],
                    message: "Expected number, received string"
                }
            ]
        });
    });

    test("it should fail when mapcode isn't of type string array", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            mapcodes: "Local"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["mapcodes"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when param number isn't in string format", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            number: 36
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["number"],
                    message: "Expected string, received number"
                }
            ]
        });
    });

    test("it should fail when param radius isn't in number format", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            radius: "2000"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["radius"],
                    message: "Expected number, received string"
                }
            ]
        });
    });

    test("it should fail when param geography isn't a string array", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            geographyType: "Country"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["geographyType"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when param returnRoadUse isn't of type string array", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnRoadUse: "LimitedAccess"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["returnRoadUse"],
                    message: "Expected boolean, received string"
                }
            ]
        });
    });

    test("it should fail when param allowFreeformNewline isn't of type boolean", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            allowFreeformNewline: "true"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["allowFreeformNewline"],
                    message: "Expected boolean, received string"
                }
            ]
        });
    });

    test("it should fail when param returnSpeedLimit isn't of type boolean", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnSpeedLimit: "true"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["returnSpeedLimit"],
                    message: "Expected boolean, received string"
                }
            ]
        });
    });

    test("it should fail when param returnMatchType isn't of type boolean", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnMatchType: "true"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_type",
                    path: ["returnMatchType"],
                    message: "Expected boolean, received string"
                }
            ]
        });
    });

    test("it should fail when view is an invalid param", async () => {
        const invalidParams: ReverseGeocodingParams = {
            position: [-122.420679, 37.772537],
            //@ts-ignore
            view: "MAA"
        };

        await expect(revgeocode(invalidParams)).rejects.toMatchObject({
            service: "ReverseGeocode",
            errors: [
                {
                    code: "invalid_enum_value",
                    message:
                        "Invalid enum value. Expected 'Unified' | 'AR' | 'IN' | 'PK' | 'IL' | 'MA' | 'RU' | 'TR' | 'CN', received 'MAA'",
                    path: ["view"]
                }
            ]
        });
    });
});
