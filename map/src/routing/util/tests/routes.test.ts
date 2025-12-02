import type { DisplayUnits, Route, Routes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import type { DisplayRouteProps, DisplayRouteSummaries } from '../../types/displayRoutes';
import { toDisplayRouteSummaries, toDisplayRoutes } from '../routes';
import { displayRouteSummariesData } from './data/displayRouteSummaries.data';

describe('Tests to test building display routes', () => {
    test('Build display routes from Routes', () => {
        expect(toDisplayRoutes({ features: [{ properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeState: 'selected' } }],
        });
        expect(toDisplayRoutes({ features: [{ properties: {} }, { properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeState: 'selected' } }, { properties: { routeState: 'deselected' } }],
        });
    });

    test('Build display routes from single Route', () => {
        const singleRoute = { properties: {} } as Route;
        expect(toDisplayRoutes(singleRoute)).toEqual({
            type: 'FeatureCollection',
            features: [{ properties: { routeState: 'selected' } }],
        });
    });

    test.each(
        displayRouteSummariesData,
    )('%s', (_name: string, displayRoutes: Routes<DisplayRouteProps>, displayUnits: DisplayUnits, expectedSummaries: DisplayRouteSummaries) => {
        expect(toDisplayRouteSummaries(displayRoutes, displayUnits)).toEqual(expectedSummaries);
    });
});
