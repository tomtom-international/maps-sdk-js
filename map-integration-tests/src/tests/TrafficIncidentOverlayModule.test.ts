import { expect, test } from '@playwright/test';
import type { TrafficIncidentDetails } from 'core';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    clearTrafficIncidentOverlay,
    initTrafficIncidentOverlay,
    showTrafficIncidentOverlay,
    waitForMapIdle,
} from './util/TestUtils';

const fixture: TrafficIncidentDetails = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 'a1',
            properties: {
                id: 'a1',
                category: 'accident',
                magnitudeOfDelay: 'major',
                events: [{ description: 'Accident', code: 1, category: 'accident' }],
                timeValidity: 'present',
            },
            geometry: { type: 'Point', coordinates: [4.9, 52.37] },
        },
        {
            type: 'Feature',
            id: 'j1',
            properties: {
                id: 'j1',
                category: 'jam',
                magnitudeOfDelay: 'moderate',
                events: [{ description: 'Jam', code: 6, category: 'jam' }],
                timeValidity: 'present',
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.88, 52.36],
                    [4.92, 52.38],
                ],
            },
        },
    ],
};

test.describe('Traffic Incident Overlay module integration tests', () => {
    const amsterdamCenter: [number, number] = [4.9, 52.37];

    test('show() renders line and symbol layers; setVisible toggles visibility', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: amsterdamCenter, zoom: 13 });
        await initTrafficIncidentOverlay(page);
        await showTrafficIncidentOverlay(page, fixture);
        await waitForMapIdle(page);

        const ids = await page.evaluate(
            () => (globalThis as MapsSDKThis).trafficIncidentOverlay?.sourceAndLayerIDs.incidents,
        );
        expect(ids?.sourceID).toMatch(/^traffic-incident-overlay-\d+$/);
        // 5 line layers (focus-halo + outline + inner-solid + inner-chevron + inner-pattern) + 3 symbol marker layers.
        expect(ids?.layerIDs).toHaveLength(8);
        const canonicalSuffixes = [
            '-focus-halo',
            '-outline',
            '-inner-solid',
            '-inner-chevron',
            '-inner-pattern',
            '-incident-marker',
            '-jam-marker',
            '-closed-road-marker',
        ];
        for (const suffix of canonicalSuffixes) {
            expect(ids?.layerIDs.some((id) => id.endsWith(suffix))).toBe(true);
        }

        // Source exists on the map
        const sourceExists = await page.evaluate((sourceID: string) => {
            const sdk = globalThis as MapsSDKThis;
            return !!sdk.mapLibreMap.getSource(sourceID);
        }, ids!.sourceID);
        expect(sourceExists).toBe(true);

        // Both layers are visible
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.isVisible())).toBe(true);

        // Hide all layers
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.isVisible())).toBe(false);

        // Show again
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.setVisible(true));
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.isVisible())).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('clear() empties the source and getShown() returns no incidents', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: amsterdamCenter, zoom: 13 });
        await initTrafficIncidentOverlay(page);
        await showTrafficIncidentOverlay(page, fixture);
        await waitForMapIdle(page);

        // Sanity: rendering happened before clear — at least one incident rendered at this zoom
        const shownBefore = await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.getShown());
        expect(shownBefore?.incidents.length).toBeGreaterThan(0);

        await clearTrafficIncidentOverlay(page);
        await waitForMapIdle(page);

        const shown = await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.getShown());
        expect(shown?.incidents).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setFocus writes feature-state; setFocus(null) clears it', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: amsterdamCenter, zoom: 13 });
        await initTrafficIncidentOverlay(page);
        await showTrafficIncidentOverlay(page, fixture);
        await waitForMapIdle(page);

        const sourceID = await page.evaluate(
            () => (globalThis as MapsSDKThis).trafficIncidentOverlay?.sourceAndLayerIDs.incidents.sourceID,
        );
        expect(sourceID).toBeDefined();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.setFocus(['a1']));
        await waitForMapIdle(page);

        const afterFocus = await page.evaluate((sid: string) => {
            const sdk = globalThis as MapsSDKThis;
            return {
                a1: sdk.mapLibreMap.getFeatureState({ source: sid, id: 'a1' }),
                j1: sdk.mapLibreMap.getFeatureState({ source: sid, id: 'j1' }),
            };
        }, sourceID!);

        expect(afterFocus.a1).toEqual({ focused: true });
        expect(afterFocus.j1).toEqual({ focused: false });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.setFocus(null));
        await waitForMapIdle(page);

        const afterClear = await page.evaluate((sid: string) => {
            const sdk = globalThis as MapsSDKThis;
            return { a1: sdk.mapLibreMap.getFeatureState({ source: sid, id: 'a1' }) };
        }, sourceID!);

        expect(afterClear.a1).toEqual({});
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
