import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildRevGeoRequest } from '../requestBuilder';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';
import reverseGeocodeReqObjectsAndUrls from './requestBuilder.data.json';
import reverseGeocodeReqObjects from './requestBuilderPerf.data.json';

describe('Reverse Geocoding request URL building functional tests', () => {
    test.each(
        reverseGeocodeReqObjectsAndUrls,
    )("'%s'", (_title: string, params: ReverseGeocodingParams, url: string) => {
        // @ts-ignore
        expect(buildRevGeoRequest(params).toString()).toStrictEqual(url);
    });
});

describe('Reverse Geocoding request URL building performance test', () => {
    test.each(reverseGeocodeReqObjects)("'%s'", (_title: string, params: ReverseGeocodingParams) => {
        // @ts-ignore
        expect(bestExecutionTimeMS(() => buildRevGeoRequest(params), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.revGeo.requestBuilding,
        );
    });
});
