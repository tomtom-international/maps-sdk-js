import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { parseGeometryDataResponse } from '../responseParser';
import type { GeometryDataResponseAPI } from '../types/apiTypes';
import apiAndParsedResponses from './responseParser.data';

describe('Geometry Data response parser tests', () => {
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name, apiResponse: GeometryDataResponseAPI, parsedResponse: PolygonFeatures) => {
        expect(parseGeometryDataResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});
