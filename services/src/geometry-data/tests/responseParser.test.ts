import type { PolygonFeatures } from '@anw/maps-sdk-js/core';
import { describe, expect, test } from 'vitest';
import { parseGeometryDataResponse } from '../responseParser';
import type { GeometryDataResponseAPI } from '../types/apiTypes';
import apiAndParsedResponses from './responseParser.data.json';

describe('Geometry Data response parser tests', () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: GeometryDataResponseAPI, parsedResponse: PolygonFeatures) => {
            expect(parseGeometryDataResponse(apiResponse)).toStrictEqual(parsedResponse);
        },
    );
});
