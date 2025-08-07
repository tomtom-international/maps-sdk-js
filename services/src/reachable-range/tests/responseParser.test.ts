import type { PolygonFeature } from '@anw/maps-sdk-js/core';
import { describe, expect, test } from 'vitest';
import { parseReachableRangeResponse } from '../responseParser';
import type { ReachableRangeResponseAPI } from '../types/apiResponseTypes';
import type { ReachableRangeParams } from '../types/reachableRangeParams';
import apiAndParsedResponses from './responseParser.data.json';

describe.skip('Calculate Route response parsing functional tests', () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponse: ReachableRangeResponseAPI,
            params: ReachableRangeParams,
            parsedResponse: PolygonFeature<ReachableRangeParams>,
        ) => expect(parseReachableRangeResponse(apiResponse, params)).toEqual(parsedResponse),
    );
});
