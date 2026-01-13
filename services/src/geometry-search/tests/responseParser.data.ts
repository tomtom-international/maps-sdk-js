import type { GeometrySearchResponse, GeometrySearchResponseAPI } from '../types';

export const apiAndParsedResponses: Array<[string, GeometrySearchResponseAPI, GeometrySearchResponse]> = [
    [
        'Geometry search with required parameters',
        {
            summary: {
                query: 'electric charging station',
                queryType: 'NON_NEAR',
                queryTime: 48,
                numResults: 1,
                offset: 0,
                totalResults: 420,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'POI',
                    id: '250009044730934',
                    score: 6.8659100533,
                    info: 'search:ev:250009044730934',
                    poi: {
                        name: 'Saemes 14ème Arrondissement Rue Saillard',
                        categorySet: [
                            {
                                id: 7309,
                            },
                        ],
                        categories: ['electric vehicle station'],
                        classifications: [
                            {
                                code: 'ELECTRIC_VEHICLE_STATION',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'electric vehicle station',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Rue Saillard',
                        municipalitySubdivision: 'Mouton-Duvernet',
                        municipality: 'Paris',
                        countrySecondarySubdivision: 'Paris',
                        countrySubdivision: 'Île-de-France',
                        postalCode: '75014',
                        countryCode: 'FR',
                        country: 'France',
                        countryCodeISO3: 'FRA',
                        freeformAddress: 'Rue Saillard, 75014 14ème Arrondissement',
                        localName: '14ème Arrondissement',
                    },
                    position: {
                        lat: 48.83353,
                        lon: 2.32707,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 48.83443,
                            lon: 2.3257,
                        },
                        btmRightPoint: {
                            lat: 48.83263,
                            lon: 2.32844,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 48.83308,
                                lon: 2.32755,
                            },
                        },
                    ],
                    chargingPark: {
                        connectors: [
                            {
                                id: 'connector-1',
                                connectorType: 'IEC62196Type2Outlet',
                                ratedPowerKW: 7.4,
                                voltageV: 230,
                                currentA: 32,
                                currentType: 'AC1',
                            },
                            {
                                id: 'connector-2',
                                connectorType: 'StandardHouseholdCountrySpecific',
                                ratedPowerKW: 7.4,
                                voltageV: 230,
                                currentA: 32,
                                currentType: 'AC1',
                            },
                        ],
                    },
                    dataSources: {
                        chargingAvailability: {
                            id: '250009044730934',
                        },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 1,
                numResults: 1,
                offset: 0,
                query: 'electric charging station',
                queryTime: 48,
                queryType: 'NON_NEAR',
                totalResults: 420,
            },
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [2.32707, 48.83353],
                    },
                    id: '250009044730934',
                    properties: {
                        type: 'POI',
                        score: 6.8659100533,
                        info: 'search:ev:250009044730934',
                        address: {
                            streetName: 'Rue Saillard',
                            municipalitySubdivision: 'Mouton-Duvernet',
                            municipality: 'Paris',
                            countrySecondarySubdivision: 'Paris',
                            countrySubdivision: 'Île-de-France',
                            postalCode: '75014',
                            countryCode: 'FR',
                            country: 'France',
                            countryCodeISO3: 'FRA',
                            freeformAddress: 'Rue Saillard, 75014 14ème Arrondissement',
                            localName: '14ème Arrondissement',
                        },
                        chargingPark: {
                            connectors: [
                                {
                                    connector: {
                                        id: 'connector-1',
                                        currentA: 32,
                                        currentType: 'AC1',
                                        ratedPowerKW: 7.4,
                                        type: 'IEC62196Type2Outlet',
                                        voltageV: 230,
                                        chargingSpeed: 'slow',
                                    },
                                    count: 1,
                                },
                                {
                                    connector: {
                                        id: 'connector-2',
                                        currentA: 32,
                                        currentType: 'AC1',
                                        ratedPowerKW: 7.4,
                                        type: 'StandardHouseholdCountrySpecific',
                                        voltageV: 230,
                                        chargingSpeed: 'slow',
                                    },
                                    count: 1,
                                },
                            ],
                        },
                        dataSources: {
                            chargingAvailability: {
                                id: '250009044730934',
                            },
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [2.32755, 48.83308],
                            },
                        ],
                        poi: {
                            name: 'Saemes 14ème Arrondissement Rue Saillard',
                            categories: ['electric vehicle station'],
                            classifications: [
                                {
                                    code: 'ELECTRIC_VEHICLE_STATION',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'electric vehicle station',
                                        },
                                    ],
                                },
                            ],
                            brands: [],
                            categoryIds: [7309],
                        },
                    },
                },
            ],
        },
    ],
    [
        'Geometry search with required parameters & optional parameters',
        {
            summary: {
                query: '24x7 restaurant',
                queryType: 'NON_NEAR',
                queryTime: 95,
                numResults: 1,
                offset: 0,
                totalResults: 1158,
                fuzzyLevel: 2,
            },
            results: [
                {
                    type: 'POI',
                    id: '250007000178386',
                    score: 2.0242877007,
                    info: 'search:ta:250007000178386-FR',
                    poi: {
                        name: 'Guy Martin Italia',
                        phone: '+33 1 43 27 08 80',
                        categorySet: [
                            {
                                id: 7315025,
                            },
                        ],
                        url: 'guymartinitalia.com',
                        categories: ['italian', 'restaurant'],
                        classifications: [
                            {
                                code: 'RESTAURANT',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'restaurant',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'italian',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '19',
                        streetName: 'Rue Bréa',
                        municipalitySubdivision: '6ème Arrondissement',
                        municipality: 'Paris',
                        countrySecondarySubdivision: 'Paris',
                        countrySubdivision: 'Île-de-France',
                        postalCode: '75006',
                        countryCode: 'FR',
                        country: 'France',
                        countryCodeISO3: 'FRA',
                        freeformAddress: '19 Rue Bréa, 75006 Paris',
                        localName: 'Paris',
                    },
                    position: {
                        lat: 48.84287,
                        lon: 2.33007,
                    },
                    mapcodes: [
                        {
                            type: 'Local',
                            fullMapcode: 'FRA FP.4M',
                            territory: 'FRA',
                            code: 'FP.4M',
                        },
                        {
                            type: 'International',
                            fullMapcode: 'VHPMH.BBNX',
                        },
                        {
                            type: 'Alternative',
                            fullMapcode: 'FRA GJ.RNV',
                            territory: 'FRA',
                            code: 'GJ.RNV',
                        },
                        {
                            type: 'Alternative',
                            fullMapcode: 'FRA H67.YRV',
                            territory: 'FRA',
                            code: 'H67.YRV',
                        },
                        {
                            type: 'Alternative',
                            fullMapcode: 'FRA HCRX.ZJJ',
                            territory: 'FRA',
                            code: 'HCRX.ZJJ',
                        },
                    ],
                    viewport: {
                        topLeftPoint: {
                            lat: 48.84377,
                            lon: 2.3287,
                        },
                        btmRightPoint: {
                            lat: 48.84197,
                            lon: 2.33144,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 48.84291,
                                lon: 2.32994,
                            },
                        },
                    ],
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 2,
                numResults: 1,
                offset: 0,
                query: '24x7 restaurant',
                queryTime: 95,
                queryType: 'NON_NEAR',
                totalResults: 1158,
            },
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [2.33007, 48.84287],
                    },
                    id: '250007000178386',
                    properties: {
                        type: 'POI',
                        score: 2.0242877007,
                        info: 'search:ta:250007000178386-FR',
                        address: {
                            streetNumber: '19',
                            streetName: 'Rue Bréa',
                            municipalitySubdivision: '6ème Arrondissement',
                            municipality: 'Paris',
                            countrySecondarySubdivision: 'Paris',
                            countrySubdivision: 'Île-de-France',
                            postalCode: '75006',
                            countryCode: 'FR',
                            country: 'France',
                            countryCodeISO3: 'FRA',
                            freeformAddress: '19 Rue Bréa, 75006 Paris',
                            localName: 'Paris',
                        },
                        mapcodes: [
                            {
                                type: 'Local',
                                fullMapcode: 'FRA FP.4M',
                                territory: 'FRA',
                                code: 'FP.4M',
                            },
                            {
                                type: 'International',
                                fullMapcode: 'VHPMH.BBNX',
                            },
                            {
                                type: 'Alternative',
                                fullMapcode: 'FRA GJ.RNV',
                                territory: 'FRA',
                                code: 'GJ.RNV',
                            },
                            {
                                type: 'Alternative',
                                fullMapcode: 'FRA H67.YRV',
                                territory: 'FRA',
                                code: 'H67.YRV',
                            },
                            {
                                type: 'Alternative',
                                fullMapcode: 'FRA HCRX.ZJJ',
                                territory: 'FRA',
                                code: 'HCRX.ZJJ',
                            },
                        ],
                        entryPoints: [
                            {
                                type: 'main',
                                position: [2.32994, 48.84291],
                            },
                        ],
                        poi: {
                            name: 'Guy Martin Italia',
                            phone: '+33 1 43 27 08 80',
                            url: 'guymartinitalia.com',
                            categories: ['italian', 'restaurant'],
                            classifications: [
                                {
                                    code: 'RESTAURANT',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'restaurant',
                                        },
                                        {
                                            nameLocale: 'en-US',
                                            name: 'italian',
                                        },
                                    ],
                                },
                            ],
                            brands: [],
                            categoryIds: [7315025],
                        },
                    },
                },
            ],
        },
    ],
    [
        'Geometry search with required parameters & optional parameters such as indexes & entityType',
        {
            summary: {
                query: 'london',
                queryType: 'NON_NEAR',
                queryTime: 56,
                numResults: 1,
                offset: 0,
                totalResults: 16,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'Geography',
                    id: 'GB/GEO/p0/37894',
                    score: 2.691385746,
                    address: {
                        municipality: 'London',
                        countrySecondarySubdivision: 'London',
                        countrySubdivision: 'ENG',
                        countrySubdivisionName: 'England',
                        countryCode: 'GB',
                        country: 'United Kingdom',
                        countryCodeISO3: 'GBR',
                        freeformAddress: 'London',
                    },
                    position: {
                        lat: 51.50015,
                        lon: -0.12624,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 51.67235,
                            lon: -0.35137,
                        },
                        btmRightPoint: {
                            lat: 51.38474,
                            lon: 0.14471,
                        },
                    },
                    boundingBox: {
                        topLeftPoint: {
                            lat: 51.67235,
                            lon: -0.35137,
                        },
                        btmRightPoint: {
                            lat: 51.38474,
                            lon: 0.14471,
                        },
                    },
                    dataSources: {
                        geometry: {
                            id: '00004733-3000-3c00-0000-000027861b0f',
                        },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 1,
                numResults: 1,
                offset: 0,
                query: 'london',
                queryTime: 56,
                queryType: 'NON_NEAR',
                totalResults: 16,
            },
            bbox: [-0.35137, 51.38474, 0.14471, 51.67235],
            features: [
                {
                    type: 'Feature',
                    bbox: [-0.35137, 51.38474, 0.14471, 51.67235],
                    geometry: {
                        type: 'Point',
                        coordinates: [-0.12624, 51.50015],
                    },
                    id: 'GB/GEO/p0/37894',
                    properties: {
                        type: 'Geography',
                        score: 2.691385746,
                        address: {
                            municipality: 'London',
                            countrySecondarySubdivision: 'London',
                            countrySubdivision: 'ENG',
                            countrySubdivisionName: 'England',
                            countryCode: 'GB',
                            country: 'United Kingdom',
                            countryCodeISO3: 'GBR',
                            freeformAddress: 'London',
                        },
                        dataSources: {
                            geometry: {
                                id: '00004733-3000-3c00-0000-000027861b0f',
                            },
                        },
                    },
                },
            ],
        },
    ],
    [
        'Geometry search for EV connectors within specific power range',
        {
            summary: {
                query: 'charging points',
                queryType: 'NON_NEAR',
                queryTime: 74,
                numResults: 1,
                offset: 0,
                totalResults: 79110,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'POI',
                    id: '756009003511328',
                    score: 4.7207713127,
                    info: 'search:ev:756009003511328',
                    poi: {
                        name: 'Energiedienst Unterbäch Wiispilweg',
                        phone: '+41 27 945 75 00',
                        categorySet: [
                            {
                                id: 7309,
                            },
                        ],
                        categories: ['electric vehicle station'],
                        classifications: [
                            {
                                code: 'ELECTRIC_VEHICLE_STATION',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'electric vehicle station',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '18',
                        streetName: 'Wiispilweg',
                        municipalitySubdivision: 'Wispil',
                        municipality: 'Unterbäch',
                        countrySecondarySubdivision: 'Raron',
                        countrySubdivision: 'Valais',
                        postalCode: '3944',
                        countryCode: 'CH',
                        country: 'Switzerland',
                        countryCodeISO3: 'CHE',
                        freeformAddress: 'Wiispilweg 18, 3944 Unterbäch',
                        localName: 'Unterbäch',
                    },
                    position: {
                        lat: 46.28515,
                        lon: 7.80076,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 46.28605,
                            lon: 7.79946,
                        },
                        btmRightPoint: {
                            lat: 46.28425,
                            lon: 7.80206,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 46.28554,
                                lon: 7.80065,
                            },
                        },
                    ],
                    chargingPark: {
                        connectors: [
                            {
                                id: 'connector-3',
                                connectorType: 'IEC62196Type2Outlet',
                                ratedPowerKW: 22,
                                voltageV: 400,
                                currentA: 32,
                                currentType: 'AC3',
                            },
                        ],
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 1,
                numResults: 1,
                offset: 0,
                query: 'charging points',
                queryTime: 74,
                queryType: 'NON_NEAR',
                totalResults: 79110,
            },
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [7.80076, 46.28515],
                    },
                    id: '756009003511328',
                    properties: {
                        type: 'POI',
                        score: 4.7207713127,
                        info: 'search:ev:756009003511328',
                        address: {
                            streetNumber: '18',
                            streetName: 'Wiispilweg',
                            municipalitySubdivision: 'Wispil',
                            municipality: 'Unterbäch',
                            countrySecondarySubdivision: 'Raron',
                            countrySubdivision: 'Valais',
                            postalCode: '3944',
                            countryCode: 'CH',
                            country: 'Switzerland',
                            countryCodeISO3: 'CHE',
                            freeformAddress: 'Wiispilweg 18, 3944 Unterbäch',
                            localName: 'Unterbäch',
                        },
                        chargingPark: {
                            connectors: [
                                {
                                    connector: {
                                        id: 'connector-3',
                                        currentA: 32,
                                        currentType: 'AC3',
                                        ratedPowerKW: 22,
                                        type: 'IEC62196Type2Outlet',
                                        voltageV: 400,
                                        chargingSpeed: 'regular',
                                    },
                                    count: 1,
                                },
                            ],
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [7.80065, 46.28554],
                            },
                        ],
                        poi: {
                            name: 'Energiedienst Unterbäch Wiispilweg',
                            phone: '+41 27 945 75 00',
                            categories: ['electric vehicle station'],
                            classifications: [
                                {
                                    code: 'ELECTRIC_VEHICLE_STATION',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'electric vehicle station',
                                        },
                                    ],
                                },
                            ],
                            brands: [],
                            categoryIds: [7309],
                        },
                    },
                },
            ],
        },
    ],
    [
        'Geometry search for fuel station and with specific brands',
        {
            summary: {
                query: 'fuel station',
                queryType: 'NON_NEAR',
                queryTime: 64,
                numResults: 2,
                offset: 0,
                totalResults: 94,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'POI',
                    id: '372008000031461',
                    score: 4.324338913,
                    info: 'search:ta:372008000031461-IE',
                    poi: {
                        name: 'Circle K Fuel Station',
                        brands: [
                            {
                                name: 'Circle K',
                            },
                        ],
                        categorySet: [
                            {
                                id: 7311,
                            },
                        ],
                        categories: ['petrol station'],
                        classifications: [
                            {
                                code: 'PETROL_STATION',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'petrol station',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Cavan Road',
                        municipalitySubdivision: 'Townparks',
                        municipality: 'Kells',
                        countrySubdivision: 'Meath',
                        postalCode: 'A82',
                        extendedPostalCode: 'A82 E7F3',
                        countryCode: 'IE',
                        country: 'Ireland',
                        countryCodeISO3: 'IRL',
                        freeformAddress: 'Cavan Road, Townparks, Kells, Meath, A82 E7F3',
                        localName: 'Kells',
                    },
                    position: {
                        lat: 53.73118,
                        lon: -6.88878,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 53.73208,
                            lon: -6.8903,
                        },
                        btmRightPoint: {
                            lat: 53.73028,
                            lon: -6.88726,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 53.73119,
                                lon: -6.88953,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '372008000031461',
                    score: 4.324338913,
                    info: 'search:ta:372008000031461-IE',
                    poi: {
                        name: 'Circle K Fuel Station',
                        brands: [
                            {
                                name: 'Circle K',
                            },
                        ],
                        categorySet: [
                            {
                                id: 7311,
                            },
                        ],
                        categories: ['petrol station'],
                        classifications: [
                            {
                                code: 'PETROL_STATION',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'petrol station',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Cavan Road',
                        municipalitySubdivision: 'Townparks',
                        municipality: 'Kells',
                        countrySubdivision: 'Meath',
                        postalCode: 'A82',
                        extendedPostalCode: 'A82 E7F3',
                        countryCode: 'IE',
                        country: 'Ireland',
                        countryCodeISO3: 'IRL',
                        freeformAddress: 'Cavan Road, Townparks, Kells, Meath, A82 E7F3',
                        localName: 'Kells',
                    },
                    position: {
                        lat: 54.73118,
                        lon: -5.12343,
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 1,
                numResults: 2,
                offset: 0,
                query: 'fuel station',
                queryTime: 64,
                queryType: 'NON_NEAR',
                totalResults: 94,
            },
            bbox: [-6.88878, 53.73118, -5.12343, 54.73118],
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-6.88878, 53.73118],
                    },
                    id: '372008000031461',
                    properties: {
                        type: 'POI',
                        score: 4.324338913,
                        info: 'search:ta:372008000031461-IE',
                        address: {
                            streetName: 'Cavan Road',
                            municipalitySubdivision: 'Townparks',
                            municipality: 'Kells',
                            countrySubdivision: 'Meath',
                            postalCode: 'A82',
                            extendedPostalCode: 'A82 E7F3',
                            countryCode: 'IE',
                            country: 'Ireland',
                            countryCodeISO3: 'IRL',
                            freeformAddress: 'Cavan Road, Townparks, Kells, Meath, A82 E7F3',
                            localName: 'Kells',
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [-6.88953, 53.73119],
                            },
                        ],
                        poi: {
                            name: 'Circle K Fuel Station',
                            brands: ['Circle K'],
                            categories: ['petrol station'],
                            classifications: [
                                {
                                    code: 'PETROL_STATION',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'petrol station',
                                        },
                                    ],
                                },
                            ],
                            categoryIds: [7311],
                        },
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-5.12343, 54.73118],
                    },
                    id: '372008000031461',
                    properties: {
                        type: 'POI',
                        score: 4.324338913,
                        info: 'search:ta:372008000031461-IE',
                        address: {
                            streetName: 'Cavan Road',
                            municipalitySubdivision: 'Townparks',
                            municipality: 'Kells',
                            countrySubdivision: 'Meath',
                            postalCode: 'A82',
                            extendedPostalCode: 'A82 E7F3',
                            countryCode: 'IE',
                            country: 'Ireland',
                            countryCodeISO3: 'IRL',
                            freeformAddress: 'Cavan Road, Townparks, Kells, Meath, A82 E7F3',
                            localName: 'Kells',
                        },
                        poi: {
                            name: 'Circle K Fuel Station',
                            brands: ['Circle K'],
                            categories: ['petrol station'],
                            classifications: [
                                {
                                    code: 'PETROL_STATION',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'petrol station',
                                        },
                                    ],
                                },
                            ],
                            categoryIds: [7311],
                        },
                    },
                },
            ],
        },
    ],
    [
        'No Results',
        {
            summary: {
                query: 'ams',
                queryType: 'NON_NEAR',
                queryTime: 161,
                numResults: 0,
                offset: 0,
                totalResults: 0,
                fuzzyLevel: 2,
            },
            results: [],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 2,
                numResults: 0,
                offset: 0,
                query: 'ams',
                queryTime: 161,
                queryType: 'NON_NEAR',
                totalResults: 0,
            },
            features: [],
        },
    ],
    [
        'Geometry search with empty connectors',
        {
            summary: {
                query: 'electric charging station',
                queryType: 'NON_NEAR',
                queryTime: 48,
                numResults: 1,
                offset: 0,
                totalResults: 420,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'POI',
                    id: '250009044730934',
                    score: 6.8659100533,
                    info: 'search:ev:250009044730934',
                    poi: {
                        name: 'Saemes 14ème Arrondissement Rue Saillard',
                        categorySet: [{ id: 7309 }],
                        categories: ['electric vehicle station'],
                        classifications: [
                            {
                                code: 'ELECTRIC_VEHICLE_STATION',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'electric vehicle station',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Rue Saillard',
                        municipalitySubdivision: 'Mouton-Duvernet',
                        municipality: 'Paris',
                        countrySecondarySubdivision: 'Paris',
                        countrySubdivision: 'Île-de-France',
                        postalCode: '75014',
                        countryCode: 'FR',
                        country: 'France',
                        countryCodeISO3: 'FRA',
                        freeformAddress: 'Rue Saillard, 75014 14ème Arrondissement',
                        localName: '14ème Arrondissement',
                    },
                    position: { lat: 48.83353, lon: 2.32707 },
                    viewport: {
                        topLeftPoint: { lat: 48.83443, lon: 2.3257 },
                        btmRightPoint: { lat: 48.83263, lon: 2.32844 },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: { lat: 48.83308, lon: 2.32755 },
                        },
                    ],
                    chargingPark: {
                        connectors: [],
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 1,
                numResults: 1,
                offset: 0,
                query: 'electric charging station',
                queryTime: 48,
                queryType: 'NON_NEAR',
                totalResults: 420,
            },
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [2.32707, 48.83353],
                    },
                    id: '250009044730934',
                    properties: {
                        type: 'POI',
                        score: 6.8659100533,
                        info: 'search:ev:250009044730934',
                        address: {
                            streetName: 'Rue Saillard',
                            municipalitySubdivision: 'Mouton-Duvernet',
                            municipality: 'Paris',
                            countrySecondarySubdivision: 'Paris',
                            countrySubdivision: 'Île-de-France',
                            postalCode: '75014',
                            countryCode: 'FR',
                            country: 'France',
                            countryCodeISO3: 'FRA',
                            freeformAddress: 'Rue Saillard, 75014 14ème Arrondissement',
                            localName: '14ème Arrondissement',
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [2.32755, 48.83308],
                            },
                        ],
                        poi: {
                            name: 'Saemes 14ème Arrondissement Rue Saillard',
                            categories: ['electric vehicle station'],
                            classifications: [
                                {
                                    code: 'ELECTRIC_VEHICLE_STATION',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'electric vehicle station',
                                        },
                                    ],
                                },
                            ],
                            brands: [],
                            categoryIds: [7309],
                        },
                    },
                },
            ],
        },
    ],
];
