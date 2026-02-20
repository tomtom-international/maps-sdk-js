import { describe, expect, test } from 'vitest';
import { customizeService } from '../../../index';

describe('Using customize obj', () => {
    test('calc route request URL building tests using customize obj', () => {
        // Using JSON parse and stringify to compare URL objects easily:
        expect(
            JSON.parse(
                JSON.stringify(
                    customizeService.calculateRoute.buildCalculateRouteRequest({
                        apiKey: 'API_KEY',
                        apiVersion: 3,
                        commonBaseURL: 'https://api.tomtom.com',
                        locations: [
                            [4.88066, 52.37319],
                            [4.49015, 52.16109],
                        ],
                    }),
                ),
            ),
        ).toEqual(
            JSON.parse(
                JSON.stringify({
                    method: 'GET',
                    url: new URL(
                        'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37319,4.88066:52.16109,4.49015/json?' +
                            'apiVersion=3&key=API_KEY&language=en-GB' +
                            '&sectionType=carpool&sectionType=carTrain&sectionType=country&sectionType=ferry' +
                            '&sectionType=importantRoadStretch' +
                            '&sectionType=lowEmissionZone&sectionType=motorway&sectionType=pedestrian' +
                            '&sectionType=roadShields&sectionType=speedLimit&sectionType=toll&sectionType=tollVignette' +
                            '&sectionType=traffic&sectionType=tunnel&sectionType=unpaved&sectionType=urban' +
                            '&sectionType=travelMode' +
                            '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
                    ),
                }),
            ),
        );
    });
});
