import { describe, expect, test } from 'vitest';
import type { Route } from '../../types';
import { getRoutePlanningLocationType } from '../routePlanningLocations';

describe('locations utility tests', () => {
    test('getRoutePlanningLocationType tests', () => {
        expect(getRoutePlanningLocationType([3, 4])).toStrictEqual('waypoint');
        expect(getRoutePlanningLocationType([[3, 4]])).toStrictEqual('path');
        expect(
            getRoutePlanningLocationType([
                [0, 1],
                [3, 4],
            ]),
        ).toStrictEqual('path');
        expect(getRoutePlanningLocationType({ type: 'Point', coordinates: [0, 1] })).toStrictEqual('waypoint');
        expect(
            getRoutePlanningLocationType({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [0, 1] },
                properties: {},
            }),
        ).toStrictEqual('waypoint');
        expect(
            getRoutePlanningLocationType({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[0, 1]] },
                properties: {},
            } as Route),
        ).toStrictEqual('path');
    });
});
