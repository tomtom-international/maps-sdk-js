import { ReverseGeocodingResponse } from "../ReverseGeocoding";

export const apiAndParsedResponses = [
    [
        "Address example 0",
        { position: [5.72884, 52.33499] },
        {
            addresses: [
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
                        localName: "Hulshorst",
                        sideOfStreet: "R",
                        offsetPosition: "52.33516,5.72879"
                    },
                    mapcodes: [
                        {
                            type: "Local",
                            fullMapcode: "US-CA FS.WRG0",
                            territory: "US-CA",
                            code: "FS.WRG0"
                        },
                        {
                            type: "International",
                            fullMapcode: "S4ZW4.89XV"
                        },
                        { type: "Alternative", fullMapcode: "USA JJCH.H9CF", territory: "USA", code: "JJCH.H9CF" }
                    ],
                    position: "52.335152,5.728785"
                }
            ]
        } as any,
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [5.72884, 52.33499] },
            properties: {
                type: "Street",
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
                    localName: "Hulshorst"
                },
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
                mapcodes: [
                    {
                        type: "Local",
                        fullMapcode: "US-CA FS.WRG0",
                        territory: "US-CA",
                        code: "FS.WRG0"
                    },
                    {
                        type: "International",
                        fullMapcode: "S4ZW4.89XV"
                    },
                    { type: "Alternative", fullMapcode: "USA JJCH.H9CF", territory: "USA", code: "JJCH.H9CF" }
                ],
                sideOfStreet: "R",
                offsetPosition: [5.72879, 52.33516],
                originalPosition: [5.728785, 52.335152]
            }
        } as ReverseGeocodingResponse
    ]
];
