import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseRevGeoResponse } from '../responseParser';
import apiAndParsedResponses from './responseParser.data';
import apiResponses from './responseParserPerf.data';

describe('ReverseGeocode response parsing tests', () => {
    test.each(apiAndParsedResponses)("'%s'", (_name, params, apiResponse, expectedParsedResponse) => {
        expect(parseRevGeoResponse(apiResponse, params)).toMatchObject(expectedParsedResponse);
    });

    // The `dataSources.geometry.id` is only fetchable for area results, so it must not be set for
    // the others. `toMatchObject` above cannot assert an absent field.
    test('does not expose a geometry data source for a non-area result', () => {
        const parsed = parseRevGeoResponse(
            {
                results: [
                    {
                        id: '00005858-5800-1200-0000-0000773670cd',
                        type: 'street',
                        title: 'Hierderweg, 8077 Hulshorst',
                        position: { type: 'Point', coordinates: [5.728785, 52.335152] },
                        address: { street: 'Hierderweg', countryCodeIso2: 'NL' },
                    },
                ],
            },
            { position: [5.72884, 52.33499] },
        );

        expect(parsed.properties.dataSources).toBeUndefined();
        expect(parsed.properties.address.countryCodeISO3).toStrictEqual('NLD');
    });
});

describe('ReverseGeocode response parsing performance tests', () => {
    test.each(apiResponses)("'%s'", (_title, params, apiResponse) => {
        expect(bestExecutionTimeMS(() => parseRevGeoResponse(apiResponse, params), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.revGeo.responseParsing,
        );
    });
});
