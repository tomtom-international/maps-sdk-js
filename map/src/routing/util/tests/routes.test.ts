import type { DisplayUnits, Routes } from '@anw/maps-sdk-js/core';
import type { DisplayRouteProps, DisplayRouteSummaries } from '../../types/displayRoutes';
import { toDisplayRouteSummaries, toDisplayRoutes } from '../routes';
import displayRouteSummariesData from './data/displayRouteSummaries.data.json';

describe('Tests to test building display routes', () => {
    test('Build display routes', () => {
        expect(toDisplayRoutes({ features: [{ properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeStyle: 'selected' } }],
        });
        expect(toDisplayRoutes({ features: [{ properties: {} }, { properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeStyle: 'selected' } }, { properties: { routeStyle: 'deselected' } }],
        });
    });

    test.each(displayRouteSummariesData)(
        `'%s`,
        // @ts-ignore
        (
            _name: string,
            displayRoutes: Routes<DisplayRouteProps>,
            displayUnits: DisplayUnits,
            expectedSummaries: DisplayRouteSummaries,
        ) => expect(toDisplayRouteSummaries(displayRoutes, displayUnits)).toEqual(expectedSummaries),
    );
});
