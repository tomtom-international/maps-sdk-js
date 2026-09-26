import { describe, expect, test } from 'vitest';
import { buildAlongRouteSearchRequest } from '../../along-route-search/requestBuilder';
import { buildAutocompleteSearchRequest } from '../../autocomplete-search/requestBuilder';
import { buildEVChargingStationsAvailabilityRequest } from '../../ev-charging-stations-availability/requestBuilder';
import { buildFuzzySearchRequest } from '../../fuzzy-search/requestBuilder';
import { buildGeocodingRequest } from '../../geocode/requestBuilder';
import { buildGeometryDataRequest } from '../../geometry-data/requestBuilder';
import { buildGeometrySearchRequest } from '../../geometry-search/requestBuilder';
import { buildPlaceByIdRequest } from '../../place-by-id/requestBuilder';
import { buildPoiCategoriesRequest } from '../../poi-categories/requestBuilder';
import { buildRevGeoRequest } from '../../revgeo/requestBuilder';

// Where a places credential is allowed to travel. The key used to sit in the query string on every
// one of these, which put it in server logs and `Referer` headers. It now travels as a header —
// except on `ev/id`, which answers 401 to a header-only credential. One test so the split cannot
// drift silently.

const COMMON = { commonBaseURL: 'https://api.tomtom.com', apiKey: 'SECRET_KEY', apiVersion: 1 } as const;

// The `apiVersion=1` places endpoints, which ignore `Accept-Language` and take the language in the
// query string instead.
const versionOneBuilders = [
    ['fuzzySearch', () => buildFuzzySearchRequest({ ...COMMON, query: 'pizza' })],
    ['geometrySearch', () => buildGeometrySearchRequest({ ...COMMON, query: 'pizza', geometries: [] })],
    [
        'alongRouteSearch',
        () =>
            buildAlongRouteSearchRequest({
                ...COMMON,
                query: 'pizza',
                maxDetourTimeSeconds: 300,
                route: { type: 'LineString', coordinates: [[4.9, 52.37]] },
            }),
    ],
    ['autocompleteSearch', () => buildAutocompleteSearchRequest({ ...COMMON, query: 'pizza' })],
    ['geocode', () => buildGeocodingRequest({ ...COMMON, query: 'amsterdam' })],
    ['placeById', () => buildPlaceByIdRequest({ ...COMMON, entityId: 'abc' })],
    ['poiCategories', () => buildPoiCategoriesRequest({ ...COMMON })],
    ['geometryData', () => buildGeometryDataRequest({ ...COMMON, geometries: ['abc'] })],
] as const;

const headerAuthBuilders = [
    ...versionOneBuilders,
    ['reverseGeocode', () => buildRevGeoRequest({ ...COMMON, position: [4.9, 52.37] })],
] as const;

describe('places credentials travel as headers, not in the URL', () => {
    test.each(headerAuthBuilders)('%s sends no key in the query string', (_name, build) => {
        const { url } = build();

        expect(url.searchParams.has('key')).toBe(false);
        expect(url.toString()).not.toContain('SECRET_KEY');
    });

    test.each(headerAuthBuilders)('%s sends the key as a header instead', (_name, build) => {
        const { headers } = build();

        expect(headers?.['TomTom-Api-Key']).toBe('SECRET_KEY');
    });

    test.each(versionOneBuilders)('%s never emits Accept-Language, which these endpoints ignore', (_name, build) => {
        const { headers } = build();

        expect(headers).not.toHaveProperty('Accept-Language');
    });

    // Proxy deployments run with no apiKey and rely on `credentials: 'include'` to have the proxy
    // inject the real one. An empty or present-but-blank header would defeat that.
    test('no key configured means no credential header at all', () => {
        const { headers } = buildFuzzySearchRequest({
            commonBaseURL: 'https://proxy.example',
            apiVersion: 1,
            query: 'pizza',
        });

        expect(headers).not.toHaveProperty('TomTom-Api-Key');
        expect(headers?.['TomTom-Api-Version']).toBe('1');
    });

    // The documented exception. If this ever starts passing as a header, the endpoint has caught up
    // and `ev/id` can join the rest.
    test('evChargingStationsAvailability still carries the key in the query string', () => {
        const url = buildEVChargingStationsAvailabilityRequest({ ...COMMON, id: '123' });

        expect(url.searchParams.get('key')).toBe('SECRET_KEY');
    });
});

describe('language stays in the query string on places requests', () => {
    // `Accept-Language` is silently ignored by the apiVersion=1 places endpoints — a request
    // carrying it comes back in the default language with no error.
    test('fuzzySearch puts language in the URL and not in a header', () => {
        const { url, headers } = buildFuzzySearchRequest({ ...COMMON, query: 'pizza', language: 'es-ES' });

        expect(url.searchParams.get('language')).toBe('es-ES');
        expect(headers).not.toHaveProperty('Accept-Language');
    });

    // `reverseGeocode` is the documented exception: pinned to `apiVersion: 2`, where the header is
    // honoured, so it keeps the common header builder and sends no `language=`.
    test('reverseGeocode sends the language as a header instead', () => {
        const { url, headers } = buildRevGeoRequest({ ...COMMON, position: [4.9, 52.37], language: 'es-ES' });

        expect(headers?.['Accept-Language']).toBe('es-ES');
        expect(url.searchParams.has('language')).toBe(false);
    });
});
