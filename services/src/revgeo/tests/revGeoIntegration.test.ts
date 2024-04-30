import reverseGeocode from "../reverseGeocoding";
import { putIntegrationTestsAPIKey } from "../../shared/tests/integrationTestUtils";
import { SDKServiceError } from "../../shared";
import { customizeService } from "../../../index";
import type { ReverseGeocodingResponseAPI } from "../types/apiTypes";

describe("Reverse Geocoding integration test without API key", () => {
    test("Reverse Geocoding integration test without API key", async () => {
        const coordinates = { position: [5.72884, 52.33499] };

        await expect(reverseGeocode(coordinates)).rejects.toBeInstanceOf(SDKServiceError);
        await expect(reverseGeocode(coordinates)).rejects.toMatchObject({
            service: "ReverseGeocode",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("Reverse Geocoding integration tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test("Default reverse geocoding", async () => {
        const exampleSDKResponse = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [5.72884, 52.33499]
            },
            bbox: expect.any(Array),
            id: expect.any(String),
            properties: {
                type: "Street",
                address: {
                    routeNumbers: [],
                    street: "Hierderweg",
                    streetName: "Hierderweg",
                    countryCode: "NL",
                    countrySubdivision: "Gelderland",
                    municipality: "Nunspeet",
                    postalCode: expect.any(String),
                    municipalitySubdivision: "Hulshorst",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: expect.any(String),
                    localName: "Hulshorst"
                },
                originalPosition: expect.any(Array)
            }
        };
        const result = await reverseGeocode({ position: [5.72884, 52.33499] });
        expect(result).toMatchObject(exampleSDKResponse);
    });

    test("Localized reverse geocoding", async () => {
        const result = await reverseGeocode({ position: [-0.12681, 51.50054], language: "es-ES" });
        expect(result).toBeDefined();
        expect(result.properties.address.country).toStrictEqual("Reino Unido");
    });

    test("Country reverse geocoding", async () => {
        const result = await reverseGeocode({ position: [5.72884, 52.33499], geographyType: ["Country"] });
        expect(result).toBeDefined();
        expect(result.properties.address.streetName).toBeUndefined();
        expect(result.properties.type).toBe("Geography");
    });

    test("Reverse geocoding with international mapcodes", async () => {
        const result = await reverseGeocode({ position: [5.72884, 52.33499], mapcodes: ["International"] });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with all mapcode types", async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            mapcodes: ["Local", "International", "Alternative"]
        });
        expect(result).toBeDefined();
    });

    // Skipped, too flaky, perhaps when map data stabilizes...?
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip("Reverse geocoding with house number input", async () => {
        // Point by Singel 144:
        const result = await reverseGeocode({ position: [4.89, 52.37552] });

        expect(result?.properties?.address.streetNumber).toBe("144");
        expect(result?.properties?.sideOfStreet).toBeUndefined();
        expect(result?.properties?.offsetPosition).toBeUndefined();

        const overhoeksPlein = [4.90224, 52.38388];
        // Point by Overhoeksplein, ensuring 21B:
        let resultWithNumber = await reverseGeocode({ position: overhoeksPlein, number: "23A" });
        expect(resultWithNumber?.properties?.address.streetNumber).toBe("23A");
        expect(resultWithNumber?.properties?.sideOfStreet).toBe("R");
        expect(resultWithNumber?.properties?.offsetPosition).toBeDefined();

        // Point by Overhoeksplein, ensuring 23M:
        resultWithNumber = await reverseGeocode({ position: overhoeksPlein, number: "23M" });
        expect(resultWithNumber?.properties?.address.streetNumber).toBe("23M");
        expect(resultWithNumber?.properties?.sideOfStreet).toBe("R");
        expect(resultWithNumber?.properties?.offsetPosition).toBeDefined();

        // Point around Regency Street 57, side of street undefined
        const resultWithNumberOtherSide = await reverseGeocode({ position: [-0.12734, 51.49534], number: "7" });
        expect(resultWithNumberOtherSide?.properties?.address.streetNumber).toBe("7");
        expect(resultWithNumberOtherSide?.properties?.sideOfStreet).toBeUndefined();
    });

    test("Reverse geocoding from the sea with small radius", async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937], radiusMeters: 10 });
        expect(result.properties.address).toBeUndefined();
    });

    test("Reverse geocoding from the sea with default radius which yields a result", async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937] });
        expect(result.properties.address).toBeDefined();
    });

    test("Reverse geocoding with specified road uses", async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            returnRoadUse: true,
            roadUses: ["Terminal", "LocalStreet"]
        });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with most options as non defaults", async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            allowFreeformNewline: true,
            heading: 90,
            language: "nl-NL",
            mapcodes: ["Local", "International"],
            number: "10",
            radiusMeters: 50000,
            returnRoadUse: true,
            roadUses: ["Ramp"]
        });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with template response override", async () => {
        const result = await reverseGeocode(
            { position: [-0.12681, 51.50054] },
            {
                parseResponse: (params, response) => ({
                    ...customizeService.reverseGeocode.parseRevGeoResponse(params, response),
                    newField: "test"
                })
            }
        );
        expect(result).toStrictEqual({ ...result, newField: "test" });
    });

    test("Reverse geocoding with API request and response callbacks", async () => {
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: ReverseGeocodingResponseAPI) => void;
        const result = await reverseGeocode({ position: [5.72884, 52.33499], onAPIRequest, onAPIResponse });
        expect(result).toBeDefined();
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test("Reverse geocoding with API request and response error callbacks", async () => {
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: ReverseGeocodingResponseAPI) => void;
        await expect(() =>
            reverseGeocode({
                position: [5.72884, 52.33499],
                apiKey: "INCORRECT",
                onAPIRequest,
                onAPIResponse
            })
        ).rejects.toThrow(expect.objectContaining({ status: 403 }));
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 403 }));
    });
});
