export const example0APIResponse = {
    summary: { queryTime: 10, numResults: 1 },
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
                localName: "Hulshorst"
            },
            position: "52.335152,5.728785"
        }
    ]
};

export const example0SDKResponse = {
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
        originalPosition: [5.728785, 52.335152]
    }
};

export const exampleAPIResponseWithNumberRoadUseSpeedLimit = {
    summary: {
        queryTime: 14,
        numResults: 1
    },
    addresses: [
        {
            address: {
                buildingNumber: "22",
                streetNumber: "22",
                routeNumbers: [],
                street: "Balderstraat",
                streetName: "Balderstraat",
                streetNameAndNumber: "Balderstraat 22",
                speedLimit: "30.00KPH",
                countryCode: "NL",
                countrySubdivision: "Flevoland",
                municipality: "Almere",
                postalCode: "1363",
                sideOfStreet: "R",
                offsetPosition: "52.352901,5.149493",
                country: "Nederland",
                countryCodeISO3: "NLD",
                freeformAddress: "Balderstraat 22, 1363 WH Almere",
                boundingBox: {
                    northEast: "52.352932,5.149829",
                    southWest: "52.352759,5.149238",
                    entity: "position"
                },
                extendedPostalCode: "1363 WH",
                localName: "Almere"
            },
            position: "52.352848,5.149537",
            roadUse: ["LocalStreet"]
        }
    ]
};

export const exampleSDKResponseWithNumberRoadUseSpeedLimit = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [5.149537, 52.352848]
    },
    properties: {
        type: "Point Address",
        address: {
            buildingNumber: "22",
            streetNumber: "22",
            routeNumbers: [],
            street: "Balderstraat",
            streetName: "Balderstraat",
            streetNameAndNumber: "Balderstraat 22",
            speedLimit: "30.00KPH",
            countryCode: "NL",
            countrySubdivision: "Flevoland",
            municipality: "Almere",
            postalCode: "1363",
            country: "Nederland",
            countryCodeISO3: "NLD",
            freeformAddress: "Balderstraat 22, 1363 WH Almere",
            extendedPostalCode: "1363 WH",
            localName: "Almere"
        },
        boundingBox: {
            type: "Polygon",
            coordinates: [
                [
                    [5.149238, 52.352759],
                    [5.149829, 52.352759],
                    [5.149829, 52.352932],
                    [5.149238, 52.352932],
                    [5.149238, 52.352759]
                ]
            ]
        },
        sideOfStreet: "R",
        offsetPosition: [5.149493, 52.352901],
        originalPosition: [5.149537, 52.352848]
    }
};

export const exampleAPIResponseWithLanguageGeoTypeMapCode = {
    summary: {
        queryTime: 5,
        numResults: 1
    },
    addresses: [
        {
            address: {
                routeNumbers: [],
                countryCode: "GB",
                countrySubdivision: "SCT",
                countrySecondarySubdivision: "Midlothian",
                municipality: "Édimbourg",
                country: "Royaume-Uni",
                countryCodeISO3: "GBR",
                freeformAddress: "Édimbourg",
                boundingBox: {
                    northEast: "56.024670,-3.075637",
                    southWest: "55.873118,-3.383767",
                    entity: "position"
                },
                countrySubdivisionName: "Écosse"
            },
            position: "55.947105,-3.140351",
            dataSources: {
                geometry: {
                    id: "00004732-3100-3c00-0000-0000240fa19a"
                }
            },
            entityType: "Municipality",
            mapcodes: [
                {
                    type: "International",
                    fullMapcode: "WH6SM.QSS7"
                }
            ]
        }
    ]
};

export const exampleSDKResponseWithLanguageGeoTypeMapCode = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [-3.140351, 55.947106]
    },
    properties: {
        type: "Geography",
        address: {
            routeNumbers: [],
            countryCode: "GB",
            countrySubdivision: "SCT",
            countrySecondarySubdivision: "Midlothian",
            municipality: "Édimbourg",
            country: "Royaume-Uni",
            countryCodeISO3: "GBR",
            freeformAddress: "Édimbourg",
            countrySubdivisionName: "Écosse"
        },
        mapcodes: [
            {
                type: "International",
                fullMapcode: "WH6SM.QSS7"
            }
        ],
        boundingBox: {
            type: "Polygon",
            coordinates: [
                [
                    [-3.383767, 55.873118],
                    [-3.075637, 55.873118],
                    [-3.075637, 56.02467],
                    [-3.383767, 56.02467],
                    [-3.383767, 55.873118]
                ]
            ]
        },
        originalPosition: [-3.140351, 55.947105]
    }
};

export const exampleAPIResponseWithRadius = {
    summary: {
        queryTime: 6,
        numResults: 1
    },
    addresses: [
        {
            address: {
                routeNumbers: [],
                countryCode: "GS",
                municipality: "Islas Georgias Del Sur",
                country: "South Georgia and the South Sandwich Islands",
                countryCodeISO3: "SGS",
                freeformAddress: "Islas Georgias Del Sur",
                boundingBox: {
                    northEast: "-54.283083,-36.491432",
                    southWest: "-54.283191,-36.492804",
                    entity: "position"
                },
                localName: "Islas Georgias Del Sur"
            },
            position: "-54.283085,-36.491432"
        }
    ]
};

export const exampleSDKResponseWithRadius = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [-36.491432, -54.283085]
    },
    properties: {
        type: "Street",
        address: {
            routeNumbers: [],
            countryCode: "GS",
            municipality: "Islas Georgias Del Sur",
            country: "South Georgia and the South Sandwich Islands",
            countryCodeISO3: "SGS",
            freeformAddress: "Islas Georgias Del Sur",
            localName: "Islas Georgias Del Sur"
        },
        boundingBox: {
            type: "Polygon",
            coordinates: [
                [
                    [-36.492804, -54.283191],
                    [-36.491432, -54.283191],
                    [-36.491432, -54.283083],
                    [-36.492804, -54.283083],
                    [-36.492804, -54.283191]
                ]
            ]
        },
        originalPosition: [-36.491432, -54.283085]
    }
};

export const exampleAPIResponseFromKrEndPoint = {
    summary: {
        queryTime: 4,
        numResults: 1
    },
    addresses: [
        {
            address: {
                buildingNumber: "28",
                streetNumber: "28",
                routeNumbers: [],
                street: "새문안로5가길",
                streetName: "새문안로5가길",
                streetNameAndNumber: "새문안로5가길 28",
                countryCode: "KR",
                countrySubdivision: "서울특별시",
                municipality: "서울특별시",
                postalCode: "03170",
                municipalitySubdivision: "종로구",
                country: "대한민국",
                countryCodeISO3: "KOR",
                freeformAddress: "03170 서울특별시 서울특별시 새문안로5가길 28 종로구",
                boundingBox: {
                    northEast: "37.574619,126.973443",
                    southWest: "37.574060,126.973232",
                    entity: "position"
                },
                localName: "종로구"
            },
            linkedAddress: {
                routeNumbers: [],
                street: "새문안로5가길",
                streetName: "새문안로5가길",
                countryCode: "KR",
                countrySubdivision: "서울특별시",
                municipality: "서울특별시",
                postalCode: "03170",
                municipalitySubdivision: "종로구",
                country: "대한민국",
                countryCodeISO3: "KOR",
                freeformAddress: "03170 서울특별시 서울특별시 종로구 적선동 156",
                boundingBox: {
                    northEast: "37.574619,126.973443",
                    southWest: "37.574060,126.973232",
                    entity: "position"
                },
                localName: "종로구",
                dependentLocalName: "적선동",
                landCode: "156"
            },
            position: "37.574394,126.973320"
        }
    ]
};

export const exampleSDKResponseForKrEndPoint = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [126.97367, 37.57435]
    },
    properties: {
        type: "Point Address",
        address: {
            buildingNumber: "28",
            streetNumber: "28",
            routeNumbers: [],
            street: "새문안로5가길",
            streetName: "새문안로5가길",
            streetNameAndNumber: "새문안로5가길 28",
            countryCode: "KR",
            countrySubdivision: "서울특별시",
            municipality: "서울특별시",
            postalCode: "03170",
            municipalitySubdivision: "종로구",
            country: "대한민국",
            countryCodeISO3: "KOR",
            freeformAddress: "03170 서울특별시 서울특별시 새문안로5가길 28 종로구",
            localName: "종로구"
        },
        boundingBox: {
            type: "Polygon",
            coordinates: [
                [
                    [126.973232, 37.57406],
                    [126.973443, 37.57406],
                    [126.973443, 37.574619],
                    [126.973232, 37.574619],
                    [126.973232, 37.57406]
                ]
            ]
        },
        originalPosition: [126.97332, 37.574394]
    }
};
