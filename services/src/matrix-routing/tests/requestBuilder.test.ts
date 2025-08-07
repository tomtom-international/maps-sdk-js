import { describe, expect, test } from 'vitest';
import type { FetchInput } from '../../shared';
import { buildCalculateMatrixRouteRequest } from '../requestBuilder';
import type { CalculateMatrixRoutePOSTDataAPI } from '../types/apiRequestTypes';
import type { CalculateMatrixRouteParams } from '../types/calculateMatrixRouteParams';
import { sdkAndAPIRequests } from './requestBuilder.data';

describe('Matrix Routing - Request builder', () => {
    test.each(sdkAndAPIRequests)(
        "'%s'",
        (
            _name: string,
            params: CalculateMatrixRouteParams,
            apiRequest: FetchInput<CalculateMatrixRoutePOSTDataAPI>,
        ) => {
            // we reparse the objects to compare URL objects properly:
            expect(JSON.parse(JSON.stringify(buildCalculateMatrixRouteRequest(params)))).toEqual(
                JSON.parse(JSON.stringify(apiRequest)),
            );
        },
    );
});
