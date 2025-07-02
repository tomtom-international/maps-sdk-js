import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import { calculateMatrixRoute } from '../calculateMatrixRoute';

const customersList = [
    [-122.42445383121401, 37.768076271233085],
    [-122.41557035495649, 37.76851728743638],
    [-122.42535505344227, 37.75424224518545],
];

const sanFranciscoRestaurant = [
    [-122.4249259, 37.7641325],
    [-122.5432123, 37.7641325],
];

describe('Matrix Routing tests', () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test('Calculate Matrix route should work', async () => {
        const response = await calculateMatrixRoute({
            origins: sanFranciscoRestaurant,
            destinations: customersList,
        });

        expect(response).toHaveProperty('data');
        expect(response).toHaveProperty('statistics');

        expect(response.data).toHaveLength(6);

        const expectedTypes = {
            originIndex: expect.any(Number),
            destinationIndex: expect.any(Number),
            routeSummary: {
                lengthInMeters: expect.any(Number),
                travelTimeInSeconds: expect.any(Number),
                trafficDelayInSeconds: expect.any(Number),
            },
        };

        response.data.forEach((route) => {
            expect(route).toMatchObject(expectedTypes);
        });
    });
});
