import { buildEVChargingStationsAvailabilityRequest } from '../requestBuilder';
import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';

describe('EV charging stations availability URL building functional tests', () => {
    test('Basic EV request building', () => {
        expect(
            buildEVChargingStationsAvailabilityRequest({
                apiKey: 'GLOBAL_API_KEY',
                apiVersion: 1,
                commonBaseURL: 'https://api-test.tomtom.com',
                id: '1234567890',
            }).toString(),
        ).toBe('https://api-test.tomtom.com/maps/orbis/places/ev/id?apiVersion=1&key=GLOBAL_API_KEY&id=1234567890');

        expect(
            buildEVChargingStationsAvailabilityRequest({
                apiKey: 'GLOBAL_API_KEY',
                apiVersion: 1,
                commonBaseURL: 'https://api-test.tomtom.com',
                language: 'es-ES',
                id: '1234567890',
            }).toString(),
        ).toBe(
            'https://api-test.tomtom.com/maps/orbis/places/ev/id?apiVersion=1&key=GLOBAL_API_KEY&language=es-ES&id=1234567890',
        );
    });
});

describe('EV charging stations availability URL building performance tests', () => {
    test('EV charging stations availability URL building performance test', async () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    buildEVChargingStationsAvailabilityRequest({
                        apiKey: 'APIKEY',
                        commonBaseURL: 'https://api.tomtom.com',
                        language: 'en-GB',
                        id: '528009002413828',
                    }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.ev.requestBuilding);
    });
});
