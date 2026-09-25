import { beforeAll, describe, expect, test } from 'vitest';
import { geocodeOne } from '../../geocode/geocoding';
import { calculateReachableRanges } from '../../reachable-range/calculateReachableRange';
import { calculateRoute } from '../../routing/calculateRoute';
import { search } from '../../search/search';
import type { VehicleParameters } from '../types/vehicleParams';
import { putIntegrationTestsAPIKey } from './integrationTestUtils';

// The composite: four services chained, each one's output feeding the next — geocode the stops,
// plan the route, search along the route the router returned, then ask what is reachable from the
// destination. What has to keep working is that every hop passes GeoJSON straight through, since
// the joins are what an integration written from scratch has to build itself. Backs the
// `routing-composite` example, so if the example breaks this says why.
//
// The vehicle is duplicated in that example rather than shared: the example imports the published
// package as a customer would, and reaching into `services/src` would break that.

// A 60 kWh vehicle at 80%, which cannot cross the Alps in one go — so the service has to plan the
// charging stops rather than returning a single leg.
const EV_VEHICLE: VehicleParameters = {
    engineType: 'electric',
    state: { currentChargePCT: 80 },
    preferences: {
        chargingPreferences: { minChargeAtChargingStopsPCT: 20, minChargeAtDestinationPCT: 20 },
    },
    model: {
        engine: {
            charging: {
                maxChargeKWH: 60,
                batteryCurve: [
                    { stateOfChargeInkWh: 15, maxPowerInkW: 150 },
                    { stateOfChargeInkWh: 45, maxPowerInkW: 100 },
                    { stateOfChargeInkWh: 57, maxPowerInkW: 40 },
                ],
                chargingConnectors: [
                    {
                        currentType: 'DC',
                        plugTypes: ['IEC_62196_Type_2_Outlet', 'Combo_to_IEC_62196_Type_2_Base'],
                        voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
                        efficiency: 0.9,
                        baseLoadInkW: 0.2,
                        maxPowerInkW: 150,
                    },
                ],
            },
            consumption: {
                speedsToConsumptionsKWH: [
                    { speedKMH: 32, consumptionUnitsPer100KM: 12.1 },
                    { speedKMH: 77, consumptionUnitsPer100KM: 19.4 },
                ],
            },
        },
    },
};

describe('four routing services chained, as a real feature uses them', () => {
    beforeAll(putIntegrationTestsAPIKey);

    test('geocoded stops feed the router, the route feeds the search, the destination feeds the range', {
        timeout: 60_000,
    }, async () => {
        // 1 — Two place names in, two waypoints out, already in the shape the router takes.
        const waypoints = await Promise.all(['Munich, DE', 'Verona, IT'].map(geocodeOne));
        expect(waypoints).toHaveLength(2);

        // 2 — An electric route. The service picks the charging stops itself.
        const routes = await calculateRoute({ locations: waypoints, vehicle: EV_VEHICLE });
        const route = routes.features[0].properties;
        const legs = route.sections.leg;
        // Munich to Verona is roughly 400 km, so anything under 200 km is a route to somewhere else.
        expect(route.summary.lengthInMeters).toBeGreaterThan(200_000);

        // More than one leg means stops were planned, which is what makes the rest meaningful.
        expect(legs.length).toBeGreaterThan(1);
        const chargingLegs = legs.filter((leg) => leg.summary.chargingInformationAtEndOfLeg);
        expect(chargingLegs.length).toBeGreaterThan(0);

        // Every leg that ends at a charging stop reports the time spent there. This is derived, not
        // returned: the API has no wait field, so it is the arrival-to-next-departure gap.
        for (const leg of chargingLegs) {
            expect(leg.summary.stopTimeInSeconds).toBeGreaterThan(0);
        }

        // The route total includes the stops, so it exceeds the sum of the driving legs.
        const drivingSeconds = legs.reduce((total, leg) => total + leg.summary.travelTimeInSeconds, 0);
        expect(route.summary.travelTimeInSeconds).toBeGreaterThan(drivingSeconds);

        // 3 — The route feature goes straight into the search. No reshaping between the two.
        const alongRoute = await search({
            poiCategories: ['ELECTRIC_VEHICLE_STATION', 'REST_AREA'],
            route: routes.features[0],
            maxDetourTimeSeconds: 300,
            limit: 20,
        });
        expect(alongRoute.features.length).toBeGreaterThan(0);
        expect(alongRoute.type).toBe('FeatureCollection');

        // 4 — The destination waypoint goes straight into the reachable range.
        const ranges = await calculateReachableRanges([
            { origin: waypoints[waypoints.length - 1], budget: { type: 'timeMinutes', value: 20 } },
        ]);
        expect(ranges.features).toHaveLength(1);
        expect(ranges.features[0].geometry.type).toBe('Polygon');
        expect(ranges.features[0].geometry.coordinates[0].length).toBeGreaterThan(10);
    });
});
