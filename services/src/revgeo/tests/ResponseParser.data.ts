import { ReverseGeocodingOptions } from "../ReverseGeocodingOptions";
import { ReverseGeocodingResponse } from "../ReverseGeocoding";
import { RevGeoAddressProps } from "core";

export const apiAndParsedResponses = [
    [
        "Address example 0",
        [5.72884, 52.33499],
        {
            address: {
                routeNumbers: [],
                street: "Hierderweg",
                streetName: "Hierderweg",
                countryCode: "NL",
                countrySubdivision: "Gelderland",
                municipality: "Nunspeet",
                postalCode: "8077",
                municipalitySubdivision: "Hulshorst",
                country: "Nederland",
                countryCodeISO3: "NLD",
                freeformAddress: "Hierderweg, 8077 Hulshorst",
                boundingBox: {
                    northEast: "52.336436,5.739380",
                    southWest: "52.334605,5.722876",
                    entity: "position"
                },
                localName: "Hulshorst"
            },
            position: "52.335152,5.728785"
        } as any,
        // no options:
        null,
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [5.72884, 52.33499] },
            properties: {
                routeNumbers: [] as any,
                street: "Hierderweg",
                streetName: "Hierderweg",
                countryCode: "NL",
                countrySubdivision: "Gelderland",
                municipality: "Nunspeet",
                postalCode: "8077",
                municipalitySubdivision: "Hulshorst",
                country: "Nederland",
                countryCodeISO3: "NLD",
                freeformAddress: "Hierderweg, 8077 Hulshorst",
                boundingBox: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [5.722876, 52.334605],
                            [5.73938, 52.334605],
                            [5.73938, 52.336436],
                            [5.722876, 52.336436],
                            [5.722876, 52.334605]
                        ]
                    ]
                },
                localName: "Hulshorst",
                originalPosition: [5.728785, 52.335152]
            }
        } as ReverseGeocodingResponse
    ],
    [
        "Address example 1 with update response function",
        [5.72884, 52.33499],
        {
            address: {
                routeNumbers: [],
                street: "Hierderweg",
                streetName: "Hierderweg",
                countryCode: "NL",
                countrySubdivision: "Gelderland",
                municipality: "Nunspeet",
                postalCode: "8077",
                municipalitySubdivision: "Hulshorst",
                country: "Nederland",
                countryCodeISO3: "NLD",
                freeformAddress: "Hierderweg, 8077 Hulshorst",
                boundingBox: {
                    northEast: "52.336436,5.739380",
                    southWest: "52.334605,5.722876",
                    entity: "position"
                },
                localName: "Hulshorst"
            },
            position: "52.335152,5.728785"
        } as any,
        {
            updateResponse: (response: ReverseGeocodingResponse): ReverseGeocodingResponse => {
                return { ...response, properties: { ...response.properties, newField: "TEST" } as RevGeoAddressProps };
            }
        } as ReverseGeocodingOptions,
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [5.72884, 52.33499] },
            properties: {
                routeNumbers: [] as any,
                street: "Hierderweg",
                streetName: "Hierderweg",
                countryCode: "NL",
                countrySubdivision: "Gelderland",
                municipality: "Nunspeet",
                postalCode: "8077",
                municipalitySubdivision: "Hulshorst",
                country: "Nederland",
                countryCodeISO3: "NLD",
                freeformAddress: "Hierderweg, 8077 Hulshorst",
                boundingBox: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [5.722876, 52.334605],
                            [5.73938, 52.334605],
                            [5.73938, 52.336436],
                            [5.722876, 52.336436],
                            [5.722876, 52.334605]
                        ]
                    ]
                },
                localName: "Hulshorst",
                originalPosition: [5.728785, 52.335152],
                newField: "TEST"
            }
        } as ReverseGeocodingResponse
    ]
];
