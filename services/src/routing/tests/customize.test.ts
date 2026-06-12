import { describe, expect, test } from 'vitest';
import { customizeService } from '../../../index';

// NOSONAR: structuredClone cannot clone URL objects; JSON round-trip is intentional here.
const buildRequest = (params: Parameters<typeof customizeService.calculateRoute.buildCalculateRouteRequest>[0]) =>
    JSON.parse(JSON.stringify(customizeService.calculateRoute.buildCalculateRouteRequest(params))); // NOSONAR

const BASE_PARAMS = {
    apiKey: 'API_KEY',
    apiVersion: 3 as const,
    commonBaseURL: 'https://api.tomtom.com',
    locations: [[4.88066, 52.37319] as [number, number], [4.49015, 52.16109] as [number, number]],
};

describe('Using customize obj', () => {
    test('calc route request URL building tests using customize obj', () => {
        expect(buildRequest(BASE_PARAMS)).toEqual(
            JSON.parse(
                JSON.stringify({
                    method: 'POST',
                    url: new URL('https://api.tomtom.com/maps/orbis/routing/routes/calculate'),
                    data: {
                        routePlanningLocations: {
                            origin: { type: 'Point', coordinates: [4.88066, 52.37319] },
                            destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                        },
                    },
                    headers: {
                        'TomTom-Api-Key': 'API_KEY',
                        'TomTom-Api-Version': '3',
                        Attributes:
                            'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
                    },
                }),
            ),
        );
    });
});

describe('sectionTypes Attributes header behaviour', () => {
    test('sections included in Attributes header when sectionTypes is undefined', () => {
        const req = buildRequest(BASE_PARAMS);
        expect(req.headers.Attributes).toContain('sections');
    });

    test('sections included in Attributes header when sectionTypes lists specific types', () => {
        const req = buildRequest({ ...BASE_PARAMS, sectionTypes: ['traffic', 'toll'] });
        expect(req.headers.Attributes).toContain('sections');
    });

    test('EXPLICIT sections added by default when sectionTypes is undefined (preserves V2 behavior)', () => {
        const req = buildRequest(BASE_PARAMS);
        expect(req.headers.Attributes).toContain('sections.tollVignette');
        expect(req.headers.Attributes).toContain('sections.roadShields');
        expect(req.headers.Attributes).toContain('sections.importantRoadStretch');
    });

    test('sections.lanes not added by default even when sectionTypes is undefined and no guidance', () => {
        const req = buildRequest(BASE_PARAMS);
        expect(req.headers.Attributes).not.toContain('sections.lanes');
    });

    test('sections.lanes added by default when sectionTypes is undefined and guidance is requested', () => {
        const req = buildRequest({ ...BASE_PARAMS, guidance: { type: 'coded' } });
        expect(req.headers.Attributes).toContain('sections.lanes');
    });

    test('sections.tollVignette added when tollVignette is in sectionTypes', () => {
        const req = buildRequest({ ...BASE_PARAMS, sectionTypes: ['tollVignette', 'traffic'] });
        expect(req.headers.Attributes).toContain('sections.tollVignette');
        expect(req.headers.Attributes).not.toContain('sections.roadShields');
    });

    test('sections.roadShields added when roadShields is in sectionTypes', () => {
        const req = buildRequest({ ...BASE_PARAMS, sectionTypes: ['roadShields'] });
        expect(req.headers.Attributes).toContain('sections.roadShields');
    });

    test('sections.importantRoadStretch added when importantRoadStretch is in sectionTypes', () => {
        const req = buildRequest({ ...BASE_PARAMS, sectionTypes: ['importantRoadStretch'] });
        expect(req.headers.Attributes).toContain('sections.importantRoadStretch');
    });

    test('sections.lanes added when lanes is in sectionTypes and guidance is requested', () => {
        const req = buildRequest({ ...BASE_PARAMS, guidance: { type: 'coded' }, sectionTypes: ['lanes', 'traffic'] });
        expect(req.headers.Attributes).toContain('sections.lanes');
    });

    test('sections.lanes not added when lanes is in sectionTypes but guidance is not requested', () => {
        const req = buildRequest({ ...BASE_PARAMS, sectionTypes: ['lanes', 'traffic'] });
        expect(req.headers.Attributes).not.toContain('sections.lanes');
    });

    test('sections.lanes not added when guidance is requested but lanes is not in sectionTypes', () => {
        const req = buildRequest({ ...BASE_PARAMS, guidance: { type: 'coded' }, sectionTypes: ['traffic'] });
        expect(req.headers.Attributes).not.toContain('sections.lanes');
    });

    test('sections omitted from Attributes header when sectionTypes is an empty array', () => {
        const req = buildRequest({ ...BASE_PARAMS, sectionTypes: [] });
        expect(req.headers.Attributes).not.toContain('sections');
    });

    test('API key is sent only in header, not as a query param', () => {
        const req = buildRequest(BASE_PARAMS);
        const url: string = req.url;
        expect(url).not.toContain('key=');
        expect(req.headers['TomTom-Api-Key']).toBe('API_KEY');
    });
});
