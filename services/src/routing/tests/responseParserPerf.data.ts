import type { CalculateRouteParams } from '..';
import type { CalculateRouteResponseAPI, TrafficSectionAPI } from '../types/apiResponseTypes';

const COORDINATE_COUNT = 50000;
const NUM_INSTRUCTIONS = 500;

const generateCoordinates = (count: number): [number, number][] =>
    Array.from({ length: count }, (_, index) => [4.87 + index * 0.00002, 52.3 + index * 0.00002] as [number, number]);

const coordinates = generateCoordinates(COORDINATE_COUNT);

const generateTrafficSections = (count: number): TrafficSectionAPI[] =>
    Array.from({ length: count }, (_, index) => ({
        startPathIndex: index * 10,
        endPathIndex: index * 10 + 9,
        delayDurationInSeconds: 30,
        effectiveSpeedInKilometersPerHour: 20,
        delayMagnitude: 'moderate',
        tec: { causes: [{ mainCauseCode: 1 }], effectCode: 4 },
    }));

export const longApiResponse: [CalculateRouteResponseAPI, CalculateRouteParams] = [
    {
        routes: [
            {
                summary: {
                    lengthInMeters: 4660261,
                    travelDurationInSeconds: 153475,
                    trafficDelayDurationInSeconds: 288,
                    trafficLengthInMeters: 20964,
                    departureDateTime: '2023-11-27T21:22:53.000Z',
                    arrivalDateTime: '2023-11-29T16:00:48.000Z',
                    noTrafficTravelTimeInSeconds: 148547,
                    historicTrafficTravelTimeInSeconds: 153224,
                    liveTrafficIncidentsTravelTimeInSeconds: 153475,
                },
                legs: [
                    {
                        summary: {
                            lengthInMeters: 4660261,
                            travelDurationInSeconds: 153475,
                            trafficDelayDurationInSeconds: 288,
                            trafficLengthInMeters: 20964,
                            departureDateTime: '2023-11-27T21:22:53.000Z',
                            arrivalDateTime: '2023-11-29T16:00:48.000Z',
                            noTrafficTravelTimeInSeconds: 148547,
                            historicTrafficTravelTimeInSeconds: 153224,
                            liveTrafficIncidentsTravelTimeInSeconds: 153475,
                        },
                        path: { type: 'LineString', coordinates },
                    },
                ],
                sections: {
                    urban: [{ startPathIndex: 0, endPathIndex: COORDINATE_COUNT - 1 }],
                    traffic: generateTrafficSections(Math.floor(COORDINATE_COUNT / 10) - 1),
                    country: [{ startPathIndex: 0, endPathIndex: COORDINATE_COUNT - 1, countryCodeIso2: 'DE' }],
                },
                instructions: Array.from({ length: NUM_INSTRUCTIONS }, (_, index) => {
                    let maneuver = 'TURN_RIGHT';
                    if (index === 0) maneuver = 'DEPART';
                    else if (index === NUM_INSTRUCTIONS - 1) maneuver = 'ARRIVE';
                    // maneuverPoint follows the API's LatLonPointAPI shape ({ latitude, longitude }),
                    // sourced from a real on-path coordinate ([longitude, latitude]) so the guidance
                    // parser's path-matching scan finds each point and advances along the route.
                    const [longitude, latitude] = coordinates[index * Math.floor(COORDINATE_COUNT / NUM_INSTRUCTIONS)];
                    return {
                        maneuver,
                        maneuverPoint: { latitude, longitude },
                        drivingSide: 'right',
                        routeOffsetInMeters: index * 100000,
                        routePath: [],
                    };
                }),
            },
        ],
    },
    {} as CalculateRouteParams,
];
