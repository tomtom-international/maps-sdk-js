import { describe, expect, test } from 'vitest';
import type { SDKServiceError } from '../errors';
import { parseDefaultResponseError } from '../errors';
import type { APIErrorResponse } from '../types/apiResponseErrorTypes';
import type { ServiceName } from '../types/servicesTypes';
import errorResponses from './responseError.data.json';

describe('Default error response parsing tests', () => {
    test.each(
        errorResponses,
    )("'%s'", (_name: string, apiResponseError: APIErrorResponse, serviceName: ServiceName, expectedSdkError: SDKServiceError) => {
        // @ts-ignore
        const sdkResponseError = parseDefaultResponseError(apiResponseError, serviceName);
        expect(sdkResponseError).toMatchObject(expectedSdkError);
    });
});
