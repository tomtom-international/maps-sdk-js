import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { GetObject, ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { geometryDataRequestSchema } from './geometryDataRequestSchema';
import { buildGeometryDataRequest } from './requestBuilder';
import { parseGeometryDataResponse } from './responseParser';
import type { GeometryDataResponseAPI } from './types/apiTypes';
import type { GeometryParams } from './types/geometryDataParams';

/**
 * @ignore
 */
export type GeometryDataTemplate = ServiceTemplate<GeometryParams, GetObject, GeometryDataResponseAPI, PolygonFeatures>;

/**
 * @ignore
 */
export const geometryDataTemplate: GeometryDataTemplate = {
    requestValidation: { schema: geometryDataRequestSchema },
    buildRequest: buildGeometryDataRequest,
    sendRequest: get,
    parseResponse: parseGeometryDataResponse,
};
