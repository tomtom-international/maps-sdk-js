import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { describe, expect, test } from 'vitest';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildGeocodingRequest } from '../requestBuilder';
import type { GeocodingParams } from '../types/geocodingParams';
import geocodingReqObjectsAndUrLs from './requestBuilder.data.json';
import geocodingReqObjects from './requestBuilderPerf.data.json';

describe('Geocoding service URL building functional tests', () => {
    test.each(geocodingReqObjectsAndUrLs)(
        `'%s`,
        //@ts-ignore
        (_name: string, params: GeocodingParams, url: string) => {
            expect(buildGeocodingRequest(params).toString()).toStrictEqual(url);
        },
    );
});

describe('Geocoding service request builder performance tests', () => {
    test('Geocoding service request builder performance test', () => {
        expect(
            bestExecutionTimeMS(() => buildGeocodingRequest(geocodingReqObjects as GeocodingParams), 10),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.geocoding.requestBuilding);
    });
});
