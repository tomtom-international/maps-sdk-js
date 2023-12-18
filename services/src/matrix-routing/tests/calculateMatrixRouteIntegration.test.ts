import { putIntegrationTestsAPIKey } from "../../shared/tests/integrationTestUtils";
import { calculateMatrixRoute } from "../calculateMatrixRoute";

const customersList = [
    [-122.42445383121401, 37.768076271233085],
    [-122.41557035495649, 37.76851728743638],
    [-122.42535505344227, 37.75424224518545],
    [-122.41642866184063, 37.75559946352948],
    [-122.40368280460183, 37.76343691239411],
    [-122.40334333334422, 37.76343691211131]
];

const sanFranciscoRestaurant = [
    [-122.4249259, 37.7641325],
    [-122.5432123, 37.7641325]
];

describe("Matrix Routing tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test.skip("Calculate Matrix route should work", async () => {
        const response = await calculateMatrixRoute({
            origins: sanFranciscoRestaurant,
            destinations: customersList
        });

        console.log(response);

        expect(1).toBe(1);
    });
});
