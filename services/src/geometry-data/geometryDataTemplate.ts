import type { PolygonFeatures } from '@cet/maps-sdk-js/core';
import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { geometryDataRequestSchema } from './geometryDataRequestSchema';
import { buildGeometryDataRequest } from './requestBuilder';
import { parseGeometryDataResponse } from './responseParser';
import type { GeometryDataResponseAPI } from './types/apiTypes';
import type { GeometryParams } from './types/geometryDataParams';

/**
 * @ignore
 */
export type GeometryDataTemplate = ServiceTemplate<GeometryParams, URL, GeometryDataResponseAPI, PolygonFeatures>;

/**
 * @ignore
 */
export const geometryDataTemplate: GeometryDataTemplate = {
    requestValidation: { schema: geometryDataRequestSchema },
    buildRequest: buildGeometryDataRequest,
    sendRequest: get,
    parseResponse: parseGeometryDataResponse,
};
