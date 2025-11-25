import type { FuzzySearchResponseAPI } from '../types';

export const apiResponses: Array<[string, FuzzySearchResponseAPI]> = [
    [
        'Fuzzy Search Response Parser Performance Test',
        {
            summary: {
                query: 'cafe',
                queryType: 'NON_NEAR',
                queryTime: 349,
                numResults: 40,
                offset: 0,
                totalResults: 1816776,
                fuzzyLevel: 1,
                geoBias: {
                    lat: 52.3759,
                    lon: 4.8975,
                },
                queryIntent: [],
            },
            results: [
                {
                    type: 'POI',
                    id: '528009005860170',
                    score: 2.5745270252,
                    dist: 53.37795095529688,
                    info: 'search:ta:528009005860170-NL',
                    poi: {
                        name: 'The Grasshopper',
                        phone: '+31 20 423 2424',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        url: 'thegrasshopper.com',
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '16',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JP',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 16, 1012 JP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37542,
                        lon: 4.89751,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37632,
                            lon: 4.89604,
                        },
                        btmRightPoint: {
                            lat: 52.37452,
                            lon: 4.89898,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37534,
                                lon: 4.89742,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007742450',
                    score: 2.5745270252,
                    dist: 53.37795095529688,
                    info: 'search:ta:528009007742450-NL',
                    poi: {
                        name: 'Homaned Ii',
                        categorySet: [
                            {
                                id: 9376,
                            },
                        ],
                        categories: ['café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '16',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JP',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 16, 1012 JP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37542,
                        lon: 4.89751,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37632,
                            lon: 4.89604,
                        },
                        btmRightPoint: {
                            lat: 52.37452,
                            lon: 4.89898,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37534,
                                lon: 4.89742,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007852118',
                    score: 2.5745270252,
                    dist: 55.746557929927334,
                    info: 'search:ta:528009007852118-NL',
                    poi: {
                        name: 'De Deugniet',
                        phone: '+31 20 428 4488',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '12',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JP',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 12, 1012 JP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.3754,
                        lon: 4.89756,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.3763,
                            lon: 4.89609,
                        },
                        btmRightPoint: {
                            lat: 52.3745,
                            lon: 4.89903,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37532,
                                lon: 4.89749,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528007000017400',
                    score: 2.5745265484,
                    dist: 62.799209729178,
                    info: 'search:ta:528007000017400-NL',
                    poi: {
                        name: 'Cafe De Deugniet',
                        phone: '+31 20 428 4488',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JN',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg, 1012 JN Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37541,
                        lon: 4.89704,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37631,
                            lon: 4.89557,
                        },
                        btmRightPoint: {
                            lat: 52.37451,
                            lon: 4.89851,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37548,
                                lon: 4.89713,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009008983410',
                    score: 2.57452631,
                    dist: 64.82783991118508,
                    info: 'search:ta:528009008983410-NL',
                    poi: {
                        name: 'Lindeboom',
                        categorySet: [
                            {
                                id: 9376007,
                            },
                        ],
                        categories: ['café/pub', 'microbrewery/beer garden'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'microbrewery/beer garden',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Beursstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Beursstraat, 1012 Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37536,
                        lon: 4.89714,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37626,
                            lon: 4.89567,
                        },
                        btmRightPoint: {
                            lat: 52.37446,
                            lon: 4.89861,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37532,
                                lon: 4.89728,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528007000057073',
                    score: 2.57452631,
                    dist: 64.42049264005949,
                    info: 'search:ta:528007000057073-NL',
                    poi: {
                        name: 'Naked Espresso',
                        categorySet: [
                            {
                                id: 9376006,
                            },
                        ],
                        url: 'www.nakedespresso.nl',
                        categories: ['café/pub', 'coffee shop'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'coffee shop',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '46',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JE',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 46, 1012 JE Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37557,
                        lon: 4.89828,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37647,
                            lon: 4.89681,
                        },
                        btmRightPoint: {
                            lat: 52.37467,
                            lon: 4.89975,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37551,
                                lon: 4.89839,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009001615941',
                    score: 2.57452631,
                    dist: 65.02641341467657,
                    info: 'search:ta:528009001615941-NL',
                    poi: {
                        name: 'Cafe Hill Street Blues',
                        phone: '+31 20 420 3288',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        url: 'www.hill-street-blues.nl',
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '52-A',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JG',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 52-A, 1012 JG Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37543,
                        lon: 4.89807,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37633,
                            lon: 4.8966,
                        },
                        btmRightPoint: {
                            lat: 52.37453,
                            lon: 4.89954,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37537,
                                lon: 4.89818,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007753399',
                    score: 2.5745260715,
                    dist: 71.00225691303787,
                    info: 'search:ta:528009007753399-NL',
                    poi: {
                        name: 'W-58',
                        phone: '+31 6 41295765',
                        categorySet: [
                            {
                                id: 9376,
                            },
                        ],
                        categories: ['café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '58 H',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JG',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 58 H, 1012 JG Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37531,
                        lon: 4.8979,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37621,
                            lon: 4.89643,
                        },
                        btmRightPoint: {
                            lat: 52.37441,
                            lon: 4.89937,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37526,
                                lon: 4.89802,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009008998617',
                    score: 2.5745260715,
                    dist: 73.64262576064402,
                    info: 'search:ta:528009008998617-NL',
                    poi: {
                        name: 'Baantjermuseumcafé',
                        phone: '+31 20 428 4488',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        url: 'www.heffer.nl/zalen_baantjermuseumcafe.html',
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '7',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JP',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 7, 1012 JP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37524,
                        lon: 4.89741,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37614,
                            lon: 4.89594,
                        },
                        btmRightPoint: {
                            lat: 52.37434,
                            lon: 4.89888,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37531,
                                lon: 4.8975,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009002705724',
                    score: 2.5745260715,
                    dist: 72.9201284070137,
                    info: 'search:ta:528009002705724-NL',
                    poi: {
                        name: 'Amsterdam Red Bars',
                        phone: '+31 6 52593370',
                        categorySet: [
                            {
                                id: 9376,
                            },
                        ],
                        categories: ['café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '60 H',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JG',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 60 H, 1012 JG Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37528,
                        lon: 4.89785,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37618,
                            lon: 4.89638,
                        },
                        btmRightPoint: {
                            lat: 52.37438,
                            lon: 4.89932,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37522,
                                lon: 4.89796,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009001562306',
                    score: 2.5745260715,
                    dist: 72.9201284070137,
                    info: 'search:ta:528009001562306-NL',
                    poi: {
                        name: 'Café Hot or Not',
                        phone: '+31 6 52593370',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        url: 'www.amsterdamredbars.nl',
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '60',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JG',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 60, 1012 JG Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37528,
                        lon: 4.89785,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37618,
                            lon: 4.89638,
                        },
                        btmRightPoint: {
                            lat: 52.37438,
                            lon: 4.89932,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37522,
                                lon: 4.89796,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007988249',
                    score: 2.5745260715,
                    dist: 73.83947279800059,
                    info: 'search:ta:528009007988249-NL',
                    poi: {
                        name: 'Het Pleidooi',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '8HS',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JP',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 8HS, 1012 JP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37524,
                        lon: 4.89738,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37614,
                            lon: 4.89591,
                        },
                        btmRightPoint: {
                            lat: 52.37434,
                            lon: 4.89885,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37525,
                                lon: 4.89766,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528007000057689',
                    score: 2.5745260715,
                    dist: 70.24230560832356,
                    info: 'search:ta:528007000057689-NL',
                    poi: {
                        name: "Drink 'N Sink",
                        phone: '+31 20 223 5301',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        url: 'drinknsink.com',
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '58HS',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JG',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 58HS, 1012 JG Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37532,
                        lon: 4.89791,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37622,
                            lon: 4.89644,
                        },
                        btmRightPoint: {
                            lat: 52.37442,
                            lon: 4.89938,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37526,
                                lon: 4.89802,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007752372',
                    score: 2.5745258331,
                    dist: 80.20134796769818,
                    info: 'search:ta:528009007752372-NL',
                    poi: {
                        name: 'Old Bridge',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '3',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JP',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 3, 1012 JP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37518,
                        lon: 4.89757,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37608,
                            lon: 4.8961,
                        },
                        btmRightPoint: {
                            lat: 52.37428,
                            lon: 4.89904,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37525,
                                lon: 4.89765,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528008000046658',
                    score: 2.5745253563,
                    dist: 84.80676135057934,
                    info: 'search:ta:528008000046658-NL',
                    poi: {
                        name: "Hunter's Ii",
                        categorySet: [
                            {
                                id: 9376006,
                            },
                        ],
                        categories: ['café/pub', 'coffee shop'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'coffee shop',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '37',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 HV',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 37, 1012 HV Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37555,
                        lon: 4.89861,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37645,
                            lon: 4.89714,
                        },
                        btmRightPoint: {
                            lat: 52.37465,
                            lon: 4.90008,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37561,
                                lon: 4.89853,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009002687118',
                    score: 2.5745253563,
                    dist: 84.82454151813485,
                    info: 'search:ta:528009002687118-NL',
                    poi: {
                        name: 'Stones Corner',
                        categorySet: [
                            {
                                id: 9376,
                            },
                        ],
                        categories: ['café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '59',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 HW',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 59, 1012 HW Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37526,
                        lon: 4.89818,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37616,
                            lon: 4.89671,
                        },
                        btmRightPoint: {
                            lat: 52.37436,
                            lon: 4.89965,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37528,
                                lon: 4.89805,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009001605156',
                    score: 2.5745253563,
                    dist: 89.09927663935026,
                    info: 'search:ta:528009001605156-NL',
                    poi: {
                        name: "Hunter's Bar",
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '24',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JD',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 24, 1012 JD Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37595,
                        lon: 4.89881,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37685,
                            lon: 4.89734,
                        },
                        btmRightPoint: {
                            lat: 52.37505,
                            lon: 4.90028,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37586,
                                lon: 4.89887,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009005860162',
                    score: 2.5745253563,
                    dist: 89.09927663935026,
                    info: 'search:ta:528009005860162-NL',
                    poi: {
                        name: "Hunter's",
                        categorySet: [
                            {
                                id: 9376006,
                            },
                        ],
                        categories: ['café/pub', 'coffee shop'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'coffee shop',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '24',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JD',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 24, 1012 JD Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37595,
                        lon: 4.89881,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37685,
                            lon: 4.89734,
                        },
                        btmRightPoint: {
                            lat: 52.37505,
                            lon: 4.90028,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37586,
                                lon: 4.89887,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009008010427',
                    score: 2.5745253563,
                    dist: 87.12643442748617,
                    info: 'search:ta:528009008010427-NL',
                    poi: {
                        name: "Hunter's Bar",
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        url: 'www.hunters-coffeeshop.com',
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '35',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 HV',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 35, 1012 HV Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37554,
                        lon: 4.89864,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37644,
                            lon: 4.89717,
                        },
                        btmRightPoint: {
                            lat: 52.37464,
                            lon: 4.90011,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.3756,
                                lon: 4.89852,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009002120907',
                    score: 2.5745251179,
                    dist: 92.64724695598225,
                    info: 'search:ta:528009002120907-NL',
                    poi: {
                        name: 'Night Bar The Bottle',
                        phone: '+31 20 772 2797',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '25HS',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JN',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 25HS, 1012 JN Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37597,
                        lon: 4.89614,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37687,
                            lon: 4.89467,
                        },
                        btmRightPoint: {
                            lat: 52.37507,
                            lon: 4.89761,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.3759,
                                lon: 4.89602,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007954574',
                    score: 2.5745251179,
                    dist: 92.41417746525039,
                    info: 'search:ta:528009007954574-NL',
                    poi: {
                        name: 'Burger Bar Xpress',
                        phone: '+31 6 39563398',
                        categorySet: [
                            {
                                id: 9376,
                            },
                        ],
                        categories: ['café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '70',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JH',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 70, 1012 JH Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37507,
                        lon: 4.89743,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37597,
                            lon: 4.89596,
                        },
                        btmRightPoint: {
                            lat: 52.37417,
                            lon: 4.8989,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37497,
                                lon: 4.89762,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528008000046897',
                    score: 2.5745248795,
                    dist: 96.03409630945534,
                    info: 'search:ta:528008000046897-NL',
                    poi: {
                        name: 'Coffee @ Last',
                        categorySet: [
                            {
                                id: 9376006,
                            },
                        ],
                        categories: ['café/pub', 'coffee shop'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'coffee shop',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '11',
                        streetName: 'Damrak',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 LG',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Damrak 11, 1012 LG Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37676,
                        lon: 4.89763,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37766,
                            lon: 4.89616,
                        },
                        btmRightPoint: {
                            lat: 52.37586,
                            lon: 4.8991,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37668,
                                lon: 4.89771,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007970671',
                    score: 2.574524641,
                    dist: 98.94981436033052,
                    info: 'search:ta:528009007970671-NL',
                    poi: {
                        name: 'Café Wiener',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '8HS',
                        streetName: 'Lange Niezel',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 GS',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Lange Niezel 8HS, 1012 GS Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.3752,
                        lon: 4.8984,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.3761,
                            lon: 4.89693,
                        },
                        btmRightPoint: {
                            lat: 52.3743,
                            lon: 4.89987,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37512,
                                lon: 4.89832,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528007000057478',
                    score: 2.574524641,
                    dist: 100.24373377321429,
                    info: 'search:ta:528007000057478-NL',
                    poi: {
                        name: 'Wonder Bar Two',
                        phone: '+31 6 43880922',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '5',
                        streetName: 'Lange Niezel',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 GS',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Lange Niezel 5, 1012 GS Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37519,
                        lon: 4.89841,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37609,
                            lon: 4.89694,
                        },
                        btmRightPoint: {
                            lat: 52.37429,
                            lon: 4.89988,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37517,
                                lon: 4.89819,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528008000044695',
                    score: 2.574524641,
                    dist: 101.20737256883417,
                    info: 'search:ta:528008000044695-NL',
                    poi: {
                        name: 'De Kroon Ii',
                        phone: '+31 20 330 7805',
                        categorySet: [
                            {
                                id: 9376006,
                            },
                        ],
                        categories: ['café/pub', 'coffee shop'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'coffee shop',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '26',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JN',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 26, 1012 JN Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37601,
                        lon: 4.89602,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37691,
                            lon: 4.89455,
                        },
                        btmRightPoint: {
                            lat: 52.37511,
                            lon: 4.89749,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37592,
                                lon: 4.89597,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528007000027961',
                    score: 2.574524641,
                    dist: 101.20737256883417,
                    info: 'search:ta:528007000027961-NL',
                    poi: {
                        name: 'Coffeeshop Dekroon',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        url: 'coffeeshopdekroon.com',
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '26',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JN',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 26, 1012 JN Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37601,
                        lon: 4.89602,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37691,
                            lon: 4.89455,
                        },
                        btmRightPoint: {
                            lat: 52.37511,
                            lon: 4.89749,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37592,
                                lon: 4.89597,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009005853524',
                    score: 2.5745244026,
                    dist: 104.25804752051923,
                    info: 'search:ta:528009005853524-NL',
                    poi: {
                        name: "Coffeeshop Prix D'Ami",
                        categorySet: [
                            {
                                id: 9376006,
                            },
                        ],
                        url: 'prixdami.nl',
                        categories: ['café/pub', 'coffee shop'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'coffee shop',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '3',
                        streetName: 'Haringpakkerssteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 LR',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Haringpakkerssteeg 3, 1012 LR Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37681,
                        lon: 4.89713,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37771,
                            lon: 4.89566,
                        },
                        btmRightPoint: {
                            lat: 52.37591,
                            lon: 4.8986,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37688,
                                lon: 4.89723,
                            },
                        },
                        {
                            type: 'main',
                            position: {
                                lat: 52.37688,
                                lon: 4.89722,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528007000057781',
                    score: 2.5745244026,
                    dist: 103.28790972361662,
                    info: 'search:ta:528007000057781-NL',
                    poi: {
                        name: 'Restaurant Los Toros',
                        phone: '+31 20 337 9148',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '9',
                        streetName: 'Damrak',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 LG',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Damrak 9, 1012 LG Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37682,
                        lon: 4.89771,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37772,
                            lon: 4.89624,
                        },
                        btmRightPoint: {
                            lat: 52.37592,
                            lon: 4.89918,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37676,
                                lon: 4.89782,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009001602929',
                    score: 2.5745244026,
                    dist: 104.25804752051923,
                    info: 'search:ta:528009001602929-NL',
                    poi: {
                        name: "Prix d'Ami",
                        phone: '+31 20 626 3985',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '3',
                        streetName: 'Haringpakkerssteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 LR',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Haringpakkerssteeg 3, 1012 LR Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37681,
                        lon: 4.89713,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37771,
                            lon: 4.89566,
                        },
                        btmRightPoint: {
                            lat: 52.37591,
                            lon: 4.8986,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37688,
                                lon: 4.89722,
                            },
                        },
                        {
                            type: 'main',
                            position: {
                                lat: 52.37688,
                                lon: 4.89723,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009000860724',
                    score: 2.5745244026,
                    dist: 104.25804752051923,
                    info: 'search:ta:528009000860724-NL',
                    poi: {
                        name: 'Stones City',
                        phone: '+31 20 627 1019',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '3',
                        streetName: 'Haringpakkerssteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 LR',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Haringpakkerssteeg 3, 1012 LR Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37681,
                        lon: 4.89713,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37771,
                            lon: 4.89566,
                        },
                        btmRightPoint: {
                            lat: 52.37591,
                            lon: 4.8986,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37688,
                                lon: 4.89722,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009000866573',
                    score: 2.5745241642,
                    dist: 106.18197146882433,
                    info: 'search:ta:528009000866573-NL',
                    poi: {
                        name: 'Cafe The Bottle',
                        phone: '+31 20 772 2797',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '25',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JN',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 25, 1012 JN Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37583,
                        lon: 4.89594,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37673,
                            lon: 4.89447,
                        },
                        btmRightPoint: {
                            lat: 52.37493,
                            lon: 4.89741,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.3759,
                                lon: 4.89602,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009000854186',
                    score: 2.5745239258,
                    dist: 113.16216652075397,
                    info: 'search:ta:528009000854186-NL',
                    poi: {
                        name: 'Sportsbar Smoking Bull',
                        phone: '+31 20 420 4201',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        url: 'smokingbull.nl',
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '13',
                        streetName: 'Lange Niezel',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 GS',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Lange Niezel 13, 1012 GS Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37513,
                        lon: 4.89859,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37603,
                            lon: 4.89712,
                        },
                        btmRightPoint: {
                            lat: 52.37423,
                            lon: 4.90006,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37505,
                                lon: 4.89851,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009005859165',
                    score: 2.5745239258,
                    dist: 111.97997930638577,
                    info: 'search:ta:528009005859165-NL',
                    poi: {
                        name: 'Dam 2 Simit Sarayi',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '123-125',
                        streetName: 'Nieuwendijk',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 MD',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Nieuwendijk 123-125, 1012 MD Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37609,
                        lon: 4.89588,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37699,
                            lon: 4.89441,
                        },
                        btmRightPoint: {
                            lat: 52.37519,
                            lon: 4.89735,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37616,
                                lon: 4.89578,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009002333918',
                    score: 2.5745236874,
                    dist: 114.80704144948174,
                    info: 'search:ta:528009002333918-NL',
                    poi: {
                        name: "Charlie's Kitchen",
                        phone: '+31 20 737 1250',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 HT',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat, 1012 HT Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37594,
                        lon: 4.89919,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37684,
                            lon: 4.89772,
                        },
                        btmRightPoint: {
                            lat: 52.37504,
                            lon: 4.90066,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.376,
                                lon: 4.89909,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009001368518',
                    score: 2.5745236874,
                    dist: 115.71459443543141,
                    info: 'search:ta:528009001368518-NL',
                    poi: {
                        name: 'Cafe The Tribe',
                        phone: '+31 20 427 2727',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '79',
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 HX',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat 79, 1012 HX Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37486,
                        lon: 4.89756,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37576,
                            lon: 4.89609,
                        },
                        btmRightPoint: {
                            lat: 52.37396,
                            lon: 4.89903,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37489,
                                lon: 4.8975,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007943012',
                    score: 2.5745234489,
                    dist: 116.95200885675514,
                    info: 'search:ta:528009007943012-NL',
                    poi: {
                        name: 'The Tribe',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Warmoesstraat',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 HX',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Warmoesstraat, 1012 HX Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37485,
                        lon: 4.8976,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37575,
                            lon: 4.89613,
                        },
                        btmRightPoint: {
                            lat: 52.37395,
                            lon: 4.89907,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37489,
                                lon: 4.8975,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009000836466',
                    score: 2.5745234489,
                    dist: 116.76267293107297,
                    info: 'search:ta:528009000836466-NL',
                    poi: {
                        name: 'Café De Kuil',
                        phone: '+31 6 53780683',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '27',
                        streetName: 'Oudebrugsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 JN',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudebrugsteeg 27, 1012 JN Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37589,
                        lon: 4.89578,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37679,
                            lon: 4.89431,
                        },
                        btmRightPoint: {
                            lat: 52.37499,
                            lon: 4.89725,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37596,
                                lon: 4.89586,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007948892',
                    score: 2.5745234489,
                    dist: 119.33921142728333,
                    info: 'search:ta:528009007948892-NL',
                    poi: {
                        name: "The Flying Pig's Bar",
                        categorySet: [
                            {
                                id: 9376007,
                            },
                        ],
                        categories: ['café/pub', 'microbrewery/beer garden'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'microbrewery/beer garden',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '100',
                        streetName: 'Nieuwendijk',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 MR',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Nieuwendijk 100, 1012 MR Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37669,
                        lon: 4.89631,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37759,
                            lon: 4.89484,
                        },
                        btmRightPoint: {
                            lat: 52.37579,
                            lon: 4.89778,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37663,
                                lon: 4.89642,
                            },
                        },
                        {
                            type: 'main',
                            position: {
                                lat: 52.37663,
                                lon: 4.89642,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009007854833',
                    score: 2.5745234489,
                    dist: 119.54104001880488,
                    info: 'search:ta:528009007854833-NL',
                    poi: {
                        name: 'Backstage',
                        categorySet: [
                            {
                                id: 9379004,
                            },
                        ],
                        categories: ['bar', 'nightlife'],
                        classifications: [
                            {
                                code: 'NIGHTLIFE',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'bar',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'nightlife',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: 'Oudezijds Armsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'North Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 GP',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudezijds Armsteeg, 1012 GP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.37578,
                        lon: 4.89925,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.37668,
                            lon: 4.89778,
                        },
                        btmRightPoint: {
                            lat: 52.37488,
                            lon: 4.90072,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37571,
                                lon: 4.89917,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '528009000777777',
                    score: 2.5745234489,
                    dist: 117.2858070996279,
                    info: 'search:ta:528009000777777-NL',
                    poi: {
                        name: 'Cafe Backstage',
                        phone: '+31 20 320 4301',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '7',
                        streetName: 'Oudezijds Armsteeg',
                        municipality: 'Amsterdam',
                        countrySubdivision: 'Noord-Holland',
                        postalCode: '1012',
                        extendedPostalCode: '1012 GP',
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Oudezijds Armsteeg 7, 1012 GP Amsterdam',
                        localName: 'Amsterdam',
                    },
                    position: {
                        lat: 52.3758,
                        lon: 4.89922,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 52.3767,
                            lon: 4.89775,
                        },
                        btmRightPoint: {
                            lat: 52.3749,
                            lon: 4.90069,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 52.37572,
                                lon: 4.89914,
                            },
                        },
                    ],
                },
            ],
        },
    ],
];
