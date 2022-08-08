import { GeocodingResponse, GeocodingResponseAPI } from "../types/GeocodingResponse";

export const apiResponse0: GeocodingResponseAPI = {
    summary: {
        query: "1507 zaandam",
        queryType: "NON_NEAR",
        queryTime: 82,
        numResults: 2,
        offset: 0,
        totalResults: 189,
        fuzzyLevel: 1
    },
    results: [
        {
            type: "Geography",
            id: "NL/GEO/p0/7133",
            score: 4.4519996643,
            entityType: "PostalCodeArea",
            matchConfidence: {
                score: 1
            },
            address: {
                municipalitySubdivision: "Zaandam, Westzaan, Amsterdam Havens",
                municipality: "Zaanstad",
                countrySubdivision: "Noord-Holland",
                postalCode: "1507",
                countryCode: "NL",
                country: "Nederland",
                countryCodeISO3: "NLD",
                freeformAddress: "1507 Zaanstad"
            },
            position: {
                lat: 52.4388,
                lon: 4.80221
            },
            viewport: {
                topLeftPoint: {
                    lat: 52.45513,
                    lon: 4.78348
                },
                btmRightPoint: {
                    lat: 52.42248,
                    lon: 4.81969
                }
            },
            boundingBox: {
                topLeftPoint: {
                    lat: 52.45513,
                    lon: 4.78348
                },
                btmRightPoint: {
                    lat: 52.42248,
                    lon: 4.81969
                }
            },
            dataSources: {
                geometry: {
                    id: "00004e4c-3100-3c00-0000-00004d7d11c3"
                }
            }
        }
    ]
};

export const apiResponse1: GeocodingResponseAPI = {
    summary: {
        query: "nieuwstraat 41 zwolle",
        queryType: "NON_NEAR",
        queryTime: 63,
        numResults: 1,
        offset: 0,
        totalResults: 1,
        fuzzyLevel: 1
    },
    results: [
        {
            type: "Point Address",
            id: "NL/PAD/p0/2492368",
            score: 5.8015999794,
            matchConfidence: {
                score: 1
            },
            address: {
                streetNumber: "41",
                streetName: "Nieuwstraat",
                municipality: "Zwolle",
                countrySubdivision: "Overijssel",
                postalCode: "8011",
                extendedPostalCode: "8011 TM",
                countryCode: "NL",
                country: "Nederland",
                countryCodeISO3: "NLD",
                freeformAddress: "Nieuwstraat 41, 8011 TM Zwolle",
                localName: "Zwolle"
            },
            position: {
                lat: 52.51322,
                lon: 6.09283
            },
            viewport: {
                topLeftPoint: {
                    lat: 52.51412,
                    lon: 6.09135
                },
                btmRightPoint: {
                    lat: 52.51232,
                    lon: 6.09431
                }
            },
            entryPoints: [
                {
                    type: "main",
                    position: {
                        lat: 52.51301,
                        lon: 6.09268
                    }
                }
            ]
        }
    ]
};

export const apiResponse2: GeocodingResponseAPI = {
    ...apiResponse0,
    results: [
        {
            ...apiResponse0.results[0],
            addressRanges: {
                from: {
                    lat: 52.45513,
                    lon: 4.78348
                },
                to: {
                    lat: 52.42248,
                    lon: 4.81969
                },
                rangeLeft: "1 - 3",
                rangeRight: "2 - 12"
            }
        }
    ]
};

export const sdkResponse0: GeocodingResponse = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.80221, 52.4388] },
            properties: {
                type: "Geography",
                id: "NL/GEO/p0/7133",
                score: 4.4519996643,
                geographyType: ["PostalCodeArea"],
                matchConfidence: {
                    score: 1
                },
                address: {
                    municipalitySubdivision: "Zaandam, Westzaan, Amsterdam Havens",
                    municipality: "Zaanstad",
                    countrySubdivision: "Noord-Holland",
                    postalCode: "1507",
                    countryCode: "NL",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: "1507 Zaanstad"
                },
                viewport: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [4.78348, 52.42248],
                            [4.81969, 52.42248],
                            [4.81969, 52.45513],
                            [4.78348, 52.45513],
                            [4.78348, 52.42248]
                        ]
                    ]
                },
                boundingBox: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [4.78348, 52.42248],
                            [4.81969, 52.42248],
                            [4.81969, 52.45513],
                            [4.78348, 52.45513],
                            [4.78348, 52.42248]
                        ]
                    ]
                },
                dataSources: {
                    geometry: {
                        id: "00004e4c-3100-3c00-0000-00004d7d11c3"
                    }
                }
            }
        }
    ]
};
export const sdkResponse1: GeocodingResponse = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [6.09283, 52.51322] },
            properties: {
                type: "Point Address",
                score: 5.8015999794,
                matchConfidence: {
                    score: 1
                },
                address: {
                    streetNumber: "41",
                    streetName: "Nieuwstraat",
                    municipality: "Zwolle",
                    countrySubdivision: "Overijssel",
                    postalCode: "8011",
                    extendedPostalCode: "8011 TM",
                    countryCode: "NL",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: "Nieuwstraat 41, 8011 TM Zwolle",
                    localName: "Zwolle"
                },
                viewport: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [6.09135, 52.51232],
                            [6.09431, 52.51232],
                            [6.09431, 52.51412],
                            [6.09135, 52.51412],
                            [6.09135, 52.51232]
                        ]
                    ]
                },
                entryPoints: [
                    {
                        type: "main",
                        position: [6.09268, 52.51301]
                    }
                ]
            }
        }
    ]
};

export const sdkResponse2: GeocodingResponse = {
    ...sdkResponse0,
    features: [
        {
            ...sdkResponse0.features[0],
            properties: {
                ...sdkResponse0.features[0].properties,
                addressRanges: {
                    from: [4.78348, 52.45513],
                    to: [4.81969, 52.42248],
                    rangeLeft: "1 - 3",
                    rangeRight: "2 - 12"
                }
            }
        }
    ]
};
