import { describe, expect, test } from 'vitest';
import { PLACES_URL_PATH, resolvePlacesEndpointUrl } from '../request/placesEndpoint';
import type { CommonServiceParams } from '../serviceTypes';

const BASE = 'https://api.tomtom.com';
const params = (overrides: Partial<CommonServiceParams> = {}): CommonServiceParams => ({
    commonBaseURL: BASE,
    ...overrides,
});

// The happy path — a plain endpoint, an interpolated query segment, a `customServiceBaseURL`
// override — is asserted end to end by every per-service `requestBuilder.test.ts`, each of which
// compares a full URL string. Only the behaviour this resolver *changed* is pinned here.
describe('resolvePlacesEndpointUrl', () => {
    // Builders were previously split between `??` and `||`. Under `??` an empty override produced
    // an empty string and `new URL('')` threw; the resolver treats it as unset instead. Pinned so
    // the ten services cannot drift apart again.
    test('an empty customServiceBaseURL falls back to the default rather than producing an unusable URL', () => {
        const url = resolvePlacesEndpointUrl(params({ customServiceBaseURL: '' }), 'geocode');

        expect(url).toBe(`${BASE}${PLACES_URL_PATH}/geocode`);
        expect(() => new URL(url)).not.toThrow();
    });
});
