import type { Routes } from '@tomtom-org/maps-sdk/core';
import { expect } from 'vitest';
import type { CalculateRouteResponseAPI } from '../types/apiResponseTypes';
import type { CalculateRouteParams } from '../types/calculateRouteParams';

export const apiAndParsedResponses: [string, CalculateRouteResponseAPI, CalculateRouteParams, Routes][] = [
    [
        'Small route through Amsterdam with alternatives, sections and guidance',
        {
            routes: [
                {
                    summary: {
                        lengthInMeters: 3259,
                        travelDurationInSeconds: 951,
                        trafficDelayDurationInSeconds: 269,
                        trafficLengthInMeters: 474,
                        departureDateTime: '2023-11-28T18:43:12+01:00',
                        arrivalDateTime: '2023-11-28T18:59:03+01:00',
                        noTrafficTravelTimeInSeconds: 574,
                        historicTrafficTravelTimeInSeconds: 713,
                        liveTrafficIncidentsTravelTimeInSeconds: 951,
                    },
                    legs: [
                        {
                            summary: {
                                lengthInMeters: 3259,
                                travelDurationInSeconds: 951,
                                trafficDelayDurationInSeconds: 269,
                                trafficLengthInMeters: 474,
                                departureDateTime: '2023-11-28T18:43:12+01:00',
                                arrivalDateTime: '2023-11-28T18:59:03+01:00',
                                noTrafficTravelTimeInSeconds: 574,
                                historicTrafficTravelTimeInSeconds: 713,
                                liveTrafficIncidentsTravelTimeInSeconds: 951,
                            },
                            path: {
                                type: 'LineString',
                                coordinates: [
                                    [4.87489, 52.38686],
                                    [4.8749, 52.38659],
                                    [4.8749, 52.38654],
                                    [4.8746, 52.38653],
                                    [4.87461, 52.38625],
                                    [4.87461, 52.38602],
                                    [4.87485, 52.38602],
                                    [4.87485, 52.38598],
                                    [4.87486, 52.38577],
                                    [4.87484, 52.38568],
                                    [4.87484, 52.38558],
                                    [4.87487, 52.38553],
                                    [4.87488, 52.38551],
                                    [4.87492, 52.38546],
                                    [4.87671, 52.38549],
                                    [4.87793, 52.38551],
                                    [4.87902, 52.38553],
                                    [4.87919, 52.3855],
                                    [4.87966, 52.38541],
                                    [4.88027, 52.38527],
                                    [4.8806, 52.38519],
                                    [4.88099, 52.3851],
                                    [4.88107, 52.38508],
                                    [4.88135, 52.38502],
                                    [4.88156, 52.385],
                                    [4.88174, 52.38497],
                                    [4.88197, 52.38493],
                                    [4.88205, 52.38492],
                                    [4.88221, 52.38488],
                                    [4.88234, 52.38484],
                                    [4.88244, 52.38482],
                                    [4.88286, 52.38472],
                                    [4.88302, 52.38469],
                                    [4.88309, 52.38467],
                                    [4.88321, 52.38465],
                                    [4.88324, 52.38465],
                                    [4.8833, 52.38465],
                                    [4.88333, 52.38466],
                                    [4.88337, 52.38466],
                                    [4.88343, 52.3847],
                                    [4.88347, 52.38474],
                                    [4.88359, 52.38488],
                                    [4.88372, 52.38504],
                                    [4.88384, 52.38519],
                                    [4.88393, 52.38523],
                                    [4.88397, 52.38524],
                                    [4.88407, 52.38525],
                                    [4.88416, 52.38523],
                                    [4.88424, 52.38521],
                                    [4.88433, 52.38518],
                                    [4.88451, 52.38509],
                                    [4.88495, 52.38485],
                                    [4.88511, 52.38476],
                                    [4.88548, 52.38458],
                                    [4.88723, 52.3836],
                                    [4.88738, 52.38351],
                                    [4.88762, 52.38334],
                                    [4.88795, 52.38312],
                                    [4.88824, 52.38297],
                                    [4.88859, 52.38283],
                                    [4.88865, 52.38281],
                                    [4.88922, 52.38256],
                                    [4.8898, 52.38231],
                                    [4.8902, 52.38211],
                                    [4.89028, 52.38207],
                                    [4.89037, 52.38203],
                                    [4.89134, 52.38154],
                                    [4.89173, 52.38139],
                                    [4.89376, 52.38076],
                                    [4.89382, 52.38074],
                                    [4.89442, 52.38048],
                                    [4.89447, 52.38045],
                                    [4.89449, 52.38043],
                                    [4.89454, 52.38036],
                                    [4.89455, 52.38033],
                                    [4.89454, 52.38012],
                                    [4.89454, 52.37993],
                                    [4.89458, 52.37985],
                                    [4.89464, 52.37981],
                                    [4.89471, 52.37978],
                                    [4.8948, 52.37977],
                                    [4.89487, 52.37977],
                                    [4.89496, 52.3798],
                                    [4.89505, 52.37987],
                                    [4.89527, 52.38004],
                                    [4.89542, 52.38019],
                                    [4.89549, 52.38027],
                                    [4.89561, 52.38038],
                                    [4.89576, 52.38052],
                                    [4.89606, 52.38081],
                                    [4.8961, 52.38086],
                                    [4.89617, 52.381],
                                    [4.89622, 52.38117],
                                    [4.89629, 52.38127],
                                    [4.89634, 52.38131],
                                    [4.89639, 52.38132],
                                    [4.89648, 52.38133],
                                    [4.89654, 52.38129],
                                    [4.89662, 52.38124],
                                    [4.8968, 52.38114],
                                    [4.89695, 52.38105],
                                    [4.89702, 52.38101],
                                    [4.89709, 52.38098],
                                    [4.89739, 52.38086],
                                    [4.8988, 52.38035],
                                    [4.89889, 52.38032],
                                    [4.89901, 52.38027],
                                    [4.89912, 52.38023],
                                    [4.89914, 52.38022],
                                    [4.89915, 52.38022],
                                    [4.8999, 52.37994],
                                    [4.90009, 52.37988],
                                    [4.90054, 52.37971],
                                    [4.90108, 52.37951],
                                    [4.90112, 52.37949],
                                    [4.90119, 52.37947],
                                    [4.90123, 52.37946],
                                    [4.90207, 52.37915],
                                    [4.90256, 52.37897],
                                    [4.90268, 52.37892],
                                    [4.90334, 52.37868],
                                    [4.90397, 52.37845],
                                    [4.90435, 52.37835],
                                    [4.90441, 52.37834],
                                    [4.90475, 52.37826],
                                    [4.90485, 52.37823],
                                    [4.90501, 52.37821],
                                    [4.90517, 52.37819],
                                    [4.90533, 52.37816],
                                    [4.90574, 52.37811],
                                    [4.90633, 52.37803],
                                    [4.9064, 52.37802],
                                    [4.90647, 52.37809],
                                    [4.90632, 52.37812],
                                    [4.90593, 52.37817],
                                    [4.90537, 52.37825],
                                    [4.90521, 52.37828],
                                    [4.90504, 52.37832],
                                    [4.90497, 52.37834],
                                    [4.90489, 52.37836],
                                    [4.90453, 52.37847],
                                    [4.9045, 52.37848],
                                    [4.90433, 52.37858],
                                    [4.90428, 52.3786],
                                    [4.90286, 52.37911],
                                    [4.90283, 52.37912],
                                    [4.90276, 52.37912],
                                    [4.90272, 52.37911],
                                    [4.90269, 52.3791],
                                    [4.90265, 52.37908],
                                    [4.90262, 52.37907],
                                    [4.9026, 52.37906],
                                    [4.90213, 52.37922],
                                    [4.90207, 52.37915],
                                    [4.90206, 52.37914],
                                    [4.90127, 52.37943],
                                ],
                            },
                        },
                    ],
                    sections: {
                        urban: [
                            {
                                startPathIndex: 9,
                                endPathIndex: 88,
                            },
                            {
                                startPathIndex: 91,
                                endPathIndex: 92,
                            },
                            {
                                startPathIndex: 103,
                                endPathIndex: 155,
                            },
                        ],
                        toll: [
                            {
                                startPathIndex: 10,
                                endPathIndex: 50,
                            },
                        ],
                        tunnel: [
                            {
                                startPathIndex: 104,
                                endPathIndex: 119,
                            },
                        ],
                        travelMode: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 151,
                                travelMode: 'car',
                            },
                            {
                                startPathIndex: 151,
                                endPathIndex: 155,
                                travelMode: 'other',
                            },
                        ],
                        country: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 155,
                                countryCodeIso2: 'NL',
                            },
                        ],
                        pedestrian: [
                            {
                                startPathIndex: 151,
                                endPathIndex: 155,
                            },
                        ],
                        traffic: [
                            {
                                startPathIndex: 80,
                                endPathIndex: 94,
                                effectiveSpeedInKilometersPerHour: 3,
                                delayDurationInSeconds: 210,
                                delayMagnitude: 'major',
                                tec: {
                                    causes: [{ mainCauseCode: 1 }, { mainCauseCode: 3 }, { mainCauseCode: 9 }],
                                    effectCode: 6,
                                },
                            },
                            {
                                startPathIndex: 119,
                                endPathIndex: 131,
                                effectiveSpeedInKilometersPerHour: 11,
                                delayDurationInSeconds: 59,
                                delayMagnitude: 'minor',
                                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                            },
                        ],
                    },
                    instructions: [
                        {
                            drivingSide: 'right',
                            maneuver: 'depart',
                            maneuverPoint: { latitude: 52.38686, longitude: 4.87489 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 0,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 0,
                                    point: { latitude: 52.38686, longitude: 4.87489 },
                                    travelTimeFromRouteStartInSeconds: 0,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38654, longitude: 4.8749 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 35,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 35,
                                    point: { latitude: 52.38654, longitude: 4.8749 },
                                    travelTimeFromRouteStartInSeconds: 11,
                                },
                                {
                                    distanceFromRouteStartInMeters: 45,
                                    point: { latitude: 52.38654, longitude: 4.87476 },
                                    travelTimeFromRouteStartInSeconds: 15,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38653, longitude: 4.8746 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 56,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 56,
                                    point: { latitude: 52.38653, longitude: 4.8746 },
                                    travelTimeFromRouteStartInSeconds: 18,
                                },
                                {
                                    distanceFromRouteStartInMeters: 66,
                                    point: { latitude: 52.38644, longitude: 4.8746 },
                                    travelTimeFromRouteStartInSeconds: 22,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38602, longitude: 4.87461 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 114,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 114,
                                    point: { latitude: 52.38602, longitude: 4.87461 },
                                    travelTimeFromRouteStartInSeconds: 37,
                                },
                                {
                                    distanceFromRouteStartInMeters: 124,
                                    point: { latitude: 52.38602, longitude: 4.87476 },
                                    travelTimeFromRouteStartInSeconds: 41,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 25,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 25,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 96,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38602, longitude: 4.87485 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 130,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 130,
                                    point: { latitude: 52.38602, longitude: 4.87485 },
                                    travelTimeFromRouteStartInSeconds: 43,
                                },
                                {
                                    distanceFromRouteStartInMeters: 133,
                                    point: { latitude: 52.38598, longitude: 4.87485 },
                                    travelTimeFromRouteStartInSeconds: 46,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -67,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38546, longitude: 4.87492 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's103',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 193,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 193,
                                    point: { latitude: 52.38546, longitude: 4.87492 },
                                    travelTimeFromRouteStartInSeconds: 105,
                                },
                                {
                                    distanceFromRouteStartInMeters: 203,
                                    point: { latitude: 52.38546, longitude: 4.87507 },
                                    travelTimeFromRouteStartInSeconds: 106,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 34,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38519, longitude: 4.88384 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 852,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 852,
                                    point: { latitude: 52.38519, longitude: 4.88384 },
                                    travelTimeFromRouteStartInSeconds: 247,
                                },
                                {
                                    distanceFromRouteStartInMeters: 860,
                                    point: { latitude: 52.38523, longitude: 4.88393 },
                                    travelTimeFromRouteStartInSeconds: 248,
                                },
                                {
                                    distanceFromRouteStartInMeters: 862,
                                    point: { latitude: 52.38523, longitude: 4.88396 },
                                    travelTimeFromRouteStartInSeconds: 248,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 210,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 196,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 133,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -147,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnSharpLeft',
                            maneuverPoint: { latitude: 52.37977, longitude: 4.8948 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8dro\u0263.\u02ccb\u0251k' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Droogbak',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8ni.w\u0259 \u02c8\u028b\u025bs.t\u0259r.d\u0254k.strat',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Nieuwe Westerdokstraat',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1822,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1822,
                                    point: { latitude: 52.37993, longitude: 4.89454 },
                                    travelTimeFromRouteStartInSeconds: 395,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1831,
                                    point: { latitude: 52.37985, longitude: 4.89458 },
                                    travelTimeFromRouteStartInSeconds: 398,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1837,
                                    point: { latitude: 52.37981, longitude: 4.89464 },
                                    travelTimeFromRouteStartInSeconds: 399,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1843,
                                    point: { latitude: 52.37978, longitude: 4.89471 },
                                    travelTimeFromRouteStartInSeconds: 400,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1849,
                                    point: { latitude: 52.37977, longitude: 4.8948 },
                                    travelTimeFromRouteStartInSeconds: 401,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1854,
                                    point: { latitude: 52.37977, longitude: 4.89487 },
                                    travelTimeFromRouteStartInSeconds: 402,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1861,
                                    point: { latitude: 52.3798, longitude: 4.89496 },
                                    travelTimeFromRouteStartInSeconds: 410,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1871,
                                    point: { latitude: 52.37987, longitude: 4.89505 },
                                    travelTimeFromRouteStartInSeconds: 422,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 876,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 569,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 272,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 118,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 130,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38133, longitude: 4.89648 },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8dro\u0263.\u02ccb\u0251k' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Droogbak',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 2038,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 2038,
                                    point: { latitude: 52.38117, longitude: 4.89622 },
                                    travelTimeFromRouteStartInSeconds: 623,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2050,
                                    point: { latitude: 52.38127, longitude: 4.89629 },
                                    travelTimeFromRouteStartInSeconds: 637,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2056,
                                    point: { latitude: 52.38131, longitude: 4.89634 },
                                    travelTimeFromRouteStartInSeconds: 641,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2060,
                                    point: { latitude: 52.38132, longitude: 4.89639 },
                                    travelTimeFromRouteStartInSeconds: 642,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2066,
                                    point: { latitude: 52.38133, longitude: 4.89648 },
                                    travelTimeFromRouteStartInSeconds: 643,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2072,
                                    point: { latitude: 52.38129, longitude: 4.89654 },
                                    travelTimeFromRouteStartInSeconds: 644,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -180,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'makeUTurn',
                            maneuverPoint: { latitude: 52.37809, longitude: 4.90647 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 2842,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 2842,
                                    point: { latitude: 52.37802, longitude: 4.9064 },
                                    travelTimeFromRouteStartInSeconds: 769,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2851,
                                    point: { latitude: 52.37809, longitude: 4.90647 },
                                    travelTimeFromRouteStartInSeconds: 772,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2862,
                                    point: { latitude: 52.37812, longitude: 4.90632 },
                                    travelTimeFromRouteStartInSeconds: 774,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2872,
                                    point: { latitude: 52.37814, longitude: 4.90617 },
                                    travelTimeFromRouteStartInSeconds: 781,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 725,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 719,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 108,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 17,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnSlightRight',
                            maneuverPoint: { latitude: 52.37848, longitude: 4.9045 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 2993,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 2993,
                                    point: { latitude: 52.37848, longitude: 4.9045 },
                                    travelTimeFromRouteStartInSeconds: 823,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3003,
                                    point: { latitude: 52.37854, longitude: 4.90439 },
                                    travelTimeFromRouteStartInSeconds: 825,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 57,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.37906, longitude: 4.9026 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3145,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3145,
                                    point: { latitude: 52.37906, longitude: 4.9026 },
                                    travelTimeFromRouteStartInSeconds: 872,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3155,
                                    point: { latitude: 52.3791, longitude: 4.90247 },
                                    travelTimeFromRouteStartInSeconds: 877,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.37922, longitude: 4.90213 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3182,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3182,
                                    point: { latitude: 52.37922, longitude: 4.90213 },
                                    travelTimeFromRouteStartInSeconds: 896,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3191,
                                    point: { latitude: 52.37915, longitude: 4.90207 },
                                    travelTimeFromRouteStartInSeconds: 902,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3191,
                                    point: { latitude: 52.37914, longitude: 4.90206 },
                                    travelTimeFromRouteStartInSeconds: 903,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            maneuver: 'arriveLeft',
                            maneuverPoint: { latitude: 52.37943, longitude: 4.90127 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: 'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: 'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3254,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3254,
                                    point: { latitude: 52.37943, longitude: 4.90127 },
                                    travelTimeFromRouteStartInSeconds: 948,
                                },
                            ],
                            sideRoads: [],
                        },
                    ],
                    progressPoints: [
                        {
                            pathIndex: 0,
                            travelDurationInSeconds: 0,
                            distanceInMeters: 0,
                        },
                        {
                            pathIndex: 7,
                            travelDurationInSeconds: 54,
                            distanceInMeters: 178,
                        },
                        {
                            pathIndex: 15,
                            travelDurationInSeconds: 115,
                            distanceInMeters: 485,
                        },
                        {
                            pathIndex: 30,
                            travelDurationInSeconds: 178,
                            distanceInMeters: 1004,
                        },
                    ],
                },
                {
                    summary: {
                        lengthInMeters: 3451,
                        travelDurationInSeconds: 908,
                        trafficDelayDurationInSeconds: 198,
                        trafficLengthInMeters: 520,
                        departureDateTime: '2023-11-28T18:43:12+01:00',
                        arrivalDateTime: '2023-11-28T18:58:19+01:00',
                        noTrafficTravelTimeInSeconds: 617,
                        historicTrafficTravelTimeInSeconds: 733,
                        liveTrafficIncidentsTravelTimeInSeconds: 908,
                        deviationDistanceInMeters: 1551,
                        deviationDurationInSeconds: 337,
                        deviationPoint: {
                            type: 'Point',
                            coordinates: [4.89173, 52.38139],
                        },
                    },
                    legs: [
                        {
                            summary: {
                                lengthInMeters: 3451,
                                travelDurationInSeconds: 908,
                                trafficDelayDurationInSeconds: 198,
                                trafficLengthInMeters: 520,
                                departureDateTime: '2023-11-28T18:43:12+01:00',
                                arrivalDateTime: '2023-11-28T18:58:19+01:00',
                                noTrafficTravelTimeInSeconds: 617,
                                historicTrafficTravelTimeInSeconds: 733,
                                liveTrafficIncidentsTravelTimeInSeconds: 908,
                            },
                            path: {
                                type: 'LineString',
                                coordinates: [
                                    [4.87489, 52.38686],
                                    [4.8749, 52.38659],
                                    [4.8749, 52.38654],
                                    [4.8746, 52.38653],
                                    [4.87461, 52.38625],
                                    [4.87461, 52.38602],
                                    [4.87485, 52.38602],
                                    [4.87485, 52.38598],
                                    [4.87486, 52.38577],
                                    [4.87484, 52.38568],
                                    [4.87484, 52.38558],
                                    [4.87487, 52.38553],
                                    [4.87488, 52.38551],
                                    [4.87492, 52.38546],
                                    [4.87671, 52.38549],
                                    [4.87793, 52.38551],
                                    [4.87902, 52.38553],
                                    [4.87919, 52.3855],
                                    [4.87966, 52.38541],
                                    [4.88027, 52.38527],
                                    [4.8806, 52.38519],
                                    [4.88099, 52.3851],
                                    [4.88107, 52.38508],
                                    [4.88135, 52.38502],
                                    [4.88156, 52.385],
                                    [4.88174, 52.38497],
                                    [4.88197, 52.38493],
                                    [4.88205, 52.38492],
                                    [4.88221, 52.38488],
                                    [4.88234, 52.38484],
                                    [4.88244, 52.38482],
                                    [4.88286, 52.38472],
                                    [4.88302, 52.38469],
                                    [4.88309, 52.38467],
                                    [4.88321, 52.38465],
                                    [4.88324, 52.38465],
                                    [4.8833, 52.38465],
                                    [4.88333, 52.38466],
                                    [4.88337, 52.38466],
                                    [4.88343, 52.3847],
                                    [4.88347, 52.38474],
                                    [4.88359, 52.38488],
                                    [4.88372, 52.38504],
                                    [4.88384, 52.38519],
                                    [4.88393, 52.38523],
                                    [4.88397, 52.38524],
                                    [4.88407, 52.38525],
                                    [4.88416, 52.38523],
                                    [4.88424, 52.38521],
                                    [4.88433, 52.38518],
                                    [4.88451, 52.38509],
                                    [4.88495, 52.38485],
                                    [4.88511, 52.38476],
                                    [4.88548, 52.38458],
                                    [4.88723, 52.3836],
                                    [4.88738, 52.38351],
                                    [4.88762, 52.38334],
                                    [4.88795, 52.38312],
                                    [4.88824, 52.38297],
                                    [4.88859, 52.38283],
                                    [4.88865, 52.38281],
                                    [4.88922, 52.38256],
                                    [4.8898, 52.38231],
                                    [4.8902, 52.38211],
                                    [4.89028, 52.38207],
                                    [4.89037, 52.38203],
                                    [4.89134, 52.38154],
                                    [4.89173, 52.38139],
                                    [4.89169, 52.38134],
                                    [4.89164, 52.38126],
                                    [4.89155, 52.38114],
                                    [4.89012, 52.38198],
                                    [4.89024, 52.38203],
                                    [4.89025, 52.38204],
                                    [4.89028, 52.38207],
                                    [4.89037, 52.38216],
                                    [4.8904, 52.38218],
                                    [4.89047, 52.38224],
                                    [4.89072, 52.38249],
                                    [4.89087, 52.38257],
                                    [4.89098, 52.38261],
                                    [4.89111, 52.38264],
                                    [4.89202, 52.38273],
                                    [4.89257, 52.38274],
                                    [4.89273, 52.38274],
                                    [4.89285, 52.38272],
                                    [4.893, 52.38272],
                                    [4.8931, 52.38274],
                                    [4.8932, 52.38276],
                                    [4.89334, 52.38281],
                                    [4.89339, 52.38283],
                                    [4.89364, 52.38282],
                                    [4.89408, 52.38283],
                                    [4.89423, 52.38281],
                                    [4.89429, 52.3828],
                                    [4.89454, 52.38274],
                                    [4.89471, 52.38265],
                                    [4.89516, 52.38232],
                                    [4.89518, 52.38231],
                                    [4.89526, 52.38225],
                                    [4.89553, 52.38207],
                                    [4.89571, 52.38191],
                                    [4.89597, 52.38171],
                                    [4.89611, 52.3816],
                                    [4.89624, 52.38149],
                                    [4.89629, 52.38146],
                                    [4.89648, 52.38133],
                                    [4.89654, 52.38129],
                                    [4.89662, 52.38124],
                                    [4.8968, 52.38114],
                                    [4.89695, 52.38105],
                                    [4.89702, 52.38101],
                                    [4.89709, 52.38098],
                                    [4.89739, 52.38086],
                                    [4.8988, 52.38035],
                                    [4.89889, 52.38032],
                                    [4.89901, 52.38027],
                                    [4.89912, 52.38023],
                                    [4.89914, 52.38022],
                                    [4.89915, 52.38022],
                                    [4.8999, 52.37994],
                                    [4.90009, 52.37988],
                                    [4.90054, 52.37971],
                                    [4.90108, 52.37951],
                                    [4.90112, 52.37949],
                                    [4.90119, 52.37947],
                                    [4.90123, 52.37946],
                                    [4.90207, 52.37915],
                                    [4.90256, 52.37897],
                                    [4.90268, 52.37892],
                                    [4.90334, 52.37868],
                                    [4.90397, 52.37845],
                                    [4.90435, 52.37835],
                                    [4.90441, 52.37834],
                                    [4.90475, 52.37826],
                                    [4.90485, 52.37823],
                                    [4.90501, 52.37821],
                                    [4.90517, 52.37819],
                                    [4.90533, 52.37816],
                                    [4.90574, 52.37811],
                                    [4.90633, 52.37803],
                                    [4.9064, 52.37802],
                                    [4.90647, 52.37809],
                                    [4.90632, 52.37812],
                                    [4.90593, 52.37817],
                                    [4.90537, 52.37825],
                                    [4.90521, 52.37828],
                                    [4.90504, 52.37832],
                                    [4.90497, 52.37834],
                                    [4.90489, 52.37836],
                                    [4.90453, 52.37847],
                                    [4.9045, 52.37848],
                                    [4.90433, 52.37858],
                                    [4.90428, 52.3786],
                                    [4.90286, 52.37911],
                                    [4.90283, 52.37912],
                                    [4.90276, 52.37912],
                                    [4.90272, 52.37911],
                                    [4.90269, 52.3791],
                                    [4.90265, 52.37908],
                                    [4.90262, 52.37907],
                                    [4.9026, 52.37906],
                                    [4.90213, 52.37922],
                                    [4.90207, 52.37915],
                                    [4.90206, 52.37914],
                                    [4.90127, 52.37943],
                                ],
                            },
                        },
                    ],
                    sections: {
                        urban: [
                            {
                                startPathIndex: 9,
                                endPathIndex: 104,
                            },
                            {
                                startPathIndex: 113,
                                endPathIndex: 165,
                            },
                        ],
                        tunnel: [
                            {
                                startPathIndex: 114,
                                endPathIndex: 129,
                            },
                        ],
                        travelMode: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 161,
                                travelMode: 'car',
                            },
                            {
                                startPathIndex: 161,
                                endPathIndex: 165,
                                travelMode: 'other',
                            },
                        ],
                        country: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 165,
                                countryCodeIso2: 'NL',
                            },
                        ],
                        pedestrian: [
                            {
                                startPathIndex: 161,
                                endPathIndex: 165,
                            },
                        ],
                        traffic: [
                            {
                                startPathIndex: 90,
                                endPathIndex: 103,
                                effectiveSpeedInKilometersPerHour: 5,
                                delayDurationInSeconds: 138,
                                delayMagnitude: 'major',
                                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                            },
                            {
                                startPathIndex: 129,
                                endPathIndex: 141,
                                effectiveSpeedInKilometersPerHour: 11,
                                delayDurationInSeconds: 59,
                                delayMagnitude: 'minor',
                                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                            },
                        ],
                    },
                    instructions: [
                        {
                            drivingSide: 'right',
                            maneuver: 'depart',
                            maneuverPoint: { latitude: 52.38686, longitude: 4.87489 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 0,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 0,
                                    point: { latitude: 52.38686, longitude: 4.87489 },
                                    travelTimeFromRouteStartInSeconds: 0,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38654, longitude: 4.8749 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 35,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 35,
                                    point: { latitude: 52.38654, longitude: 4.8749 },
                                    travelTimeFromRouteStartInSeconds: 11,
                                },
                                {
                                    distanceFromRouteStartInMeters: 45,
                                    point: { latitude: 52.38654, longitude: 4.87476 },
                                    travelTimeFromRouteStartInSeconds: 15,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38653, longitude: 4.8746 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 56,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 56,
                                    point: { latitude: 52.38653, longitude: 4.8746 },
                                    travelTimeFromRouteStartInSeconds: 18,
                                },
                                {
                                    distanceFromRouteStartInMeters: 66,
                                    point: { latitude: 52.38644, longitude: 4.8746 },
                                    travelTimeFromRouteStartInSeconds: 22,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38602, longitude: 4.87461 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 114,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 114,
                                    point: { latitude: 52.38602, longitude: 4.87461 },
                                    travelTimeFromRouteStartInSeconds: 37,
                                },
                                {
                                    distanceFromRouteStartInMeters: 124,
                                    point: { latitude: 52.38602, longitude: 4.87476 },
                                    travelTimeFromRouteStartInSeconds: 41,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 25,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 25,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 96,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38602, longitude: 4.87485 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 130,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 130,
                                    point: { latitude: 52.38602, longitude: 4.87485 },
                                    travelTimeFromRouteStartInSeconds: 43,
                                },
                                {
                                    distanceFromRouteStartInMeters: 133,
                                    point: { latitude: 52.38598, longitude: 4.87485 },
                                    travelTimeFromRouteStartInSeconds: 46,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -67,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38546, longitude: 4.87492 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's103',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 193,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 193,
                                    point: { latitude: 52.38546, longitude: 4.87492 },
                                    travelTimeFromRouteStartInSeconds: 105,
                                },
                                {
                                    distanceFromRouteStartInMeters: 203,
                                    point: { latitude: 52.38546, longitude: 4.87507 },
                                    travelTimeFromRouteStartInSeconds: 106,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 34,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38519, longitude: 4.88384 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 852,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 852,
                                    point: { latitude: 52.38519, longitude: 4.88384 },
                                    travelTimeFromRouteStartInSeconds: 247,
                                },
                                {
                                    distanceFromRouteStartInMeters: 860,
                                    point: { latitude: 52.38523, longitude: 4.88393 },
                                    travelTimeFromRouteStartInSeconds: 248,
                                },
                                {
                                    distanceFromRouteStartInMeters: 862,
                                    point: { latitude: 52.38523, longitude: 4.88396 },
                                    travelTimeFromRouteStartInSeconds: 248,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 210,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 196,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 133,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 84,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38139, longitude: 4.89173 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8b\u0153\u2040y.t\u0259n \u02c8br\u0251\u2040u.w\u0259rs.strat',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Buiten Brouwersstraat',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8ni.w\u0259 \u02c8\u028b\u025bs.t\u0259r.d\u0254k.strat',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Nieuwe Westerdokstraat',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1549,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1549,
                                    point: { latitude: 52.38139, longitude: 4.89173 },
                                    travelTimeFromRouteStartInSeconds: 337,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1555,
                                    point: { latitude: 52.38134, longitude: 4.89169 },
                                    travelTimeFromRouteStartInSeconds: 338,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 603,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 296,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 107,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38114, longitude: 4.89155 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8har.l\u025b.m\u0259r \u02c8h\u0251\u2040ut.t\u0153\u2040y.n\u0259n',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmer Houttuinen',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8b\u0153\u2040y.t\u0259n \u02c8br\u0251\u2040u.w\u0259rs.strat',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Buiten Brouwersstraat',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1578,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1578,
                                    point: { latitude: 52.38114, longitude: 4.89155 },
                                    travelTimeFromRouteStartInSeconds: 343,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1588,
                                    point: { latitude: 52.38121, longitude: 4.89144 },
                                    travelTimeFromRouteStartInSeconds: 345,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 101,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38198, longitude: 4.89012 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8\u028b\u025bs.t\u0259r.d\u0254ks.\u02ccka.d\u0259',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Westerdokskade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8har.l\u025b.m\u0259r \u02c8h\u0251\u2040ut.t\u0153\u2040y.n\u0259n',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmer Houttuinen',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1713,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1713,
                                    point: { latitude: 52.38198, longitude: 4.89012 },
                                    travelTimeFromRouteStartInSeconds: 374,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1722,
                                    point: { latitude: 52.38203, longitude: 4.89024 },
                                    travelTimeFromRouteStartInSeconds: 375,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 34,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38283, longitude: 4.89339 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1974,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1974,
                                    point: { latitude: 52.38283, longitude: 4.89339 },
                                    travelTimeFromRouteStartInSeconds: 418,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1984,
                                    point: { latitude: 52.38283, longitude: 4.89354 },
                                    travelTimeFromRouteStartInSeconds: 424,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 48,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -180,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'makeUTurn',
                            maneuverPoint: { latitude: 52.37809, longitude: 4.90647 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3036,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3036,
                                    point: { latitude: 52.37802, longitude: 4.9064 },
                                    travelTimeFromRouteStartInSeconds: 726,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3045,
                                    point: { latitude: 52.37809, longitude: 4.90647 },
                                    travelTimeFromRouteStartInSeconds: 729,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3056,
                                    point: { latitude: 52.37812, longitude: 4.90632 },
                                    travelTimeFromRouteStartInSeconds: 730,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3066,
                                    point: { latitude: 52.37814, longitude: 4.90617 },
                                    travelTimeFromRouteStartInSeconds: 740,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 919,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 859,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 800,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 725,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 719,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 108,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 17,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnSlightRight',
                            maneuverPoint: { latitude: 52.37848, longitude: 4.9045 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3187,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3187,
                                    point: { latitude: 52.37848, longitude: 4.9045 },
                                    travelTimeFromRouteStartInSeconds: 780,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3197,
                                    point: { latitude: 52.37854, longitude: 4.90439 },
                                    travelTimeFromRouteStartInSeconds: 783,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 57,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.37906, longitude: 4.9026 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3339,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3339,
                                    point: { latitude: 52.37906, longitude: 4.9026 },
                                    travelTimeFromRouteStartInSeconds: 829,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3349,
                                    point: { latitude: 52.3791, longitude: 4.90247 },
                                    travelTimeFromRouteStartInSeconds: 834,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.37922, longitude: 4.90213 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3375,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3375,
                                    point: { latitude: 52.37922, longitude: 4.90213 },
                                    travelTimeFromRouteStartInSeconds: 854,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3384,
                                    point: { latitude: 52.37915, longitude: 4.90207 },
                                    travelTimeFromRouteStartInSeconds: 860,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3385,
                                    point: { latitude: 52.37914, longitude: 4.90206 },
                                    travelTimeFromRouteStartInSeconds: 860,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            maneuver: 'arriveLeft',
                            maneuverPoint: { latitude: 52.37943, longitude: 4.90127 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: 'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: 'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3448,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3448,
                                    point: { latitude: 52.37943, longitude: 4.90127 },
                                    travelTimeFromRouteStartInSeconds: 906,
                                },
                            ],
                            sideRoads: [],
                        },
                    ],
                },
                {
                    summary: {
                        lengthInMeters: 11267,
                        travelDurationInSeconds: 1902,
                        trafficDelayDurationInSeconds: 8,
                        trafficLengthInMeters: 11,
                        departureDateTime: '2023-11-28T18:43:12+01:00',
                        arrivalDateTime: '2023-11-28T19:14:53+01:00',
                        noTrafficTravelTimeInSeconds: 1468,
                        historicTrafficTravelTimeInSeconds: 1896,
                        liveTrafficIncidentsTravelTimeInSeconds: 1902,
                        deviationDistanceInMeters: 193,
                        deviationDurationInSeconds: 105,
                        deviationPoint: {
                            type: 'Point',
                            coordinates: [4.87492, 52.38546],
                        },
                    },
                    legs: [
                        {
                            summary: {
                                lengthInMeters: 11267,
                                travelDurationInSeconds: 1902,
                                trafficDelayDurationInSeconds: 8,
                                trafficLengthInMeters: 11,
                                departureDateTime: '2023-11-28T18:43:12+01:00',
                                arrivalDateTime: '2023-11-28T19:14:53+01:00',
                                noTrafficTravelTimeInSeconds: 1468,
                                historicTrafficTravelTimeInSeconds: 1896,
                                liveTrafficIncidentsTravelTimeInSeconds: 1902,
                            },
                            path: {
                                type: 'LineString',
                                coordinates: [
                                    [4.87489, 52.38686],
                                    [4.8749, 52.38659],
                                    [4.8749, 52.38654],
                                    [4.8746, 52.38653],
                                    [4.87461, 52.38625],
                                    [4.87461, 52.38602],
                                    [4.87485, 52.38602],
                                    [4.87485, 52.38598],
                                    [4.87486, 52.38577],
                                    [4.87484, 52.38568],
                                    [4.87484, 52.38558],
                                    [4.87487, 52.38553],
                                    [4.87488, 52.38551],
                                    [4.87492, 52.38546],
                                    [4.87327, 52.38543],
                                    [4.87076, 52.38539],
                                    [4.87, 52.38538],
                                    [4.8697, 52.38537],
                                    [4.86953, 52.38533],
                                    [4.86951, 52.38524],
                                    [4.86954, 52.38519],
                                    [4.86978, 52.3847],
                                    [4.86987, 52.3846],
                                    [4.87006, 52.38409],
                                    [4.87009, 52.38405],
                                    [4.87008, 52.38402],
                                    [4.87008, 52.38393],
                                    [4.87027, 52.38348],
                                    [4.87045, 52.38301],
                                    [4.87053, 52.38281],
                                    [4.87064, 52.38252],
                                    [4.87081, 52.38205],
                                    [4.871, 52.38152],
                                    [4.87122, 52.38095],
                                    [4.87162, 52.37978],
                                    [4.87175, 52.37941],
                                    [4.8718, 52.37935],
                                    [4.87189, 52.37931],
                                    [4.87275, 52.37908],
                                    [4.87313, 52.37896],
                                    [4.87325, 52.37893],
                                    [4.87371, 52.37881],
                                    [4.87386, 52.37877],
                                    [4.8741, 52.37875],
                                    [4.87422, 52.37875],
                                    [4.87429, 52.37876],
                                    [4.8745, 52.37884],
                                    [4.87476, 52.37891],
                                    [4.87513, 52.37902],
                                    [4.87538, 52.37881],
                                    [4.87542, 52.37877],
                                    [4.8754, 52.37874],
                                    [4.87538, 52.37872],
                                    [4.87512, 52.37835],
                                    [4.87478, 52.37787],
                                    [4.8747, 52.37779],
                                    [4.87464, 52.37771],
                                    [4.87464, 52.3777],
                                    [4.8746, 52.37759],
                                    [4.87366, 52.37618],
                                    [4.87361, 52.37613],
                                    [4.87359, 52.37611],
                                    [4.87357, 52.37608],
                                    [4.87354, 52.37601],
                                    [4.87354, 52.37598],
                                    [4.87306, 52.37528],
                                    [4.87282, 52.37494],
                                    [4.8728, 52.3749],
                                    [4.87275, 52.37482],
                                    [4.87268, 52.37482],
                                    [4.87261, 52.3748],
                                    [4.87255, 52.37477],
                                    [4.87252, 52.37473],
                                    [4.8725, 52.3747],
                                    [4.87249, 52.37466],
                                    [4.8725, 52.37463],
                                    [4.87251, 52.37459],
                                    [4.87254, 52.37456],
                                    [4.87251, 52.37447],
                                    [4.87247, 52.37438],
                                    [4.87208, 52.37375],
                                    [4.87144, 52.37278],
                                    [4.87132, 52.37263],
                                    [4.87127, 52.37256],
                                    [4.87123, 52.37251],
                                    [4.87121, 52.37247],
                                    [4.8711, 52.37226],
                                    [4.87061, 52.37153],
                                    [4.87043, 52.37111],
                                    [4.87041, 52.37104],
                                    [4.8704, 52.37099],
                                    [4.87039, 52.37097],
                                    [4.87037, 52.37089],
                                    [4.87036, 52.37086],
                                    [4.87033, 52.37074],
                                    [4.87031, 52.37037],
                                    [4.87031, 52.37027],
                                    [4.87039, 52.3699],
                                    [4.8705, 52.36963],
                                    [4.8706, 52.3694],
                                    [4.8709, 52.36892],
                                    [4.87106, 52.36873],
                                    [4.87167, 52.36785],
                                    [4.87175, 52.3677],
                                    [4.872, 52.36735],
                                    [4.87206, 52.36727],
                                    [4.87209, 52.36723],
                                    [4.87213, 52.36717],
                                    [4.87218, 52.36722],
                                    [4.87224, 52.36726],
                                    [4.87231, 52.36728],
                                    [4.8724, 52.36731],
                                    [4.87323, 52.36754],
                                    [4.87345, 52.36761],
                                    [4.8736, 52.36766],
                                    [4.87383, 52.36772],
                                    [4.87479, 52.36797],
                                    [4.87591, 52.36827],
                                    [4.87618, 52.36834],
                                    [4.8763, 52.36837],
                                    [4.87639, 52.36832],
                                    [4.87649, 52.36823],
                                    [4.87673, 52.36794],
                                    [4.87682, 52.36776],
                                    [4.87685, 52.36766],
                                    [4.87687, 52.36747],
                                    [4.87687, 52.36726],
                                    [4.87688, 52.36719],
                                    [4.87703, 52.36682],
                                    [4.87705, 52.36679],
                                    [4.87724, 52.36654],
                                    [4.87726, 52.36652],
                                    [4.8774, 52.3664],
                                    [4.87766, 52.36621],
                                    [4.87786, 52.36609],
                                    [4.87793, 52.36605],
                                    [4.878, 52.36601],
                                    [4.87803, 52.36599],
                                    [4.87828, 52.36581],
                                    [4.87845, 52.36565],
                                    [4.87857, 52.36548],
                                    [4.87864, 52.36532],
                                    [4.87869, 52.36505],
                                    [4.87868, 52.36495],
                                    [4.87859, 52.36469],
                                    [4.87856, 52.36459],
                                    [4.87852, 52.3645],
                                    [4.87851, 52.36442],
                                    [4.87851, 52.36439],
                                    [4.87852, 52.36434],
                                    [4.87855, 52.36422],
                                    [4.87861, 52.36407],
                                    [4.87865, 52.36396],
                                    [4.87868, 52.36391],
                                    [4.87872, 52.36381],
                                    [4.87876, 52.36376],
                                    [4.87881, 52.36369],
                                    [4.87882, 52.36368],
                                    [4.87883, 52.36367],
                                    [4.87889, 52.36362],
                                    [4.87913, 52.36349],
                                    [4.87948, 52.36327],
                                    [4.8799, 52.36296],
                                    [4.87994, 52.36293],
                                    [4.88001, 52.36288],
                                    [4.88017, 52.36277],
                                    [4.88023, 52.36274],
                                    [4.88033, 52.36266],
                                    [4.88038, 52.36263],
                                    [4.88065, 52.36236],
                                    [4.88099, 52.36211],
                                    [4.88104, 52.36206],
                                    [4.88114, 52.362],
                                    [4.88135, 52.3619],
                                    [4.88165, 52.36178],
                                    [4.88173, 52.36176],
                                    [4.88181, 52.36174],
                                    [4.88191, 52.36171],
                                    [4.88213, 52.36167],
                                    [4.88231, 52.36166],
                                    [4.88241, 52.36166],
                                    [4.88247, 52.36166],
                                    [4.88319, 52.36166],
                                    [4.88348, 52.36164],
                                    [4.88366, 52.36162],
                                    [4.88383, 52.36158],
                                    [4.884, 52.36151],
                                    [4.88447, 52.36128],
                                    [4.88503, 52.36102],
                                    [4.88539, 52.36084],
                                    [4.88582, 52.36063],
                                    [4.88595, 52.36056],
                                    [4.88598, 52.36054],
                                    [4.88601, 52.36053],
                                    [4.88613, 52.36046],
                                    [4.88647, 52.36029],
                                    [4.88673, 52.36015],
                                    [4.88678, 52.36012],
                                    [4.88693, 52.36009],
                                    [4.88696, 52.36008],
                                    [4.887, 52.36006],
                                    [4.88719, 52.35996],
                                    [4.88724, 52.35993],
                                    [4.88744, 52.35982],
                                    [4.88756, 52.35972],
                                    [4.88774, 52.35958],
                                    [4.88796, 52.35936],
                                    [4.88813, 52.3592],
                                    [4.88839, 52.35896],
                                    [4.88854, 52.35885],
                                    [4.88903, 52.35856],
                                    [4.88943, 52.35838],
                                    [4.88964, 52.35833],
                                    [4.88981, 52.35828],
                                    [4.89017, 52.35819],
                                    [4.89026, 52.35817],
                                    [4.89038, 52.3581],
                                    [4.89059, 52.35807],
                                    [4.89074, 52.35804],
                                    [4.89084, 52.35803],
                                    [4.89094, 52.35803],
                                    [4.89106, 52.35802],
                                    [4.89126, 52.35801],
                                    [4.8914, 52.35802],
                                    [4.89185, 52.35799],
                                    [4.89205, 52.35798],
                                    [4.89284, 52.35791],
                                    [4.89724, 52.35767],
                                    [4.89778, 52.35764],
                                    [4.89784, 52.35762],
                                    [4.89831, 52.35759],
                                    [4.89837, 52.35759],
                                    [4.89841, 52.3576],
                                    [4.89854, 52.35762],
                                    [4.89889, 52.35769],
                                    [4.89911, 52.35774],
                                    [4.8993, 52.35778],
                                    [4.89957, 52.35784],
                                    [4.8999, 52.35791],
                                    [4.90022, 52.35798],
                                    [4.90032, 52.35802],
                                    [4.90179, 52.35832],
                                    [4.90188, 52.35834],
                                    [4.90199, 52.35836],
                                    [4.90218, 52.3584],
                                    [4.90268, 52.35851],
                                    [4.90336, 52.35866],
                                    [4.90353, 52.3587],
                                    [4.90368, 52.35871],
                                    [4.90379, 52.35871],
                                    [4.90403, 52.35874],
                                    [4.90404, 52.35874],
                                    [4.90422, 52.35878],
                                    [4.90432, 52.3588],
                                    [4.90557, 52.35901],
                                    [4.90561, 52.35902],
                                    [4.90568, 52.35903],
                                    [4.90593, 52.35907],
                                    [4.90608, 52.3591],
                                    [4.90622, 52.35912],
                                    [4.90629, 52.35914],
                                    [4.90681, 52.35936],
                                    [4.90813, 52.35999],
                                    [4.90829, 52.36005],
                                    [4.90832, 52.36006],
                                    [4.90839, 52.36008],
                                    [4.90852, 52.36011],
                                    [4.90869, 52.36016],
                                    [4.90884, 52.36019],
                                    [4.9089, 52.3602],
                                    [4.90895, 52.36021],
                                    [4.90927, 52.36023],
                                    [4.90944, 52.36024],
                                    [4.91011, 52.36023],
                                    [4.91035, 52.36025],
                                    [4.91049, 52.36028],
                                    [4.91065, 52.36032],
                                    [4.91082, 52.36039],
                                    [4.91107, 52.36051],
                                    [4.91147, 52.36071],
                                    [4.91172, 52.36084],
                                    [4.91175, 52.36085],
                                    [4.91198, 52.36096],
                                    [4.91213, 52.361],
                                    [4.91236, 52.36103],
                                    [4.9136, 52.36113],
                                    [4.91404, 52.36119],
                                    [4.91443, 52.36127],
                                    [4.91483, 52.36137],
                                    [4.915, 52.36142],
                                    [4.91516, 52.36146],
                                    [4.91522, 52.36148],
                                    [4.91551, 52.36156],
                                    [4.91605, 52.36171],
                                    [4.91649, 52.36179],
                                    [4.91716, 52.36183],
                                    [4.91795, 52.36187],
                                    [4.91828, 52.36191],
                                    [4.91851, 52.36196],
                                    [4.91883, 52.36205],
                                    [4.9191, 52.36218],
                                    [4.9196, 52.36251],
                                    [4.91976, 52.36264],
                                    [4.92006, 52.36282],
                                    [4.92027, 52.36291],
                                    [4.92035, 52.36292],
                                    [4.92046, 52.36294],
                                    [4.92077, 52.36297],
                                    [4.92181, 52.36304],
                                    [4.92188, 52.36304],
                                    [4.92233, 52.36306],
                                    [4.92251, 52.36307],
                                    [4.92301, 52.36308],
                                    [4.92311, 52.3631],
                                    [4.92313, 52.3631],
                                    [4.92325, 52.36314],
                                    [4.92333, 52.3632],
                                    [4.92337, 52.36326],
                                    [4.92342, 52.36337],
                                    [4.92331, 52.36357],
                                    [4.92326, 52.36367],
                                    [4.92325, 52.36371],
                                    [4.92323, 52.36377],
                                    [4.92325, 52.36385],
                                    [4.92329, 52.3639],
                                    [4.92346, 52.364],
                                    [4.9242, 52.36447],
                                    [4.92427, 52.36451],
                                    [4.92513, 52.36499],
                                    [4.92572, 52.36528],
                                    [4.92591, 52.36537],
                                    [4.92647, 52.36566],
                                    [4.92671, 52.36575],
                                    [4.92687, 52.3658],
                                    [4.92704, 52.36583],
                                    [4.92711, 52.36584],
                                    [4.92722, 52.36585],
                                    [4.92876, 52.36591],
                                    [4.92895, 52.36593],
                                    [4.93006, 52.36596],
                                    [4.93032, 52.36595],
                                    [4.93114, 52.36598],
                                    [4.93125, 52.36599],
                                    [4.93173, 52.366],
                                    [4.93185, 52.36601],
                                    [4.93196, 52.36601],
                                    [4.93216, 52.36601],
                                    [4.93268, 52.36603],
                                    [4.93285, 52.36604],
                                    [4.93301, 52.36604],
                                    [4.93311, 52.36605],
                                    [4.93349, 52.36606],
                                    [4.93353, 52.36607],
                                    [4.9336, 52.36608],
                                    [4.93366, 52.36609],
                                    [4.93376, 52.36614],
                                    [4.93382, 52.36618],
                                    [4.93388, 52.36625],
                                    [4.9339, 52.36631],
                                    [4.9339, 52.36635],
                                    [4.93389, 52.36681],
                                    [4.93389, 52.36686],
                                    [4.93388, 52.3671],
                                    [4.93387, 52.36737],
                                    [4.93387, 52.36739],
                                    [4.93386, 52.3675],
                                    [4.93386, 52.36759],
                                    [4.93385, 52.36786],
                                    [4.93382, 52.36838],
                                    [4.93382, 52.36844],
                                    [4.93382, 52.36855],
                                    [4.93382, 52.36863],
                                    [4.93386, 52.36903],
                                    [4.93418, 52.36981],
                                    [4.93423, 52.37004],
                                    [4.93423, 52.37033],
                                    [4.93423, 52.37097],
                                    [4.93424, 52.3711],
                                    [4.93424, 52.37124],
                                    [4.93423, 52.37133],
                                    [4.93421, 52.37154],
                                    [4.93415, 52.37173],
                                    [4.93401, 52.37207],
                                    [4.93395, 52.37219],
                                    [4.93385, 52.37235],
                                    [4.93376, 52.37248],
                                    [4.93368, 52.37257],
                                    [4.93359, 52.37268],
                                    [4.93347, 52.37281],
                                    [4.93326, 52.37304],
                                    [4.93312, 52.37316],
                                    [4.93283, 52.3734],
                                    [4.93259, 52.37357],
                                    [4.93239, 52.37369],
                                    [4.93212, 52.37384],
                                    [4.93102, 52.37433],
                                    [4.93001, 52.37473],
                                    [4.92966, 52.37487],
                                    [4.92906, 52.37507],
                                    [4.92897, 52.3751],
                                    [4.92873, 52.37516],
                                    [4.9278, 52.37535],
                                    [4.92666, 52.37555],
                                    [4.92475, 52.37586],
                                    [4.92314, 52.3761],
                                    [4.92206, 52.37626],
                                    [4.92198, 52.37628],
                                    [4.92188, 52.37629],
                                    [4.92178, 52.37631],
                                    [4.92163, 52.37633],
                                    [4.9215, 52.37635],
                                    [4.92142, 52.37636],
                                    [4.92039, 52.3765],
                                    [4.91884, 52.37671],
                                    [4.91844, 52.37677],
                                    [4.91631, 52.37705],
                                    [4.91455, 52.37725],
                                    [4.91306, 52.37738],
                                    [4.91286, 52.37739],
                                    [4.9119, 52.37745],
                                    [4.91169, 52.37747],
                                    [4.91149, 52.37748],
                                    [4.91026, 52.37758],
                                    [4.91002, 52.37761],
                                    [4.90984, 52.37763],
                                    [4.90874, 52.37778],
                                    [4.90765, 52.37792],
                                    [4.90746, 52.37796],
                                    [4.90714, 52.378],
                                    [4.90647, 52.37809],
                                    [4.90632, 52.37812],
                                    [4.90593, 52.37817],
                                    [4.90537, 52.37825],
                                    [4.90521, 52.37828],
                                    [4.90504, 52.37832],
                                    [4.90497, 52.37834],
                                    [4.90489, 52.37836],
                                    [4.90453, 52.37847],
                                    [4.9045, 52.37848],
                                    [4.90433, 52.37858],
                                    [4.90428, 52.3786],
                                    [4.90286, 52.37911],
                                    [4.90283, 52.37912],
                                    [4.90276, 52.37912],
                                    [4.90272, 52.37911],
                                    [4.90269, 52.3791],
                                    [4.90265, 52.37908],
                                    [4.90262, 52.37907],
                                    [4.9026, 52.37906],
                                    [4.90213, 52.37922],
                                    [4.90207, 52.37915],
                                    [4.90206, 52.37914],
                                    [4.90127, 52.37943],
                                ],
                            },
                        },
                    ],
                    sections: {
                        tunnel: [
                            {
                                startPathIndex: 263,
                                endPathIndex: 270,
                            },
                        ],
                        urban: [
                            {
                                startPathIndex: 9,
                                endPathIndex: 403,
                            },
                            {
                                startPathIndex: 410,
                                endPathIndex: 414,
                            },
                            {
                                startPathIndex: 418,
                                endPathIndex: 452,
                            },
                        ],
                        travelMode: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 448,
                                travelMode: 'car',
                            },
                            {
                                startPathIndex: 448,
                                endPathIndex: 452,
                                travelMode: 'other',
                            },
                        ],
                        country: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 452,
                                countryCodeIso2: 'NL',
                            },
                        ],
                        pedestrian: [
                            {
                                startPathIndex: 448,
                                endPathIndex: 452,
                            },
                        ],
                        traffic: [
                            {
                                startPathIndex: 15,
                                endPathIndex: 18,
                                effectiveSpeedInKilometersPerHour: 36,
                                delayDurationInSeconds: 0,
                                delayMagnitude: 'undefined',
                                tec: { causes: [{ mainCauseCode: 3 }], effectCode: 1 },
                            },
                            {
                                startPathIndex: 74,
                                endPathIndex: 77,
                                effectiveSpeedInKilometersPerHour: 4,
                                delayDurationInSeconds: 8,
                                delayMagnitude: 'major',
                                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                            },
                        ],
                    },
                    instructions: [
                        {
                            drivingSide: 'right',
                            maneuver: 'depart',
                            maneuverPoint: { latitude: 52.38686, longitude: 4.87489 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 0,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 0,
                                    point: { latitude: 52.38686, longitude: 4.87489 },
                                    travelTimeFromRouteStartInSeconds: 0,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38654, longitude: 4.8749 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 35,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 35,
                                    point: { latitude: 52.38654, longitude: 4.8749 },
                                    travelTimeFromRouteStartInSeconds: 11,
                                },
                                {
                                    distanceFromRouteStartInMeters: 45,
                                    point: { latitude: 52.38654, longitude: 4.87476 },
                                    travelTimeFromRouteStartInSeconds: 15,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38653, longitude: 4.8746 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 56,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 56,
                                    point: { latitude: 52.38653, longitude: 4.8746 },
                                    travelTimeFromRouteStartInSeconds: 18,
                                },
                                {
                                    distanceFromRouteStartInMeters: 66,
                                    point: { latitude: 52.38644, longitude: 4.8746 },
                                    travelTimeFromRouteStartInSeconds: 22,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38602, longitude: 4.87461 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 114,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 114,
                                    point: { latitude: 52.38602, longitude: 4.87461 },
                                    travelTimeFromRouteStartInSeconds: 37,
                                },
                                {
                                    distanceFromRouteStartInMeters: 124,
                                    point: { latitude: 52.38602, longitude: 4.87476 },
                                    travelTimeFromRouteStartInSeconds: 41,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 25,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 25,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 96,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38602, longitude: 4.87485 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 130,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 130,
                                    point: { latitude: 52.38602, longitude: 4.87485 },
                                    travelTimeFromRouteStartInSeconds: 43,
                                },
                                {
                                    distanceFromRouteStartInMeters: 133,
                                    point: { latitude: 52.38598, longitude: 4.87485 },
                                    travelTimeFromRouteStartInSeconds: 46,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 113,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.38546, longitude: 4.87492 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's103',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 193,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 193,
                                    point: { latitude: 52.38546, longitude: 4.87492 },
                                    travelTimeFromRouteStartInSeconds: 105,
                                },
                                {
                                    distanceFromRouteStartInMeters: 203,
                                    point: { latitude: 52.38546, longitude: 4.87477 },
                                    travelTimeFromRouteStartInSeconds: 106,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -68,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.38533, longitude: 4.86953 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'v\u0251n \u02c8h\u0251l.strat' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Van Hallstraat',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's103',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 561,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 561,
                                    point: { latitude: 52.38533, longitude: 4.86953 },
                                    travelTimeFromRouteStartInSeconds: 157,
                                },
                                {
                                    distanceFromRouteStartInMeters: 571,
                                    point: { latitude: 52.38525, longitude: 4.86951 },
                                    travelTimeFromRouteStartInSeconds: 159,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 79,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: true,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.37902, longitude: 4.87513 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.pl\u0251nt.sun',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikplantsoen',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8k\u0254st.f\u0259r.lo.r\u0259n.\u02ccstrat' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Kostverlorenstraat',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1494,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1494,
                                    point: { latitude: 52.37902, longitude: 4.87513 },
                                    travelTimeFromRouteStartInSeconds: 283,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1504,
                                    point: { latitude: 52.37895, longitude: 4.87521 },
                                    travelTimeFromRouteStartInSeconds: 284,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 781,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 719,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 665,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 609,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 495,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 430,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 297,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 247,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 138,
                                    side: 'LEFT_AND_RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 68,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.37877, longitude: 4.87542 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.pl\u0251nt.sun',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikplantsoen',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.pl\u0251nt.sun',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikplantsoen',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1529,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1529,
                                    point: { latitude: 52.37877, longitude: 4.87542 },
                                    travelTimeFromRouteStartInSeconds: 287,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1533,
                                    point: { latitude: 52.37874, longitude: 4.8754 },
                                    travelTimeFromRouteStartInSeconds: 288,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 3,
                            drivingSide: 'right',
                            maneuver: 'roundaboutStraight',
                            maneuverPoint: { latitude: 52.37456, longitude: 4.87254 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.strat',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikstraat',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.strat',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikstraat',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 2,
                            routeOffsetInMeters: 2005,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 2005,
                                    point: { latitude: 52.37482, longitude: 4.87275 },
                                    travelTimeFromRouteStartInSeconds: 359,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2010,
                                    point: { latitude: 52.37482, longitude: 4.87268 },
                                    travelTimeFromRouteStartInSeconds: 361,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2015,
                                    point: { latitude: 52.3748, longitude: 4.87261 },
                                    travelTimeFromRouteStartInSeconds: 363,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2020,
                                    point: { latitude: 52.37477, longitude: 4.87255 },
                                    travelTimeFromRouteStartInSeconds: 365,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2024,
                                    point: { latitude: 52.37473, longitude: 4.87252 },
                                    travelTimeFromRouteStartInSeconds: 366,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2029,
                                    point: { latitude: 52.3747, longitude: 4.8725 },
                                    travelTimeFromRouteStartInSeconds: 368,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2033,
                                    point: { latitude: 52.37466, longitude: 4.87249 },
                                    travelTimeFromRouteStartInSeconds: 369,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2037,
                                    point: { latitude: 52.37463, longitude: 4.8725 },
                                    travelTimeFromRouteStartInSeconds: 371,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2040,
                                    point: { latitude: 52.37459, longitude: 4.87251 },
                                    travelTimeFromRouteStartInSeconds: 374,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2044,
                                    point: { latitude: 52.37456, longitude: 4.87254 },
                                    travelTimeFromRouteStartInSeconds: 377,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 356,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 163,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.36717, longitude: 4.87213 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8k\u026a\u014b.k\u0259r.\u02ccstrat' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Kinkerstraat',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8b\u026al.d\u0259r.d\u025b\u2040ik.\u02ccstrat' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Bilderdijkstraat',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 2918,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 2918,
                                    point: { latitude: 52.36717, longitude: 4.87213 },
                                    travelTimeFromRouteStartInSeconds: 530,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2924,
                                    point: { latitude: 52.36722, longitude: 4.87218 },
                                    travelTimeFromRouteStartInSeconds: 531,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2930,
                                    point: { latitude: 52.36726, longitude: 4.87224 },
                                    travelTimeFromRouteStartInSeconds: 533,
                                },
                                {
                                    distanceFromRouteStartInMeters: 2936,
                                    point: { latitude: 52.36728, longitude: 4.87231 },
                                    travelTimeFromRouteStartInSeconds: 533,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 660,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 622,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 443,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 368,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 212,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 74,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.36837, longitude: 4.8763 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8n\u0251.s\u0251\u2040u.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Nassaukade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8k\u026a\u014b.k\u0259r.\u02ccstrat' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Kinkerstraat',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 3233,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 3233,
                                    point: { latitude: 52.36837, longitude: 4.8763 },
                                    travelTimeFromRouteStartInSeconds: 601,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3241,
                                    point: { latitude: 52.36832, longitude: 4.87639 },
                                    travelTimeFromRouteStartInSeconds: 602,
                                },
                                {
                                    distanceFromRouteStartInMeters: 3243,
                                    point: { latitude: 52.36831, longitude: 4.87641 },
                                    travelTimeFromRouteStartInSeconds: 602,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 228,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 183,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 112,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -45,
                            drivingSide: 'right',
                            maneuver: 'roundaboutSlightLeft',
                            maneuverPoint: { latitude: 52.36357, longitude: 4.92331 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 2,
                            routeOffsetInMeters: 7191,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 7191,
                                    point: { latitude: 52.36307, longitude: 4.92251 },
                                    travelTimeFromRouteStartInSeconds: 1260,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7225,
                                    point: { latitude: 52.36308, longitude: 4.92301 },
                                    travelTimeFromRouteStartInSeconds: 1265,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7233,
                                    point: { latitude: 52.3631, longitude: 4.92311 },
                                    travelTimeFromRouteStartInSeconds: 1266,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7234,
                                    point: { latitude: 52.3631, longitude: 4.92313 },
                                    travelTimeFromRouteStartInSeconds: 1266,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7243,
                                    point: { latitude: 52.36314, longitude: 4.92325 },
                                    travelTimeFromRouteStartInSeconds: 1267,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7251,
                                    point: { latitude: 52.3632, longitude: 4.92333 },
                                    travelTimeFromRouteStartInSeconds: 1268,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7258,
                                    point: { latitude: 52.36326, longitude: 4.92337 },
                                    travelTimeFromRouteStartInSeconds: 1269,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7272,
                                    point: { latitude: 52.36337, longitude: 4.92342 },
                                    travelTimeFromRouteStartInSeconds: 1270,
                                },
                                {
                                    distanceFromRouteStartInMeters: 7295,
                                    point: { latitude: 52.36357, longitude: 4.92331 },
                                    travelTimeFromRouteStartInSeconds: 1274,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 548,
                                    side: 'LEFT_AND_RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 355,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 199,
                                    side: 'LEFT',
                                },
                                {
                                    offsetFromManeuverInMeters: 171,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 148,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            drivingSide: 'right',
                            maneuver: 'exitRoundabout',
                            maneuverPoint: { latitude: 52.36357, longitude: 4.92331 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 69,
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 7295,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 7295,
                                    point: { latitude: 52.36357, longitude: 4.92331 },
                                    travelTimeFromRouteStartInSeconds: 1274,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 17,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnSlightRight',
                            maneuverPoint: { latitude: 52.37848, longitude: 4.9045 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's100',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 11005,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 11005,
                                    point: { latitude: 52.37848, longitude: 4.9045 },
                                    travelTimeFromRouteStartInSeconds: 1774,
                                },
                                {
                                    distanceFromRouteStartInMeters: 11015,
                                    point: { latitude: 52.37854, longitude: 4.90439 },
                                    travelTimeFromRouteStartInSeconds: 1777,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 971,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 822,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 57,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.37906, longitude: 4.9026 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 11157,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 11157,
                                    point: { latitude: 52.37906, longitude: 4.9026 },
                                    travelTimeFromRouteStartInSeconds: 1823,
                                },
                                {
                                    distanceFromRouteStartInMeters: 11167,
                                    point: { latitude: 52.3791, longitude: 4.90247 },
                                    travelTimeFromRouteStartInSeconds: 1830,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.37922, longitude: 4.90213 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 11193,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 11193,
                                    point: { latitude: 52.37922, longitude: 4.90213 },
                                    travelTimeFromRouteStartInSeconds: 1849,
                                },
                                {
                                    distanceFromRouteStartInMeters: 11202,
                                    point: { latitude: 52.37915, longitude: 4.90207 },
                                    travelTimeFromRouteStartInSeconds: 1855,
                                },
                                {
                                    distanceFromRouteStartInMeters: 11202,
                                    point: { latitude: 52.37914, longitude: 4.90206 },
                                    travelTimeFromRouteStartInSeconds: 1856,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            maneuver: 'arriveLeft',
                            maneuverPoint: { latitude: 52.37943, longitude: 4.90127 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: 'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: 'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 11265,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 11265,
                                    point: { latitude: 52.37943, longitude: 4.90127 },
                                    travelTimeFromRouteStartInSeconds: 1901,
                                },
                            ],
                            sideRoads: [],
                        },
                    ],
                },
            ],
            roadShieldAtlasReference: 'https://api.tomtom.com/map/1/roadshield/1.0.0/',
        } as CalculateRouteResponseAPI,
        {} as CalculateRouteParams,
        {
            type: 'FeatureCollection',
            bbox: [4.86951, 52.35759, 4.93424, 52.38686],
            features: [
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [4.87489, 52.38686],
                            [4.8749, 52.38659],
                            [4.8749, 52.38654],
                            [4.8746, 52.38653],
                            [4.87461, 52.38625],
                            [4.87461, 52.38602],
                            [4.87485, 52.38602],
                            [4.87485, 52.38598],
                            [4.87486, 52.38577],
                            [4.87484, 52.38568],
                            [4.87484, 52.38558],
                            [4.87487, 52.38553],
                            [4.87488, 52.38551],
                            [4.87492, 52.38546],
                            [4.87671, 52.38549],
                            [4.87793, 52.38551],
                            [4.87902, 52.38553],
                            [4.87919, 52.3855],
                            [4.87966, 52.38541],
                            [4.88027, 52.38527],
                            [4.8806, 52.38519],
                            [4.88099, 52.3851],
                            [4.88107, 52.38508],
                            [4.88135, 52.38502],
                            [4.88156, 52.385],
                            [4.88174, 52.38497],
                            [4.88197, 52.38493],
                            [4.88205, 52.38492],
                            [4.88221, 52.38488],
                            [4.88234, 52.38484],
                            [4.88244, 52.38482],
                            [4.88286, 52.38472],
                            [4.88302, 52.38469],
                            [4.88309, 52.38467],
                            [4.88321, 52.38465],
                            [4.88324, 52.38465],
                            [4.8833, 52.38465],
                            [4.88333, 52.38466],
                            [4.88337, 52.38466],
                            [4.88343, 52.3847],
                            [4.88347, 52.38474],
                            [4.88359, 52.38488],
                            [4.88372, 52.38504],
                            [4.88384, 52.38519],
                            [4.88393, 52.38523],
                            [4.88397, 52.38524],
                            [4.88407, 52.38525],
                            [4.88416, 52.38523],
                            [4.88424, 52.38521],
                            [4.88433, 52.38518],
                            [4.88451, 52.38509],
                            [4.88495, 52.38485],
                            [4.88511, 52.38476],
                            [4.88548, 52.38458],
                            [4.88723, 52.3836],
                            [4.88738, 52.38351],
                            [4.88762, 52.38334],
                            [4.88795, 52.38312],
                            [4.88824, 52.38297],
                            [4.88859, 52.38283],
                            [4.88865, 52.38281],
                            [4.88922, 52.38256],
                            [4.8898, 52.38231],
                            [4.8902, 52.38211],
                            [4.89028, 52.38207],
                            [4.89037, 52.38203],
                            [4.89134, 52.38154],
                            [4.89173, 52.38139],
                            [4.89376, 52.38076],
                            [4.89382, 52.38074],
                            [4.89442, 52.38048],
                            [4.89447, 52.38045],
                            [4.89449, 52.38043],
                            [4.89454, 52.38036],
                            [4.89455, 52.38033],
                            [4.89454, 52.38012],
                            [4.89454, 52.37993],
                            [4.89458, 52.37985],
                            [4.89464, 52.37981],
                            [4.89471, 52.37978],
                            [4.8948, 52.37977],
                            [4.89487, 52.37977],
                            [4.89496, 52.3798],
                            [4.89505, 52.37987],
                            [4.89527, 52.38004],
                            [4.89542, 52.38019],
                            [4.89549, 52.38027],
                            [4.89561, 52.38038],
                            [4.89576, 52.38052],
                            [4.89606, 52.38081],
                            [4.8961, 52.38086],
                            [4.89617, 52.381],
                            [4.89622, 52.38117],
                            [4.89629, 52.38127],
                            [4.89634, 52.38131],
                            [4.89639, 52.38132],
                            [4.89648, 52.38133],
                            [4.89654, 52.38129],
                            [4.89662, 52.38124],
                            [4.8968, 52.38114],
                            [4.89695, 52.38105],
                            [4.89702, 52.38101],
                            [4.89709, 52.38098],
                            [4.89739, 52.38086],
                            [4.8988, 52.38035],
                            [4.89889, 52.38032],
                            [4.89901, 52.38027],
                            [4.89912, 52.38023],
                            [4.89914, 52.38022],
                            [4.89915, 52.38022],
                            [4.8999, 52.37994],
                            [4.90009, 52.37988],
                            [4.90054, 52.37971],
                            [4.90108, 52.37951],
                            [4.90112, 52.37949],
                            [4.90119, 52.37947],
                            [4.90123, 52.37946],
                            [4.90207, 52.37915],
                            [4.90256, 52.37897],
                            [4.90268, 52.37892],
                            [4.90334, 52.37868],
                            [4.90397, 52.37845],
                            [4.90435, 52.37835],
                            [4.90441, 52.37834],
                            [4.90475, 52.37826],
                            [4.90485, 52.37823],
                            [4.90501, 52.37821],
                            [4.90517, 52.37819],
                            [4.90533, 52.37816],
                            [4.90574, 52.37811],
                            [4.90633, 52.37803],
                            [4.9064, 52.37802],
                            [4.90647, 52.37809],
                            [4.90632, 52.37812],
                            [4.90593, 52.37817],
                            [4.90537, 52.37825],
                            [4.90521, 52.37828],
                            [4.90504, 52.37832],
                            [4.90497, 52.37834],
                            [4.90489, 52.37836],
                            [4.90453, 52.37847],
                            [4.9045, 52.37848],
                            [4.90433, 52.37858],
                            [4.90428, 52.3786],
                            [4.90286, 52.37911],
                            [4.90283, 52.37912],
                            [4.90276, 52.37912],
                            [4.90272, 52.37911],
                            [4.90269, 52.3791],
                            [4.90265, 52.37908],
                            [4.90262, 52.37907],
                            [4.9026, 52.37906],
                            [4.90213, 52.37922],
                            [4.90207, 52.37915],
                            [4.90206, 52.37914],
                            [4.90127, 52.37943],
                        ],
                    },
                    bbox: [4.8746, 52.37802, 4.90647, 52.38686],
                    properties: {
                        summary: {
                            lengthInMeters: 3259,
                            travelTimeInSeconds: 951,
                            trafficDelayInSeconds: 269,
                            trafficLengthInMeters: 474,
                            departureTime: new Date('2023-11-28T17:43:12.000Z'),
                            arrivalTime: new Date('2023-11-28T17:59:03.000Z'),
                            noTrafficTravelTimeInSeconds: 574,
                            historicTrafficTravelTimeInSeconds: 713,
                            liveTrafficIncidentsTravelTimeInSeconds: 951,
                        },
                        sections: {
                            leg: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 155,
                                    summary: {
                                        lengthInMeters: 3259,
                                        travelTimeInSeconds: 951,
                                        trafficDelayInSeconds: 269,
                                        trafficLengthInMeters: 474,
                                        departureTime: new Date('2023-11-28T17:43:12.000Z'),
                                        arrivalTime: new Date('2023-11-28T17:59:03.000Z'),
                                        noTrafficTravelTimeInSeconds: 574,
                                        historicTrafficTravelTimeInSeconds: 713,
                                        liveTrafficIncidentsTravelTimeInSeconds: 951,
                                    },
                                },
                            ],
                            toll: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 10,
                                    endPointIndex: 50,
                                },
                            ],
                            urban: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 9,
                                    endPointIndex: 88,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 91,
                                    endPointIndex: 92,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 103,
                                    endPointIndex: 155,
                                },
                            ],
                            tunnel: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 104,
                                    endPointIndex: 119,
                                },
                            ],
                            country: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 155,
                                    countryCodeISO3: 'NLD',
                                },
                            ],
                            pedestrian: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 151,
                                    endPointIndex: 155,
                                },
                            ],
                            vehicleRestricted: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 151,
                                    endPointIndex: 155,
                                },
                            ],
                            traffic: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 80,
                                    endPointIndex: 94,
                                    delayInSeconds: 210,
                                    effectiveSpeedInKmh: 3,
                                    magnitudeOfDelay: 'major',
                                    categories: ['jam', 'roadworks', 'danger'],
                                    tec: {
                                        causes: [{ mainCauseCode: 1 }, { mainCauseCode: 3 }, { mainCauseCode: 9 }],
                                        effectCode: 6,
                                    },
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 119,
                                    endPointIndex: 131,
                                    delayInSeconds: 59,
                                    effectiveSpeedInKmh: 11,
                                    magnitudeOfDelay: 'minor',
                                    tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                                    categories: ['jam'],
                                },
                            ],
                        },
                        guidance: {
                            instructions: [
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'DEPART',
                                    maneuverPoint: [4.87489, 52.38686],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 0,
                                    routePath: [
                                        {
                                            distanceInMeters: 0,
                                            point: [4.87489, 52.38686],
                                            travelTimeInSeconds: 0,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.8749, 52.38654],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 35,
                                    routePath: [
                                        {
                                            distanceInMeters: 35,
                                            point: [4.8749, 52.38654],
                                            travelTimeInSeconds: 11,
                                        },
                                        {
                                            distanceInMeters: 45,
                                            point: [4.87476, 52.38654],
                                            travelTimeInSeconds: 15,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.8746, 52.38653],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                    routeOffsetInMeters: 56,
                                    routePath: [
                                        {
                                            distanceInMeters: 56,
                                            point: [4.8746, 52.38653],
                                            travelTimeInSeconds: 18,
                                        },
                                        {
                                            distanceInMeters: 66,
                                            point: [4.8746, 52.38644],
                                            travelTimeInSeconds: 22,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.87461, 52.38602],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 114,
                                    routePath: [
                                        {
                                            distanceInMeters: 114,
                                            point: [4.87461, 52.38602],
                                            travelTimeInSeconds: 37,
                                        },
                                        {
                                            distanceInMeters: 124,
                                            point: [4.87476, 52.38602],
                                            travelTimeInSeconds: 41,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 25,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 25,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 96,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.87485, 52.38602],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 130,
                                    routePath: [
                                        {
                                            distanceInMeters: 130,
                                            point: [4.87485, 52.38602],
                                            travelTimeInSeconds: 43,
                                        },
                                        {
                                            distanceInMeters: 133,
                                            point: [4.87485, 52.38598],
                                            travelTimeInSeconds: 46,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -67,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.87492, 52.38546],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's103',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 193,
                                    routePath: [
                                        {
                                            distanceInMeters: 193,
                                            point: [4.87492, 52.38546],
                                            travelTimeInSeconds: 105,
                                        },
                                        {
                                            distanceInMeters: 203,
                                            point: [4.87507, 52.38546],
                                            travelTimeInSeconds: 106,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 34,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.88384, 52.38519],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                    routeOffsetInMeters: 852,
                                    routePath: [
                                        {
                                            distanceInMeters: 852,
                                            point: [4.88384, 52.38519],
                                            travelTimeInSeconds: 247,
                                        },
                                        {
                                            distanceInMeters: 860,
                                            point: [4.88393, 52.38523],
                                            travelTimeInSeconds: 248,
                                        },
                                        {
                                            distanceInMeters: 862,
                                            point: [4.88396, 52.38523],
                                            travelTimeInSeconds: 248,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 210,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 196,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 133,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -147,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'SHARP_LEFT',
                                    maneuverPoint: [4.8948, 52.37977],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8dro\u0263.\u02ccb\u0251k',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Droogbak',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8ni.w\u0259 \u02c8\u028b\u025bs.t\u0259r.d\u0254k.strat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Nieuwe Westerdokstraat',
                                        },
                                    },
                                    routeOffsetInMeters: 1822,
                                    routePath: [
                                        {
                                            distanceInMeters: 1822,
                                            point: [4.89454, 52.37993],
                                            travelTimeInSeconds: 395,
                                        },
                                        {
                                            distanceInMeters: 1831,
                                            point: [4.89458, 52.37985],
                                            travelTimeInSeconds: 398,
                                        },
                                        {
                                            distanceInMeters: 1837,
                                            point: [4.89464, 52.37981],
                                            travelTimeInSeconds: 399,
                                        },
                                        {
                                            distanceInMeters: 1843,
                                            point: [4.89471, 52.37978],
                                            travelTimeInSeconds: 400,
                                        },
                                        {
                                            distanceInMeters: 1849,
                                            point: [4.8948, 52.37977],
                                            travelTimeInSeconds: 401,
                                        },
                                        {
                                            distanceInMeters: 1854,
                                            point: [4.89487, 52.37977],
                                            travelTimeInSeconds: 402,
                                        },
                                        {
                                            distanceInMeters: 1861,
                                            point: [4.89496, 52.3798],
                                            travelTimeInSeconds: 410,
                                        },
                                        {
                                            distanceInMeters: 1871,
                                            point: [4.89505, 52.37987],
                                            travelTimeInSeconds: 422,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 876,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 569,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 272,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 118,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 130,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.89648, 52.38133],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8dro\u0263.\u02ccb\u0251k',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Droogbak',
                                        },
                                    },
                                    routeOffsetInMeters: 2038,
                                    routePath: [
                                        {
                                            distanceInMeters: 2038,
                                            point: [4.89622, 52.38117],
                                            travelTimeInSeconds: 623,
                                        },
                                        {
                                            distanceInMeters: 2050,
                                            point: [4.89629, 52.38127],
                                            travelTimeInSeconds: 637,
                                        },
                                        {
                                            distanceInMeters: 2056,
                                            point: [4.89634, 52.38131],
                                            travelTimeInSeconds: 641,
                                        },
                                        {
                                            distanceInMeters: 2060,
                                            point: [4.89639, 52.38132],
                                            travelTimeInSeconds: 642,
                                        },
                                        {
                                            distanceInMeters: 2066,
                                            point: [4.89648, 52.38133],
                                            travelTimeInSeconds: 643,
                                        },
                                        {
                                            distanceInMeters: 2072,
                                            point: [4.89654, 52.38129],
                                            travelTimeInSeconds: 644,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -180,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'MAKE_UTURN',
                                    maneuverPoint: [4.90647, 52.37809],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 2842,
                                    routePath: [
                                        {
                                            distanceInMeters: 2842,
                                            point: [4.9064, 52.37802],
                                            travelTimeInSeconds: 769,
                                        },
                                        {
                                            distanceInMeters: 2851,
                                            point: [4.90647, 52.37809],
                                            travelTimeInSeconds: 772,
                                        },
                                        {
                                            distanceInMeters: 2862,
                                            point: [4.90632, 52.37812],
                                            travelTimeInSeconds: 774,
                                        },
                                        {
                                            distanceInMeters: 2872,
                                            point: [4.90617, 52.37814],
                                            travelTimeInSeconds: 781,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 725,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 719,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 108,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 17,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'SLIGHT_RIGHT',
                                    maneuverPoint: [4.9045, 52.37848],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 2993,
                                    routePath: [
                                        {
                                            distanceInMeters: 2993,
                                            point: [4.9045, 52.37848],
                                            travelTimeInSeconds: 823,
                                        },
                                        {
                                            distanceInMeters: 3003,
                                            point: [4.90439, 52.37854],
                                            travelTimeInSeconds: 825,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 57,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.9026, 52.37906],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 3145,
                                    routePath: [
                                        {
                                            distanceInMeters: 3145,
                                            point: [4.9026, 52.37906],
                                            travelTimeInSeconds: 872,
                                        },
                                        {
                                            distanceInMeters: 3155,
                                            point: [4.90247, 52.3791],
                                            travelTimeInSeconds: 877,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.90213, 52.37922],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 3182,
                                    routePath: [
                                        {
                                            distanceInMeters: 3182,
                                            point: [4.90213, 52.37922],
                                            travelTimeInSeconds: 896,
                                        },
                                        {
                                            distanceInMeters: 3191,
                                            point: [4.90207, 52.37915],
                                            travelTimeInSeconds: 902,
                                        },
                                        {
                                            distanceInMeters: 3191,
                                            point: [4.90206, 52.37914],
                                            travelTimeInSeconds: 903,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ARRIVE_LEFT',
                                    maneuverPoint: [4.90127, 52.37943],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                    routeOffsetInMeters: 3254,
                                    routePath: [
                                        {
                                            distanceInMeters: 3254,
                                            point: [4.90127, 52.37943],
                                            travelTimeInSeconds: 948,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                            ],
                        },
                        progress: [
                            {
                                pointIndex: 0,
                                travelTimeInSeconds: 0,
                                distanceInMeters: 0,
                            },
                            {
                                pointIndex: 7,
                                travelTimeInSeconds: 54,
                                distanceInMeters: 178,
                            },
                            {
                                pointIndex: 15,
                                travelTimeInSeconds: 115,
                                distanceInMeters: 485,
                            },
                            {
                                pointIndex: 30,
                                travelTimeInSeconds: 178,
                                distanceInMeters: 1004,
                            },
                        ],
                        index: 0,
                    },
                },
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [4.87489, 52.38686],
                            [4.8749, 52.38659],
                            [4.8749, 52.38654],
                            [4.8746, 52.38653],
                            [4.87461, 52.38625],
                            [4.87461, 52.38602],
                            [4.87485, 52.38602],
                            [4.87485, 52.38598],
                            [4.87486, 52.38577],
                            [4.87484, 52.38568],
                            [4.87484, 52.38558],
                            [4.87487, 52.38553],
                            [4.87488, 52.38551],
                            [4.87492, 52.38546],
                            [4.87671, 52.38549],
                            [4.87793, 52.38551],
                            [4.87902, 52.38553],
                            [4.87919, 52.3855],
                            [4.87966, 52.38541],
                            [4.88027, 52.38527],
                            [4.8806, 52.38519],
                            [4.88099, 52.3851],
                            [4.88107, 52.38508],
                            [4.88135, 52.38502],
                            [4.88156, 52.385],
                            [4.88174, 52.38497],
                            [4.88197, 52.38493],
                            [4.88205, 52.38492],
                            [4.88221, 52.38488],
                            [4.88234, 52.38484],
                            [4.88244, 52.38482],
                            [4.88286, 52.38472],
                            [4.88302, 52.38469],
                            [4.88309, 52.38467],
                            [4.88321, 52.38465],
                            [4.88324, 52.38465],
                            [4.8833, 52.38465],
                            [4.88333, 52.38466],
                            [4.88337, 52.38466],
                            [4.88343, 52.3847],
                            [4.88347, 52.38474],
                            [4.88359, 52.38488],
                            [4.88372, 52.38504],
                            [4.88384, 52.38519],
                            [4.88393, 52.38523],
                            [4.88397, 52.38524],
                            [4.88407, 52.38525],
                            [4.88416, 52.38523],
                            [4.88424, 52.38521],
                            [4.88433, 52.38518],
                            [4.88451, 52.38509],
                            [4.88495, 52.38485],
                            [4.88511, 52.38476],
                            [4.88548, 52.38458],
                            [4.88723, 52.3836],
                            [4.88738, 52.38351],
                            [4.88762, 52.38334],
                            [4.88795, 52.38312],
                            [4.88824, 52.38297],
                            [4.88859, 52.38283],
                            [4.88865, 52.38281],
                            [4.88922, 52.38256],
                            [4.8898, 52.38231],
                            [4.8902, 52.38211],
                            [4.89028, 52.38207],
                            [4.89037, 52.38203],
                            [4.89134, 52.38154],
                            [4.89173, 52.38139],
                            [4.89169, 52.38134],
                            [4.89164, 52.38126],
                            [4.89155, 52.38114],
                            [4.89012, 52.38198],
                            [4.89024, 52.38203],
                            [4.89025, 52.38204],
                            [4.89028, 52.38207],
                            [4.89037, 52.38216],
                            [4.8904, 52.38218],
                            [4.89047, 52.38224],
                            [4.89072, 52.38249],
                            [4.89087, 52.38257],
                            [4.89098, 52.38261],
                            [4.89111, 52.38264],
                            [4.89202, 52.38273],
                            [4.89257, 52.38274],
                            [4.89273, 52.38274],
                            [4.89285, 52.38272],
                            [4.893, 52.38272],
                            [4.8931, 52.38274],
                            [4.8932, 52.38276],
                            [4.89334, 52.38281],
                            [4.89339, 52.38283],
                            [4.89364, 52.38282],
                            [4.89408, 52.38283],
                            [4.89423, 52.38281],
                            [4.89429, 52.3828],
                            [4.89454, 52.38274],
                            [4.89471, 52.38265],
                            [4.89516, 52.38232],
                            [4.89518, 52.38231],
                            [4.89526, 52.38225],
                            [4.89553, 52.38207],
                            [4.89571, 52.38191],
                            [4.89597, 52.38171],
                            [4.89611, 52.3816],
                            [4.89624, 52.38149],
                            [4.89629, 52.38146],
                            [4.89648, 52.38133],
                            [4.89654, 52.38129],
                            [4.89662, 52.38124],
                            [4.8968, 52.38114],
                            [4.89695, 52.38105],
                            [4.89702, 52.38101],
                            [4.89709, 52.38098],
                            [4.89739, 52.38086],
                            [4.8988, 52.38035],
                            [4.89889, 52.38032],
                            [4.89901, 52.38027],
                            [4.89912, 52.38023],
                            [4.89914, 52.38022],
                            [4.89915, 52.38022],
                            [4.8999, 52.37994],
                            [4.90009, 52.37988],
                            [4.90054, 52.37971],
                            [4.90108, 52.37951],
                            [4.90112, 52.37949],
                            [4.90119, 52.37947],
                            [4.90123, 52.37946],
                            [4.90207, 52.37915],
                            [4.90256, 52.37897],
                            [4.90268, 52.37892],
                            [4.90334, 52.37868],
                            [4.90397, 52.37845],
                            [4.90435, 52.37835],
                            [4.90441, 52.37834],
                            [4.90475, 52.37826],
                            [4.90485, 52.37823],
                            [4.90501, 52.37821],
                            [4.90517, 52.37819],
                            [4.90533, 52.37816],
                            [4.90574, 52.37811],
                            [4.90633, 52.37803],
                            [4.9064, 52.37802],
                            [4.90647, 52.37809],
                            [4.90632, 52.37812],
                            [4.90593, 52.37817],
                            [4.90537, 52.37825],
                            [4.90521, 52.37828],
                            [4.90504, 52.37832],
                            [4.90497, 52.37834],
                            [4.90489, 52.37836],
                            [4.90453, 52.37847],
                            [4.9045, 52.37848],
                            [4.90433, 52.37858],
                            [4.90428, 52.3786],
                            [4.90286, 52.37911],
                            [4.90283, 52.37912],
                            [4.90276, 52.37912],
                            [4.90272, 52.37911],
                            [4.90269, 52.3791],
                            [4.90265, 52.37908],
                            [4.90262, 52.37907],
                            [4.9026, 52.37906],
                            [4.90213, 52.37922],
                            [4.90207, 52.37915],
                            [4.90206, 52.37914],
                            [4.90127, 52.37943],
                        ],
                    },
                    bbox: [4.8746, 52.37802, 4.90647, 52.38686],
                    properties: {
                        index: 1,
                        summary: {
                            lengthInMeters: 3451,
                            travelTimeInSeconds: 908,
                            trafficDelayInSeconds: 198,
                            trafficLengthInMeters: 520,
                            departureTime: new Date('2023-11-28T17:43:12.000Z'),
                            arrivalTime: new Date('2023-11-28T17:58:19.000Z'),
                            noTrafficTravelTimeInSeconds: 617,
                            historicTrafficTravelTimeInSeconds: 733,
                            liveTrafficIncidentsTravelTimeInSeconds: 908,
                            deviationDistanceInMeters: 1551,
                            deviationPoint: [4.89173, 52.38139],
                        },
                        sections: {
                            leg: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 165,
                                    summary: {
                                        lengthInMeters: 3451,
                                        travelTimeInSeconds: 908,
                                        trafficDelayInSeconds: 198,
                                        trafficLengthInMeters: 520,
                                        departureTime: new Date('2023-11-28T17:43:12.000Z'),
                                        arrivalTime: new Date('2023-11-28T17:58:19.000Z'),
                                        noTrafficTravelTimeInSeconds: 617,
                                        historicTrafficTravelTimeInSeconds: 733,
                                        liveTrafficIncidentsTravelTimeInSeconds: 908,
                                    },
                                },
                            ],
                            urban: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 9,
                                    endPointIndex: 104,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 113,
                                    endPointIndex: 165,
                                },
                            ],
                            tunnel: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 114,
                                    endPointIndex: 129,
                                },
                            ],
                            country: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 165,
                                    countryCodeISO3: 'NLD',
                                },
                            ],
                            pedestrian: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 161,
                                    endPointIndex: 165,
                                },
                            ],
                            vehicleRestricted: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 161,
                                    endPointIndex: 165,
                                },
                            ],
                            traffic: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 90,
                                    endPointIndex: 103,
                                    delayInSeconds: 138,
                                    effectiveSpeedInKmh: 5,
                                    magnitudeOfDelay: 'major',
                                    tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                                    categories: ['jam'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 129,
                                    endPointIndex: 141,
                                    delayInSeconds: 59,
                                    effectiveSpeedInKmh: 11,
                                    magnitudeOfDelay: 'minor',
                                    tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                                    categories: ['jam'],
                                },
                            ],
                        },
                        guidance: {
                            instructions: [
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'DEPART',
                                    maneuverPoint: [4.87489, 52.38686],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 0,
                                    routePath: [
                                        {
                                            distanceInMeters: 0,
                                            point: [4.87489, 52.38686],
                                            travelTimeInSeconds: 0,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.8749, 52.38654],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 35,
                                    routePath: [
                                        {
                                            distanceInMeters: 35,
                                            point: [4.8749, 52.38654],
                                            travelTimeInSeconds: 11,
                                        },
                                        {
                                            distanceInMeters: 45,
                                            point: [4.87476, 52.38654],
                                            travelTimeInSeconds: 15,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.8746, 52.38653],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                    routeOffsetInMeters: 56,
                                    routePath: [
                                        {
                                            distanceInMeters: 56,
                                            point: [4.8746, 52.38653],
                                            travelTimeInSeconds: 18,
                                        },
                                        {
                                            distanceInMeters: 66,
                                            point: [4.8746, 52.38644],
                                            travelTimeInSeconds: 22,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.87461, 52.38602],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 114,
                                    routePath: [
                                        {
                                            distanceInMeters: 114,
                                            point: [4.87461, 52.38602],
                                            travelTimeInSeconds: 37,
                                        },
                                        {
                                            distanceInMeters: 124,
                                            point: [4.87476, 52.38602],
                                            travelTimeInSeconds: 41,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 25,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 25,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 96,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.87485, 52.38602],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 130,
                                    routePath: [
                                        {
                                            distanceInMeters: 130,
                                            point: [4.87485, 52.38602],
                                            travelTimeInSeconds: 43,
                                        },
                                        {
                                            distanceInMeters: 133,
                                            point: [4.87485, 52.38598],
                                            travelTimeInSeconds: 46,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -67,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.87492, 52.38546],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's103',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 193,
                                    routePath: [
                                        {
                                            distanceInMeters: 193,
                                            point: [4.87492, 52.38546],
                                            travelTimeInSeconds: 105,
                                        },
                                        {
                                            distanceInMeters: 203,
                                            point: [4.87507, 52.38546],
                                            travelTimeInSeconds: 106,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 34,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.88384, 52.38519],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02ccpl\u025b\u2040in',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerplein',
                                        },
                                    },
                                    routeOffsetInMeters: 852,
                                    routePath: [
                                        {
                                            distanceInMeters: 852,
                                            point: [4.88384, 52.38519],
                                            travelTimeInSeconds: 247,
                                        },
                                        {
                                            distanceInMeters: 860,
                                            point: [4.88393, 52.38523],
                                            travelTimeInSeconds: 248,
                                        },
                                        {
                                            distanceInMeters: 862,
                                            point: [4.88396, 52.38523],
                                            travelTimeInSeconds: 248,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 210,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 196,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 133,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 84,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.89173, 52.38139],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8b\u0153\u2040y.t\u0259n \u02c8br\u0251\u2040u.w\u0259rs.strat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Buiten Brouwersstraat',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8ni.w\u0259 \u02c8\u028b\u025bs.t\u0259r.d\u0254k.strat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Nieuwe Westerdokstraat',
                                        },
                                    },
                                    routeOffsetInMeters: 1549,
                                    routePath: [
                                        {
                                            distanceInMeters: 1549,
                                            point: [4.89173, 52.38139],
                                            travelTimeInSeconds: 337,
                                        },
                                        {
                                            distanceInMeters: 1555,
                                            point: [4.89169, 52.38134],
                                            travelTimeInSeconds: 338,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 603,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 296,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 107,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.89155, 52.38114],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8har.l\u025b.m\u0259r \u02c8h\u0251\u2040ut.t\u0153\u2040y.n\u0259n',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmer Houttuinen',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8b\u0153\u2040y.t\u0259n \u02c8br\u0251\u2040u.w\u0259rs.strat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Buiten Brouwersstraat',
                                        },
                                    },
                                    routeOffsetInMeters: 1578,
                                    routePath: [
                                        {
                                            distanceInMeters: 1578,
                                            point: [4.89155, 52.38114],
                                            travelTimeInSeconds: 343,
                                        },
                                        {
                                            distanceInMeters: 1588,
                                            point: [4.89144, 52.38121],
                                            travelTimeInSeconds: 345,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 101,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.89012, 52.38198],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8\u028b\u025bs.t\u0259r.d\u0254ks.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Westerdokskade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8har.l\u025b.m\u0259r \u02c8h\u0251\u2040ut.t\u0153\u2040y.n\u0259n',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmer Houttuinen',
                                        },
                                    },
                                    routeOffsetInMeters: 1713,
                                    routePath: [
                                        {
                                            distanceInMeters: 1713,
                                            point: [4.89012, 52.38198],
                                            travelTimeInSeconds: 374,
                                        },
                                        {
                                            distanceInMeters: 1722,
                                            point: [4.89024, 52.38203],
                                            travelTimeInSeconds: 375,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 34,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.89339, 52.38283],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 1974,
                                    routePath: [
                                        {
                                            distanceInMeters: 1974,
                                            point: [4.89339, 52.38283],
                                            travelTimeInSeconds: 418,
                                        },
                                        {
                                            distanceInMeters: 1984,
                                            point: [4.89354, 52.38283],
                                            travelTimeInSeconds: 424,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 48,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -180,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'MAKE_UTURN',
                                    maneuverPoint: [4.90647, 52.37809],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 3036,
                                    routePath: [
                                        {
                                            distanceInMeters: 3036,
                                            point: [4.9064, 52.37802],
                                            travelTimeInSeconds: 726,
                                        },
                                        {
                                            distanceInMeters: 3045,
                                            point: [4.90647, 52.37809],
                                            travelTimeInSeconds: 729,
                                        },
                                        {
                                            distanceInMeters: 3056,
                                            point: [4.90632, 52.37812],
                                            travelTimeInSeconds: 730,
                                        },
                                        {
                                            distanceInMeters: 3066,
                                            point: [4.90617, 52.37814],
                                            travelTimeInSeconds: 740,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 919,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 859,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 800,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 725,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 719,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 108,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 17,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'SLIGHT_RIGHT',
                                    maneuverPoint: [4.9045, 52.37848],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 3187,
                                    routePath: [
                                        {
                                            distanceInMeters: 3187,
                                            point: [4.9045, 52.37848],
                                            travelTimeInSeconds: 780,
                                        },
                                        {
                                            distanceInMeters: 3197,
                                            point: [4.90439, 52.37854],
                                            travelTimeInSeconds: 783,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 57,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.9026, 52.37906],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 3339,
                                    routePath: [
                                        {
                                            distanceInMeters: 3339,
                                            point: [4.9026, 52.37906],
                                            travelTimeInSeconds: 829,
                                        },
                                        {
                                            distanceInMeters: 3349,
                                            point: [4.90247, 52.3791],
                                            travelTimeInSeconds: 834,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.90213, 52.37922],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 3375,
                                    routePath: [
                                        {
                                            distanceInMeters: 3375,
                                            point: [4.90213, 52.37922],
                                            travelTimeInSeconds: 854,
                                        },
                                        {
                                            distanceInMeters: 3384,
                                            point: [4.90207, 52.37915],
                                            travelTimeInSeconds: 860,
                                        },
                                        {
                                            distanceInMeters: 3385,
                                            point: [4.90206, 52.37914],
                                            travelTimeInSeconds: 860,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ARRIVE_LEFT',
                                    maneuverPoint: [4.90127, 52.37943],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                    routeOffsetInMeters: 3448,
                                    routePath: [
                                        {
                                            distanceInMeters: 3448,
                                            point: [4.90127, 52.37943],
                                            travelTimeInSeconds: 906,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                            ],
                        },
                    },
                },
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [4.87489, 52.38686],
                            [4.8749, 52.38659],
                            [4.8749, 52.38654],
                            [4.8746, 52.38653],
                            [4.87461, 52.38625],
                            [4.87461, 52.38602],
                            [4.87485, 52.38602],
                            [4.87485, 52.38598],
                            [4.87486, 52.38577],
                            [4.87484, 52.38568],
                            [4.87484, 52.38558],
                            [4.87487, 52.38553],
                            [4.87488, 52.38551],
                            [4.87492, 52.38546],
                            [4.87327, 52.38543],
                            [4.87076, 52.38539],
                            [4.87, 52.38538],
                            [4.8697, 52.38537],
                            [4.86953, 52.38533],
                            [4.86951, 52.38524],
                            [4.86954, 52.38519],
                            [4.86978, 52.3847],
                            [4.86987, 52.3846],
                            [4.87006, 52.38409],
                            [4.87009, 52.38405],
                            [4.87008, 52.38402],
                            [4.87008, 52.38393],
                            [4.87027, 52.38348],
                            [4.87045, 52.38301],
                            [4.87053, 52.38281],
                            [4.87064, 52.38252],
                            [4.87081, 52.38205],
                            [4.871, 52.38152],
                            [4.87122, 52.38095],
                            [4.87162, 52.37978],
                            [4.87175, 52.37941],
                            [4.8718, 52.37935],
                            [4.87189, 52.37931],
                            [4.87275, 52.37908],
                            [4.87313, 52.37896],
                            [4.87325, 52.37893],
                            [4.87371, 52.37881],
                            [4.87386, 52.37877],
                            [4.8741, 52.37875],
                            [4.87422, 52.37875],
                            [4.87429, 52.37876],
                            [4.8745, 52.37884],
                            [4.87476, 52.37891],
                            [4.87513, 52.37902],
                            [4.87538, 52.37881],
                            [4.87542, 52.37877],
                            [4.8754, 52.37874],
                            [4.87538, 52.37872],
                            [4.87512, 52.37835],
                            [4.87478, 52.37787],
                            [4.8747, 52.37779],
                            [4.87464, 52.37771],
                            [4.87464, 52.3777],
                            [4.8746, 52.37759],
                            [4.87366, 52.37618],
                            [4.87361, 52.37613],
                            [4.87359, 52.37611],
                            [4.87357, 52.37608],
                            [4.87354, 52.37601],
                            [4.87354, 52.37598],
                            [4.87306, 52.37528],
                            [4.87282, 52.37494],
                            [4.8728, 52.3749],
                            [4.87275, 52.37482],
                            [4.87268, 52.37482],
                            [4.87261, 52.3748],
                            [4.87255, 52.37477],
                            [4.87252, 52.37473],
                            [4.8725, 52.3747],
                            [4.87249, 52.37466],
                            [4.8725, 52.37463],
                            [4.87251, 52.37459],
                            [4.87254, 52.37456],
                            [4.87251, 52.37447],
                            [4.87247, 52.37438],
                            [4.87208, 52.37375],
                            [4.87144, 52.37278],
                            [4.87132, 52.37263],
                            [4.87127, 52.37256],
                            [4.87123, 52.37251],
                            [4.87121, 52.37247],
                            [4.8711, 52.37226],
                            [4.87061, 52.37153],
                            [4.87043, 52.37111],
                            [4.87041, 52.37104],
                            [4.8704, 52.37099],
                            [4.87039, 52.37097],
                            [4.87037, 52.37089],
                            [4.87036, 52.37086],
                            [4.87033, 52.37074],
                            [4.87031, 52.37037],
                            [4.87031, 52.37027],
                            [4.87039, 52.3699],
                            [4.8705, 52.36963],
                            [4.8706, 52.3694],
                            [4.8709, 52.36892],
                            [4.87106, 52.36873],
                            [4.87167, 52.36785],
                            [4.87175, 52.3677],
                            [4.872, 52.36735],
                            [4.87206, 52.36727],
                            [4.87209, 52.36723],
                            [4.87213, 52.36717],
                            [4.87218, 52.36722],
                            [4.87224, 52.36726],
                            [4.87231, 52.36728],
                            [4.8724, 52.36731],
                            [4.87323, 52.36754],
                            [4.87345, 52.36761],
                            [4.8736, 52.36766],
                            [4.87383, 52.36772],
                            [4.87479, 52.36797],
                            [4.87591, 52.36827],
                            [4.87618, 52.36834],
                            [4.8763, 52.36837],
                            [4.87639, 52.36832],
                            [4.87649, 52.36823],
                            [4.87673, 52.36794],
                            [4.87682, 52.36776],
                            [4.87685, 52.36766],
                            [4.87687, 52.36747],
                            [4.87687, 52.36726],
                            [4.87688, 52.36719],
                            [4.87703, 52.36682],
                            [4.87705, 52.36679],
                            [4.87724, 52.36654],
                            [4.87726, 52.36652],
                            [4.8774, 52.3664],
                            [4.87766, 52.36621],
                            [4.87786, 52.36609],
                            [4.87793, 52.36605],
                            [4.878, 52.36601],
                            [4.87803, 52.36599],
                            [4.87828, 52.36581],
                            [4.87845, 52.36565],
                            [4.87857, 52.36548],
                            [4.87864, 52.36532],
                            [4.87869, 52.36505],
                            [4.87868, 52.36495],
                            [4.87859, 52.36469],
                            [4.87856, 52.36459],
                            [4.87852, 52.3645],
                            [4.87851, 52.36442],
                            [4.87851, 52.36439],
                            [4.87852, 52.36434],
                            [4.87855, 52.36422],
                            [4.87861, 52.36407],
                            [4.87865, 52.36396],
                            [4.87868, 52.36391],
                            [4.87872, 52.36381],
                            [4.87876, 52.36376],
                            [4.87881, 52.36369],
                            [4.87882, 52.36368],
                            [4.87883, 52.36367],
                            [4.87889, 52.36362],
                            [4.87913, 52.36349],
                            [4.87948, 52.36327],
                            [4.8799, 52.36296],
                            [4.87994, 52.36293],
                            [4.88001, 52.36288],
                            [4.88017, 52.36277],
                            [4.88023, 52.36274],
                            [4.88033, 52.36266],
                            [4.88038, 52.36263],
                            [4.88065, 52.36236],
                            [4.88099, 52.36211],
                            [4.88104, 52.36206],
                            [4.88114, 52.362],
                            [4.88135, 52.3619],
                            [4.88165, 52.36178],
                            [4.88173, 52.36176],
                            [4.88181, 52.36174],
                            [4.88191, 52.36171],
                            [4.88213, 52.36167],
                            [4.88231, 52.36166],
                            [4.88241, 52.36166],
                            [4.88247, 52.36166],
                            [4.88319, 52.36166],
                            [4.88348, 52.36164],
                            [4.88366, 52.36162],
                            [4.88383, 52.36158],
                            [4.884, 52.36151],
                            [4.88447, 52.36128],
                            [4.88503, 52.36102],
                            [4.88539, 52.36084],
                            [4.88582, 52.36063],
                            [4.88595, 52.36056],
                            [4.88598, 52.36054],
                            [4.88601, 52.36053],
                            [4.88613, 52.36046],
                            [4.88647, 52.36029],
                            [4.88673, 52.36015],
                            [4.88678, 52.36012],
                            [4.88693, 52.36009],
                            [4.88696, 52.36008],
                            [4.887, 52.36006],
                            [4.88719, 52.35996],
                            [4.88724, 52.35993],
                            [4.88744, 52.35982],
                            [4.88756, 52.35972],
                            [4.88774, 52.35958],
                            [4.88796, 52.35936],
                            [4.88813, 52.3592],
                            [4.88839, 52.35896],
                            [4.88854, 52.35885],
                            [4.88903, 52.35856],
                            [4.88943, 52.35838],
                            [4.88964, 52.35833],
                            [4.88981, 52.35828],
                            [4.89017, 52.35819],
                            [4.89026, 52.35817],
                            [4.89038, 52.3581],
                            [4.89059, 52.35807],
                            [4.89074, 52.35804],
                            [4.89084, 52.35803],
                            [4.89094, 52.35803],
                            [4.89106, 52.35802],
                            [4.89126, 52.35801],
                            [4.8914, 52.35802],
                            [4.89185, 52.35799],
                            [4.89205, 52.35798],
                            [4.89284, 52.35791],
                            [4.89724, 52.35767],
                            [4.89778, 52.35764],
                            [4.89784, 52.35762],
                            [4.89831, 52.35759],
                            [4.89837, 52.35759],
                            [4.89841, 52.3576],
                            [4.89854, 52.35762],
                            [4.89889, 52.35769],
                            [4.89911, 52.35774],
                            [4.8993, 52.35778],
                            [4.89957, 52.35784],
                            [4.8999, 52.35791],
                            [4.90022, 52.35798],
                            [4.90032, 52.35802],
                            [4.90179, 52.35832],
                            [4.90188, 52.35834],
                            [4.90199, 52.35836],
                            [4.90218, 52.3584],
                            [4.90268, 52.35851],
                            [4.90336, 52.35866],
                            [4.90353, 52.3587],
                            [4.90368, 52.35871],
                            [4.90379, 52.35871],
                            [4.90403, 52.35874],
                            [4.90404, 52.35874],
                            [4.90422, 52.35878],
                            [4.90432, 52.3588],
                            [4.90557, 52.35901],
                            [4.90561, 52.35902],
                            [4.90568, 52.35903],
                            [4.90593, 52.35907],
                            [4.90608, 52.3591],
                            [4.90622, 52.35912],
                            [4.90629, 52.35914],
                            [4.90681, 52.35936],
                            [4.90813, 52.35999],
                            [4.90829, 52.36005],
                            [4.90832, 52.36006],
                            [4.90839, 52.36008],
                            [4.90852, 52.36011],
                            [4.90869, 52.36016],
                            [4.90884, 52.36019],
                            [4.9089, 52.3602],
                            [4.90895, 52.36021],
                            [4.90927, 52.36023],
                            [4.90944, 52.36024],
                            [4.91011, 52.36023],
                            [4.91035, 52.36025],
                            [4.91049, 52.36028],
                            [4.91065, 52.36032],
                            [4.91082, 52.36039],
                            [4.91107, 52.36051],
                            [4.91147, 52.36071],
                            [4.91172, 52.36084],
                            [4.91175, 52.36085],
                            [4.91198, 52.36096],
                            [4.91213, 52.361],
                            [4.91236, 52.36103],
                            [4.9136, 52.36113],
                            [4.91404, 52.36119],
                            [4.91443, 52.36127],
                            [4.91483, 52.36137],
                            [4.915, 52.36142],
                            [4.91516, 52.36146],
                            [4.91522, 52.36148],
                            [4.91551, 52.36156],
                            [4.91605, 52.36171],
                            [4.91649, 52.36179],
                            [4.91716, 52.36183],
                            [4.91795, 52.36187],
                            [4.91828, 52.36191],
                            [4.91851, 52.36196],
                            [4.91883, 52.36205],
                            [4.9191, 52.36218],
                            [4.9196, 52.36251],
                            [4.91976, 52.36264],
                            [4.92006, 52.36282],
                            [4.92027, 52.36291],
                            [4.92035, 52.36292],
                            [4.92046, 52.36294],
                            [4.92077, 52.36297],
                            [4.92181, 52.36304],
                            [4.92188, 52.36304],
                            [4.92233, 52.36306],
                            [4.92251, 52.36307],
                            [4.92301, 52.36308],
                            [4.92311, 52.3631],
                            [4.92313, 52.3631],
                            [4.92325, 52.36314],
                            [4.92333, 52.3632],
                            [4.92337, 52.36326],
                            [4.92342, 52.36337],
                            [4.92331, 52.36357],
                            [4.92326, 52.36367],
                            [4.92325, 52.36371],
                            [4.92323, 52.36377],
                            [4.92325, 52.36385],
                            [4.92329, 52.3639],
                            [4.92346, 52.364],
                            [4.9242, 52.36447],
                            [4.92427, 52.36451],
                            [4.92513, 52.36499],
                            [4.92572, 52.36528],
                            [4.92591, 52.36537],
                            [4.92647, 52.36566],
                            [4.92671, 52.36575],
                            [4.92687, 52.3658],
                            [4.92704, 52.36583],
                            [4.92711, 52.36584],
                            [4.92722, 52.36585],
                            [4.92876, 52.36591],
                            [4.92895, 52.36593],
                            [4.93006, 52.36596],
                            [4.93032, 52.36595],
                            [4.93114, 52.36598],
                            [4.93125, 52.36599],
                            [4.93173, 52.366],
                            [4.93185, 52.36601],
                            [4.93196, 52.36601],
                            [4.93216, 52.36601],
                            [4.93268, 52.36603],
                            [4.93285, 52.36604],
                            [4.93301, 52.36604],
                            [4.93311, 52.36605],
                            [4.93349, 52.36606],
                            [4.93353, 52.36607],
                            [4.9336, 52.36608],
                            [4.93366, 52.36609],
                            [4.93376, 52.36614],
                            [4.93382, 52.36618],
                            [4.93388, 52.36625],
                            [4.9339, 52.36631],
                            [4.9339, 52.36635],
                            [4.93389, 52.36681],
                            [4.93389, 52.36686],
                            [4.93388, 52.3671],
                            [4.93387, 52.36737],
                            [4.93387, 52.36739],
                            [4.93386, 52.3675],
                            [4.93386, 52.36759],
                            [4.93385, 52.36786],
                            [4.93382, 52.36838],
                            [4.93382, 52.36844],
                            [4.93382, 52.36855],
                            [4.93382, 52.36863],
                            [4.93386, 52.36903],
                            [4.93418, 52.36981],
                            [4.93423, 52.37004],
                            [4.93423, 52.37033],
                            [4.93423, 52.37097],
                            [4.93424, 52.3711],
                            [4.93424, 52.37124],
                            [4.93423, 52.37133],
                            [4.93421, 52.37154],
                            [4.93415, 52.37173],
                            [4.93401, 52.37207],
                            [4.93395, 52.37219],
                            [4.93385, 52.37235],
                            [4.93376, 52.37248],
                            [4.93368, 52.37257],
                            [4.93359, 52.37268],
                            [4.93347, 52.37281],
                            [4.93326, 52.37304],
                            [4.93312, 52.37316],
                            [4.93283, 52.3734],
                            [4.93259, 52.37357],
                            [4.93239, 52.37369],
                            [4.93212, 52.37384],
                            [4.93102, 52.37433],
                            [4.93001, 52.37473],
                            [4.92966, 52.37487],
                            [4.92906, 52.37507],
                            [4.92897, 52.3751],
                            [4.92873, 52.37516],
                            [4.9278, 52.37535],
                            [4.92666, 52.37555],
                            [4.92475, 52.37586],
                            [4.92314, 52.3761],
                            [4.92206, 52.37626],
                            [4.92198, 52.37628],
                            [4.92188, 52.37629],
                            [4.92178, 52.37631],
                            [4.92163, 52.37633],
                            [4.9215, 52.37635],
                            [4.92142, 52.37636],
                            [4.92039, 52.3765],
                            [4.91884, 52.37671],
                            [4.91844, 52.37677],
                            [4.91631, 52.37705],
                            [4.91455, 52.37725],
                            [4.91306, 52.37738],
                            [4.91286, 52.37739],
                            [4.9119, 52.37745],
                            [4.91169, 52.37747],
                            [4.91149, 52.37748],
                            [4.91026, 52.37758],
                            [4.91002, 52.37761],
                            [4.90984, 52.37763],
                            [4.90874, 52.37778],
                            [4.90765, 52.37792],
                            [4.90746, 52.37796],
                            [4.90714, 52.378],
                            [4.90647, 52.37809],
                            [4.90632, 52.37812],
                            [4.90593, 52.37817],
                            [4.90537, 52.37825],
                            [4.90521, 52.37828],
                            [4.90504, 52.37832],
                            [4.90497, 52.37834],
                            [4.90489, 52.37836],
                            [4.90453, 52.37847],
                            [4.9045, 52.37848],
                            [4.90433, 52.37858],
                            [4.90428, 52.3786],
                            [4.90286, 52.37911],
                            [4.90283, 52.37912],
                            [4.90276, 52.37912],
                            [4.90272, 52.37911],
                            [4.90269, 52.3791],
                            [4.90265, 52.37908],
                            [4.90262, 52.37907],
                            [4.9026, 52.37906],
                            [4.90213, 52.37922],
                            [4.90207, 52.37915],
                            [4.90206, 52.37914],
                            [4.90127, 52.37943],
                        ],
                    },
                    bbox: [4.86951, 52.35759, 4.93424, 52.38686],
                    properties: {
                        summary: {
                            lengthInMeters: 11267,
                            travelTimeInSeconds: 1902,
                            trafficDelayInSeconds: 8,
                            trafficLengthInMeters: 11,
                            departureTime: new Date('2023-11-28T17:43:12.000Z'),
                            arrivalTime: new Date('2023-11-28T18:14:53.000Z'),
                            noTrafficTravelTimeInSeconds: 1468,
                            historicTrafficTravelTimeInSeconds: 1896,
                            liveTrafficIncidentsTravelTimeInSeconds: 1902,
                            deviationDistanceInMeters: 193,
                            deviationPoint: [4.87492, 52.38546],
                        },
                        sections: {
                            leg: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 452,
                                    summary: {
                                        lengthInMeters: 11267,
                                        travelTimeInSeconds: 1902,
                                        trafficDelayInSeconds: 8,
                                        trafficLengthInMeters: 11,
                                        departureTime: new Date('2023-11-28T17:43:12.000Z'),
                                        arrivalTime: new Date('2023-11-28T18:14:53.000Z'),
                                        noTrafficTravelTimeInSeconds: 1468,
                                        historicTrafficTravelTimeInSeconds: 1896,
                                        liveTrafficIncidentsTravelTimeInSeconds: 1902,
                                    },
                                },
                            ],
                            tunnel: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 263,
                                    endPointIndex: 270,
                                },
                            ],
                            urban: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 9,
                                    endPointIndex: 403,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 410,
                                    endPointIndex: 414,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 418,
                                    endPointIndex: 452,
                                },
                            ],
                            country: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 452,
                                    countryCodeISO3: 'NLD',
                                },
                            ],
                            pedestrian: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 448,
                                    endPointIndex: 452,
                                },
                            ],
                            vehicleRestricted: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 448,
                                    endPointIndex: 452,
                                },
                            ],
                            traffic: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 15,
                                    endPointIndex: 18,
                                    effectiveSpeedInKmh: 36,
                                    magnitudeOfDelay: 'indefinite',
                                    tec: { causes: [{ mainCauseCode: 3 }], effectCode: 1 },
                                    categories: ['roadworks'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 74,
                                    endPointIndex: 77,
                                    delayInSeconds: 8,
                                    effectiveSpeedInKmh: 4,
                                    magnitudeOfDelay: 'major',
                                    tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                                    categories: ['jam'],
                                },
                            ],
                        },
                        guidance: {
                            instructions: [
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'DEPART',
                                    maneuverPoint: [4.87489, 52.38686],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 0,
                                    routePath: [
                                        {
                                            distanceInMeters: 0,
                                            point: [4.87489, 52.38686],
                                            travelTimeInSeconds: 0,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.8749, 52.38654],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 35,
                                    routePath: [
                                        {
                                            distanceInMeters: 35,
                                            point: [4.8749, 52.38654],
                                            travelTimeInSeconds: 11,
                                        },
                                        {
                                            distanceInMeters: 45,
                                            point: [4.87476, 52.38654],
                                            travelTimeInSeconds: 15,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.8746, 52.38653],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0254s.x\u0251lk.\u02cclan',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Gosschalklaan',
                                        },
                                    },
                                    routeOffsetInMeters: 56,
                                    routePath: [
                                        {
                                            distanceInMeters: 56,
                                            point: [4.8746, 52.38653],
                                            travelTimeInSeconds: 18,
                                        },
                                        {
                                            distanceInMeters: 66,
                                            point: [4.8746, 52.38644],
                                            travelTimeInSeconds: 22,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.87461, 52.38602],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 114,
                                    routePath: [
                                        {
                                            distanceInMeters: 114,
                                            point: [4.87461, 52.38602],
                                            travelTimeInSeconds: 37,
                                        },
                                        {
                                            distanceInMeters: 124,
                                            point: [4.87476, 52.38602],
                                            travelTimeInSeconds: 41,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 25,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 25,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 96,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.87485, 52.38602],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 130,
                                    routePath: [
                                        {
                                            distanceInMeters: 130,
                                            point: [4.87485, 52.38602],
                                            travelTimeInSeconds: 43,
                                        },
                                        {
                                            distanceInMeters: 133,
                                            point: [4.87485, 52.38598],
                                            travelTimeInSeconds: 46,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 113,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.87492, 52.38546],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's103',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 193,
                                    routePath: [
                                        {
                                            distanceInMeters: 193,
                                            point: [4.87492, 52.38546],
                                            travelTimeInSeconds: 105,
                                        },
                                        {
                                            distanceInMeters: 203,
                                            point: [4.87477, 52.38546],
                                            travelTimeInSeconds: 106,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -68,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.86953, 52.38533],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'v\u0251n \u02c8h\u0251l.strat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Van Hallstraat',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's103',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8har.l\u025b.m\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Haarlemmerweg',
                                        },
                                    },
                                    routeOffsetInMeters: 561,
                                    routePath: [
                                        {
                                            distanceInMeters: 561,
                                            point: [4.86953, 52.38533],
                                            travelTimeInSeconds: 157,
                                        },
                                        {
                                            distanceInMeters: 571,
                                            point: [4.86951, 52.38525],
                                            travelTimeInSeconds: 159,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 79,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: true,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.87513, 52.37902],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.pl\u0251nt.sun',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikplantsoen',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8k\u0254st.f\u0259r.lo.r\u0259n.\u02ccstrat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Kostverlorenstraat',
                                        },
                                    },
                                    routeOffsetInMeters: 1494,
                                    routePath: [
                                        {
                                            distanceInMeters: 1494,
                                            point: [4.87513, 52.37902],
                                            travelTimeInSeconds: 283,
                                        },
                                        {
                                            distanceInMeters: 1504,
                                            point: [4.87521, 52.37895],
                                            travelTimeInSeconds: 284,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 781,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 719,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 665,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 609,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 495,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 430,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 297,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 247,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 138,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 68,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.87542, 52.37877],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.pl\u0251nt.sun',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikplantsoen',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.pl\u0251nt.sun',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikplantsoen',
                                        },
                                    },
                                    routeOffsetInMeters: 1529,
                                    routePath: [
                                        {
                                            distanceInMeters: 1529,
                                            point: [4.87542, 52.37877],
                                            travelTimeInSeconds: 287,
                                        },
                                        {
                                            distanceInMeters: 1533,
                                            point: [4.8754, 52.37874],
                                            travelTimeInSeconds: 288,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 3,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_STRAIGHT',
                                    maneuverPoint: [4.87254, 52.37456],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.strat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikstraat',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8fre.d\u0259.r\u026ak \u02c8h\u025bn.dr\u026ak.strat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Frederik Hendrikstraat',
                                        },
                                    },
                                    roundaboutExitNumber: 2,
                                    routeOffsetInMeters: 2005,
                                    routePath: [
                                        {
                                            distanceInMeters: 2005,
                                            point: [4.87275, 52.37482],
                                            travelTimeInSeconds: 359,
                                        },
                                        {
                                            distanceInMeters: 2010,
                                            point: [4.87268, 52.37482],
                                            travelTimeInSeconds: 361,
                                        },
                                        {
                                            distanceInMeters: 2015,
                                            point: [4.87261, 52.3748],
                                            travelTimeInSeconds: 363,
                                        },
                                        {
                                            distanceInMeters: 2020,
                                            point: [4.87255, 52.37477],
                                            travelTimeInSeconds: 365,
                                        },
                                        {
                                            distanceInMeters: 2024,
                                            point: [4.87252, 52.37473],
                                            travelTimeInSeconds: 366,
                                        },
                                        {
                                            distanceInMeters: 2029,
                                            point: [4.8725, 52.3747],
                                            travelTimeInSeconds: 368,
                                        },
                                        {
                                            distanceInMeters: 2033,
                                            point: [4.87249, 52.37466],
                                            travelTimeInSeconds: 369,
                                        },
                                        {
                                            distanceInMeters: 2037,
                                            point: [4.8725, 52.37463],
                                            travelTimeInSeconds: 371,
                                        },
                                        {
                                            distanceInMeters: 2040,
                                            point: [4.87251, 52.37459],
                                            travelTimeInSeconds: 374,
                                        },
                                        {
                                            distanceInMeters: 2044,
                                            point: [4.87254, 52.37456],
                                            travelTimeInSeconds: 377,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 356,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 163,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.87213, 52.36717],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8k\u026a\u014b.k\u0259r.\u02ccstrat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Kinkerstraat',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8b\u026al.d\u0259r.d\u025b\u2040ik.\u02ccstrat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Bilderdijkstraat',
                                        },
                                    },
                                    routeOffsetInMeters: 2918,
                                    routePath: [
                                        {
                                            distanceInMeters: 2918,
                                            point: [4.87213, 52.36717],
                                            travelTimeInSeconds: 530,
                                        },
                                        {
                                            distanceInMeters: 2924,
                                            point: [4.87218, 52.36722],
                                            travelTimeInSeconds: 531,
                                        },
                                        {
                                            distanceInMeters: 2930,
                                            point: [4.87224, 52.36726],
                                            travelTimeInSeconds: 533,
                                        },
                                        {
                                            distanceInMeters: 2936,
                                            point: [4.87231, 52.36728],
                                            travelTimeInSeconds: 533,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 660,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 622,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 443,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 368,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 212,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 74,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.8763, 52.36837],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8n\u0251.s\u0251\u2040u.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Nassaukade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8k\u026a\u014b.k\u0259r.\u02ccstrat',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Kinkerstraat',
                                        },
                                    },
                                    routeOffsetInMeters: 3233,
                                    routePath: [
                                        {
                                            distanceInMeters: 3233,
                                            point: [4.8763, 52.36837],
                                            travelTimeInSeconds: 601,
                                        },
                                        {
                                            distanceInMeters: 3241,
                                            point: [4.87639, 52.36832],
                                            travelTimeInSeconds: 602,
                                        },
                                        {
                                            distanceInMeters: 3243,
                                            point: [4.87641, 52.36831],
                                            travelTimeInSeconds: 602,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 228,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 183,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 112,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -45,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_SLIGHT_LEFT',
                                    maneuverPoint: [4.92331, 52.36357],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                    roundaboutExitNumber: 2,
                                    routeOffsetInMeters: 7191,
                                    routePath: [
                                        {
                                            distanceInMeters: 7191,
                                            point: [4.92251, 52.36307],
                                            travelTimeInSeconds: 1260,
                                        },
                                        {
                                            distanceInMeters: 7225,
                                            point: [4.92301, 52.36308],
                                            travelTimeInSeconds: 1265,
                                        },
                                        {
                                            distanceInMeters: 7233,
                                            point: [4.92311, 52.3631],
                                            travelTimeInSeconds: 1266,
                                        },
                                        {
                                            distanceInMeters: 7234,
                                            point: [4.92313, 52.3631],
                                            travelTimeInSeconds: 1266,
                                        },
                                        {
                                            distanceInMeters: 7243,
                                            point: [4.92325, 52.36314],
                                            travelTimeInSeconds: 1267,
                                        },
                                        {
                                            distanceInMeters: 7251,
                                            point: [4.92333, 52.3632],
                                            travelTimeInSeconds: 1268,
                                        },
                                        {
                                            distanceInMeters: 7258,
                                            point: [4.92337, 52.36326],
                                            travelTimeInSeconds: 1269,
                                        },
                                        {
                                            distanceInMeters: 7272,
                                            point: [4.92342, 52.36337],
                                            travelTimeInSeconds: 1270,
                                        },
                                        {
                                            distanceInMeters: 7295,
                                            point: [4.92331, 52.36357],
                                            travelTimeInSeconds: 1274,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 548,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 355,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 199,
                                            side: 'LEFT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 171,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 148,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'EXIT_ROUNDABOUT',
                                    maneuverPoint: [4.92331, 52.36357],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 69,
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8m\u0251\u2040u.r\u026ats.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Mauritskade',
                                        },
                                    },
                                    routeOffsetInMeters: 7295,
                                    routePath: [
                                        {
                                            distanceInMeters: 7295,
                                            point: [4.92331, 52.36357],
                                            travelTimeInSeconds: 1274,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 17,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'SLIGHT_RIGHT',
                                    maneuverPoint: [4.9045, 52.37848],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's100',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 11005,
                                    routePath: [
                                        {
                                            distanceInMeters: 11005,
                                            point: [4.9045, 52.37848],
                                            travelTimeInSeconds: 1774,
                                        },
                                        {
                                            distanceInMeters: 11015,
                                            point: [4.90439, 52.37854],
                                            travelTimeInSeconds: 1777,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 971,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 822,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 57,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.9026, 52.37906],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 11157,
                                    routePath: [
                                        {
                                            distanceInMeters: 11157,
                                            point: [4.9026, 52.37906],
                                            travelTimeInSeconds: 1823,
                                        },
                                        {
                                            distanceInMeters: 11167,
                                            point: [4.90247, 52.3791],
                                            travelTimeInSeconds: 1830,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.90213, 52.37922],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: 'd\u0259 \u02c8r\u0153\u2040y.t\u0259r.\u02ccka.d\u0259',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'De Ruijterkade',
                                        },
                                    },
                                    routeOffsetInMeters: 11193,
                                    routePath: [
                                        {
                                            distanceInMeters: 11193,
                                            point: [4.90213, 52.37922],
                                            travelTimeInSeconds: 1849,
                                        },
                                        {
                                            distanceInMeters: 11202,
                                            point: [4.90207, 52.37915],
                                            travelTimeInSeconds: 1855,
                                        },
                                        {
                                            distanceInMeters: 11202,
                                            point: [4.90206, 52.37914],
                                            travelTimeInSeconds: 1856,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ARRIVE_LEFT',
                                    maneuverPoint: [4.90127, 52.37943],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                'mi.\u02c8xil d\u0259 \u02c8r\u0153\u2040y.t\u0259r.t\u028c.n\u0259l',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Michiel de Ruijtertunnel',
                                        },
                                    },
                                    routeOffsetInMeters: 11265,
                                    routePath: [
                                        {
                                            distanceInMeters: 11265,
                                            point: [4.90127, 52.37943],
                                            travelTimeInSeconds: 1901,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                            ],
                        },
                        index: 2,
                    },
                },
            ],
        },
    ],
    [
        'Short route with multiple lags and multiple travel modes',
        {
            routes: [
                {
                    summary: {
                        lengthInMeters: 1380,
                        travelDurationInSeconds: 460,
                        trafficDelayDurationInSeconds: 0,
                        trafficLengthInMeters: 0,
                        departureDateTime: '2023-11-28T19:10:05+01:00',
                        arrivalDateTime: '2023-11-28T19:17:43+01:00',
                        noTrafficTravelTimeInSeconds: 438,
                        historicTrafficTravelTimeInSeconds: 460,
                        liveTrafficIncidentsTravelTimeInSeconds: 460,
                    },
                    legs: [
                        {
                            summary: {
                                lengthInMeters: 395,
                                travelDurationInSeconds: 46,
                                trafficDelayDurationInSeconds: 0,
                                trafficLengthInMeters: 0,
                                departureDateTime: '2023-11-28T19:10:05+01:00',
                                arrivalDateTime: '2023-11-28T19:10:50+01:00',
                                noTrafficTravelTimeInSeconds: 31,
                                historicTrafficTravelTimeInSeconds: 46,
                                liveTrafficIncidentsTravelTimeInSeconds: 46,
                            },
                            path: {
                                type: 'LineString',
                                coordinates: [
                                    [4.81034, 52.47157],
                                    [4.81051, 52.47159],
                                    [4.81064, 52.47162],
                                    [4.81069, 52.47162],
                                    [4.81089, 52.47163],
                                    [4.81106, 52.47164],
                                    [4.81126, 52.47163],
                                    [4.81137, 52.47163],
                                    [4.81163, 52.47161],
                                    [4.81179, 52.47159],
                                    [4.81201, 52.47155],
                                    [4.81219, 52.47153],
                                    [4.81259, 52.47147],
                                    [4.81322, 52.47141],
                                    [4.81385, 52.47139],
                                    [4.81467, 52.47138],
                                    [4.81472, 52.47138],
                                    [4.81513, 52.4714],
                                    [4.81537, 52.4714],
                                    [4.81566, 52.47143],
                                    [4.81608, 52.47148],
                                ],
                            },
                        },
                        {
                            summary: {
                                lengthInMeters: 985,
                                travelDurationInSeconds: 414,
                                trafficDelayDurationInSeconds: 0,
                                trafficLengthInMeters: 0,
                                departureDateTime: '2023-11-28T19:10:50+01:00',
                                arrivalDateTime: '2023-11-28T19:17:43+01:00',
                                noTrafficTravelTimeInSeconds: 406,
                                historicTrafficTravelTimeInSeconds: 414,
                                liveTrafficIncidentsTravelTimeInSeconds: 414,
                            },
                            path: {
                                type: 'LineString',
                                coordinates: [
                                    [4.81608, 52.47148],
                                    [4.81618, 52.47149],
                                    [4.81623, 52.47149],
                                    [4.81644, 52.47153],
                                    [4.81734, 52.47168],
                                    [4.8176, 52.47173],
                                    [4.82073, 52.47239],
                                    [4.82105, 52.47246],
                                    [4.82126, 52.47248],
                                    [4.82172, 52.47258],
                                    [4.82182, 52.47256],
                                    [4.82186, 52.47254],
                                    [4.8219, 52.47253],
                                    [4.82196, 52.47252],
                                    [4.82205, 52.47253],
                                    [4.82214, 52.47256],
                                    [4.82219, 52.47259],
                                    [4.82221, 52.47264],
                                    [4.8222, 52.4727],
                                    [4.82215, 52.47276],
                                    [4.82211, 52.47278],
                                    [4.82206, 52.47279],
                                    [4.82201, 52.4728],
                                    [4.82197, 52.47282],
                                    [4.82193, 52.47289],
                                    [4.8219, 52.47295],
                                    [4.82188, 52.47299],
                                    [4.82185, 52.47307],
                                    [4.82186, 52.47311],
                                    [4.8218, 52.47322],
                                    [4.82173, 52.47338],
                                    [4.82166, 52.47352],
                                    [4.82163, 52.47357],
                                    [4.82161, 52.47362],
                                    [4.82181, 52.47366],
                                    [4.82185, 52.47365],
                                    [4.82187, 52.47364],
                                    [4.82193, 52.47357],
                                    [4.82205, 52.47343],
                                    [4.82216, 52.4733],
                                    [4.82227, 52.47318],
                                    [4.82231, 52.47317],
                                    [4.82236, 52.47317],
                                    [4.8228, 52.47324],
                                    [4.82325, 52.47332],
                                    [4.82284, 52.47405],
                                    [4.82284, 52.47407],
                                    [4.82288, 52.4741],
                                    [4.82261, 52.47427],
                                    [4.82259, 52.47431],
                                    [4.82251, 52.47441],
                                    [4.82242, 52.47446],
                                    [4.82233, 52.47455],
                                    [4.82205, 52.47492],
                                    [4.82192, 52.47513],
                                    [4.82182, 52.47525],
                                    [4.82172, 52.47542],
                                    [4.82164, 52.47553],
                                ],
                            },
                        },
                    ],
                    sections: {
                        urban: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 13,
                            },
                            {
                                startPathIndex: 16,
                                endPathIndex: 69,
                            },
                        ],
                        travelMode: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 54,
                                travelMode: 'car',
                            },
                            {
                                startPathIndex: 54,
                                endPathIndex: 61,
                                travelMode: 'other',
                            },
                            {
                                startPathIndex: 61,
                                endPathIndex: 68,
                                travelMode: 'car',
                            },
                            {
                                startPathIndex: 68,
                                endPathIndex: 78,
                                travelMode: 'other',
                            },
                        ],
                        country: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 78,
                                countryCodeIso2: 'NL',
                            },
                        ],
                        pedestrian: [
                            {
                                startPathIndex: 68,
                                endPathIndex: 78,
                            },
                        ],
                        unpaved: [
                            {
                                startPathIndex: 71,
                                endPathIndex: 78,
                            },
                        ],
                    },
                    instructions: [
                        {
                            drivingSide: 'right',
                            maneuver: 'depart',
                            maneuverPoint: { latitude: 52.47157, longitude: 4.81034 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's153',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0153\u2040ys.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Guisweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's153',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8\u0263\u0153\u2040ys.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Guisweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 0,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 0,
                                    point: { latitude: 52.47157, longitude: 4.81034 },
                                    travelTimeFromRouteStartInSeconds: 0,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            maneuver: 'waypointRight',
                            maneuverPoint: { latitude: 52.47148, longitude: 4.81609 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 'N515',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's153',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8lex.\u028ba.t\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Leeghwaterweg',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 'N515',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's153',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8lex.\u028ba.t\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Leeghwaterweg',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 395,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 395,
                                    point: { latitude: 52.47148, longitude: 4.81609 },
                                    travelTimeFromRouteStartInSeconds: 46,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 324,
                                    side: 'LEFT_AND_RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -88,
                            drivingSide: 'right',
                            maneuver: 'roundaboutLeft',
                            maneuverPoint: { latitude: 52.4728, longitude: 4.82201 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 'N515',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                    {
                                        countryCodeIso2: 'NL',
                                        roadNumber: {
                                            text: 's153',
                                        },
                                        countrySubdivisionCodeIso: '',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: { ipa: '\u02c8lex.\u028ba.t\u0259r.\u02cc\u028b\u025bx' },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Leeghwaterweg',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 3,
                            routeOffsetInMeters: 803,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 803,
                                    point: { latitude: 52.47256, longitude: 4.82182 },
                                    travelTimeFromRouteStartInSeconds: 77,
                                },
                                {
                                    distanceFromRouteStartInMeters: 806,
                                    point: { latitude: 52.47254, longitude: 4.82186 },
                                    travelTimeFromRouteStartInSeconds: 77,
                                },
                                {
                                    distanceFromRouteStartInMeters: 810,
                                    point: { latitude: 52.47253, longitude: 4.8219 },
                                    travelTimeFromRouteStartInSeconds: 78,
                                },
                                {
                                    distanceFromRouteStartInMeters: 814,
                                    point: { latitude: 52.47252, longitude: 4.82196 },
                                    travelTimeFromRouteStartInSeconds: 78,
                                },
                                {
                                    distanceFromRouteStartInMeters: 821,
                                    point: { latitude: 52.47253, longitude: 4.82205 },
                                    travelTimeFromRouteStartInSeconds: 79,
                                },
                                {
                                    distanceFromRouteStartInMeters: 827,
                                    point: { latitude: 52.47256, longitude: 4.82214 },
                                    travelTimeFromRouteStartInSeconds: 80,
                                },
                                {
                                    distanceFromRouteStartInMeters: 832,
                                    point: { latitude: 52.47259, longitude: 4.82219 },
                                    travelTimeFromRouteStartInSeconds: 81,
                                },
                                {
                                    distanceFromRouteStartInMeters: 838,
                                    point: { latitude: 52.47264, longitude: 4.82221 },
                                    travelTimeFromRouteStartInSeconds: 81,
                                },
                                {
                                    distanceFromRouteStartInMeters: 844,
                                    point: { latitude: 52.4727, longitude: 4.8222 },
                                    travelTimeFromRouteStartInSeconds: 82,
                                },
                                {
                                    distanceFromRouteStartInMeters: 851,
                                    point: { latitude: 52.47276, longitude: 4.82215 },
                                    travelTimeFromRouteStartInSeconds: 84,
                                },
                                {
                                    distanceFromRouteStartInMeters: 855,
                                    point: { latitude: 52.47278, longitude: 4.82211 },
                                    travelTimeFromRouteStartInSeconds: 84,
                                },
                                {
                                    distanceFromRouteStartInMeters: 859,
                                    point: { latitude: 52.47279, longitude: 4.82206 },
                                    travelTimeFromRouteStartInSeconds: 85,
                                },
                                {
                                    distanceFromRouteStartInMeters: 862,
                                    point: { latitude: 52.4728, longitude: 4.82201 },
                                    travelTimeFromRouteStartInSeconds: 86,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.47362, longitude: 4.82161 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 959,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 959,
                                    point: { latitude: 52.47362, longitude: 4.82161 },
                                    travelTimeFromRouteStartInSeconds: 156,
                                },
                                {
                                    distanceFromRouteStartInMeters: 969,
                                    point: { latitude: 52.47365, longitude: 4.82175 },
                                    travelTimeFromRouteStartInSeconds: 164,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 72,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 68,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: true,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 52.47365, longitude: 4.82185 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 975,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 975,
                                    point: { latitude: 52.47365, longitude: 4.82185 },
                                    travelTimeFromRouteStartInSeconds: 169,
                                },
                                {
                                    distanceFromRouteStartInMeters: 977,
                                    point: { latitude: 52.47364, longitude: 4.82187 },
                                    travelTimeFromRouteStartInSeconds: 170,
                                },
                                {
                                    distanceFromRouteStartInMeters: 985,
                                    point: { latitude: 52.47358, longitude: 4.82193 },
                                    travelTimeFromRouteStartInSeconds: 176,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -45,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.47318, longitude: 4.82227 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1035,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1035,
                                    point: { latitude: 52.47318, longitude: 4.82227 },
                                    travelTimeFromRouteStartInSeconds: 212,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1038,
                                    point: { latitude: 52.47317, longitude: 4.82231 },
                                    travelTimeFromRouteStartInSeconds: 214,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1042,
                                    point: { latitude: 52.47317, longitude: 4.82236 },
                                    travelTimeFromRouteStartInSeconds: 216,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 48,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 31,
                                    side: 'RIGHT',
                                },
                                {
                                    offsetFromManeuverInMeters: 15,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -96,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.47332, longitude: 4.82325 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1104,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1104,
                                    point: { latitude: 52.47332, longitude: 4.82325 },
                                    travelTimeFromRouteStartInSeconds: 262,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1114,
                                    point: { latitude: 52.4734, longitude: 4.8232 },
                                    travelTimeFromRouteStartInSeconds: 269,
                                },
                            ],
                            sideRoads: [
                                {
                                    offsetFromManeuverInMeters: 31,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -39,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 52.4741, longitude: 4.82288 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            },
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1197,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1197,
                                    point: { latitude: 52.4741, longitude: 4.82288 },
                                    travelTimeFromRouteStartInSeconds: 328,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1207,
                                    point: { latitude: 52.47416, longitude: 4.82278 },
                                    travelTimeFromRouteStartInSeconds: 335,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 22,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isManeuverObligatory: false,
                            maneuver: 'turnSlightRight',
                            maneuverPoint: { latitude: 52.47427, longitude: 4.82261 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1223,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1223,
                                    point: { latitude: 52.47427, longitude: 4.82261 },
                                    travelTimeFromRouteStartInSeconds: 347,
                                },
                                {
                                    distanceFromRouteStartInMeters: 1228,
                                    point: { latitude: 52.47431, longitude: 4.82259 },
                                    travelTimeFromRouteStartInSeconds: 350,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            maneuver: 'arriveAhead',
                            maneuverPoint: { latitude: 52.47553, longitude: 4.82164 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 1379,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 1379,
                                    point: { latitude: 52.47553, longitude: 4.82164 },
                                    travelTimeFromRouteStartInSeconds: 459,
                                },
                            ],
                            sideRoads: [],
                        },
                    ],
                },
            ],
            roadShieldAtlasReference: 'https://api.tomtom.com/map/1/roadshield/1.0.0/',
        } as CalculateRouteResponseAPI,
        {} as CalculateRouteParams,
        {
            type: 'FeatureCollection',
            bbox: [4.81034, 52.47138, 4.82325, 52.47553],
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [4.81034, 52.47157],
                            [4.81051, 52.47159],
                            [4.81064, 52.47162],
                            [4.81069, 52.47162],
                            [4.81089, 52.47163],
                            [4.81106, 52.47164],
                            [4.81126, 52.47163],
                            [4.81137, 52.47163],
                            [4.81163, 52.47161],
                            [4.81179, 52.47159],
                            [4.81201, 52.47155],
                            [4.81219, 52.47153],
                            [4.81259, 52.47147],
                            [4.81322, 52.47141],
                            [4.81385, 52.47139],
                            [4.81467, 52.47138],
                            [4.81472, 52.47138],
                            [4.81513, 52.4714],
                            [4.81537, 52.4714],
                            [4.81566, 52.47143],
                            [4.81608, 52.47148],
                            [4.81608, 52.47148],
                            [4.81618, 52.47149],
                            [4.81623, 52.47149],
                            [4.81644, 52.47153],
                            [4.81734, 52.47168],
                            [4.8176, 52.47173],
                            [4.82073, 52.47239],
                            [4.82105, 52.47246],
                            [4.82126, 52.47248],
                            [4.82172, 52.47258],
                            [4.82182, 52.47256],
                            [4.82186, 52.47254],
                            [4.8219, 52.47253],
                            [4.82196, 52.47252],
                            [4.82205, 52.47253],
                            [4.82214, 52.47256],
                            [4.82219, 52.47259],
                            [4.82221, 52.47264],
                            [4.8222, 52.4727],
                            [4.82215, 52.47276],
                            [4.82211, 52.47278],
                            [4.82206, 52.47279],
                            [4.82201, 52.4728],
                            [4.82197, 52.47282],
                            [4.82193, 52.47289],
                            [4.8219, 52.47295],
                            [4.82188, 52.47299],
                            [4.82185, 52.47307],
                            [4.82186, 52.47311],
                            [4.8218, 52.47322],
                            [4.82173, 52.47338],
                            [4.82166, 52.47352],
                            [4.82163, 52.47357],
                            [4.82161, 52.47362],
                            [4.82181, 52.47366],
                            [4.82185, 52.47365],
                            [4.82187, 52.47364],
                            [4.82193, 52.47357],
                            [4.82205, 52.47343],
                            [4.82216, 52.4733],
                            [4.82227, 52.47318],
                            [4.82231, 52.47317],
                            [4.82236, 52.47317],
                            [4.8228, 52.47324],
                            [4.82325, 52.47332],
                            [4.82284, 52.47405],
                            [4.82284, 52.47407],
                            [4.82288, 52.4741],
                            [4.82261, 52.47427],
                            [4.82259, 52.47431],
                            [4.82251, 52.47441],
                            [4.82242, 52.47446],
                            [4.82233, 52.47455],
                            [4.82205, 52.47492],
                            [4.82192, 52.47513],
                            [4.82182, 52.47525],
                            [4.82172, 52.47542],
                            [4.82164, 52.47553],
                        ],
                    },
                    bbox: [4.81034, 52.47138, 4.82325, 52.47553],
                    properties: {
                        summary: {
                            lengthInMeters: 1380,
                            travelTimeInSeconds: 460,
                            trafficDelayInSeconds: 0,
                            trafficLengthInMeters: 0,
                            departureTime: new Date('2023-11-28T18:10:05.000Z'),
                            arrivalTime: new Date('2023-11-28T18:17:43.000Z'),
                            noTrafficTravelTimeInSeconds: 438,
                            historicTrafficTravelTimeInSeconds: 460,
                            liveTrafficIncidentsTravelTimeInSeconds: 460,
                        },
                        sections: {
                            leg: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 20,
                                    summary: {
                                        lengthInMeters: 395,
                                        travelTimeInSeconds: 46,
                                        trafficDelayInSeconds: 0,
                                        trafficLengthInMeters: 0,
                                        departureTime: new Date('2023-11-28T18:10:05.000Z'),
                                        arrivalTime: new Date('2023-11-28T18:10:50.000Z'),
                                        noTrafficTravelTimeInSeconds: 31,
                                        historicTrafficTravelTimeInSeconds: 46,
                                        liveTrafficIncidentsTravelTimeInSeconds: 46,
                                    },
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 20,
                                    endPointIndex: 78,
                                    summary: {
                                        lengthInMeters: 985,
                                        travelTimeInSeconds: 414,
                                        trafficDelayInSeconds: 0,
                                        trafficLengthInMeters: 0,
                                        departureTime: new Date('2023-11-28T18:10:50.000Z'),
                                        arrivalTime: new Date('2023-11-28T18:17:43.000Z'),
                                        noTrafficTravelTimeInSeconds: 406,
                                        historicTrafficTravelTimeInSeconds: 414,
                                        liveTrafficIncidentsTravelTimeInSeconds: 414,
                                    },
                                },
                            ],
                            urban: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 13,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 16,
                                    endPointIndex: 69,
                                },
                            ],
                            vehicleRestricted: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 54,
                                    endPointIndex: 61,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 68,
                                    endPointIndex: 78,
                                },
                            ],
                            country: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 78,
                                    countryCodeISO3: 'NLD',
                                },
                            ],
                            pedestrian: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 68,
                                    endPointIndex: 78,
                                },
                            ],
                            unpaved: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 71,
                                    endPointIndex: 78,
                                },
                            ],
                        },
                        guidance: {
                            instructions: [
                                {
                                    drivingSide: 'RIGHT',
                                    maneuver: 'DEPART',
                                    maneuverPoint: [4.81034, 52.47157],
                                    pathPointIndex: 0,
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's153',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0153\u2040ys.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Guisweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's153',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8\u0263\u0153\u2040ys.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Guisweg',
                                        },
                                    },
                                    routeOffsetInMeters: 0,
                                    routePath: [
                                        {
                                            distanceInMeters: 0,
                                            point: [4.81034, 52.47157],
                                            travelTimeInSeconds: 0,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    drivingSide: 'RIGHT',
                                    maneuver: 'WAYPOINT_RIGHT',
                                    maneuverPoint: [4.81609, 52.47148],
                                    pathPointIndex: 20,
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 'N515',
                                                },
                                            },
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's153',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8lex.\u028ba.t\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Leeghwaterweg',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 'N515',
                                                },
                                            },
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's153',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8lex.\u028ba.t\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Leeghwaterweg',
                                        },
                                    },
                                    routeOffsetInMeters: 395,
                                    routePath: [
                                        {
                                            distanceInMeters: 395,
                                            point: [4.81609, 52.47148],
                                            travelTimeInSeconds: 46,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 324,
                                            side: 'LEFT_AND_RIGHT',
                                        },
                                    ],
                                },
                                {
                                    changeOfAngleInDegrees: -88,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_LEFT',
                                    maneuverPoint: [4.82201, 52.4728],
                                    pathPointIndex: 42,
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 'N515',
                                                },
                                            },
                                            {
                                                countryCode: 'NLD',
                                                roadNumber: {
                                                    text: 's153',
                                                },
                                            },
                                        ],
                                        streetName: {
                                            phonetic: '\u02c8lex.\u028ba.t\u0259r.\u02cc\u028b\u025bx',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Leeghwaterweg',
                                        },
                                    },
                                    roundaboutExitNumber: 3,
                                    routeOffsetInMeters: 803,
                                    routePath: [
                                        {
                                            distanceInMeters: 803,
                                            point: [4.82182, 52.47256],
                                            travelTimeInSeconds: 77,
                                        },
                                        {
                                            distanceInMeters: 806,
                                            point: [4.82186, 52.47254],
                                            travelTimeInSeconds: 77,
                                        },
                                        {
                                            distanceInMeters: 810,
                                            point: [4.8219, 52.47253],
                                            travelTimeInSeconds: 78,
                                        },
                                        {
                                            distanceInMeters: 814,
                                            point: [4.82196, 52.47252],
                                            travelTimeInSeconds: 78,
                                        },
                                        {
                                            distanceInMeters: 821,
                                            point: [4.82205, 52.47253],
                                            travelTimeInSeconds: 79,
                                        },
                                        {
                                            distanceInMeters: 827,
                                            point: [4.82214, 52.47256],
                                            travelTimeInSeconds: 80,
                                        },
                                        {
                                            distanceInMeters: 832,
                                            point: [4.82219, 52.47259],
                                            travelTimeInSeconds: 81,
                                        },
                                        {
                                            distanceInMeters: 838,
                                            point: [4.82221, 52.47264],
                                            travelTimeInSeconds: 81,
                                        },
                                        {
                                            distanceInMeters: 844,
                                            point: [4.8222, 52.4727],
                                            travelTimeInSeconds: 82,
                                        },
                                        {
                                            distanceInMeters: 851,
                                            point: [4.82215, 52.47276],
                                            travelTimeInSeconds: 84,
                                        },
                                        {
                                            distanceInMeters: 855,
                                            point: [4.82211, 52.47278],
                                            travelTimeInSeconds: 84,
                                        },
                                        {
                                            distanceInMeters: 859,
                                            point: [4.82206, 52.47279],
                                            travelTimeInSeconds: 85,
                                        },
                                        {
                                            distanceInMeters: 862,
                                            point: [4.82201, 52.4728],
                                            travelTimeInSeconds: 86,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    changeOfAngleInDegrees: 90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.82161, 52.47362],
                                    pathPointIndex: 52,
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 959,
                                    routePath: [
                                        {
                                            distanceInMeters: 959,
                                            point: [4.82161, 52.47362],
                                            travelTimeInSeconds: 156,
                                        },
                                        {
                                            distanceInMeters: 969,
                                            point: [4.82175, 52.47365],
                                            travelTimeInSeconds: 164,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 72,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    changeOfAngleInDegrees: 68,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: true,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [4.82185, 52.47365],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    routeOffsetInMeters: 975,
                                    routePath: [
                                        {
                                            distanceInMeters: 975,
                                            point: [4.82185, 52.47365],
                                            travelTimeInSeconds: 169,
                                        },
                                        {
                                            distanceInMeters: 977,
                                            point: [4.82187, 52.47364],
                                            travelTimeInSeconds: 170,
                                        },
                                        {
                                            distanceInMeters: 985,
                                            point: [4.82193, 52.47358],
                                            travelTimeInSeconds: 176,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    changeOfAngleInDegrees: -45,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.82227, 52.47318],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    routeOffsetInMeters: 1035,
                                    routePath: [
                                        {
                                            distanceInMeters: 1035,
                                            point: [4.82227, 52.47318],
                                            travelTimeInSeconds: 212,
                                        },
                                        {
                                            distanceInMeters: 1038,
                                            point: [4.82231, 52.47317],
                                            travelTimeInSeconds: 214,
                                        },
                                        {
                                            distanceInMeters: 1042,
                                            point: [4.82236, 52.47317],
                                            travelTimeInSeconds: 216,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 48,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 31,
                                            side: 'RIGHT',
                                        },
                                        {
                                            offsetFromManeuverInMeters: 15,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    changeOfAngleInDegrees: -96,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.82325, 52.47332],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    routeOffsetInMeters: 1104,
                                    routePath: [
                                        {
                                            distanceInMeters: 1104,
                                            point: [4.82325, 52.47332],
                                            travelTimeInSeconds: 262,
                                        },
                                        {
                                            distanceInMeters: 1114,
                                            point: [4.8232, 52.4734],
                                            travelTimeInSeconds: 269,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            offsetFromManeuverInMeters: 31,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    changeOfAngleInDegrees: -39,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [4.82288, 52.4741],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8z\u025b\u2040i.l\u0259n.ma.k\u0259rs.\u02ccp\u0251t',
                                            phoneticLanguageCode: 'nl-NL',
                                            text: 'Zeilenmakerspad',
                                        },
                                    },
                                    routeOffsetInMeters: 1197,
                                    routePath: [
                                        {
                                            distanceInMeters: 1197,
                                            point: [4.82288, 52.4741],
                                            travelTimeInSeconds: 328,
                                        },
                                        {
                                            distanceInMeters: 1207,
                                            point: [4.82278, 52.47416],
                                            travelTimeInSeconds: 335,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    changeOfAngleInDegrees: 22,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'SLIGHT_RIGHT',
                                    maneuverPoint: [4.82261, 52.47427],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 1223,
                                    routePath: [
                                        {
                                            distanceInMeters: 1223,
                                            point: [4.82261, 52.47427],
                                            travelTimeInSeconds: 347,
                                        },
                                        {
                                            distanceInMeters: 1228,
                                            point: [4.82259, 52.47431],
                                            travelTimeInSeconds: 350,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ARRIVE_AHEAD',
                                    maneuverPoint: [4.82164, 52.47553],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 1379,
                                    routePath: [
                                        {
                                            distanceInMeters: 1379,
                                            point: [4.82164, 52.47553],
                                            travelTimeInSeconds: 459,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                            ],
                        },
                    },
                },
            ],
        } as Routes,
    ],
    [
        'LDEVR A-B route',
        {
            routes: [
                {
                    summary: {
                        lengthInMeters: 106424,
                        travelDurationInSeconds: 5755,
                        trafficDelayDurationInSeconds: 279,
                        trafficLengthInMeters: 2126,
                        departureDateTime: '2025-10-29T15:33:57+01:00',
                        arrivalDateTime: '2025-10-29T17:09:52+01:00',
                        batteryConsumptionInkWh: 23.263960253333337,
                        remainingChargeAtArrivalInkWh: 24.06296924,
                        totalChargingTimeInSeconds: 367,
                    },
                    legs: [
                        {
                            summary: {
                                lengthInMeters: 91772,
                                travelDurationInSeconds: 4247,
                                trafficDelayDurationInSeconds: 279,
                                trafficLengthInMeters: 2126,
                                departureDateTime: '2025-10-29T15:33:57+01:00',
                                arrivalDateTime: '2025-10-29T16:44:44+01:00',
                                batteryConsumptionInkWh: 20.646929493333335,
                                remainingChargeAtArrivalInkWh: 11.353070506666665,
                                chargingInformationAtEndOfLeg: {
                                    chargingConnectionInfo: {
                                        chargingVoltageInV: 800,
                                        chargingCurrentInA: 438,
                                        chargingCurrentType: 'Direct_Current',
                                        chargingPowerInkW: 350,
                                        chargingPlugType: 'Combo_to_IEC_62196_Type_2_Base',
                                        plugAndChargeSupport: 'SUPPORTED',
                                    },
                                    targetChargeInkWh: 26.68,
                                    chargingTimeInSeconds: 367,
                                    chargingParkUuid: '6c7aeb4e-c3e5-4f0e-83eb-721c8623e39e',
                                    chargingParkExternalId: '6c7aeb4e-c3e5-4f0e-83eb-721c8623e39e',
                                    chargingParkName: 'IONITY',
                                    chargingParkOperatorName: 'IONITY',
                                    chargingParkLocation: {
                                        coordinate: {
                                            latitude: 41.8987318,
                                            longitude: 2.7705115,
                                        },
                                        street: 'N-156',
                                        city: "Vilob\u00ed d'Onyar",
                                        postalCode: '17185',
                                        countryCode: 'ES',
                                    },
                                    chargingParkPaymentOptions: [
                                        {
                                            method: 'Subscription',
                                            brands: [
                                                'Shell Recharge',
                                                'EnBW mobility+',
                                                'EVBox Charge',
                                                'Eneco',
                                                'Vandebron',
                                                'ChargePoint',
                                                'Travel Card - Travelcard Laadpas',
                                                'enviaM',
                                                'Virta',
                                                'Freshmile Pass',
                                                'AVIA',
                                                'MKB brandstof',
                                                'GP Joule Connect GmbH',
                                                'Duferco Energia - D-Mobility',
                                                'E.ON Drive',
                                                'E-Flux',
                                                'DKV Mobility - DKV CARD +CHARGE',
                                                'Chargemap Pass',
                                                'Aral Pulse Fuel & Charge Ladekarte',
                                                'Mobiflow',
                                                'stations-e',
                                                'NEXTCHARGE card',
                                                'Corpay Card',
                                                'Digital Charging Solutions - ChargeNow Laadkaart',
                                                'Octopus Electroverse',
                                                'ConnectNed',
                                                'emyon',
                                                'Q8 Electric App',
                                                'LOGPAY - CHARGE&FUEL CARD ',
                                                "EDI - D'Ieteren Energy",
                                                'Plugsurfing',
                                                'Northe',
                                            ],
                                            mobilityServiceProviders: [
                                                {
                                                    brand: 'Shell Recharge',
                                                },
                                                {
                                                    brand: 'EnBW mobility+',
                                                },
                                                {
                                                    brand: 'EVBox Charge',
                                                },
                                                {
                                                    brand: 'Eneco',
                                                },
                                                {
                                                    brand: 'Vandebron',
                                                },
                                                {
                                                    brand: 'ChargePoint',
                                                },
                                                {
                                                    brand: 'Travel Card - Travelcard Laadpas',
                                                },
                                                {
                                                    brand: 'enviaM',
                                                },
                                                {
                                                    brand: 'Virta',
                                                },
                                                {
                                                    brand: 'Freshmile Pass',
                                                },
                                                {
                                                    brand: 'AVIA',
                                                },
                                                {
                                                    brand: 'MKB brandstof',
                                                },
                                                {
                                                    brand: 'GP Joule Connect GmbH',
                                                },
                                                {
                                                    brand: 'Duferco Energia - D-Mobility',
                                                },
                                                {
                                                    brand: 'E.ON Drive',
                                                },
                                                {
                                                    brand: 'E-Flux',
                                                },
                                                {
                                                    brand: 'DKV Mobility - DKV CARD +CHARGE',
                                                },
                                                {
                                                    brand: 'Chargemap Pass',
                                                },
                                                {
                                                    brand: 'Aral Pulse Fuel & Charge Ladekarte',
                                                },
                                                {
                                                    brand: 'Mobiflow',
                                                },
                                                {
                                                    brand: 'stations-e',
                                                },
                                                {
                                                    brand: 'NEXTCHARGE card',
                                                },
                                                {
                                                    brand: 'Corpay Card',
                                                },
                                                {
                                                    brand: 'Digital Charging Solutions - ChargeNow Laadkaart',
                                                },
                                                {
                                                    brand: 'Octopus Electroverse',
                                                },
                                                {
                                                    brand: 'ConnectNed',
                                                },
                                                {
                                                    brand: 'emyon',
                                                },
                                                {
                                                    brand: 'Q8 Electric App',
                                                },
                                                {
                                                    brand: 'LOGPAY - CHARGE&FUEL CARD ',
                                                },
                                                {
                                                    brand: "EDI - D'Ieteren Energy",
                                                },
                                                {
                                                    brand: 'Plugsurfing',
                                                },
                                                {
                                                    brand: 'Northe',
                                                },
                                            ],
                                        },
                                    ],
                                    chargingParkPowerInkW: 350,
                                    chargingStopType: 'Auto_Generated',
                                    chargePointOperator: {
                                        name: 'IONITY',
                                    },
                                    chargingParkOpeningHours: {
                                        twentyFourSeven: 'true',
                                        timeZoneOffset: '+01:00',
                                    },
                                },
                            },
                            path: {
                                type: 'LineString',
                                coordinates: [
                                    [2.173445, 41.3850457],
                                    [2.1734717, 41.3850582],
                                    [2.770679, 41.8985751],
                                ],
                            },
                        },
                        {
                            summary: {
                                lengthInMeters: 14652,
                                travelDurationInSeconds: 1141,
                                trafficDelayDurationInSeconds: 0,
                                trafficLengthInMeters: 0,
                                departureDateTime: '2025-10-29T16:50:51+01:00',
                                arrivalDateTime: '2025-10-29T17:09:52+01:00',
                                batteryConsumptionInkWh: 2.6170307600000005,
                                remainingChargeAtArrivalInkWh: 24.06296924,
                            },
                            path: {
                                type: 'LineString',
                                coordinates: [
                                    [2.770474, 41.8986964],
                                    [2.770679, 41.8985751],
                                    [2.7706468, 41.8985483],
                                ],
                            },
                        },
                    ],
                    sections: {
                        pedestrian: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 16,
                            },
                        ],
                        travelMode: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 16,
                                travelMode: 'other',
                            },
                            {
                                startPathIndex: 16,
                                endPathIndex: 1941,
                                travelMode: 'car',
                            },
                        ],
                        speedLimit: [
                            {
                                startPathIndex: 16,
                                endPathIndex: 41,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 20 }],
                            },
                            {
                                startPathIndex: 41,
                                endPathIndex: 97,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 30 }],
                            },
                            {
                                startPathIndex: 97,
                                endPathIndex: 150,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 50 }],
                            },
                            {
                                startPathIndex: 150,
                                endPathIndex: 524,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 80 }],
                            },
                            {
                                startPathIndex: 524,
                                endPathIndex: 543,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 120 }],
                            },
                            {
                                startPathIndex: 543,
                                endPathIndex: 580,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 100 }],
                            },
                            {
                                startPathIndex: 580,
                                endPathIndex: 605,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 120 }],
                            },
                            {
                                startPathIndex: 605,
                                endPathIndex: 613,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 100 }],
                            },
                            {
                                startPathIndex: 613,
                                endPathIndex: 705,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 120 }],
                            },
                            {
                                startPathIndex: 705,
                                endPathIndex: 712,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 100 }],
                            },
                            {
                                startPathIndex: 712,
                                endPathIndex: 1459,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 120 }],
                            },
                            {
                                startPathIndex: 1459,
                                endPathIndex: 1463,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 100 }],
                            },
                            {
                                startPathIndex: 1463,
                                endPathIndex: 1465,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 70 }],
                            },
                            {
                                startPathIndex: 1465,
                                endPathIndex: 1476,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 50 }],
                            },
                            {
                                startPathIndex: 1476,
                                endPathIndex: 1484,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 60 }],
                            },
                            {
                                startPathIndex: 1484,
                                endPathIndex: 1488,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 40 }],
                            },
                            {
                                startPathIndex: 1489,
                                endPathIndex: 1507,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 90 }],
                            },
                            {
                                startPathIndex: 1507,
                                endPathIndex: 1511,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 40 }],
                            },
                            {
                                startPathIndex: 1543,
                                endPathIndex: 1546,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 90 }],
                            },
                            {
                                startPathIndex: 1546,
                                endPathIndex: 1560,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 70 }],
                            },
                            {
                                startPathIndex: 1560,
                                endPathIndex: 1563,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 40 }],
                            },
                            {
                                startPathIndex: 1582,
                                endPathIndex: 1586,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 90 }],
                            },
                            {
                                startPathIndex: 1586,
                                endPathIndex: 1607,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 60 }],
                            },
                            {
                                startPathIndex: 1607,
                                endPathIndex: 1684,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 120 }],
                            },
                            {
                                startPathIndex: 1684,
                                endPathIndex: 1687,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 80 }],
                            },
                            {
                                startPathIndex: 1687,
                                endPathIndex: 1701,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 60 }],
                            },
                            {
                                startPathIndex: 1701,
                                endPathIndex: 1716,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 40 }],
                            },
                            {
                                startPathIndex: 1716,
                                endPathIndex: 1722,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 100 }],
                            },
                            {
                                startPathIndex: 1722,
                                endPathIndex: 1751,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 80 }],
                            },
                            {
                                startPathIndex: 1751,
                                endPathIndex: 1760,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 40 }],
                            },
                            {
                                startPathIndex: 1785,
                                endPathIndex: 1788,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 30 }],
                            },
                            {
                                startPathIndex: 1788,
                                endPathIndex: 1797,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 40 }],
                            },
                            {
                                startPathIndex: 1797,
                                endPathIndex: 1802,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 30 }],
                            },
                            {
                                startPathIndex: 1810,
                                endPathIndex: 1813,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 50 }],
                            },
                            {
                                startPathIndex: 1813,
                                endPathIndex: 1912,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 40 }],
                            },
                            {
                                startPathIndex: 1912,
                                endPathIndex: 1941,
                                speedRestrictions: [{ type: 'maximum', inKilometersPerHour: 30 }],
                            },
                        ],
                        urban: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 106,
                            },
                            {
                                startPathIndex: 113,
                                endPathIndex: 177,
                            },
                            {
                                startPathIndex: 183,
                                endPathIndex: 189,
                            },
                            {
                                startPathIndex: 244,
                                endPathIndex: 281,
                            },
                            {
                                startPathIndex: 290,
                                endPathIndex: 314,
                            },
                            {
                                startPathIndex: 361,
                                endPathIndex: 373,
                            },
                            {
                                startPathIndex: 374,
                                endPathIndex: 388,
                            },
                            {
                                startPathIndex: 389,
                                endPathIndex: 417,
                            },
                            {
                                startPathIndex: 444,
                                endPathIndex: 472,
                            },
                            {
                                startPathIndex: 480,
                                endPathIndex: 519,
                            },
                            {
                                startPathIndex: 531,
                                endPathIndex: 552,
                            },
                            {
                                startPathIndex: 554,
                                endPathIndex: 590,
                            },
                            {
                                startPathIndex: 654,
                                endPathIndex: 681,
                            },
                            {
                                startPathIndex: 712,
                                endPathIndex: 738,
                            },
                            {
                                startPathIndex: 807,
                                endPathIndex: 816,
                            },
                            {
                                startPathIndex: 877,
                                endPathIndex: 899,
                            },
                            {
                                startPathIndex: 971,
                                endPathIndex: 1006,
                            },
                            {
                                startPathIndex: 1012,
                                endPathIndex: 1052,
                            },
                            {
                                startPathIndex: 1730,
                                endPathIndex: 1753,
                            },
                            {
                                startPathIndex: 1798,
                                endPathIndex: 1941,
                            },
                        ],
                        motorway: [
                            {
                                startPathIndex: 111,
                                endPathIndex: 114,
                            },
                            {
                                startPathIndex: 150,
                                endPathIndex: 351,
                            },
                            {
                                startPathIndex: 352,
                                endPathIndex: 1459,
                            },
                            {
                                startPathIndex: 1607,
                                endPathIndex: 1684,
                            },
                        ],
                        tunnel: [
                            {
                                startPathIndex: 152,
                                endPathIndex: 177,
                            },
                            {
                                startPathIndex: 194,
                                endPathIndex: 218,
                            },
                            {
                                startPathIndex: 257,
                                endPathIndex: 270,
                            },
                            {
                                startPathIndex: 379,
                                endPathIndex: 383,
                            },
                            {
                                startPathIndex: 396,
                                endPathIndex: 402,
                            },
                            {
                                startPathIndex: 410,
                                endPathIndex: 415,
                            },
                        ],
                        roadShields: [
                            {
                                startPathIndex: 150,
                                endPathIndex: 448,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-autopista-autovia',
                                        shieldContent: 'B-10',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 448,
                                endPathIndex: 476,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-autopista-autovia',
                                        shieldContent: 'C-58',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 476,
                                endPathIndex: 490,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-autopista-autovia',
                                        shieldContent: 'C-33',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 498,
                                endPathIndex: 698,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-autopista-autovia',
                                        shieldContent: 'C-33',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 698,
                                endPathIndex: 1459,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-autopista-autovia',
                                        shieldContent: 'AP-7',
                                    },
                                    {
                                        reference: 'european-road',
                                        shieldContent: 'E-15',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 1488,
                                endPathIndex: 1519,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-carretera-de-la-rige',
                                        shieldContent: 'N-156',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 1528,
                                endPathIndex: 1582,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-carretera-de-la-rige',
                                        shieldContent: 'N-156',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 1607,
                                endPathIndex: 1684,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-autopista-autovia',
                                        shieldContent: 'AP-7',
                                    },
                                    {
                                        reference: 'european-road',
                                        shieldContent: 'E-15',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 1716,
                                endPathIndex: 1751,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-autopista-autovia',
                                        shieldContent: 'C-65',
                                    },
                                ],
                            },
                            {
                                startPathIndex: 1760,
                                endPathIndex: 1912,
                                roadShieldReferences: [
                                    {
                                        reference: 'esp-carretera-de-la-rige',
                                        shieldContent: 'N-IIa',
                                    },
                                ],
                            },
                        ],
                        lowEmissionZone: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 498,
                            },
                        ],
                        country: [
                            {
                                startPathIndex: 0,
                                endPathIndex: 1941,
                                countryCodeIso2: 'ES',
                            },
                        ],
                        traffic: [
                            {
                                startPathIndex: 83,
                                endPathIndex: 98,
                                effectiveSpeedInKilometersPerHour: 15,
                                delayDurationInSeconds: 0,
                                delayMagnitude: 'undefined',
                                tec: { causes: [{ mainCauseCode: 3 }], effectCode: 1 },
                            },
                            {
                                startPathIndex: 99,
                                endPathIndex: 127,
                                effectiveSpeedInKilometersPerHour: 5,
                                delayDurationInSeconds: 204,
                                delayMagnitude: 'minor',
                                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                            },
                            {
                                startPathIndex: 344,
                                endPathIndex: 387,
                                effectiveSpeedInKilometersPerHour: 39,
                                delayDurationInSeconds: 75,
                                delayMagnitude: 'minor',
                                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 4 },
                            },
                            {
                                startPathIndex: 1488,
                                endPathIndex: 1519,
                                effectiveSpeedInKilometersPerHour: 52,
                                delayDurationInSeconds: 0,
                                delayMagnitude: 'undefined',
                                tec: {
                                    causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                    effectCode: 1,
                                },
                            },
                            {
                                startPathIndex: 1528,
                                endPathIndex: 1531,
                                effectiveSpeedInKilometersPerHour: 52,
                                delayDurationInSeconds: 0,
                                delayMagnitude: 'undefined',
                                tec: {
                                    causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                    effectCode: 1,
                                },
                            },
                            {
                                startPathIndex: 1540,
                                endPathIndex: 1568,
                                effectiveSpeedInKilometersPerHour: 56,
                                delayDurationInSeconds: 0,
                                delayMagnitude: 'undefined',
                                tec: {
                                    causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                    effectCode: 1,
                                },
                            },
                            {
                                startPathIndex: 1575,
                                endPathIndex: 1582,
                                effectiveSpeedInKilometersPerHour: 52,
                                delayDurationInSeconds: 0,
                                delayMagnitude: 'undefined',
                                tec: {
                                    causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                    effectCode: 1,
                                },
                            },
                        ],
                        lanes: [
                            {
                                startPathIndex: 137,
                                endPathIndex: 138,
                                lanes: [
                                    {
                                        directions: ['slightLeft'],
                                        follow: 'slightLeft',
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'shortDashed', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 144,
                                endPathIndex: 150,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 425,
                                endPathIndex: 428,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight', 'slightRight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['slightRight'],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 475,
                                endPathIndex: 476,
                                lanes: [
                                    {
                                        directions: [],
                                    },
                                    {
                                        directions: [],
                                    },
                                    {
                                        directions: [],
                                    },
                                    {
                                        directions: [],
                                    },
                                ],
                                laneSeparators: [
                                    'singleSolid',
                                    'longDashed',
                                    'shortDashed',
                                    'longDashed',
                                    'singleSolid',
                                ],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 663,
                                endPathIndex: 666,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['slightRight'],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'shortDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1458,
                                endPathIndex: 1459,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['slightRight'],
                                        follow: 'slightRight',
                                    },
                                ],
                                laneSeparators: [
                                    'singleSolid',
                                    'longDashed',
                                    'longDashed',
                                    'shortDashed',
                                    'singleSolid',
                                ],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1486,
                                endPathIndex: 1488,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1488,
                                endPathIndex: 1489,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['slightRight', 'straight'],
                                        follow: 'slightRight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1510,
                                endPathIndex: 1511,
                                lanes: [
                                    {
                                        directions: ['straight', 'slightRight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['slightRight', 'straight'],
                                    },
                                ],
                                laneSeparators: ['doubleSolid', 'singleSolid', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1515,
                                endPathIndex: 1519,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1525,
                                endPathIndex: 1528,
                                lanes: [
                                    {
                                        directions: ['straight', 'slightRight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['slightRight', 'straight'],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1540,
                                endPathIndex: 1543,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1561,
                                endPathIndex: 1563,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1580,
                                endPathIndex: 1582,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['slightRight', 'straight'],
                                        follow: 'slightRight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1604,
                                endPathIndex: 1607,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1614,
                                endPathIndex: 1614,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['slightRight'],
                                    },
                                ],
                                laneSeparators: [
                                    'singleSolid',
                                    'longDashed',
                                    'longDashed',
                                    'shortDashed',
                                    'singleSolid',
                                ],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1683,
                                endPathIndex: 1684,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['slightRight'],
                                        follow: 'slightRight',
                                    },
                                ],
                                laneSeparators: [
                                    'singleSolid',
                                    'longDashed',
                                    'longDashed',
                                    'longDashed',
                                    'shortDashed',
                                    'singleSolid',
                                ],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1703,
                                endPathIndex: 1703,
                                lanes: [
                                    {
                                        directions: [],
                                    },
                                    {
                                        directions: [],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1707,
                                endPathIndex: 1716,
                                lanes: [
                                    {
                                        directions: [],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1735,
                                endPathIndex: 1736,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['slightRight'],
                                    },
                                    {
                                        directions: ['slightRight'],
                                    },
                                ],
                                laneSeparators: [
                                    'singleSolid',
                                    'longDashed',
                                    'shortDashed',
                                    'longDashed',
                                    'singleSolid',
                                ],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1748,
                                endPathIndex: 1751,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                    {
                                        directions: ['slightRight'],
                                        follow: 'slightRight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'shortDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1755,
                                endPathIndex: 1757,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1757,
                                endPathIndex: 1760,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1782,
                                endPathIndex: 1785,
                                lanes: [
                                    {
                                        directions: ['slightLeft', 'straight'],
                                    },
                                    {
                                        directions: ['slightRight', 'straight', 'slightLeft'],
                                        follow: 'slightRight',
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1798,
                                endPathIndex: 1802,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight'],
                                    },
                                ],
                                laneSeparators: ['singleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                            {
                                startPathIndex: 1899,
                                endPathIndex: 1900,
                                lanes: [
                                    {
                                        directions: ['straight'],
                                        follow: 'straight',
                                    },
                                    {
                                        directions: ['straight', 'right'],
                                        follow: 'straight',
                                    },
                                ],
                                laneSeparators: ['doubleSolid', 'longDashed', 'singleSolid'],
                                properties: ['IS_MANEUVER'],
                            },
                        ],
                    },
                    instructions: [
                        {
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'depart',
                            maneuverPoint: { latitude: 41.3850457, longitude: 2.173445 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.\u02c8nu\u02d0.\u00f0\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de la Canuda',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.\u02c8nu\u02d0.\u00f0\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de la Canuda',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 0,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 0,
                                    point: { latitude: 41.3850457, longitude: 2.173445 },
                                    travelTimeFromRouteStartInSeconds: 0,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 90,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 41.385144, longitude: 2.1736944 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u025bl \u02c8p\u0254\u02d0\u027b.t\u0259l \u02c8d\u025bl \u02c8e\u2040\u026an.d\u2040\u0292\u0259l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida del Portal del \u00c1ngel',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.\u02c8nu\u02d0.\u00f0\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de la Canuda',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 24,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 24,
                                    point: { latitude: 41.385144, longitude: 2.1736944 },
                                    travelTimeFromRouteStartInSeconds: 18,
                                },
                                {
                                    distanceFromRouteStartInMeters: 28,
                                    point: { latitude: 41.3851064, longitude: 2.1737078 },
                                    travelTimeFromRouteStartInSeconds: 21,
                                },
                                {
                                    distanceFromRouteStartInMeters: 34,
                                    point: { latitude: 41.3850632, longitude: 2.1737441 },
                                    travelTimeFromRouteStartInSeconds: 25,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -73,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 41.3846666, longitude: 2.1740645 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'LEFT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u0259\u2040\u028as \u02c8\u0251\u02d0\u027b.k\u0259\u2040\u028as',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de los Arcos',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u025bl \u02c8p\u0254\u02d0\u027b.t\u0259l \u02c8d\u025bl \u02c8e\u2040\u026an.d\u2040\u0292\u0259l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida del Portal del \u00c1ngel',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 86,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 86,
                                    point: { latitude: 41.3846666, longitude: 2.1740645 },
                                    travelTimeFromRouteStartInSeconds: 64,
                                },
                                {
                                    distanceFromRouteStartInMeters: 96,
                                    point: { latitude: 41.3846831, longitude: 2.1741825 },
                                    travelTimeFromRouteStartInSeconds: 72,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -45,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 41.3842133, longitude: 2.1752366 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'SLIGHT_LEFT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.t\u025b.\u02c8\u00f0\u027b\u00e6l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida de la Catedral',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 203,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 203,
                                    point: { latitude: 41.3842133, longitude: 2.1752366 },
                                    travelTimeFromRouteStartInSeconds: 152,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -85,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 41.3842374, longitude: 2.1752903 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'LEFT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.t\u025b.\u02c8\u00f0\u027b\u00e6l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida de la Catedral',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 208,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 208,
                                    point: { latitude: 41.3842374, longitude: 2.1752903 },
                                    travelTimeFromRouteStartInSeconds: 156,
                                },
                                {
                                    distanceFromRouteStartInMeters: 218,
                                    point: { latitude: 41.3843198, longitude: 2.1752424 },
                                    travelTimeFromRouteStartInSeconds: 164,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 124,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: true,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 41.3864368, longitude: 2.175411 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'SHARP_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8bi\u02d0.\u0259 l\u0259.j\u0259.\u02c8t\u00e6.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'V\u00eda Laietana',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 503,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 503,
                                    point: { latitude: 41.3864368, longitude: 2.175411 },
                                    travelTimeFromRouteStartInSeconds: 342,
                                },
                                {
                                    distanceFromRouteStartInMeters: 513,
                                    point: { latitude: 41.3863725, longitude: 2.1754945 },
                                    travelTimeFromRouteStartInSeconds: 349,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 175,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepLeft',
                            maneuverPoint: { latitude: 41.3835803, longitude: 2.1896911 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'SLIGHT_LEFT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u025bl \u02c8d\u0252k.t\u0259\u027b \u0259j.gw\u0259.\u02c8\u00f0\u025b',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle del Doctor Aiguader',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u025bl \u02c8d\u0252k.t\u0259\u027b \u0259j.gw\u0259.\u02c8\u00f0\u025b',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle del Doctor Aiguader',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 2033,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 2033,
                                    point: { latitude: 41.3835803, longitude: 2.1896911 },
                                    travelTimeFromRouteStartInSeconds: 1025,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 987,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 880,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 880,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 732,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 732,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 723,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 630,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 540,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 428,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 428,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 326,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 326,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 240,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 240,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 177,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 116,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 7,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'mergeRightLane',
                            maneuverPoint: { latitude: 41.3857207, longitude: 2.1934864 },
                            nextRoadInformation: {
                                properties: ['URBAN', 'CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'B-10',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8bi\u02d0 \u02c8t\u025bn' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'B-10',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u025bl li\u02d0.t\u0254\u02d0.\u02c8\u027b\u00e6l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda del Litoral',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 2433,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 2433,
                                    point: { latitude: 41.3857207, longitude: 2.1934864 },
                                    travelTimeFromRouteStartInSeconds: 1058,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepLeft',
                            maneuverPoint: { latitude: 41.4492086, longitude: 2.1996582 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'C-58',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8si\u02d0 f\u026af.ti\u02d0.\u02c8e\u2040\u026at' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'C-58',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'B-10',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8bi\u02d0 \u02c8t\u025bn' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'B-10',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u025bl li\u02d0.t\u0254\u02d0.\u02c8\u027b\u00e6l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda del Litoral',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 11215,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 11215,
                                    point: { latitude: 41.4492086, longitude: 2.1996582 },
                                    travelTimeFromRouteStartInSeconds: 1588,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 573,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 129,
                                    side: 'RIGHT',
                                },
                            ],
                            signpost: {
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '',
                                },
                                towardName: {
                                    phonetic: { ipa: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259' },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'Girona',
                                },
                            },
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepRight',
                            maneuverPoint: { latitude: 41.4570916, longitude: 2.1879101 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_LEFT'],
                                onRouteAngle: 'SLIGHT_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'C-58',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8si\u02d0 f\u026af.ti\u02d0.\u02c8e\u2040\u026at' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'C-58',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl b\u00e6.\u02c8j\u025bs',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Vall\u00e9s',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 12661,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 12661,
                                    point: { latitude: 41.4570916, longitude: 2.1879101 },
                                    travelTimeFromRouteStartInSeconds: 1660,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 800,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 773,
                                    side: 'RIGHT',
                                },
                            ],
                            signpost: {
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '',
                                },
                                towardName: {
                                    phonetic: { ipa: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259' },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'Girona',
                                },
                            },
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepLeft',
                            maneuverPoint: { latitude: 41.5490913, longitude: 2.2356266 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN', 'MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN', 'MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'C-33',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8si\u02d0 \u03b8\u025c\u02d0.ti\u02d0.\u02c8\u03b8\u027bi\u02d0',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'C-33',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 24680,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 24680,
                                    point: { latitude: 41.5490913, longitude: 2.2356266 },
                                    travelTimeFromRouteStartInSeconds: 2068,
                                },
                            ],
                            sideRoads: [],
                            signpost: {
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '',
                                },
                                towardName: {
                                    phonetic: { ipa: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259' },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'Girona',
                                },
                            },
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'exitMotorwayRight',
                            maneuverPoint: { latitude: 41.8932804, longitude: 2.7750912 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'SLIGHT_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'C-25',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8si\u02d0 tw\u025bn.ti\u02d0.\u02c8fa\u2040\u026av',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'C-25',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 90058,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 90058,
                                    point: { latitude: 41.8932804, longitude: 2.7750912 },
                                    travelTimeFromRouteStartInSeconds: 4096,
                                },
                            ],
                            sideRoads: [],
                            signpost: {
                                exitIconReference: {
                                    reference: 'exit-esp-right',
                                    shieldContent: '8',
                                },
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '8',
                                },
                                towardName: {
                                    phonetic: {
                                        ipa: '\u027bi\u02d0.u\u02d0.\u02c8\u00f0\u025b.j\u0254\u02d0ts \u02c8d\u0259 \u02c8l\u00e6 \u02c8s\u025bl.v\u0259',
                                    },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'RIUDELLOTS DE LA SELVA',
                                },
                            },
                        },
                        {
                            changeOfAngleInDegrees: 122,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'roundaboutSharpRight',
                            maneuverPoint: { latitude: 41.8932778, longitude: 2.7790877 },
                            maneuverView: {
                                offRouteAngles: ['SHARP_LEFT', 'SLIGHT_LEFT', 'RIGHT'],
                                onRouteAngle: 'SHARP_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-156',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-156',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 1,
                            roundaboutType: 'DEFAULT',
                            routeOffsetInMeters: 90774,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 90774,
                                    point: { latitude: 41.8933287, longitude: 2.779195 },
                                    travelTimeFromRouteStartInSeconds: 4141,
                                },
                                {
                                    distanceFromRouteStartInMeters: 90785,
                                    point: { latitude: 41.8932778, longitude: 2.7790877 },
                                    travelTimeFromRouteStartInSeconds: 4142,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 340,
                                    side: 'LEFT',
                                },
                            ],
                            signpost: {
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '',
                                },
                                towardName: {
                                    phonetic: { ipa: '\u0259.\u02c8e\u2040\u026a.\u027b\u0259.p\u0254\u02d0\u027bt' },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'Aeroport',
                                },
                            },
                        },
                        {
                            changeOfAngleInDegrees: 83,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'roundaboutSlightRight',
                            maneuverPoint: { latitude: 41.8984571, longitude: 2.7704725 },
                            maneuverView: {
                                offRouteAngles: ['LEFT', 'STRAIGHT', 'RIGHT'],
                                onRouteAngle: 'SLIGHT_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-156',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-156',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 2,
                            roundaboutType: 'DEFAULT',
                            routeOffsetInMeters: 91678,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 91678,
                                    point: { latitude: 41.8980896, longitude: 2.7706146 },
                                    travelTimeFromRouteStartInSeconds: 4202,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91686,
                                    point: { latitude: 41.8981433, longitude: 2.7706629 },
                                    travelTimeFromRouteStartInSeconds: 4203,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91693,
                                    point: { latitude: 41.898205, longitude: 2.770687 },
                                    travelTimeFromRouteStartInSeconds: 4204,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91700,
                                    point: { latitude: 41.8982694, longitude: 2.770687 },
                                    travelTimeFromRouteStartInSeconds: 4204,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91707,
                                    point: { latitude: 41.898331, longitude: 2.7706629 },
                                    travelTimeFromRouteStartInSeconds: 4205,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91712,
                                    point: { latitude: 41.898374, longitude: 2.7706307 },
                                    travelTimeFromRouteStartInSeconds: 4206,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91718,
                                    point: { latitude: 41.8984088, longitude: 2.7705878 },
                                    travelTimeFromRouteStartInSeconds: 4206,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91723,
                                    point: { latitude: 41.8984383, longitude: 2.7705315 },
                                    travelTimeFromRouteStartInSeconds: 4207,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91729,
                                    point: { latitude: 41.8984571, longitude: 2.7704725 },
                                    travelTimeFromRouteStartInSeconds: 4208,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 849,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 268,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 168,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -107,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: true,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 41.8985751, longitude: 2.770679 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'LEFT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 91750,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 91750,
                                    point: { latitude: 41.8985751, longitude: 2.770679 },
                                    travelTimeFromRouteStartInSeconds: 4227,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91760,
                                    point: { latitude: 41.8986308, longitude: 2.770585 },
                                    travelTimeFromRouteStartInSeconds: 4237,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'waypointRight',
                            maneuverPoint: { latitude: 41.8986965, longitude: 2.770474 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 91772,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 91772,
                                    point: { latitude: 41.8986965, longitude: 2.770474 },
                                    travelTimeFromRouteStartInSeconds: 4614,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -180,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'makeUTurn',
                            maneuverPoint: { latitude: 41.8986965, longitude: 2.770474 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'BACK',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 91772,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 91772,
                                    point: { latitude: 41.8986965, longitude: 2.770474 },
                                    travelTimeFromRouteStartInSeconds: 4614,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91782,
                                    point: { latitude: 41.8986408, longitude: 2.7705679 },
                                    travelTimeFromRouteStartInSeconds: 4627,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 107,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: true,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 41.8985751, longitude: 2.770679 },
                            maneuverView: {
                                offRouteAngles: [],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 91794,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 91794,
                                    point: { latitude: 41.8985751, longitude: 2.770679 },
                                    travelTimeFromRouteStartInSeconds: 4641,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91798,
                                    point: { latitude: 41.8985483, longitude: 2.7706468 },
                                    travelTimeFromRouteStartInSeconds: 4642,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91804,
                                    point: { latitude: 41.8985188, longitude: 2.7705878 },
                                    travelTimeFromRouteStartInSeconds: 4644,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91804,
                                    point: { latitude: 41.8985186, longitude: 2.7705876 },
                                    travelTimeFromRouteStartInSeconds: 4644,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -84,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'roundaboutLeft',
                            maneuverPoint: { latitude: 41.8980896, longitude: 2.7706146 },
                            maneuverView: {
                                offRouteAngles: ['SHARP_LEFT', 'STRAIGHT', 'RIGHT'],
                                onRouteAngle: 'LEFT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-156',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-156',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 3,
                            roundaboutType: 'DEFAULT',
                            routeOffsetInMeters: 91816,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 91816,
                                    point: { latitude: 41.8984571, longitude: 2.7704725 },
                                    travelTimeFromRouteStartInSeconds: 4648,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91822,
                                    point: { latitude: 41.8984652, longitude: 2.7704027 },
                                    travelTimeFromRouteStartInSeconds: 4648,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91828,
                                    point: { latitude: 41.8984625, longitude: 2.7703303 },
                                    travelTimeFromRouteStartInSeconds: 4649,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91834,
                                    point: { latitude: 41.8984464, longitude: 2.7702633 },
                                    travelTimeFromRouteStartInSeconds: 4650,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91842,
                                    point: { latitude: 41.8984061, longitude: 2.7701774 },
                                    travelTimeFromRouteStartInSeconds: 4651,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91851,
                                    point: { latitude: 41.8983445, longitude: 2.7701157 },
                                    travelTimeFromRouteStartInSeconds: 4652,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91859,
                                    point: { latitude: 41.898272, longitude: 2.7700835 },
                                    travelTimeFromRouteStartInSeconds: 4653,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91864,
                                    point: { latitude: 41.8982238, longitude: 2.7700809 },
                                    travelTimeFromRouteStartInSeconds: 4653,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91870,
                                    point: { latitude: 41.8981755, longitude: 2.7700916 },
                                    travelTimeFromRouteStartInSeconds: 4654,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91875,
                                    point: { latitude: 41.8981299, longitude: 2.7701184 },
                                    travelTimeFromRouteStartInSeconds: 4655,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91881,
                                    point: { latitude: 41.8980896, longitude: 2.770156 },
                                    travelTimeFromRouteStartInSeconds: 4655,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91887,
                                    point: { latitude: 41.8980548, longitude: 2.7702042 },
                                    travelTimeFromRouteStartInSeconds: 4656,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91896,
                                    point: { latitude: 41.8980199, longitude: 2.7703062 },
                                    travelTimeFromRouteStartInSeconds: 4657,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91905,
                                    point: { latitude: 41.8980119, longitude: 2.7704188 },
                                    travelTimeFromRouteStartInSeconds: 4658,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91915,
                                    point: { latitude: 41.8980387, longitude: 2.7705288 },
                                    travelTimeFromRouteStartInSeconds: 4659,
                                },
                                {
                                    distanceFromRouteStartInMeters: 91924,
                                    point: { latitude: 41.8980896, longitude: 2.7706146 },
                                    travelTimeFromRouteStartInSeconds: 4659,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -84,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'exitRoundabout',
                            maneuverPoint: { latitude: 41.8980896, longitude: 2.7706146 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-156',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-156',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 43,
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 3,
                            roundaboutManeuverContext: 'ROUNDABOUT_LEFT',
                            routeOffsetInMeters: 91924,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 91924,
                                    point: { latitude: 41.8980896, longitude: 2.7706146 },
                                    travelTimeFromRouteStartInSeconds: 4659,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -122,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'roundaboutSharpLeft',
                            maneuverPoint: { latitude: 41.8933448, longitude: 2.7795035 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_LEFT', 'SLIGHT_RIGHT', 'SHARP_RIGHT'],
                                onRouteAngle: 'SHARP_LEFT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-156',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-156',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 4,
                            roundaboutType: 'DEFAULT',
                            routeOffsetInMeters: 92816,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 92816,
                                    point: { latitude: 41.8930042, longitude: 2.7789187 },
                                    travelTimeFromRouteStartInSeconds: 4718,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92823,
                                    point: { latitude: 41.8929398, longitude: 2.7789322 },
                                    travelTimeFromRouteStartInSeconds: 4718,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92826,
                                    point: { latitude: 41.892913, longitude: 2.7789375 },
                                    travelTimeFromRouteStartInSeconds: 4719,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92836,
                                    point: { latitude: 41.8928272, longitude: 2.7789858 },
                                    travelTimeFromRouteStartInSeconds: 4720,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92846,
                                    point: { latitude: 41.8927574, longitude: 2.7790636 },
                                    travelTimeFromRouteStartInSeconds: 4721,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92856,
                                    point: { latitude: 41.8927011, longitude: 2.7791601 },
                                    travelTimeFromRouteStartInSeconds: 4722,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92867,
                                    point: { latitude: 41.8926689, longitude: 2.7792755 },
                                    travelTimeFromRouteStartInSeconds: 4723,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92877,
                                    point: { latitude: 41.8926582, longitude: 2.7793962 },
                                    travelTimeFromRouteStartInSeconds: 4724,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92887,
                                    point: { latitude: 41.8926716, longitude: 2.7795196 },
                                    travelTimeFromRouteStartInSeconds: 4725,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92897,
                                    point: { latitude: 41.8927091, longitude: 2.7796322 },
                                    travelTimeFromRouteStartInSeconds: 4726,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92907,
                                    point: { latitude: 41.8927655, longitude: 2.7797261 },
                                    travelTimeFromRouteStartInSeconds: 4727,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92917,
                                    point: { latitude: 41.8928379, longitude: 2.7798012 },
                                    travelTimeFromRouteStartInSeconds: 4728,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92928,
                                    point: { latitude: 41.8929237, longitude: 2.7798441 },
                                    travelTimeFromRouteStartInSeconds: 4729,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92938,
                                    point: { latitude: 41.8930149, longitude: 2.7798575 },
                                    travelTimeFromRouteStartInSeconds: 4730,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92948,
                                    point: { latitude: 41.8931034, longitude: 2.7798414 },
                                    travelTimeFromRouteStartInSeconds: 4731,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92958,
                                    point: { latitude: 41.8931866, longitude: 2.7797905 },
                                    travelTimeFromRouteStartInSeconds: 4732,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92964,
                                    point: { latitude: 41.8932322, longitude: 2.7797475 },
                                    travelTimeFromRouteStartInSeconds: 4733,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92969,
                                    point: { latitude: 41.8932644, longitude: 2.7797046 },
                                    travelTimeFromRouteStartInSeconds: 4733,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92978,
                                    point: { latitude: 41.8933126, longitude: 2.7796161 },
                                    travelTimeFromRouteStartInSeconds: 4734,
                                },
                                {
                                    distanceFromRouteStartInMeters: 92988,
                                    point: { latitude: 41.8933448, longitude: 2.7795035 },
                                    travelTimeFromRouteStartInSeconds: 4735,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 723,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 624,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 43,
                                    side: 'LEFT',
                                },
                            ],
                            signpost: {
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '',
                                },
                                towardName: {
                                    phonetic: { ipa: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259' },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'Girona',
                                },
                            },
                        },
                        {
                            changeOfAngleInDegrees: -122,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'exitRoundabout',
                            maneuverPoint: { latitude: 41.8933448, longitude: 2.7795035 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 51,
                            previousRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-156',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-156',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 4,
                            roundaboutManeuverContext: 'ROUNDABOUT_SHARP_LEFT',
                            routeOffsetInMeters: 92988,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 92988,
                                    point: { latitude: 41.8933448, longitude: 2.7795035 },
                                    travelTimeFromRouteStartInSeconds: 4735,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepRight',
                            maneuverPoint: { latitude: 41.8957695, longitude: 2.7769151 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_LEFT'],
                                onRouteAngle: 'SLIGHT_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 93346,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 93346,
                                    point: { latitude: 41.8957695, longitude: 2.7769151 },
                                    travelTimeFromRouteStartInSeconds: 4757,
                                },
                            ],
                            sideRoads: [],
                            signpost: {
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '',
                                },
                                towardName: {
                                    phonetic: { ipa: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259' },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'Girona',
                                },
                            },
                        },
                        {
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'mergeRightLane',
                            maneuverPoint: { latitude: 41.8985215, longitude: 2.7749035 },
                            nextRoadInformation: {
                                properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 93713,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 93713,
                                    point: { latitude: 41.8985215, longitude: 2.7749035 },
                                    travelTimeFromRouteStartInSeconds: 4775,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepLeft',
                            maneuverPoint: { latitude: 41.9042695, longitude: 2.7733102 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 94365,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 94365,
                                    point: { latitude: 41.9042695, longitude: 2.7733102 },
                                    travelTimeFromRouteStartInSeconds: 4796,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'exitMotorwayRight',
                            maneuverPoint: { latitude: 41.9564304, longitude: 2.7853534 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'SLIGHT_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'AP-7',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'AP-7',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-green2-white-4',
                                            shieldContent: 'E-15',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'E-15',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 100513,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 100513,
                                    point: { latitude: 41.9564304, longitude: 2.7853534 },
                                    travelTimeFromRouteStartInSeconds: 4991,
                                },
                            ],
                            sideRoads: [],
                            signpost: {
                                exitIconReference: {
                                    reference: 'exit-esp-right',
                                    shieldContent: '7',
                                },
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '7',
                                },
                                towardName: {
                                    phonetic: {
                                        ipa: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259 \u02c8s\u028a\u2040\u0259\u027b',
                                    },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'GIRONA S',
                                },
                            },
                        },
                        {
                            changeOfAngleInDegrees: 6,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'continueStraight',
                            maneuverPoint: { latitude: 41.9616553, longitude: 2.7891889 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 101318,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 101318,
                                    point: { latitude: 41.9616553, longitude: 2.7891889 },
                                    travelTimeFromRouteStartInSeconds: 5044,
                                },
                                {
                                    distanceFromRouteStartInMeters: 101328,
                                    point: { latitude: 41.9616871, longitude: 2.7893019 },
                                    travelTimeFromRouteStartInSeconds: 5045,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 215,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'mergeRightLane',
                            maneuverPoint: { latitude: 41.962401, longitude: 2.791324 },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 101533,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 101533,
                                    point: { latitude: 41.962401, longitude: 2.791324 },
                                    travelTimeFromRouteStartInSeconds: 5064,
                                },
                            ],
                            sideRoads: [],
                            signpost: {
                                exitName: {
                                    text: '',
                                },
                                exitNumber: {
                                    text: '',
                                },
                                towardName: {
                                    phonetic: {
                                        ipa: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259 \u02c8s\u025bn.t\u0259\u027b',
                                    },
                                    phoneticLanguageCode: 'en-GB',
                                    text: 'Girona Centre',
                                },
                            },
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepLeft',
                            maneuverPoint: { latitude: 41.9614005, longitude: 2.8008378 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'C-65',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8si\u02d0 s\u026ak.sti\u02d0.\u02c8fa\u2040\u026av',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'C-65',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'C-65',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8si\u02d0 s\u026ak.sti\u02d0.\u02c8fa\u2040\u026av',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'C-65',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 102404,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 102404,
                                    point: { latitude: 41.9614005, longitude: 2.8008378 },
                                    travelTimeFromRouteStartInSeconds: 5110,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepRight',
                            maneuverPoint: { latitude: 41.957463, longitude: 2.8073367 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'SLIGHT_RIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-blue2-white-4',
                                            shieldContent: 'C-65',
                                        },
                                        roadNumber: {
                                            phonetic: {
                                                ipa: '\u02c8si\u02d0 s\u026ak.sti\u02d0.\u02c8fa\u2040\u026av',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'C-65',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 103109,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 103109,
                                    point: { latitude: 41.957463, longitude: 2.8073367 },
                                    travelTimeFromRouteStartInSeconds: 5144,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 225,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'keepLeft',
                            maneuverPoint: { latitude: 41.9568434, longitude: 2.8088227 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 103250,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 103250,
                                    point: { latitude: 41.9568434, longitude: 2.8088227 },
                                    travelTimeFromRouteStartInSeconds: 5155,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -125,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'roundaboutSharpLeft',
                            maneuverPoint: { latitude: 41.956763, longitude: 2.8103408 },
                            maneuverView: {
                                offRouteAngles: ['LEFT', 'STRAIGHT', 'RIGHT'],
                                onRouteAngle: 'SHARP_LEFT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 4,
                            roundaboutType: 'DEFAULT',
                            routeOffsetInMeters: 103346,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 103346,
                                    point: { latitude: 41.9562909, longitude: 2.8096998 },
                                    travelTimeFromRouteStartInSeconds: 5175,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103349,
                                    point: { latitude: 41.9562668, longitude: 2.8097159 },
                                    travelTimeFromRouteStartInSeconds: 5175,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103360,
                                    point: { latitude: 41.9561917, longitude: 2.8097963 },
                                    travelTimeFromRouteStartInSeconds: 5177,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103363,
                                    point: { latitude: 41.9561702, longitude: 2.8098258 },
                                    travelTimeFromRouteStartInSeconds: 5177,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103374,
                                    point: { latitude: 41.9561192, longitude: 2.8099358 },
                                    travelTimeFromRouteStartInSeconds: 5178,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103382,
                                    point: { latitude: 41.9560978, longitude: 2.8100324 },
                                    travelTimeFromRouteStartInSeconds: 5179,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103386,
                                    point: { latitude: 41.9560924, longitude: 2.8100753 },
                                    travelTimeFromRouteStartInSeconds: 5180,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103394,
                                    point: { latitude: 41.9560924, longitude: 2.8101745 },
                                    travelTimeFromRouteStartInSeconds: 5181,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103403,
                                    point: { latitude: 41.9561085, longitude: 2.8102738 },
                                    travelTimeFromRouteStartInSeconds: 5182,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103406,
                                    point: { latitude: 41.9561192, longitude: 2.810314 },
                                    travelTimeFromRouteStartInSeconds: 5182,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103417,
                                    point: { latitude: 41.9561675, longitude: 2.8104267 },
                                    travelTimeFromRouteStartInSeconds: 5183,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103420,
                                    point: { latitude: 41.9561863, longitude: 2.8104508 },
                                    travelTimeFromRouteStartInSeconds: 5184,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103420,
                                    point: { latitude: 41.956189, longitude: 2.8104588 },
                                    travelTimeFromRouteStartInSeconds: 5184,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103429,
                                    point: { latitude: 41.9562507, longitude: 2.8105259 },
                                    travelTimeFromRouteStartInSeconds: 5185,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103433,
                                    point: { latitude: 41.9562829, longitude: 2.8105527 },
                                    travelTimeFromRouteStartInSeconds: 5185,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103444,
                                    point: { latitude: 41.9563687, longitude: 2.8105929 },
                                    travelTimeFromRouteStartInSeconds: 5186,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103447,
                                    point: { latitude: 41.9563955, longitude: 2.810601 },
                                    travelTimeFromRouteStartInSeconds: 5186,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103456,
                                    point: { latitude: 41.9564813, longitude: 2.8106037 },
                                    travelTimeFromRouteStartInSeconds: 5187,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103459,
                                    point: { latitude: 41.9565055, longitude: 2.8105983 },
                                    travelTimeFromRouteStartInSeconds: 5188,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103466,
                                    point: { latitude: 41.9565672, longitude: 2.8105769 },
                                    travelTimeFromRouteStartInSeconds: 5188,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103471,
                                    point: { latitude: 41.9566074, longitude: 2.8105527 },
                                    travelTimeFromRouteStartInSeconds: 5189,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103478,
                                    point: { latitude: 41.956661, longitude: 2.8105071 },
                                    travelTimeFromRouteStartInSeconds: 5190,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103480,
                                    point: { latitude: 41.9566771, longitude: 2.8104883 },
                                    travelTimeFromRouteStartInSeconds: 5190,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103487,
                                    point: { latitude: 41.9567227, longitude: 2.8104267 },
                                    travelTimeFromRouteStartInSeconds: 5191,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103492,
                                    point: { latitude: 41.9567469, longitude: 2.8103784 },
                                    travelTimeFromRouteStartInSeconds: 5191,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103496,
                                    point: { latitude: 41.956763, longitude: 2.8103408 },
                                    travelTimeFromRouteStartInSeconds: 5192,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -125,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'exitRoundabout',
                            maneuverPoint: { latitude: 41.956763, longitude: 2.8103408 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: [],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 16,
                            previousRoadInformation: {
                                properties: [],
                                roadNames: [
                                    {
                                        identifier: {
                                            text: '',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 4,
                            roundaboutManeuverContext: 'ROUNDABOUT_SHARP_LEFT',
                            routeOffsetInMeters: 103496,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 103496,
                                    point: { latitude: 41.956763, longitude: 2.8103408 },
                                    travelTimeFromRouteStartInSeconds: 5192,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: -1,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'roundaboutStraight',
                            maneuverPoint: { latitude: 41.96132, longitude: 2.8109872 },
                            maneuverView: {
                                offRouteAngles: ['SLIGHT_RIGHT', 'RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 3,
                            roundaboutType: 'DEFAULT',
                            routeOffsetInMeters: 103944,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 103944,
                                    point: { latitude: 41.9605342, longitude: 2.8107861 },
                                    travelTimeFromRouteStartInSeconds: 5238,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103966,
                                    point: { latitude: 41.960687, longitude: 2.8109577 },
                                    travelTimeFromRouteStartInSeconds: 5241,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103986,
                                    point: { latitude: 41.9608507, longitude: 2.8110489 },
                                    travelTimeFromRouteStartInSeconds: 5244,
                                },
                                {
                                    distanceFromRouteStartInMeters: 103998,
                                    point: { latitude: 41.9609606, longitude: 2.8110811 },
                                    travelTimeFromRouteStartInSeconds: 5245,
                                },
                                {
                                    distanceFromRouteStartInMeters: 104016,
                                    point: { latitude: 41.9611189, longitude: 2.8110892 },
                                    travelTimeFromRouteStartInSeconds: 5249,
                                },
                                {
                                    distanceFromRouteStartInMeters: 104021,
                                    point: { latitude: 41.9611618, longitude: 2.8110784 },
                                    travelTimeFromRouteStartInSeconds: 5249,
                                },
                                {
                                    distanceFromRouteStartInMeters: 104035,
                                    point: { latitude: 41.9612825, longitude: 2.8110301 },
                                    travelTimeFromRouteStartInSeconds: 5251,
                                },
                                {
                                    distanceFromRouteStartInMeters: 104038,
                                    point: { latitude: 41.9613093, longitude: 2.8110087 },
                                    travelTimeFromRouteStartInSeconds: 5252,
                                },
                                {
                                    distanceFromRouteStartInMeters: 104040,
                                    point: { latitude: 41.96132, longitude: 2.8109872 },
                                    travelTimeFromRouteStartInSeconds: 5252,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 62,
                                    side: 'LEFT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -1,
                            drivingSide: 'right',
                            isEnforcedAtForkPoint: false,
                            maneuver: 'exitRoundabout',
                            maneuverPoint: { latitude: 41.96132, longitude: 2.8109872 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 20,
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            roundaboutExitNumber: 3,
                            roundaboutManeuverContext: 'ROUNDABOUT_STRAIGHT',
                            routeOffsetInMeters: 104040,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 104040,
                                    point: { latitude: 41.96132, longitude: 2.8109872 },
                                    travelTimeFromRouteStartInSeconds: 5252,
                                },
                            ],
                            sideRoads: [],
                        },
                        {
                            changeOfAngleInDegrees: 0,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            maneuver: 'continueStraight',
                            maneuverPoint: { latitude: 41.975584, longitude: 2.8166226 },
                            maneuverView: {
                                offRouteAngles: ['RIGHT'],
                                onRouteAngle: 'STRAIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 105694,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 105694,
                                    point: { latitude: 41.975584, longitude: 2.8166226 },
                                    travelTimeFromRouteStartInSeconds: 5550,
                                },
                                {
                                    distanceFromRouteStartInMeters: 105703,
                                    point: { latitude: 41.9756591, longitude: 2.8166547 },
                                    travelTimeFromRouteStartInSeconds: 5551,
                                },
                                {
                                    distanceFromRouteStartInMeters: 105711,
                                    point: { latitude: 41.9757262, longitude: 2.8166842 },
                                    travelTimeFromRouteStartInSeconds: 5552,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 967,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 924,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 875,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 798,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 741,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 671,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 671,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 636,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 636,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 603,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 565,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 486,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 426,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 426,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 378,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 314,
                                    side: 'RIGHT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 224,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 180,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 105,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 105,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 85,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 41.9780919, longitude: 2.8176391 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8s\u00e6nt \u02c8d\u2040\u0292\u0259\u2040\u028an b\u00e6p.\u02c8ti\u02d0.st\u0259 \u02c8d\u0259 \u02c8l\u00e6 \u02c8s\u0254\u02d0l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Sant Joan Baptista de la Salle',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 175,
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadShields: [
                                    {
                                        countryCodeIso2: 'ES',
                                        iconReference: {
                                            reference: 'rectangle-red-white-5',
                                            shieldContent: 'N-IIa',
                                        },
                                        roadNumber: {
                                            phonetic: { ipa: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a' },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'N-IIa',
                                        },
                                        countrySubdivisionCodeIso: 'CT',
                                    },
                                ],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 105985,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 105985,
                                    point: { latitude: 41.9780919, longitude: 2.8176391 },
                                    travelTimeFromRouteStartInSeconds: 5592,
                                },
                                {
                                    distanceFromRouteStartInMeters: 105995,
                                    point: { latitude: 41.9780681, longitude: 2.8177556 },
                                    travelTimeFromRouteStartInSeconds: 5594,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 175,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 175,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: -85,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'turnLeft',
                            maneuverPoint: { latitude: 41.9776225, longitude: 2.8199726 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'LEFT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u2040\u0292\u0259\u2040\u028an m\u0259.\u027b\u0259.\u02c8g\u00e6j',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle Joan Maragall',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 102,
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8s\u00e6nt \u02c8d\u2040\u0292\u0259\u2040\u028an b\u00e6p.\u02c8ti\u02d0.st\u0259 \u02c8d\u0259 \u02c8l\u00e6 \u02c8s\u0254\u02d0l',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Sant Joan Baptista de la Salle',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 106185,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 106185,
                                    point: { latitude: 41.9776225, longitude: 2.8199726 },
                                    travelTimeFromRouteStartInSeconds: 5660,
                                },
                                {
                                    distanceFromRouteStartInMeters: 106195,
                                    point: { latitude: 41.9777062, longitude: 2.8200136 },
                                    travelTimeFromRouteStartInSeconds: 5665,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 102,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 30,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            changeOfAngleInDegrees: 85,
                            drivingSide: 'right',
                            intersectionName: {
                                text: '',
                            },
                            isEnforcedAtForkPoint: false,
                            isManeuverObligatory: false,
                            maneuver: 'turnRight',
                            maneuverPoint: { latitude: 41.9794062, longitude: 2.8212118 },
                            maneuverView: {
                                offRouteAngles: ['STRAIGHT'],
                                onRouteAngle: 'RIGHT',
                            },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u0259 \u02c8s\u00e6nt \u00e6n.\u02c8t\u0259\u2040\u028a.n\u026a m\u0259.\u02c8\u027bi\u02d0.\u0259 \u02c8kl\u00e6.\u027b\u0259t',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda de Sant Antoni Maria Claret',
                                        },
                                    },
                                ],
                            },
                            ambiguousExitOffsetFromManeuverInMeters: 121,
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u2040\u0292\u0259\u2040\u028an m\u0259.\u027b\u0259.\u02c8g\u00e6j',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle Joan Maragall',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 106410,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 106410,
                                    point: { latitude: 41.9794062, longitude: 2.8212118 },
                                    travelTimeFromRouteStartInSeconds: 5748,
                                },
                            ],
                            sideRoads: [
                                {
                                    drivable: true,
                                    offsetFromManeuverInMeters: 121,
                                    side: 'LEFT',
                                },
                                {
                                    drivable: false,
                                    offsetFromManeuverInMeters: 121,
                                    side: 'RIGHT',
                                },
                            ],
                        },
                        {
                            drivingSide: 'right',
                            maneuver: 'arriveLeft',
                            maneuverPoint: { latitude: 41.9793422, longitude: 2.8213479 },
                            nextRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u0259 \u02c8s\u00e6nt \u00e6n.\u02c8t\u0259\u2040\u028a.n\u026a m\u0259.\u02c8\u027bi\u02d0.\u0259 \u02c8kl\u00e6.\u027b\u0259t',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda de Sant Antoni Maria Claret',
                                        },
                                    },
                                ],
                            },
                            previousRoadInformation: {
                                properties: ['URBAN'],
                                roadNames: [
                                    {
                                        identifier: {
                                            phonetic: {
                                                ipa: '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u0259 \u02c8s\u00e6nt \u00e6n.\u02c8t\u0259\u2040\u028a.n\u026a m\u0259.\u02c8\u027bi\u02d0.\u0259 \u02c8kl\u00e6.\u027b\u0259t',
                                            },
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda de Sant Antoni Maria Claret',
                                        },
                                    },
                                ],
                            },
                            routeOffsetInMeters: 106424,
                            routePath: [
                                {
                                    distanceFromRouteStartInMeters: 106424,
                                    point: { latitude: 41.9793422, longitude: 2.8213479 },
                                    travelTimeFromRouteStartInSeconds: 5755,
                                },
                            ],
                            sideRoads: [],
                        },
                    ],
                    progressPoints: [
                        {
                            pathIndex: 0,
                            travelDurationInSeconds: 0,
                            distanceInMeters: 0,
                        },
                        {
                            pathIndex: 22,
                            travelDurationInSeconds: 224,
                            distanceInMeters: 302,
                        },
                        {
                            pathIndex: 31,
                            travelDurationInSeconds: 266,
                            distanceInMeters: 394,
                        },
                        {
                            pathIndex: 64,
                            travelDurationInSeconds: 591,
                            distanceInMeters: 870,
                        },
                        {
                            pathIndex: 101,
                            travelDurationInSeconds: 719,
                            distanceInMeters: 1332,
                        },
                        {
                            pathIndex: 127,
                            travelDurationInSeconds: 989,
                            distanceInMeters: 1707,
                        },
                        {
                            pathIndex: 139,
                            travelDurationInSeconds: 1027,
                            distanceInMeters: 2059,
                        },
                        {
                            pathIndex: 163,
                            travelDurationInSeconds: 1069,
                            distanceInMeters: 2645,
                        },
                        {
                            pathIndex: 282,
                            travelDurationInSeconds: 1272,
                            distanceInMeters: 6807,
                        },
                        {
                            pathIndex: 345,
                            travelDurationInSeconds: 1355,
                            distanceInMeters: 8369,
                        },
                        {
                            pathIndex: 377,
                            travelDurationInSeconds: 1458,
                            distanceInMeters: 9361,
                        },
                        {
                            pathIndex: 395,
                            travelDurationInSeconds: 1535,
                            distanceInMeters: 10277,
                        },
                        {
                            pathIndex: 476,
                            travelDurationInSeconds: 1660,
                            distanceInMeters: 12661,
                        },
                        {
                            pathIndex: 526,
                            travelDurationInSeconds: 1747,
                            distanceInMeters: 14909,
                        },
                        {
                            pathIndex: 638,
                            travelDurationInSeconds: 2015,
                            distanceInMeters: 23000,
                        },
                        {
                            pathIndex: 787,
                            travelDurationInSeconds: 2276,
                            distanceInMeters: 31112,
                        },
                        {
                            pathIndex: 1118,
                            travelDurationInSeconds: 3243,
                            distanceInMeters: 62355,
                        },
                        {
                            pathIndex: 1298,
                            travelDurationInSeconds: 3687,
                            distanceInMeters: 76786,
                        },
                        {
                            pathIndex: 1465,
                            travelDurationInSeconds: 4106,
                            distanceInMeters: 90240,
                        },
                        {
                            pathIndex: 1519,
                            travelDurationInSeconds: 4208,
                            distanceInMeters: 91729,
                        },
                        {
                            pathIndex: 1523,
                            travelDurationInSeconds: 4247,
                            distanceInMeters: 91772,
                        },
                        {
                            pathIndex: 1524,
                            travelDurationInSeconds: 4614,
                            distanceInMeters: 91772,
                        },
                        {
                            pathIndex: 1526,
                            travelDurationInSeconds: 4642,
                            distanceInMeters: 91798,
                        },
                        {
                            pathIndex: 1548,
                            travelDurationInSeconds: 4664,
                            distanceInMeters: 91996,
                        },
                        {
                            pathIndex: 1566,
                            travelDurationInSeconds: 4720,
                            distanceInMeters: 92836,
                        },
                        {
                            pathIndex: 1599,
                            travelDurationInSeconds: 4761,
                            distanceInMeters: 93432,
                        },
                        {
                            pathIndex: 1658,
                            travelDurationInSeconds: 4917,
                            distanceInMeters: 98272,
                        },
                        {
                            pathIndex: 1687,
                            travelDurationInSeconds: 5003,
                            distanceInMeters: 100718,
                        },
                        {
                            pathIndex: 1709,
                            travelDurationInSeconds: 5056,
                            distanceInMeters: 101449,
                        },
                        {
                            pathIndex: 1757,
                            travelDurationInSeconds: 5155,
                            distanceInMeters: 103250,
                        },
                        {
                            pathIndex: 1776,
                            travelDurationInSeconds: 5186,
                            distanceInMeters: 103447,
                        },
                        {
                            pathIndex: 1802,
                            travelDurationInSeconds: 5238,
                            distanceInMeters: 103944,
                        },
                        {
                            pathIndex: 1817,
                            travelDurationInSeconds: 5280,
                            distanceInMeters: 104175,
                        },
                        {
                            pathIndex: 1834,
                            travelDurationInSeconds: 5322,
                            distanceInMeters: 104513,
                        },
                        {
                            pathIndex: 1841,
                            travelDurationInSeconds: 5348,
                            distanceInMeters: 104727,
                        },
                        {
                            pathIndex: 1846,
                            travelDurationInSeconds: 5367,
                            distanceInMeters: 104825,
                        },
                        {
                            pathIndex: 1856,
                            travelDurationInSeconds: 5389,
                            distanceInMeters: 104959,
                        },
                        {
                            pathIndex: 1868,
                            travelDurationInSeconds: 5425,
                            distanceInMeters: 105064,
                        },
                        {
                            pathIndex: 1887,
                            travelDurationInSeconds: 5473,
                            distanceInMeters: 105380,
                        },
                        {
                            pathIndex: 1892,
                            travelDurationInSeconds: 5501,
                            distanceInMeters: 105500,
                        },
                        {
                            pathIndex: 1896,
                            travelDurationInSeconds: 5511,
                            distanceInMeters: 105589,
                        },
                        {
                            pathIndex: 1902,
                            travelDurationInSeconds: 5552,
                            distanceInMeters: 105711,
                        },
                        {
                            pathIndex: 1915,
                            travelDurationInSeconds: 5606,
                            distanceInMeters: 106041,
                        },
                        {
                            pathIndex: 1924,
                            travelDurationInSeconds: 5646,
                            distanceInMeters: 106155,
                        },
                        {
                            pathIndex: 1934,
                            travelDurationInSeconds: 5715,
                            distanceInMeters: 106314,
                        },
                        {
                            pathIndex: 1941,
                            travelDurationInSeconds: 5755,
                            distanceInMeters: 106424,
                        },
                    ],
                },
            ],
            roadShieldAtlasReference: 'https://api.tomtom.com/maps/assets/sprites/1.0.0-0-roadshields/',
        } as CalculateRouteResponseAPI,
        {
            vehicle: {
                model: {
                    engine: {
                        charging: {
                            maxChargeKWH: 40,
                        },
                    },
                },
            },
        } as CalculateRouteParams,
        {
            type: 'FeatureCollection',
            bbox: [2.173445, 41.3850457, 2.770679, 41.8986964],
            features: [
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [2.173445, 41.3850457],
                            [2.1734717, 41.3850582],
                            [2.770679, 41.8985751],
                            [2.770474, 41.8986964],
                            [2.770679, 41.8985751],
                            [2.7706468, 41.8985483],
                        ],
                    },
                    bbox: [2.173445, 41.3850457, 2.770679, 41.8986964],
                    properties: {
                        index: 0,
                        summary: {
                            lengthInMeters: 106424,
                            travelTimeInSeconds: 5755,
                            trafficDelayInSeconds: 279,
                            trafficLengthInMeters: 2126,
                            departureTime: new Date('2025-10-29T14:33:57.000Z'),
                            arrivalTime: new Date('2025-10-29T16:09:52.000Z'),
                            batteryConsumptionInkWh: 23.263960253333337,
                            remainingChargeAtArrivalInkWh: 24.06296924,
                            totalChargingTimeInSeconds: 367,
                            batteryConsumptionInPCT: 58.15990063333335,
                            remainingChargeAtArrivalInPCT: 60.1574231,
                        },
                        sections: {
                            leg: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    summary: {
                                        lengthInMeters: 91772,
                                        travelTimeInSeconds: 4247,
                                        trafficDelayInSeconds: 279,
                                        trafficLengthInMeters: 2126,
                                        departureTime: new Date('2025-10-29T14:33:57.000Z'),
                                        arrivalTime: new Date('2025-10-29T15:44:44.000Z'),
                                        batteryConsumptionInkWh: 20.646929493333335,
                                        remainingChargeAtArrivalInkWh: 11.353070506666665,
                                        chargingInformationAtEndOfLeg: {
                                            type: 'Feature',
                                            geometry: {
                                                type: 'Point',
                                                coordinates: [2.7705115, 41.8987318],
                                            },
                                            properties: {
                                                targetChargeInkWh: 26.68,
                                                chargingTimeInSeconds: 367,
                                                chargingParkUuid: '6c7aeb4e-c3e5-4f0e-83eb-721c8623e39e',
                                                chargingParkExternalId: '6c7aeb4e-c3e5-4f0e-83eb-721c8623e39e',
                                                chargingParkName: 'IONITY',
                                                chargingParkOperatorName: 'IONITY',
                                                chargingParkPaymentOptions: [
                                                    {
                                                        method: 'Subscription',
                                                        brands: [
                                                            'Shell Recharge',
                                                            'EnBW mobility+',
                                                            'EVBox Charge',
                                                            'Eneco',
                                                            'Vandebron',
                                                            'ChargePoint',
                                                            'Travel Card - Travelcard Laadpas',
                                                            'enviaM',
                                                            'Virta',
                                                            'Freshmile Pass',
                                                            'AVIA',
                                                            'MKB brandstof',
                                                            'GP Joule Connect GmbH',
                                                            'Duferco Energia - D-Mobility',
                                                            'E.ON Drive',
                                                            'E-Flux',
                                                            'DKV Mobility - DKV CARD +CHARGE',
                                                            'Chargemap Pass',
                                                            'Aral Pulse Fuel & Charge Ladekarte',
                                                            'Mobiflow',
                                                            'stations-e',
                                                            'NEXTCHARGE card',
                                                            'Corpay Card',
                                                            'Digital Charging Solutions - ChargeNow Laadkaart',
                                                            'Octopus Electroverse',
                                                            'ConnectNed',
                                                            'emyon',
                                                            'Q8 Electric App',
                                                            'LOGPAY - CHARGE&FUEL CARD ',
                                                            "EDI - D'Ieteren Energy",
                                                            'Plugsurfing',
                                                            'Northe',
                                                        ],
                                                        mobilityServiceProviders: [
                                                            {
                                                                brand: 'Shell Recharge',
                                                            },
                                                            {
                                                                brand: 'EnBW mobility+',
                                                            },
                                                            {
                                                                brand: 'EVBox Charge',
                                                            },
                                                            {
                                                                brand: 'Eneco',
                                                            },
                                                            {
                                                                brand: 'Vandebron',
                                                            },
                                                            {
                                                                brand: 'ChargePoint',
                                                            },
                                                            {
                                                                brand: 'Travel Card - Travelcard Laadpas',
                                                            },
                                                            {
                                                                brand: 'enviaM',
                                                            },
                                                            {
                                                                brand: 'Virta',
                                                            },
                                                            {
                                                                brand: 'Freshmile Pass',
                                                            },
                                                            {
                                                                brand: 'AVIA',
                                                            },
                                                            {
                                                                brand: 'MKB brandstof',
                                                            },
                                                            {
                                                                brand: 'GP Joule Connect GmbH',
                                                            },
                                                            {
                                                                brand: 'Duferco Energia - D-Mobility',
                                                            },
                                                            {
                                                                brand: 'E.ON Drive',
                                                            },
                                                            {
                                                                brand: 'E-Flux',
                                                            },
                                                            {
                                                                brand: 'DKV Mobility - DKV CARD +CHARGE',
                                                            },
                                                            {
                                                                brand: 'Chargemap Pass',
                                                            },
                                                            {
                                                                brand: 'Aral Pulse Fuel & Charge Ladekarte',
                                                            },
                                                            {
                                                                brand: 'Mobiflow',
                                                            },
                                                            {
                                                                brand: 'stations-e',
                                                            },
                                                            {
                                                                brand: 'NEXTCHARGE card',
                                                            },
                                                            {
                                                                brand: 'Corpay Card',
                                                            },
                                                            {
                                                                brand: 'Digital Charging Solutions - ChargeNow Laadkaart',
                                                            },
                                                            {
                                                                brand: 'Octopus Electroverse',
                                                            },
                                                            {
                                                                brand: 'ConnectNed',
                                                            },
                                                            {
                                                                brand: 'emyon',
                                                            },
                                                            {
                                                                brand: 'Q8 Electric App',
                                                            },
                                                            {
                                                                brand: 'LOGPAY - CHARGE&FUEL CARD ',
                                                            },
                                                            {
                                                                brand: "EDI - D'Ieteren Energy",
                                                            },
                                                            {
                                                                brand: 'Plugsurfing',
                                                            },
                                                            {
                                                                brand: 'Northe',
                                                            },
                                                        ],
                                                    },
                                                ],
                                                chargingParkPowerInkW: 350,
                                                chargingStopType: 'Auto_Generated',
                                                chargePointOperator: {
                                                    name: 'IONITY',
                                                },
                                                chargingParkOpeningHours: {
                                                    twentyFourSeven: 'true',
                                                    timeZoneOffset: '+01:00',
                                                },
                                                type: 'POI',
                                                address: {
                                                    freeformAddress: 'N-156',
                                                    streetName: 'N-156',
                                                    municipality: "Vilob\u00ed d'Onyar",
                                                    postalCode: '17185',
                                                },
                                                chargingConnectionInfo: {
                                                    plugType: 'Combo_to_IEC_62196_Type_2_Base',
                                                    currentInA: 438,
                                                    voltageInV: 800,
                                                    chargingPowerInkW: 350,
                                                    currentType: 'DC',
                                                    chargingSpeed: 'ultra-fast',
                                                },
                                                targetChargeInPCT: 66.7,
                                                chargingParkSpeed: 'ultra-fast',
                                            },
                                        },
                                        batteryConsumptionInPCT: 51.61732373333334,
                                        remainingChargeAtArrivalInPCT: 28.382676266666664,
                                    },
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 2,
                                    summary: {
                                        lengthInMeters: 14652,
                                        travelTimeInSeconds: 1141,
                                        trafficDelayInSeconds: 0,
                                        trafficLengthInMeters: 0,
                                        departureTime: new Date('2025-10-29T15:50:51.000Z'),
                                        arrivalTime: new Date('2025-10-29T16:09:52.000Z'),
                                        batteryConsumptionInkWh: 2.6170307600000005,
                                        remainingChargeAtArrivalInkWh: 24.06296924,
                                        batteryConsumptionInPCT: 6.542576900000002,
                                        remainingChargeAtArrivalInPCT: 60.1574231,
                                    },
                                },
                            ],
                            pedestrian: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 16,
                                },
                            ],
                            vehicleRestricted: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 16,
                                },
                            ],
                            speedLimit: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 16,
                                    endPointIndex: 41,
                                    maxSpeedLimitInKmh: 20,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 41,
                                    endPointIndex: 97,
                                    maxSpeedLimitInKmh: 30,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 97,
                                    endPointIndex: 150,
                                    maxSpeedLimitInKmh: 50,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 150,
                                    endPointIndex: 524,
                                    maxSpeedLimitInKmh: 80,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 524,
                                    endPointIndex: 543,
                                    maxSpeedLimitInKmh: 120,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 543,
                                    endPointIndex: 580,
                                    maxSpeedLimitInKmh: 100,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 580,
                                    endPointIndex: 605,
                                    maxSpeedLimitInKmh: 120,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 605,
                                    endPointIndex: 613,
                                    maxSpeedLimitInKmh: 100,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 613,
                                    endPointIndex: 705,
                                    maxSpeedLimitInKmh: 120,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 705,
                                    endPointIndex: 712,
                                    maxSpeedLimitInKmh: 100,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 712,
                                    endPointIndex: 1459,
                                    maxSpeedLimitInKmh: 120,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1459,
                                    endPointIndex: 1463,
                                    maxSpeedLimitInKmh: 100,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1463,
                                    endPointIndex: 1465,
                                    maxSpeedLimitInKmh: 70,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1465,
                                    endPointIndex: 1476,
                                    maxSpeedLimitInKmh: 50,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1476,
                                    endPointIndex: 1484,
                                    maxSpeedLimitInKmh: 60,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1484,
                                    endPointIndex: 1488,
                                    maxSpeedLimitInKmh: 40,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1489,
                                    endPointIndex: 1507,
                                    maxSpeedLimitInKmh: 90,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1507,
                                    endPointIndex: 1511,
                                    maxSpeedLimitInKmh: 40,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1543,
                                    endPointIndex: 1546,
                                    maxSpeedLimitInKmh: 90,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1546,
                                    endPointIndex: 1560,
                                    maxSpeedLimitInKmh: 70,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1560,
                                    endPointIndex: 1563,
                                    maxSpeedLimitInKmh: 40,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1582,
                                    endPointIndex: 1586,
                                    maxSpeedLimitInKmh: 90,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1586,
                                    endPointIndex: 1607,
                                    maxSpeedLimitInKmh: 60,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1607,
                                    endPointIndex: 1684,
                                    maxSpeedLimitInKmh: 120,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1684,
                                    endPointIndex: 1687,
                                    maxSpeedLimitInKmh: 80,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1687,
                                    endPointIndex: 1701,
                                    maxSpeedLimitInKmh: 60,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1701,
                                    endPointIndex: 1716,
                                    maxSpeedLimitInKmh: 40,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1716,
                                    endPointIndex: 1722,
                                    maxSpeedLimitInKmh: 100,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1722,
                                    endPointIndex: 1751,
                                    maxSpeedLimitInKmh: 80,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1751,
                                    endPointIndex: 1760,
                                    maxSpeedLimitInKmh: 40,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1785,
                                    endPointIndex: 1788,
                                    maxSpeedLimitInKmh: 30,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1788,
                                    endPointIndex: 1797,
                                    maxSpeedLimitInKmh: 40,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1797,
                                    endPointIndex: 1802,
                                    maxSpeedLimitInKmh: 30,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1810,
                                    endPointIndex: 1813,
                                    maxSpeedLimitInKmh: 50,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1813,
                                    endPointIndex: 1912,
                                    maxSpeedLimitInKmh: 40,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1912,
                                    endPointIndex: 1941,
                                    maxSpeedLimitInKmh: 30,
                                },
                            ],
                            urban: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 106,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 113,
                                    endPointIndex: 177,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 183,
                                    endPointIndex: 189,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 244,
                                    endPointIndex: 281,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 290,
                                    endPointIndex: 314,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 361,
                                    endPointIndex: 373,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 374,
                                    endPointIndex: 388,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 389,
                                    endPointIndex: 417,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 444,
                                    endPointIndex: 472,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 480,
                                    endPointIndex: 519,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 531,
                                    endPointIndex: 552,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 554,
                                    endPointIndex: 590,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 654,
                                    endPointIndex: 681,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 712,
                                    endPointIndex: 738,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 807,
                                    endPointIndex: 816,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 877,
                                    endPointIndex: 899,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 971,
                                    endPointIndex: 1006,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1012,
                                    endPointIndex: 1052,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1730,
                                    endPointIndex: 1753,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1798,
                                    endPointIndex: 1941,
                                },
                            ],
                            motorway: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 111,
                                    endPointIndex: 114,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 150,
                                    endPointIndex: 351,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 352,
                                    endPointIndex: 1459,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1607,
                                    endPointIndex: 1684,
                                },
                            ],
                            tunnel: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 152,
                                    endPointIndex: 177,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 194,
                                    endPointIndex: 218,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 257,
                                    endPointIndex: 270,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 379,
                                    endPointIndex: 383,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 396,
                                    endPointIndex: 402,
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 410,
                                    endPointIndex: 415,
                                },
                            ],
                            roadShields: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 150,
                                    endPointIndex: 448,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-autopista-autovia',
                                            shieldContent: 'B-10',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 448,
                                    endPointIndex: 476,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-autopista-autovia',
                                            shieldContent: 'C-58',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 476,
                                    endPointIndex: 490,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-autopista-autovia',
                                            shieldContent: 'C-33',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 498,
                                    endPointIndex: 698,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-autopista-autovia',
                                            shieldContent: 'C-33',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 698,
                                    endPointIndex: 1459,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-autopista-autovia',
                                            shieldContent: 'AP-7',
                                        },
                                        {
                                            reference: 'european-road',
                                            shieldContent: 'E-15',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1488,
                                    endPointIndex: 1519,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-carretera-de-la-rige',
                                            shieldContent: 'N-156',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1528,
                                    endPointIndex: 1582,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-carretera-de-la-rige',
                                            shieldContent: 'N-156',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1607,
                                    endPointIndex: 1684,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-autopista-autovia',
                                            shieldContent: 'AP-7',
                                        },
                                        {
                                            reference: 'european-road',
                                            shieldContent: 'E-15',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1716,
                                    endPointIndex: 1751,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-autopista-autovia',
                                            shieldContent: 'C-65',
                                        },
                                    ],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1760,
                                    endPointIndex: 1912,
                                    roadShieldReferences: [
                                        {
                                            reference: 'esp-carretera-de-la-rige',
                                            shieldContent: 'N-IIa',
                                        },
                                    ],
                                },
                            ],
                            lowEmissionZone: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 498,
                                },
                            ],
                            country: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 0,
                                    endPointIndex: 1941,
                                    countryCodeISO3: 'ESP',
                                },
                            ],
                            traffic: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 83,
                                    endPointIndex: 98,
                                    delayInSeconds: 0,
                                    effectiveSpeedInKmh: 15,
                                    magnitudeOfDelay: 'indefinite',
                                    tec: { causes: [{ mainCauseCode: 3 }], effectCode: 1 },
                                    categories: ['roadworks'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 99,
                                    endPointIndex: 127,
                                    delayInSeconds: 204,
                                    effectiveSpeedInKmh: 5,
                                    magnitudeOfDelay: 'minor',
                                    tec: { causes: [{ mainCauseCode: 1 }], effectCode: 6 },
                                    categories: ['jam'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 344,
                                    endPointIndex: 387,
                                    delayInSeconds: 75,
                                    effectiveSpeedInKmh: 39,
                                    magnitudeOfDelay: 'minor',
                                    tec: { causes: [{ mainCauseCode: 1 }], effectCode: 4 },
                                    categories: ['jam'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1488,
                                    endPointIndex: 1519,
                                    delayInSeconds: 0,
                                    effectiveSpeedInKmh: 52,
                                    magnitudeOfDelay: 'indefinite',
                                    tec: {
                                        causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                        effectCode: 1,
                                    },
                                    categories: ['narrow-lanes', 'roadworks'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1528,
                                    endPointIndex: 1531,
                                    delayInSeconds: 0,
                                    effectiveSpeedInKmh: 52,
                                    magnitudeOfDelay: 'indefinite',
                                    tec: {
                                        causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                        effectCode: 1,
                                    },
                                    categories: ['narrow-lanes', 'roadworks'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1540,
                                    endPointIndex: 1568,
                                    delayInSeconds: 0,
                                    effectiveSpeedInKmh: 56,
                                    magnitudeOfDelay: 'indefinite',
                                    tec: {
                                        causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                        effectCode: 1,
                                    },
                                    categories: ['narrow-lanes', 'roadworks'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1575,
                                    endPointIndex: 1582,
                                    delayInSeconds: 0,
                                    effectiveSpeedInKmh: 52,
                                    magnitudeOfDelay: 'indefinite',
                                    tec: {
                                        causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                                        effectCode: 1,
                                    },
                                    categories: ['narrow-lanes', 'roadworks'],
                                },
                            ],
                            lanes: [
                                {
                                    id: expect.any(String),
                                    startPointIndex: 137,
                                    endPointIndex: 138,
                                    lanes: [
                                        {
                                            directions: ['SLIGHT_LEFT'],
                                            follow: 'SLIGHT_LEFT',
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'SHORT_DASHED', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 144,
                                    endPointIndex: 150,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 425,
                                    endPointIndex: 428,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT', 'SLIGHT_RIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 475,
                                    endPointIndex: 476,
                                    lanes: [
                                        {
                                            directions: [],
                                        },
                                        {
                                            directions: [],
                                        },
                                        {
                                            directions: [],
                                        },
                                        {
                                            directions: [],
                                        },
                                    ],
                                    laneSeparators: [
                                        'SINGLE_SOLID',
                                        'LONG_DASHED',
                                        'SHORT_DASHED',
                                        'LONG_DASHED',
                                        'SINGLE_SOLID',
                                    ],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 663,
                                    endPointIndex: 666,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SHORT_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1458,
                                    endPointIndex: 1459,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                            follow: 'SLIGHT_RIGHT',
                                        },
                                    ],
                                    laneSeparators: [
                                        'SINGLE_SOLID',
                                        'LONG_DASHED',
                                        'LONG_DASHED',
                                        'SHORT_DASHED',
                                        'SINGLE_SOLID',
                                    ],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    startPointIndex: 1486,
                                    endPointIndex: 1488,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1488,
                                    endPointIndex: 1489,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT', 'STRAIGHT'],
                                            follow: 'SLIGHT_RIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1510,
                                    endPointIndex: 1511,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT', 'SLIGHT_RIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT', 'STRAIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['DOUBLE_SOLID', 'SINGLE_SOLID', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1515,
                                    endPointIndex: 1519,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1525,
                                    endPointIndex: 1528,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT', 'SLIGHT_RIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT', 'STRAIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1540,
                                    endPointIndex: 1543,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1561,
                                    endPointIndex: 1563,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1580,
                                    endPointIndex: 1582,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT', 'STRAIGHT'],
                                            follow: 'SLIGHT_RIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1604,
                                    endPointIndex: 1607,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1614,
                                    endPointIndex: 1614,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                        },
                                    ],
                                    laneSeparators: [
                                        'SINGLE_SOLID',
                                        'LONG_DASHED',
                                        'LONG_DASHED',
                                        'SHORT_DASHED',
                                        'SINGLE_SOLID',
                                    ],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1683,
                                    endPointIndex: 1684,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                            follow: 'SLIGHT_RIGHT',
                                        },
                                    ],
                                    laneSeparators: [
                                        'SINGLE_SOLID',
                                        'LONG_DASHED',
                                        'LONG_DASHED',
                                        'LONG_DASHED',
                                        'SHORT_DASHED',
                                        'SINGLE_SOLID',
                                    ],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1703,
                                    endPointIndex: 1703,
                                    lanes: [
                                        {
                                            directions: [],
                                        },
                                        {
                                            directions: [],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1707,
                                    endPointIndex: 1716,
                                    lanes: [
                                        {
                                            directions: [],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1735,
                                    endPointIndex: 1736,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                        },
                                    ],
                                    laneSeparators: [
                                        'SINGLE_SOLID',
                                        'LONG_DASHED',
                                        'SHORT_DASHED',
                                        'LONG_DASHED',
                                        'SINGLE_SOLID',
                                    ],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1748,
                                    endPointIndex: 1751,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT'],
                                            follow: 'SLIGHT_RIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SHORT_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1755,
                                    endPointIndex: 1757,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1757,
                                    endPointIndex: 1760,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1782,
                                    endPointIndex: 1785,
                                    lanes: [
                                        {
                                            directions: ['SLIGHT_LEFT', 'STRAIGHT'],
                                        },
                                        {
                                            directions: ['SLIGHT_RIGHT', 'STRAIGHT', 'SLIGHT_LEFT'],
                                            follow: 'SLIGHT_RIGHT',
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1798,
                                    endPointIndex: 1802,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT'],
                                        },
                                    ],
                                    laneSeparators: ['SINGLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                                {
                                    id: expect.any(String),
                                    startPointIndex: 1899,
                                    endPointIndex: 1900,
                                    lanes: [
                                        {
                                            directions: ['STRAIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                        {
                                            directions: ['STRAIGHT', 'RIGHT'],
                                            follow: 'STRAIGHT',
                                        },
                                    ],
                                    laneSeparators: ['DOUBLE_SOLID', 'LONG_DASHED', 'SINGLE_SOLID'],
                                    properties: ['IS_MANEUVER'],
                                },
                            ],
                        },
                        guidance: {
                            instructions: [
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'DEPART',
                                    maneuverPoint: [2.173445, 41.3850457],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.\u02c8nu\u02d0.\u00f0\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de la Canuda',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.\u02c8nu\u02d0.\u00f0\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de la Canuda',
                                        },
                                    },
                                    routeOffsetInMeters: 0,
                                    routePath: [
                                        {
                                            distanceInMeters: 0,
                                            point: [2.173445, 41.3850457],
                                            travelTimeInSeconds: 0,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    changeOfAngleInDegrees: 90,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [2.1736944, 41.385144],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u025bl \u02c8p\u0254\u02d0\u027b.t\u0259l \u02c8d\u025bl \u02c8e\u2040\u026an.d\u2040\u0292\u0259l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida del Portal del \u00c1ngel',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.\u02c8nu\u02d0.\u00f0\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de la Canuda',
                                        },
                                    },
                                    routeOffsetInMeters: 24,
                                    routePath: [
                                        {
                                            distanceInMeters: 24,
                                            point: [2.1736944, 41.385144],
                                            travelTimeInSeconds: 18,
                                        },
                                        {
                                            distanceInMeters: 28,
                                            point: [2.1737078, 41.3851064],
                                            travelTimeInSeconds: 21,
                                        },
                                        {
                                            distanceInMeters: 34,
                                            point: [2.1737441, 41.3850632],
                                            travelTimeInSeconds: 25,
                                        },
                                    ],
                                    sideRoads: [],
                                    pathPointIndex: 0,
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -73,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [2.1740645, 41.3846666],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8l\u0259\u2040\u028as \u02c8\u0251\u02d0\u027b.k\u0259\u2040\u028as',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de los Arcos',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u025bl \u02c8p\u0254\u02d0\u027b.t\u0259l \u02c8d\u025bl \u02c8e\u2040\u026an.d\u2040\u0292\u0259l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida del Portal del \u00c1ngel',
                                        },
                                    },
                                    routeOffsetInMeters: 86,
                                    routePath: [
                                        {
                                            distanceInMeters: 86,
                                            point: [2.1740645, 41.3846666],
                                            travelTimeInSeconds: 64,
                                        },
                                        {
                                            distanceInMeters: 96,
                                            point: [2.1741825, 41.3846831],
                                            travelTimeInSeconds: 72,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -45,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [2.1752366, 41.3842133],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.t\u025b.\u02c8\u00f0\u027b\u00e6l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida de la Catedral',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 203,
                                    routePath: [
                                        {
                                            distanceInMeters: 203,
                                            point: [2.1752366, 41.3842133],
                                            travelTimeInSeconds: 152,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -85,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [2.1752903, 41.3842374],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u00e6.v\u0259.\u02c8ni\u02d0.d\u0259 \u02c8d\u0259 \u02c8l\u00e6 k\u00e6.t\u025b.\u02c8\u00f0\u027b\u00e6l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Avenida de la Catedral',
                                        },
                                    },
                                    routeOffsetInMeters: 208,
                                    routePath: [
                                        {
                                            distanceInMeters: 208,
                                            point: [2.1752903, 41.3842374],
                                            travelTimeInSeconds: 156,
                                        },
                                        {
                                            distanceInMeters: 218,
                                            point: [2.1752424, 41.3843198],
                                            travelTimeInSeconds: 164,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 124,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: true,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [2.175411, 41.3864368],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic: '\u02c8bi\u02d0.\u0259 l\u0259.j\u0259.\u02c8t\u00e6.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'V\u00eda Laietana',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 503,
                                    routePath: [
                                        {
                                            distanceInMeters: 503,
                                            point: [2.175411, 41.3864368],
                                            travelTimeInSeconds: 342,
                                        },
                                        {
                                            distanceInMeters: 513,
                                            point: [2.1754945, 41.3863725],
                                            travelTimeInSeconds: 349,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 175,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_LEFT',
                                    maneuverPoint: [2.1896911, 41.3835803],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u025bl \u02c8d\u0252k.t\u0259\u027b \u0259j.gw\u0259.\u02c8\u00f0\u025b',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle del Doctor Aiguader',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u025bl \u02c8d\u0252k.t\u0259\u027b \u0259j.gw\u0259.\u02c8\u00f0\u025b',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle del Doctor Aiguader',
                                        },
                                    },
                                    routeOffsetInMeters: 2033,
                                    routePath: [
                                        {
                                            distanceInMeters: 2033,
                                            point: [2.1896911, 41.3835803],
                                            travelTimeInSeconds: 1025,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 987,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 880,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 880,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 732,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 732,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 723,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 630,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 540,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 428,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 428,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 326,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 326,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 240,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 240,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 177,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 116,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 7,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'MERGE_RIGHT_LANE',
                                    maneuverPoint: [2.1934864, 41.3857207],
                                    nextRoadInfo: {
                                        properties: ['URBAN', 'CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'B-10',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8bi\u02d0 \u02c8t\u025bn',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'B-10',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u025bl li\u02d0.t\u0254\u02d0.\u02c8\u027b\u00e6l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda del Litoral',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 2433,
                                    routePath: [
                                        {
                                            distanceInMeters: 2433,
                                            point: [2.1934864, 41.3857207],
                                            travelTimeInSeconds: 1058,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_LEFT',
                                    maneuverPoint: [2.1996582, 41.4492086],
                                    nextRoadInfo: {
                                        properties: ['CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'C-58',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8si\u02d0 f\u026af.ti\u02d0.\u02c8e\u2040\u026at',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'C-58',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'B-10',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8bi\u02d0 \u02c8t\u025bn',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'B-10',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u025bl li\u02d0.t\u0254\u02d0.\u02c8\u027b\u00e6l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda del Litoral',
                                        },
                                    },
                                    routeOffsetInMeters: 11215,
                                    routePath: [
                                        {
                                            distanceInMeters: 11215,
                                            point: [2.1996582, 41.4492086],
                                            travelTimeInSeconds: 1588,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 573,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 129,
                                            side: 'RIGHT',
                                        },
                                    ],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '',
                                        },
                                        towardName: {
                                            phonetic: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Girona',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_RIGHT',
                                    maneuverPoint: [2.1879101, 41.4570916],
                                    nextRoadInfo: {
                                        properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'C-58',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8si\u02d0 f\u026af.ti\u02d0.\u02c8e\u2040\u026at',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'C-58',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl b\u00e6.\u02c8j\u025bs',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Vall\u00e9s',
                                        },
                                    },
                                    routeOffsetInMeters: 12661,
                                    routePath: [
                                        {
                                            distanceInMeters: 12661,
                                            point: [2.1879101, 41.4570916],
                                            travelTimeInSeconds: 1660,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 800,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 773,
                                            side: 'RIGHT',
                                        },
                                    ],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '',
                                        },
                                        towardName: {
                                            phonetic: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Girona',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_LEFT',
                                    maneuverPoint: [2.2356266, 41.5490913],
                                    nextRoadInfo: {
                                        properties: ['URBAN', 'MOTORWAY', 'CONTROLLED_ACCESS'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN', 'MOTORWAY', 'CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'C-33',
                                                },
                                                roadNumber: {
                                                    phonetic:
                                                        '\u02c8si\u02d0 \u03b8\u025c\u02d0.ti\u02d0.\u02c8\u03b8\u027bi\u02d0',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'C-33',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 24680,
                                    routePath: [
                                        {
                                            distanceInMeters: 24680,
                                            point: [2.2356266, 41.5490913],
                                            travelTimeInSeconds: 2068,
                                        },
                                    ],
                                    sideRoads: [],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '',
                                        },
                                        towardName: {
                                            phonetic: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Girona',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'EXIT_MOTORWAY_RIGHT',
                                    maneuverPoint: [2.7750912, 41.8932804],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'C-25',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8si\u02d0 tw\u025bn.ti\u02d0.\u02c8fa\u2040\u026av',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'C-25',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                    routeOffsetInMeters: 90058,
                                    routePath: [
                                        {
                                            distanceInMeters: 90058,
                                            point: [2.7750912, 41.8932804],
                                            travelTimeInSeconds: 4096,
                                        },
                                    ],
                                    sideRoads: [],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '8',
                                        },
                                        towardName: {
                                            phonetic:
                                                '\u027bi\u02d0.u\u02d0.\u02c8\u00f0\u025b.j\u0254\u02d0ts \u02c8d\u0259 \u02c8l\u00e6 \u02c8s\u025bl.v\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'RIUDELLOTS DE LA SELVA',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 122,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_SHARP_RIGHT',
                                    maneuverPoint: [2.7790877, 41.8932778],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-156',
                                                },
                                                roadNumber: {
                                                    phonetic:
                                                        '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-156',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    roundaboutExitNumber: 1,
                                    routeOffsetInMeters: 90774,
                                    routePath: [
                                        {
                                            distanceInMeters: 90774,
                                            point: [2.779195, 41.8933287],
                                            travelTimeInSeconds: 4141,
                                        },
                                        {
                                            distanceInMeters: 90785,
                                            point: [2.7790877, 41.8932778],
                                            travelTimeInSeconds: 4142,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 340,
                                            side: 'LEFT',
                                        },
                                    ],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '',
                                        },
                                        towardName: {
                                            phonetic: '\u0259.\u02c8e\u2040\u026a.\u027b\u0259.p\u0254\u02d0\u027bt',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Aeroport',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 83,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_SLIGHT_RIGHT',
                                    maneuverPoint: [2.7704725, 41.8984571],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic:
                                                '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-156',
                                                },
                                                roadNumber: {
                                                    phonetic:
                                                        '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-156',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    roundaboutExitNumber: 2,
                                    routeOffsetInMeters: 91678,
                                    routePath: [
                                        {
                                            distanceInMeters: 91678,
                                            point: [2.7706146, 41.8980896],
                                            travelTimeInSeconds: 4202,
                                        },
                                        {
                                            distanceInMeters: 91686,
                                            point: [2.7706629, 41.8981433],
                                            travelTimeInSeconds: 4203,
                                        },
                                        {
                                            distanceInMeters: 91693,
                                            point: [2.770687, 41.898205],
                                            travelTimeInSeconds: 4204,
                                        },
                                        {
                                            distanceInMeters: 91700,
                                            point: [2.770687, 41.8982694],
                                            travelTimeInSeconds: 4204,
                                        },
                                        {
                                            distanceInMeters: 91707,
                                            point: [2.7706629, 41.898331],
                                            travelTimeInSeconds: 4205,
                                        },
                                        {
                                            distanceInMeters: 91712,
                                            point: [2.7706307, 41.898374],
                                            travelTimeInSeconds: 4206,
                                        },
                                        {
                                            distanceInMeters: 91718,
                                            point: [2.7705878, 41.8984088],
                                            travelTimeInSeconds: 4206,
                                        },
                                        {
                                            distanceInMeters: 91723,
                                            point: [2.7705315, 41.8984383],
                                            travelTimeInSeconds: 4207,
                                        },
                                        {
                                            distanceInMeters: 91729,
                                            point: [2.7704725, 41.8984571],
                                            travelTimeInSeconds: 4208,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 849,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 268,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 168,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -107,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: true,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [2.770679, 41.8985751],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic:
                                                '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                    routeOffsetInMeters: 91750,
                                    routePath: [
                                        {
                                            distanceInMeters: 91750,
                                            point: [2.770679, 41.8985751],
                                            travelTimeInSeconds: 4227,
                                        },
                                        {
                                            distanceInMeters: 91760,
                                            point: [2.770585, 41.8986308],
                                            travelTimeInSeconds: 4237,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    drivingSide: 'RIGHT',
                                    maneuver: 'WAYPOINT_RIGHT',
                                    maneuverPoint: [2.770474, 41.8986965],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 91772,
                                    routePath: [
                                        {
                                            distanceInMeters: 91772,
                                            point: [2.770474, 41.8986965],
                                            travelTimeInSeconds: 4614,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    changeOfAngleInDegrees: -180,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'MAKE_UTURN',
                                    maneuverPoint: [2.770474, 41.8986965],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 91772,
                                    routePath: [
                                        {
                                            distanceInMeters: 91772,
                                            point: [2.770474, 41.8986965],
                                            travelTimeInSeconds: 4614,
                                        },
                                        {
                                            distanceInMeters: 91782,
                                            point: [2.7705679, 41.8986408],
                                            travelTimeInSeconds: 4627,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 107,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: true,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [2.770679, 41.8985751],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic:
                                                '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 91794,
                                    routePath: [
                                        {
                                            distanceInMeters: 91794,
                                            point: [2.770679, 41.8985751],
                                            travelTimeInSeconds: 4641,
                                        },
                                        {
                                            distanceInMeters: 91798,
                                            point: [2.7706468, 41.8985483],
                                            travelTimeInSeconds: 4642,
                                        },
                                        {
                                            distanceInMeters: 91804,
                                            point: [2.7705878, 41.8985188],
                                            travelTimeInSeconds: 4644,
                                        },
                                        {
                                            distanceInMeters: 91804,
                                            point: [2.7705876, 41.8985186],
                                            travelTimeInSeconds: 4644,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -84,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_LEFT',
                                    maneuverPoint: [2.7706146, 41.8980896],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-156',
                                                },
                                                roadNumber: {
                                                    phonetic:
                                                        '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-156',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic:
                                                '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                    roundaboutExitNumber: 3,
                                    routeOffsetInMeters: 91816,
                                    routePath: [
                                        {
                                            distanceInMeters: 91816,
                                            point: [2.7704725, 41.8984571],
                                            travelTimeInSeconds: 4648,
                                        },
                                        {
                                            distanceInMeters: 91822,
                                            point: [2.7704027, 41.8984652],
                                            travelTimeInSeconds: 4648,
                                        },
                                        {
                                            distanceInMeters: 91828,
                                            point: [2.7703303, 41.8984625],
                                            travelTimeInSeconds: 4649,
                                        },
                                        {
                                            distanceInMeters: 91834,
                                            point: [2.7702633, 41.8984464],
                                            travelTimeInSeconds: 4650,
                                        },
                                        {
                                            distanceInMeters: 91842,
                                            point: [2.7701774, 41.8984061],
                                            travelTimeInSeconds: 4651,
                                        },
                                        {
                                            distanceInMeters: 91851,
                                            point: [2.7701157, 41.8983445],
                                            travelTimeInSeconds: 4652,
                                        },
                                        {
                                            distanceInMeters: 91859,
                                            point: [2.7700835, 41.898272],
                                            travelTimeInSeconds: 4653,
                                        },
                                        {
                                            distanceInMeters: 91864,
                                            point: [2.7700809, 41.8982238],
                                            travelTimeInSeconds: 4653,
                                        },
                                        {
                                            distanceInMeters: 91870,
                                            point: [2.7700916, 41.8981755],
                                            travelTimeInSeconds: 4654,
                                        },
                                        {
                                            distanceInMeters: 91875,
                                            point: [2.7701184, 41.8981299],
                                            travelTimeInSeconds: 4655,
                                        },
                                        {
                                            distanceInMeters: 91881,
                                            point: [2.770156, 41.8980896],
                                            travelTimeInSeconds: 4655,
                                        },
                                        {
                                            distanceInMeters: 91887,
                                            point: [2.7702042, 41.8980548],
                                            travelTimeInSeconds: 4656,
                                        },
                                        {
                                            distanceInMeters: 91896,
                                            point: [2.7703062, 41.8980199],
                                            travelTimeInSeconds: 4657,
                                        },
                                        {
                                            distanceInMeters: 91905,
                                            point: [2.7704188, 41.8980119],
                                            travelTimeInSeconds: 4658,
                                        },
                                        {
                                            distanceInMeters: 91915,
                                            point: [2.7705288, 41.8980387],
                                            travelTimeInSeconds: 4659,
                                        },
                                        {
                                            distanceInMeters: 91924,
                                            point: [2.7706146, 41.8980896],
                                            travelTimeInSeconds: 4659,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -84,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'EXIT_ROUNDABOUT',
                                    maneuverPoint: [2.7706146, 41.8980896],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-156',
                                                },
                                                roadNumber: {
                                                    phonetic:
                                                        '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-156',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 43,
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            phonetic:
                                                '\u02c8p\u0251\u02d0\u027bk a\u2040\u026a.\u027b\u0254\u02d0.p\u0254\u02d0\u027b.\u02c8tw\u00e6.\u027bj\u0259\u2040\u028a \u02c8i\u02d0 l\u0259.\u02c8d\u2040\u0292\u026a.st\u026a.k\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Parque Aeroportuario y Log\u00edstico',
                                        },
                                    },
                                    roundaboutExitNumber: 3,
                                    routeOffsetInMeters: 91924,
                                    routePath: [
                                        {
                                            distanceInMeters: 91924,
                                            point: [2.7706146, 41.8980896],
                                            travelTimeInSeconds: 4659,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -122,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_SHARP_LEFT',
                                    maneuverPoint: [2.7795035, 41.8933448],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-156',
                                                },
                                                roadNumber: {
                                                    phonetic:
                                                        '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-156',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    roundaboutExitNumber: 4,
                                    routeOffsetInMeters: 92816,
                                    routePath: [
                                        {
                                            distanceInMeters: 92816,
                                            point: [2.7789187, 41.8930042],
                                            travelTimeInSeconds: 4718,
                                        },
                                        {
                                            distanceInMeters: 92823,
                                            point: [2.7789322, 41.8929398],
                                            travelTimeInSeconds: 4718,
                                        },
                                        {
                                            distanceInMeters: 92826,
                                            point: [2.7789375, 41.892913],
                                            travelTimeInSeconds: 4719,
                                        },
                                        {
                                            distanceInMeters: 92836,
                                            point: [2.7789858, 41.8928272],
                                            travelTimeInSeconds: 4720,
                                        },
                                        {
                                            distanceInMeters: 92846,
                                            point: [2.7790636, 41.8927574],
                                            travelTimeInSeconds: 4721,
                                        },
                                        {
                                            distanceInMeters: 92856,
                                            point: [2.7791601, 41.8927011],
                                            travelTimeInSeconds: 4722,
                                        },
                                        {
                                            distanceInMeters: 92867,
                                            point: [2.7792755, 41.8926689],
                                            travelTimeInSeconds: 4723,
                                        },
                                        {
                                            distanceInMeters: 92877,
                                            point: [2.7793962, 41.8926582],
                                            travelTimeInSeconds: 4724,
                                        },
                                        {
                                            distanceInMeters: 92887,
                                            point: [2.7795196, 41.8926716],
                                            travelTimeInSeconds: 4725,
                                        },
                                        {
                                            distanceInMeters: 92897,
                                            point: [2.7796322, 41.8927091],
                                            travelTimeInSeconds: 4726,
                                        },
                                        {
                                            distanceInMeters: 92907,
                                            point: [2.7797261, 41.8927655],
                                            travelTimeInSeconds: 4727,
                                        },
                                        {
                                            distanceInMeters: 92917,
                                            point: [2.7798012, 41.8928379],
                                            travelTimeInSeconds: 4728,
                                        },
                                        {
                                            distanceInMeters: 92928,
                                            point: [2.7798441, 41.8929237],
                                            travelTimeInSeconds: 4729,
                                        },
                                        {
                                            distanceInMeters: 92938,
                                            point: [2.7798575, 41.8930149],
                                            travelTimeInSeconds: 4730,
                                        },
                                        {
                                            distanceInMeters: 92948,
                                            point: [2.7798414, 41.8931034],
                                            travelTimeInSeconds: 4731,
                                        },
                                        {
                                            distanceInMeters: 92958,
                                            point: [2.7797905, 41.8931866],
                                            travelTimeInSeconds: 4732,
                                        },
                                        {
                                            distanceInMeters: 92964,
                                            point: [2.7797475, 41.8932322],
                                            travelTimeInSeconds: 4733,
                                        },
                                        {
                                            distanceInMeters: 92969,
                                            point: [2.7797046, 41.8932644],
                                            travelTimeInSeconds: 4733,
                                        },
                                        {
                                            distanceInMeters: 92978,
                                            point: [2.7796161, 41.8933126],
                                            travelTimeInSeconds: 4734,
                                        },
                                        {
                                            distanceInMeters: 92988,
                                            point: [2.7795035, 41.8933448],
                                            travelTimeInSeconds: 4735,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 723,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 624,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 43,
                                            side: 'LEFT',
                                        },
                                    ],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '',
                                        },
                                        towardName: {
                                            phonetic: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Girona',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -122,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'EXIT_ROUNDABOUT',
                                    maneuverPoint: [2.7795035, 41.8933448],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 51,
                                    previousRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-156',
                                                },
                                                roadNumber: {
                                                    phonetic:
                                                        '\u02c8\u025bn w\u028cn.f\u026af.ti\u02d0.\u02c8s\u026aks',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-156',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    roundaboutExitNumber: 4,
                                    routeOffsetInMeters: 92988,
                                    routePath: [
                                        {
                                            distanceInMeters: 92988,
                                            point: [2.7795035, 41.8933448],
                                            travelTimeInSeconds: 4735,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_RIGHT',
                                    maneuverPoint: [2.7769151, 41.8957695],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 93346,
                                    routePath: [
                                        {
                                            distanceInMeters: 93346,
                                            point: [2.7769151, 41.8957695],
                                            travelTimeInSeconds: 4757,
                                        },
                                    ],
                                    sideRoads: [],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '',
                                        },
                                        towardName: {
                                            phonetic: 'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Girona',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'MERGE_RIGHT_LANE',
                                    maneuverPoint: [2.7749035, 41.8985215],
                                    nextRoadInfo: {
                                        properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 93713,
                                    routePath: [
                                        {
                                            distanceInMeters: 93713,
                                            point: [2.7749035, 41.8985215],
                                            travelTimeInSeconds: 4775,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_LEFT',
                                    maneuverPoint: [2.7733102, 41.9042695],
                                    nextRoadInfo: {
                                        properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                    routeOffsetInMeters: 94365,
                                    routePath: [
                                        {
                                            distanceInMeters: 94365,
                                            point: [2.7733102, 41.9042695],
                                            travelTimeInSeconds: 4796,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'EXIT_MOTORWAY_RIGHT',
                                    maneuverPoint: [2.7853534, 41.9564304],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['MOTORWAY', 'CONTROLLED_ACCESS'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'AP-7',
                                                },
                                                roadNumber: {
                                                    phonetic: 'e\u2040\u026a.\u02c8pi\u02d0 \u02c8s\u025b.vn\u0329',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'AP-7',
                                                },
                                                stateCode: 'CT',
                                            },
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-green2-white-4',
                                                    shieldContent: 'E-15',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8i\u02d0 f\u026af.\u02c8ti\u02d0n',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'E-15',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u0254\u02d0.t\u0254\u02d0.\u02c8pi\u02d0.st\u0259 \u02c8d\u025bl m\u025b.d\u026a.t\u0259.\u02c8\u027be\u2040\u026a.ni\u02d0.\u0259\u2040\u028a',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Autopista del Mediterr\u00e1neo',
                                        },
                                    },
                                    routeOffsetInMeters: 100513,
                                    routePath: [
                                        {
                                            distanceInMeters: 100513,
                                            point: [2.7853534, 41.9564304],
                                            travelTimeInSeconds: 4991,
                                        },
                                    ],
                                    sideRoads: [],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '7',
                                        },
                                        towardName: {
                                            phonetic:
                                                'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259 \u02c8s\u028a\u2040\u0259\u027b',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'GIRONA S',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 6,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'STRAIGHT',
                                    maneuverPoint: [2.7891889, 41.9616553],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 101318,
                                    routePath: [
                                        {
                                            distanceInMeters: 101318,
                                            point: [2.7891889, 41.9616553],
                                            travelTimeInSeconds: 5044,
                                        },
                                        {
                                            distanceInMeters: 101328,
                                            point: [2.7893019, 41.9616871],
                                            travelTimeInSeconds: 5045,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 215,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'MERGE_RIGHT_LANE',
                                    maneuverPoint: [2.791324, 41.962401],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 101533,
                                    routePath: [
                                        {
                                            distanceInMeters: 101533,
                                            point: [2.791324, 41.962401],
                                            travelTimeInSeconds: 5064,
                                        },
                                    ],
                                    sideRoads: [],
                                    signpost: {
                                        exitName: {
                                            text: '',
                                        },
                                        exitNumber: {
                                            text: '',
                                        },
                                        towardName: {
                                            phonetic:
                                                'd\u2040\u0292\u026a.\u02c8\u027b\u0259\u2040\u028a.n\u0259 \u02c8s\u025bn.t\u0259\u027b',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Girona Centre',
                                        },
                                    },
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_LEFT',
                                    maneuverPoint: [2.8008378, 41.9614005],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'C-65',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8si\u02d0 s\u026ak.sti\u02d0.\u02c8fa\u2040\u026av',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'C-65',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'C-65',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8si\u02d0 s\u026ak.sti\u02d0.\u02c8fa\u2040\u026av',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'C-65',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 102404,
                                    routePath: [
                                        {
                                            distanceInMeters: 102404,
                                            point: [2.8008378, 41.9614005],
                                            travelTimeInSeconds: 5110,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_RIGHT',
                                    maneuverPoint: [2.8073367, 41.957463],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-blue2-white-4',
                                                    shieldContent: 'C-65',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8si\u02d0 s\u026ak.sti\u02d0.\u02c8fa\u2040\u026av',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'C-65',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 103109,
                                    routePath: [
                                        {
                                            distanceInMeters: 103109,
                                            point: [2.8073367, 41.957463],
                                            travelTimeInSeconds: 5144,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 225,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'KEEP_LEFT',
                                    maneuverPoint: [2.8088227, 41.9568434],
                                    nextRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    routeOffsetInMeters: 103250,
                                    routePath: [
                                        {
                                            distanceInMeters: 103250,
                                            point: [2.8088227, 41.9568434],
                                            travelTimeInSeconds: 5155,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    changeOfAngleInDegrees: -125,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_SHARP_LEFT',
                                    maneuverPoint: [2.8103408, 41.956763],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    roundaboutExitNumber: 4,
                                    routeOffsetInMeters: 103346,
                                    routePath: [
                                        {
                                            distanceInMeters: 103346,
                                            point: [2.8096998, 41.9562909],
                                            travelTimeInSeconds: 5175,
                                        },
                                        {
                                            distanceInMeters: 103349,
                                            point: [2.8097159, 41.9562668],
                                            travelTimeInSeconds: 5175,
                                        },
                                        {
                                            distanceInMeters: 103360,
                                            point: [2.8097963, 41.9561917],
                                            travelTimeInSeconds: 5177,
                                        },
                                        {
                                            distanceInMeters: 103363,
                                            point: [2.8098258, 41.9561702],
                                            travelTimeInSeconds: 5177,
                                        },
                                        {
                                            distanceInMeters: 103374,
                                            point: [2.8099358, 41.9561192],
                                            travelTimeInSeconds: 5178,
                                        },
                                        {
                                            distanceInMeters: 103382,
                                            point: [2.8100324, 41.9560978],
                                            travelTimeInSeconds: 5179,
                                        },
                                        {
                                            distanceInMeters: 103386,
                                            point: [2.8100753, 41.9560924],
                                            travelTimeInSeconds: 5180,
                                        },
                                        {
                                            distanceInMeters: 103394,
                                            point: [2.8101745, 41.9560924],
                                            travelTimeInSeconds: 5181,
                                        },
                                        {
                                            distanceInMeters: 103403,
                                            point: [2.8102738, 41.9561085],
                                            travelTimeInSeconds: 5182,
                                        },
                                        {
                                            distanceInMeters: 103406,
                                            point: [2.810314, 41.9561192],
                                            travelTimeInSeconds: 5182,
                                        },
                                        {
                                            distanceInMeters: 103417,
                                            point: [2.8104267, 41.9561675],
                                            travelTimeInSeconds: 5183,
                                        },
                                        {
                                            distanceInMeters: 103420,
                                            point: [2.8104508, 41.9561863],
                                            travelTimeInSeconds: 5184,
                                        },
                                        {
                                            distanceInMeters: 103420,
                                            point: [2.8104588, 41.956189],
                                            travelTimeInSeconds: 5184,
                                        },
                                        {
                                            distanceInMeters: 103429,
                                            point: [2.8105259, 41.9562507],
                                            travelTimeInSeconds: 5185,
                                        },
                                        {
                                            distanceInMeters: 103433,
                                            point: [2.8105527, 41.9562829],
                                            travelTimeInSeconds: 5185,
                                        },
                                        {
                                            distanceInMeters: 103444,
                                            point: [2.8105929, 41.9563687],
                                            travelTimeInSeconds: 5186,
                                        },
                                        {
                                            distanceInMeters: 103447,
                                            point: [2.810601, 41.9563955],
                                            travelTimeInSeconds: 5186,
                                        },
                                        {
                                            distanceInMeters: 103456,
                                            point: [2.8106037, 41.9564813],
                                            travelTimeInSeconds: 5187,
                                        },
                                        {
                                            distanceInMeters: 103459,
                                            point: [2.8105983, 41.9565055],
                                            travelTimeInSeconds: 5188,
                                        },
                                        {
                                            distanceInMeters: 103466,
                                            point: [2.8105769, 41.9565672],
                                            travelTimeInSeconds: 5188,
                                        },
                                        {
                                            distanceInMeters: 103471,
                                            point: [2.8105527, 41.9566074],
                                            travelTimeInSeconds: 5189,
                                        },
                                        {
                                            distanceInMeters: 103478,
                                            point: [2.8105071, 41.956661],
                                            travelTimeInSeconds: 5190,
                                        },
                                        {
                                            distanceInMeters: 103480,
                                            point: [2.8104883, 41.9566771],
                                            travelTimeInSeconds: 5190,
                                        },
                                        {
                                            distanceInMeters: 103487,
                                            point: [2.8104267, 41.9567227],
                                            travelTimeInSeconds: 5191,
                                        },
                                        {
                                            distanceInMeters: 103492,
                                            point: [2.8103784, 41.9567469],
                                            travelTimeInSeconds: 5191,
                                        },
                                        {
                                            distanceInMeters: 103496,
                                            point: [2.8103408, 41.956763],
                                            travelTimeInSeconds: 5192,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -125,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'EXIT_ROUNDABOUT',
                                    maneuverPoint: [2.8103408, 41.956763],
                                    nextRoadInfo: {
                                        properties: [],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 16,
                                    previousRoadInfo: {
                                        properties: [],
                                        streetName: {
                                            text: '',
                                        },
                                    },
                                    roundaboutExitNumber: 4,
                                    routeOffsetInMeters: 103496,
                                    routePath: [
                                        {
                                            distanceInMeters: 103496,
                                            point: [2.8103408, 41.956763],
                                            travelTimeInSeconds: 5192,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    changeOfAngleInDegrees: -1,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ROUNDABOUT_STRAIGHT',
                                    maneuverPoint: [2.8109872, 41.96132],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    roundaboutExitNumber: 3,
                                    routeOffsetInMeters: 103944,
                                    routePath: [
                                        {
                                            distanceInMeters: 103944,
                                            point: [2.8107861, 41.9605342],
                                            travelTimeInSeconds: 5238,
                                        },
                                        {
                                            distanceInMeters: 103966,
                                            point: [2.8109577, 41.960687],
                                            travelTimeInSeconds: 5241,
                                        },
                                        {
                                            distanceInMeters: 103986,
                                            point: [2.8110489, 41.9608507],
                                            travelTimeInSeconds: 5244,
                                        },
                                        {
                                            distanceInMeters: 103998,
                                            point: [2.8110811, 41.9609606],
                                            travelTimeInSeconds: 5245,
                                        },
                                        {
                                            distanceInMeters: 104016,
                                            point: [2.8110892, 41.9611189],
                                            travelTimeInSeconds: 5249,
                                        },
                                        {
                                            distanceInMeters: 104021,
                                            point: [2.8110784, 41.9611618],
                                            travelTimeInSeconds: 5249,
                                        },
                                        {
                                            distanceInMeters: 104035,
                                            point: [2.8110301, 41.9612825],
                                            travelTimeInSeconds: 5251,
                                        },
                                        {
                                            distanceInMeters: 104038,
                                            point: [2.8110087, 41.9613093],
                                            travelTimeInSeconds: 5252,
                                        },
                                        {
                                            distanceInMeters: 104040,
                                            point: [2.8109872, 41.96132],
                                            travelTimeInSeconds: 5252,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 62,
                                            side: 'LEFT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -1,
                                    drivingSide: 'RIGHT',
                                    maneuver: 'EXIT_ROUNDABOUT',
                                    maneuverPoint: [2.8109872, 41.96132],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 20,
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    roundaboutExitNumber: 3,
                                    routeOffsetInMeters: 104040,
                                    routePath: [
                                        {
                                            distanceInMeters: 104040,
                                            point: [2.8109872, 41.96132],
                                            travelTimeInSeconds: 5252,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 0,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    maneuver: 'STRAIGHT',
                                    maneuverPoint: [2.8166226, 41.975584],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    routeOffsetInMeters: 105694,
                                    routePath: [
                                        {
                                            distanceInMeters: 105694,
                                            point: [2.8166226, 41.975584],
                                            travelTimeInSeconds: 5550,
                                        },
                                        {
                                            distanceInMeters: 105703,
                                            point: [2.8166547, 41.9756591],
                                            travelTimeInSeconds: 5551,
                                        },
                                        {
                                            distanceInMeters: 105711,
                                            point: [2.8166842, 41.9757262],
                                            travelTimeInSeconds: 5552,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 967,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 924,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 875,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 798,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 741,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 671,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 671,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 636,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 636,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 603,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 565,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 486,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 426,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 426,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 378,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 314,
                                            side: 'RIGHT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 224,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 180,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 105,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 105,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 85,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [2.8176391, 41.9780919],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8s\u00e6nt \u02c8d\u2040\u0292\u0259\u2040\u028an b\u00e6p.\u02c8ti\u02d0.st\u0259 \u02c8d\u0259 \u02c8l\u00e6 \u02c8s\u0254\u02d0l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Sant Joan Baptista de la Salle',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 175,
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        roadShields: [
                                            {
                                                countryCode: 'ESP',
                                                roadShieldReference: {
                                                    reference: 'rectangle-red-white-5',
                                                    shieldContent: 'N-IIa',
                                                },
                                                roadNumber: {
                                                    phonetic: '\u02c8\u025bn \u02c8tu\u02d0 \u02c8e\u2040\u026a',
                                                    phoneticLanguageCode: 'en-GB',
                                                    text: 'N-IIa',
                                                },
                                                stateCode: 'CT',
                                            },
                                        ],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 b\u0251\u02d0\u027b.s\u0259.\u02c8l\u0259\u2040\u028a.n\u0259',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Barcelona',
                                        },
                                    },
                                    routeOffsetInMeters: 105985,
                                    routePath: [
                                        {
                                            distanceInMeters: 105985,
                                            point: [2.8176391, 41.9780919],
                                            travelTimeInSeconds: 5592,
                                        },
                                        {
                                            distanceInMeters: 105995,
                                            point: [2.8177556, 41.9780681],
                                            travelTimeInSeconds: 5594,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 175,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 175,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: -85,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_LEFT',
                                    maneuverPoint: [2.8199726, 41.9776225],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u2040\u0292\u0259\u2040\u028an m\u0259.\u027b\u0259.\u02c8g\u00e6j',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle Joan Maragall',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 102,
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u0259 \u02c8s\u00e6nt \u02c8d\u2040\u0292\u0259\u2040\u028an b\u00e6p.\u02c8ti\u02d0.st\u0259 \u02c8d\u0259 \u02c8l\u00e6 \u02c8s\u0254\u02d0l',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle de Sant Joan Baptista de la Salle',
                                        },
                                    },
                                    routeOffsetInMeters: 106185,
                                    routePath: [
                                        {
                                            distanceInMeters: 106185,
                                            point: [2.8199726, 41.9776225],
                                            travelTimeInSeconds: 5660,
                                        },
                                        {
                                            distanceInMeters: 106195,
                                            point: [2.8200136, 41.9777062],
                                            travelTimeInSeconds: 5665,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 102,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 30,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    changeOfAngleInDegrees: 85,
                                    drivingSide: 'RIGHT',
                                    intersectionName: {
                                        text: '',
                                    },
                                    isManeuverObligatory: false,
                                    maneuver: 'TURN_RIGHT',
                                    maneuverPoint: [2.8212118, 41.9794062],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u0259 \u02c8s\u00e6nt \u00e6n.\u02c8t\u0259\u2040\u028a.n\u026a m\u0259.\u02c8\u027bi\u02d0.\u0259 \u02c8kl\u00e6.\u027b\u0259t',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda de Sant Antoni Maria Claret',
                                        },
                                    },
                                    offsetOfAmbiguousExitFromManeuverInMeters: 121,
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8k\u00e6.je\u2040\u026a \u02c8d\u2040\u0292\u0259\u2040\u028an m\u0259.\u027b\u0259.\u02c8g\u00e6j',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Calle Joan Maragall',
                                        },
                                    },
                                    routeOffsetInMeters: 106410,
                                    routePath: [
                                        {
                                            distanceInMeters: 106410,
                                            point: [2.8212118, 41.9794062],
                                            travelTimeInSeconds: 5748,
                                        },
                                    ],
                                    sideRoads: [
                                        {
                                            drivable: true,
                                            offsetFromManeuverInMeters: 121,
                                            side: 'LEFT',
                                        },
                                        {
                                            drivable: false,
                                            offsetFromManeuverInMeters: 121,
                                            side: 'RIGHT',
                                        },
                                    ],
                                },
                                {
                                    pathPointIndex: expect.any(Number),
                                    drivingSide: 'RIGHT',
                                    maneuver: 'ARRIVE_LEFT',
                                    maneuverPoint: [2.8213479, 41.9793422],
                                    nextRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u0259 \u02c8s\u00e6nt \u00e6n.\u02c8t\u0259\u2040\u028a.n\u026a m\u0259.\u02c8\u027bi\u02d0.\u0259 \u02c8kl\u00e6.\u027b\u0259t',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda de Sant Antoni Maria Claret',
                                        },
                                    },
                                    previousRoadInfo: {
                                        properties: ['URBAN'],
                                        streetName: {
                                            phonetic:
                                                '\u02c8\u027b\u0252n.d\u0259 \u02c8d\u0259 \u02c8s\u00e6nt \u00e6n.\u02c8t\u0259\u2040\u028a.n\u026a m\u0259.\u02c8\u027bi\u02d0.\u0259 \u02c8kl\u00e6.\u027b\u0259t',
                                            phoneticLanguageCode: 'en-GB',
                                            text: 'Ronda de Sant Antoni Maria Claret',
                                        },
                                    },
                                    routeOffsetInMeters: 106424,
                                    routePath: [
                                        {
                                            distanceInMeters: 106424,
                                            point: [2.8213479, 41.9793422],
                                            travelTimeInSeconds: 5755,
                                        },
                                    ],
                                    sideRoads: [],
                                },
                            ],
                        },
                        progress: [
                            {
                                pointIndex: 0,
                                travelTimeInSeconds: 0,
                                distanceInMeters: 0,
                            },
                            {
                                pointIndex: 22,
                                travelTimeInSeconds: 224,
                                distanceInMeters: 302,
                            },
                            {
                                pointIndex: 31,
                                travelTimeInSeconds: 266,
                                distanceInMeters: 394,
                            },
                            {
                                pointIndex: 64,
                                travelTimeInSeconds: 591,
                                distanceInMeters: 870,
                            },
                            {
                                pointIndex: 101,
                                travelTimeInSeconds: 719,
                                distanceInMeters: 1332,
                            },
                            {
                                pointIndex: 127,
                                travelTimeInSeconds: 989,
                                distanceInMeters: 1707,
                            },
                            {
                                pointIndex: 139,
                                travelTimeInSeconds: 1027,
                                distanceInMeters: 2059,
                            },
                            {
                                pointIndex: 163,
                                travelTimeInSeconds: 1069,
                                distanceInMeters: 2645,
                            },
                            {
                                pointIndex: 282,
                                travelTimeInSeconds: 1272,
                                distanceInMeters: 6807,
                            },
                            {
                                pointIndex: 345,
                                travelTimeInSeconds: 1355,
                                distanceInMeters: 8369,
                            },
                            {
                                pointIndex: 377,
                                travelTimeInSeconds: 1458,
                                distanceInMeters: 9361,
                            },
                            {
                                pointIndex: 395,
                                travelTimeInSeconds: 1535,
                                distanceInMeters: 10277,
                            },
                            {
                                pointIndex: 476,
                                travelTimeInSeconds: 1660,
                                distanceInMeters: 12661,
                            },
                            {
                                pointIndex: 526,
                                travelTimeInSeconds: 1747,
                                distanceInMeters: 14909,
                            },
                            {
                                pointIndex: 638,
                                travelTimeInSeconds: 2015,
                                distanceInMeters: 23000,
                            },
                            {
                                pointIndex: 787,
                                travelTimeInSeconds: 2276,
                                distanceInMeters: 31112,
                            },
                            {
                                pointIndex: 1118,
                                travelTimeInSeconds: 3243,
                                distanceInMeters: 62355,
                            },
                            {
                                pointIndex: 1298,
                                travelTimeInSeconds: 3687,
                                distanceInMeters: 76786,
                            },
                            {
                                pointIndex: 1465,
                                travelTimeInSeconds: 4106,
                                distanceInMeters: 90240,
                            },
                            {
                                pointIndex: 1519,
                                travelTimeInSeconds: 4208,
                                distanceInMeters: 91729,
                            },
                            {
                                pointIndex: 1523,
                                travelTimeInSeconds: 4247,
                                distanceInMeters: 91772,
                            },
                            {
                                pointIndex: 1524,
                                travelTimeInSeconds: 4614,
                                distanceInMeters: 91772,
                            },
                            {
                                pointIndex: 1526,
                                travelTimeInSeconds: 4642,
                                distanceInMeters: 91798,
                            },
                            {
                                pointIndex: 1548,
                                travelTimeInSeconds: 4664,
                                distanceInMeters: 91996,
                            },
                            {
                                pointIndex: 1566,
                                travelTimeInSeconds: 4720,
                                distanceInMeters: 92836,
                            },
                            {
                                pointIndex: 1599,
                                travelTimeInSeconds: 4761,
                                distanceInMeters: 93432,
                            },
                            {
                                pointIndex: 1658,
                                travelTimeInSeconds: 4917,
                                distanceInMeters: 98272,
                            },
                            {
                                pointIndex: 1687,
                                travelTimeInSeconds: 5003,
                                distanceInMeters: 100718,
                            },
                            {
                                pointIndex: 1709,
                                travelTimeInSeconds: 5056,
                                distanceInMeters: 101449,
                            },
                            {
                                pointIndex: 1757,
                                travelTimeInSeconds: 5155,
                                distanceInMeters: 103250,
                            },
                            {
                                pointIndex: 1776,
                                travelTimeInSeconds: 5186,
                                distanceInMeters: 103447,
                            },
                            {
                                pointIndex: 1802,
                                travelTimeInSeconds: 5238,
                                distanceInMeters: 103944,
                            },
                            {
                                pointIndex: 1817,
                                travelTimeInSeconds: 5280,
                                distanceInMeters: 104175,
                            },
                            {
                                pointIndex: 1834,
                                travelTimeInSeconds: 5322,
                                distanceInMeters: 104513,
                            },
                            {
                                pointIndex: 1841,
                                travelTimeInSeconds: 5348,
                                distanceInMeters: 104727,
                            },
                            {
                                pointIndex: 1846,
                                travelTimeInSeconds: 5367,
                                distanceInMeters: 104825,
                            },
                            {
                                pointIndex: 1856,
                                travelTimeInSeconds: 5389,
                                distanceInMeters: 104959,
                            },
                            {
                                pointIndex: 1868,
                                travelTimeInSeconds: 5425,
                                distanceInMeters: 105064,
                            },
                            {
                                pointIndex: 1887,
                                travelTimeInSeconds: 5473,
                                distanceInMeters: 105380,
                            },
                            {
                                pointIndex: 1892,
                                travelTimeInSeconds: 5501,
                                distanceInMeters: 105500,
                            },
                            {
                                pointIndex: 1896,
                                travelTimeInSeconds: 5511,
                                distanceInMeters: 105589,
                            },
                            {
                                pointIndex: 1902,
                                travelTimeInSeconds: 5552,
                                distanceInMeters: 105711,
                            },
                            {
                                pointIndex: 1915,
                                travelTimeInSeconds: 5606,
                                distanceInMeters: 106041,
                            },
                            {
                                pointIndex: 1924,
                                travelTimeInSeconds: 5646,
                                distanceInMeters: 106155,
                            },
                            {
                                pointIndex: 1934,
                                travelTimeInSeconds: 5715,
                                distanceInMeters: 106314,
                            },
                            {
                                pointIndex: 1941,
                                travelTimeInSeconds: 5755,
                                distanceInMeters: 106424,
                            },
                        ],
                    },
                },
            ],
        } as Routes,
    ],
];
