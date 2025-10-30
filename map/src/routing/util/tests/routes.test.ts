import type { DisplayUnits, Routes } from '@tomtom-org/maps-sdk-js/core';
import { describe, expect, test } from 'vitest';
import type { DisplayRouteProps, DisplayRouteSummaries } from '../../types/displayRoutes';
import { toDisplayRouteSummaries, toDisplayRoutes } from '../routes';
import displayRouteSummariesData from './data/displayRouteSummaries.data.json';

describe('Tests to test building display routes', () => {
    test('Build display routes', () => {
        expect(toDisplayRoutes({ features: [{ properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeState: 'selected' } }],
        });
        expect(toDisplayRoutes({ features: [{ properties: {} }, { properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeState: 'selected' } }, { properties: { routeState: 'deselected' } }],
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
