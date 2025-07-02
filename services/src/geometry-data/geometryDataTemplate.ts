import type { PolygonFeatures } from '@anw/maps-sdk-js/core';
import type { ServiceTemplate } from '../shared';
import type { GeometryDataResponseAPI } from './types/apiTypes';
import type { GeometryParams } from './types/geometryDataParams';
import { buildGeometryDataRequest } from './requestBuilder';
import { get } from '../shared/fetch';
import { parseGeometryDataResponse } from './responseParser';
import { geometryDataRequestSchema } from './geometryDataRequestSchema';

export type GeometryDataTemplate = ServiceTemplate<GeometryParams, URL, GeometryDataResponseAPI, PolygonFeatures>;

export const geometryDataTemplate: GeometryDataTemplate = {
    requestValidation: { schema: geometryDataRequestSchema },
    buildRequest: buildGeometryDataRequest,
    sendRequest: get,
    parseResponse: parseGeometryDataResponse,
};
