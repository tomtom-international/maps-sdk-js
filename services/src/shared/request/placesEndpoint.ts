import type { CommonServiceParams } from '../serviceTypes';

/**
 * The path every places endpoint hangs off.
 *
 * @ignore
 */
export const PLACES_URL_PATH = '/maps/orbis/places';

/**
 * The URL for one places endpoint, honouring a caller's `customServiceBaseURL` override.
 *
 * @remarks
 * `endpoint` is the path below {@link PLACES_URL_PATH}, already interpolated where it carries a
 * query — `'search/pizza.json'`, `'poiCategories.json'`, `'ev/id'`.
 *
 * An **empty** `customServiceBaseURL` counts as unset — hence `||` rather than `??`, since
 * `new URL('')` throws. One resolver, so every places service answers the same way.
 *
 * @ignore
 */
export const resolvePlacesEndpointUrl = (params: CommonServiceParams, endpoint: string): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}${PLACES_URL_PATH}/${endpoint}`;
