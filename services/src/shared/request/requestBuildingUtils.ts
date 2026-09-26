import type { HasLngLat, POICategory, TomTomAPIHeaders } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, getPosition, poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import { isNil } from 'lodash-es';
import { arrayToCSV } from '../arrays';
import type { CommonServiceParams } from '../serviceTypes';
import type { GeoBias } from '../types/geoBias';

/**
 * The credential pair: the API key and the API version.
 *
 * @remarks
 * The `apiKey` guard is what makes proxy deployments work: with no key configured nothing is
 * emitted, and `fetch` attaches `credentials: 'include'` so the proxy can inject the real one.
 */
const buildCredentialHeaders = (params: CommonServiceParams): TomTomAPIHeaders => ({
    ...(params.apiKey && { 'TomTom-Api-Key': params.apiKey }),
    ...(!isNil(params.apiVersion) && { 'TomTom-Api-Version': String(params.apiVersion) }),
});

/**
 * Builds the TomTom API request headers common to every service: the credential pair plus the
 * language. Service request builders spread the result and add any service-specific headers
 * (e.g. `Attributes`) on top.
 * @ignore
 */
export const buildCommonServiceRequestHeaders = (params: CommonServiceParams): TomTomAPIHeaders => ({
    ...buildCredentialHeaders(params),
    ...(params.language && { 'Accept-Language': params.language }),
});

/**
 * @ignore
 * @param urlParams
 * @param params
 */
export const appendCommonParams = (urlParams: URLSearchParams, params: CommonServiceParams): void => {
    urlParams.append('apiVersion', String(params.apiVersion));
    if (params.apiKey) {
        urlParams.append('key', params.apiKey);
    }
    params.language && urlParams.append('language', params.language);
};

/**
 * The credential headers for a places request: the API key and the API version, and nothing else.
 *
 * @remarks
 * Deliberately **not** {@link buildCommonServiceRequestHeaders}, which also emits
 * `Accept-Language`. The `apiVersion=1` places endpoints ignore that header — a request carrying it
 * comes back in the default language, with no error. Only `language=` in the query string
 * localizes, so {@link appendPlacesLanguageParam} keeps it there. Probed against production; the
 * API documentation does not state it.
 *
 * `reverseGeocode` is the exception and uses the common builder, because it is pinned to
 * `apiVersion: 2`, where the header is honoured.
 *
 * @ignore
 */
export const buildPlacesRequestHeaders = (params: CommonServiceParams): TomTomAPIHeaders =>
    buildCredentialHeaders(params);

/**
 * Appends the query parameters a places request still carries in the URL.
 *
 * @remarks
 * Only `language`. The key and the version moved to headers — see
 * {@link buildPlacesRequestHeaders} for why this one could not follow them.
 *
 * @ignore
 */
export const appendPlacesLanguageParam = (urlParams: URLSearchParams, params: CommonServiceParams): void => {
    params.language && urlParams.append('language', params.language);
};

/**
 * Adds parameter from the array by repeating each array part into a query parameter of the same name.
 * E.g. ...&avoid=motorways&avoid=ferries&...
 * @ignore
 * @param urlParams
 * @param paramName
 * @param paramArray
 */
export const appendByRepeatingParamName = (
    urlParams: URLSearchParams,
    paramName: string,
    paramArray?: string[],
): void => {
    for (const param of paramArray || []) {
        urlParams.append(paramName, param);
    }
};

/**
 * @ignore
 */
export const appendByJoiningParamValue = (
    urlParams: URLSearchParams,
    name: string,
    values?: string[] | number[] | (string | number)[],
): void => {
    if (Array.isArray(values) && values.length > 0) {
        urlParams.append(name, values.join(','));
    }
};

/**
 * @ignore
 */
export const appendOptionalParam = (
    urlParams: URLSearchParams,
    name: string,
    value?: string | number | boolean,
): void => {
    !isNil(value) && urlParams.append(name, String(value));
};

/**
 * Adds lat and lon parameters to the url.
 * @ignore
 * @param urlParams
 * @param hasLngLat
 */
export const appendLatLonParamsFromPosition = (urlParams: URLSearchParams, hasLngLat: HasLngLat | undefined): void => {
    const position = getPosition(hasLngLat);
    if (position) {
        urlParams.append('lat', String(position[1]));
        urlParams.append('lon', String(position[0]));
    }
};

/**
 * Adds whichever geographic bias was given: `lat`/`lon` plus `radius` for a point, or the
 * `topLeft`/`btmRight` corner pair for a bounding box.
 *
 * @ignore
 */
export const appendGeoBiasParams = (urlParams: URLSearchParams, geoBias: GeoBias | undefined): void => {
    if (!geoBias) return;

    if (geoBias.position !== undefined) {
        appendLatLonParamsFromPosition(urlParams, geoBias.position);
        appendOptionalParam(urlParams, 'radius', geoBias.radiusMeters);

        return;
    }

    const bbox = bboxFromGeoJSON(geoBias.boundingBox);
    if (!bbox) return;

    urlParams.append('topLeft', arrayToCSV([bbox[3], bbox[0]]));
    urlParams.append('btmRight', arrayToCSV([bbox[1], bbox[2]]));
};

/**
 * Map POICategory values to their numeric IDs for use in API requests.
 * @ignore
 */
export const mapPOICategoriesToIDs = (categories: POICategory[]): number[] =>
    categories.map((category) => poiCategoriesToID[category]);
