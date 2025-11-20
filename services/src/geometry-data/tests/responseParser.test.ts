import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { parseGeometryDataResponse } from '../responseParser';
import type { GeometryDataResponseAPI } from '../types/apiTypes';
import apiAndParsedResponses from './responseParser.data.json';

describe('Geometry Data response parser tests', () => {
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: GeometryDataResponseAPI, parsedResponse: PolygonFeatures) => {
        // @ts-ignore
        expect(parseGeometryDataResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});
