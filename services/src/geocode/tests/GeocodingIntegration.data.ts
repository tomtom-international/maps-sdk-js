import { GeocodingProps } from "../types/GeocodingResponse";
import { FeatureCollection, Point } from "geojson";

type GeocodingResponseOmitId = FeatureCollection<Point, Omit<GeocodingProps, "id">>;

export const singleResultExample: GeocodingResponseOmitId = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.8093, 52.44131] },
            properties: {
                type: "Street",
                score: 3.8105280399,
                matchConfidence: {
                    score: 1
                },
                address: {
                    streetName: "Teakhout",
                    municipalitySubdivision: "Zaandam",
                    municipality: "Zaanstad",
                    countrySubdivision: "Noord-Holland",
                    countryCode: "NL",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: "Teakhout, Zaanstad",
                    localName: "Zaanstad"
                },
                viewport: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [4.80845, 52.44009],
                            [4.81063, 52.44009],
                            [4.81063, 52.44179],
                            [4.80845, 52.44179],
                            [4.80845, 52.44009]
                        ]
                    ]
                }
            }
        }
    ]
};

const firstResult: Omit<GeocodingProps, "id"> = {
    type: "Street",
    score: 2.1169600487,
    matchConfidence: {
        score: 1
    },
    address: {
        streetName: "Teakhout",
        municipalitySubdivision: "Zaandam",
        municipality: "Zaanstad",
        countrySubdivision: "Noord-Holland",
        countryCode: "NL",
        country: "Nederland",
        countryCodeISO3: "NLD",
        freeformAddress: "Teakhout, Zaanstad",
        localName: "Zaanstad"
    },
    viewport: {
        type: "Polygon",
        coordinates: [
            [
                [4.80845, 52.44009],
                [4.81063, 52.44009],
                [4.81063, 52.44179],
                [4.80845, 52.44179],
                [4.80845, 52.44009]
            ]
        ]
    }
};

export const multiResultExample: GeocodingResponseOmitId = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.8093, 52.44131] },
            properties: {
                ...firstResult
            }
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [5.16929, 52.01988] },
            properties: {
                type: "Street",
                score: 2.0959999561,
                matchConfidence: {
                    score: 1
                },
                address: {
                    streetName: "Teakhout",
                    municipality: "Houten",
                    countrySubdivision: "Utrecht",
                    postalCode: "3991",
                    extendedPostalCode: "3991 PZ",
                    countryCode: "NL",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: "Teakhout, 3991 PZ Houten",
                    localName: "Houten"
                },
                viewport: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [5.16905, 52.01978],
                            [5.16957, 52.01978],
                            [5.16957, 52.01995],
                            [5.16905, 52.01995],
                            [5.16905, 52.01978]
                        ]
                    ]
                }
            }
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.46823, 52.04562] },
            properties: {
                type: "Street",
                score: 2.0959999561,
                matchConfidence: {
                    score: 1
                },
                address: {
                    streetName: "Teakhout",
                    municipality: "Zoetermeer",
                    countrySubdivision: "Zuid-Holland",
                    postalCode: "2719",
                    extendedPostalCode: "2719 KE",
                    countryCode: "NL",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: "Teakhout, 2719 KE Zoetermeer",
                    localName: "Zoetermeer"
                },
                viewport: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [4.4668, 52.04548],
                            [4.46897, 52.04548],
                            [4.46897, 52.04637],
                            [4.4668, 52.04637],
                            [4.4668, 52.04548]
                        ]
                    ]
                }
            }
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.49915, 51.85925] },
            properties: {
                type: "Street",
                score: 2.0959999561,
                matchConfidence: {
                    score: 1
                },
                address: {
                    streetName: "Teakhout",
                    municipality: "Barendrecht",
                    countrySubdivision: "Zuid-Holland",
                    postalCode: "2994",
                    extendedPostalCode: "2994 HS",
                    countryCode: "NL",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: "Teakhout, 2994 HS Barendrecht",
                    localName: "Barendrecht"
                },
                viewport: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [4.49774, 51.85923],
                            [4.49915, 51.85923],
                            [4.49915, 51.85925],
                            [4.49774, 51.85925],
                            [4.49774, 51.85923]
                        ]
                    ]
                }
            }
        }
    ]
};

export const customParserExample = {
    result: {
        ...firstResult,
        position: { lat: 52.44131, lon: 4.8093 },
        viewport: {
            topLeftPoint: {
                lat: 52.44179,
                lon: 4.80845
            },
            btmRightPoint: {
                lat: 52.44009,
                lon: 4.81063
            }
        }
    },
    summary: {
        query: "teakhout",
        queryType: "NON_NEAR",
        numResults: 4,
        offset: 0,
        totalResults: 4,
        fuzzyLevel: 1
    }
};
