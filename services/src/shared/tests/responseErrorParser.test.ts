import { describe, expect, test } from 'vitest';
import { parseDefaultResponseError } from '../errors';
import errorResponses from './responseError.data';

describe('Default error response parsing tests', () => {
    test.each(errorResponses)("'%s'", (_name, apiResponseError, serviceName, expectedSdkError) => {
        const sdkResponseError = parseDefaultResponseError(apiResponseError, serviceName);
        expect(sdkResponseError).toMatchObject(expectedSdkError);
    });
});
