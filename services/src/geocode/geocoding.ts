import { callService } from '../shared/serviceTemplate';
import type { GeocodingTemplate } from './geocodingTemplate';
import { geocodingTemplate } from './geocodingTemplate';
import type { GeocodingParams } from './types/geocodingParams';
import type { GeocodingResponse } from './types/geocodingResponse';

/**
 * In many cases, the complete Search service might be too much.
 * For instance, if you are only interested in traditional Geocoding, Search can also be exclusively accessed for address look-up.
 * The Geocoding is performed by hitting the Geocode endpoint with just the address or partial address in question.
 * The Geocoding index will be queried for everything above the street level data.
 *
 * No POIs (Points of Interest) will be returned.
 * Note that the geocoder is very tolerant of typos and incomplete addresses.
 * It will also handle everything from exact street addresses, streets, or intersections
 * as well as higher-level geographies such as city centers, counties, states, etc.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://docs.tomtom.com/search-api/documentation/geocoding-service/geocode
 */
export const geocode = async (
    params: GeocodingParams,
    customTemplate?: Partial<GeocodingTemplate>,
): Promise<GeocodingResponse> => callService(params, { ...geocodingTemplate, ...customTemplate }, 'Geocode');

export default geocode;
