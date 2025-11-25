import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildGeocodingRequest } from '../requestBuilder';
import { geocodingReqObjectsAndUrLs } from './requestBuilder.data';
import { geocodingReqObjects } from './requestBuilderPerf.data';

describe('Geocoding service URL building functional tests', () => {
    test.each(geocodingReqObjectsAndUrLs)(`'%s`, (_name, params, url) => {
        expect(buildGeocodingRequest(params).toString()).toStrictEqual(url);
    });
});

describe('Geocoding service request builder performance tests', () => {
    test('Geocoding service request builder performance test', () => {
        expect(bestExecutionTimeMS(() => buildGeocodingRequest(geocodingReqObjects), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.geocoding.requestBuilding,
        );
    });
});
