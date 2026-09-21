import { describe, expect, test } from 'vitest';
import { validateRequestSchema } from '../../shared/schema/validation';
import { matrixRouteValidationConfig } from '../calculateMatrixRouteRequestSchema';
import type { CalculateMatrixRouteParams } from '../types/calculateMatrixRouteParams';

describe('Calculate matrix route request schema validation', () => {
    const config = matrixRouteValidationConfig;

    const baseParams: CalculateMatrixRouteParams = {
        apiKey: 'APIKEY',
        commonBaseURL: 'https://api-test.tomtom.com',
        origins: [[4.89066, 52.37317]],
        destinations: [[4.49015, 52.16109]],
    };

    const validate = (params: CalculateMatrixRouteParams) => () =>
        validateRequestSchema<CalculateMatrixRouteParams>(params, config);

    test('it should accept every option MatrixRouteOptions offers', () => {
        expect(
            validate({
                ...baseParams,
                options: {
                    departAt: 'now',
                    routeType: 'fastest',
                    traffic: 'live',
                    travelMode: 'truck',
                    vehicleWeight: 3500,
                    vehicleMaxSpeed: 90,
                    vehicleCommercial: true,
                    avoid: ['tollRoads', 'unpavedRoads'],
                },
            }),
        ).not.toThrow();
    });

    test('it should accept a Date for departAt and the "any" literal for arriveAt', () => {
        expect(
            validate({ ...baseParams, options: { departAt: new Date(Date.UTC(2030, 8, 16, 15, 0)) } }),
        ).not.toThrow();
        expect(validate({ ...baseParams, options: { arriveAt: 'any' } })).not.toThrow();
    });

    test('it should accept the GeoJSON forms of HasLngLat for origins and destinations', () => {
        expect(
            validate({
                ...baseParams,
                origins: [{ type: 'Point', coordinates: [4.89066, 52.37317] }],
                destinations: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                        properties: {},
                    },
                ],
            }),
        ).not.toThrow();
    });

    test('it should reject an avoid value the endpoint does not support', () => {
        expect(validate({ ...baseParams, options: { avoid: ['motorways' as never] } })).toThrow();
    });

    test('it should reject a travel mode the endpoint does not support', () => {
        expect(validate({ ...baseParams, options: { travelMode: 'bicycle' as never } })).toThrow();
    });

    test('it should reject a max speed above the accepted range', () => {
        expect(validate({ ...baseParams, options: { vehicleMaxSpeed: 300 } })).toThrow();
    });

    test('it should reject missing origins', () => {
        const { origins: _origins, ...withoutOrigins } = baseParams;

        expect(validate(withoutOrigins as CalculateMatrixRouteParams)).toThrow(
            expect.objectContaining({ issues: [expect.objectContaining({ path: ['origins'] })] }),
        );
    });
});
