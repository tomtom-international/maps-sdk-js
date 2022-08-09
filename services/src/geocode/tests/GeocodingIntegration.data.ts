import { GeocodingAPIResult, GeocodingResponse } from "../types";

export const singleResultExample: GeocodingResponse = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.8093, 52.44131] },
            properties: {
                type: "Street",
                id: "NL/STR/p0/60516",
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
                position: {
                    lat: 52.44131,
                    lon: 4.8093
                },
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
            }
        }
    ]
};

const firstResult: GeocodingAPIResult = {
    type: "Street",
    id: "NL/STR/p0/60516",
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
    position: {
        lat: 52.44131,
        lon: 4.8093
    },
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
};

export const multiResultExample: GeocodingResponse = {
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
                id: "NL/STR/p0/225684",
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
                position: {
                    lat: 52.01988,
                    lon: 5.16929
                },
                viewport: {
                    topLeftPoint: {
                        lat: 52.01995,
                        lon: 5.16905
                    },
                    btmRightPoint: {
                        lat: 52.01978,
                        lon: 5.16957
                    }
                }
            }
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.46823, 52.04562] },
            properties: {
                type: "Street",
                id: "NL/STR/p0/225685",
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
                position: {
                    lat: 52.04562,
                    lon: 4.46823
                },
                viewport: {
                    topLeftPoint: {
                        lat: 52.04637,
                        lon: 4.4668
                    },
                    btmRightPoint: {
                        lat: 52.04548,
                        lon: 4.46897
                    }
                }
            }
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [4.49915, 51.85925] },
            properties: {
                type: "Street",
                id: "NL/STR/p0/225686",
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
                position: {
                    lat: 51.85925,
                    lon: 4.49915
                },
                viewport: {
                    topLeftPoint: {
                        lat: 51.85925,
                        lon: 4.49774
                    },
                    btmRightPoint: {
                        lat: 51.85923,
                        lon: 4.49915
                    }
                }
            }
        }
    ]
};

export const customParserExample = {
    result: {
        ...firstResult
    },
    summary: {
        query: "teakhout",
        queryType: "NON_NEAR",
        queryTime: 7,
        numResults: 4,
        offset: 0,
        totalResults: 4,
        fuzzyLevel: 1
    }
};
