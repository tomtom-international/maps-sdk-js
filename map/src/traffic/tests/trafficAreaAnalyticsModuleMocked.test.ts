import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import type { TomTomMap } from '../../TomTomMap';
import { TrafficAreaAnalyticsModule } from '../TrafficAreaAnalyticsModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Traffic area analytics module tests', () => {
    function createMockMap(): TomTomMap {
        const geometrySource = { id: 'sourceID', setData: vi.fn() };
        return {
            mapLibreMap: {
                once: vi.fn().mockReturnValue(Promise.resolve()),
                getSource: vi.fn().mockReturnValue(geometrySource),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: {} }),
                getLayer: vi.fn(),
                addLayer: vi.fn(),
                isStyleLoaded: vi.fn().mockReturnValue(true),
                setLayoutProperty: vi.fn(),
                setPaintProperty: vi.fn(),
                setFilter: vi.fn(),
                moveLayer: vi.fn(),
                getLayoutProperty: vi.fn().mockReturnValue('visible'),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
                updateIfRegistered: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValueOnce(false).mockReturnValue(true),
        } as unknown as TomTomMap;
    }

    /** Minimal TrafficAreaAnalytics response with one tile. */
    function createSampleAnalytics(): TrafficAreaAnalytics {
        return {
            type: 'FeatureCollection',
            properties: {
                startDate: new Date('2024-08-06'),
                endDate: new Date('2024-08-10'),
                metrics: ['speed', 'congestionLevel'],
                heatmap: false,
                frcs: [0, 1, 2],
                ranges: {
                    congestionLevel: { min: 45, max: 45 },
                    speed: { min: 35, max: 35 },
                    freeFlowSpeed: { min: 60, max: 60 },
                    travelTime: { min: 8, max: 8 },
                },
            },
            features: [
                {
                    type: 'Feature',
                    id: 'feat-001',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-3.71, 40.41],
                                [-3.7, 40.42],
                                [-3.69, 40.41],
                                [-3.71, 40.41],
                            ],
                        ],
                    },
                    bbox: [-3.71, 40.41, -3.69, 40.42],
                    properties: {
                        name: 'Test Region',
                        timezone: 'Europe/Madrid',
                        level: 0,
                        baseData: { congestionLevel: 45, speed: 35, freeFlowSpeed: 60, travelTime: 8 },
                        timedData: {},
                        tiledData: {
                            tiles: [
                                {
                                    tileCentre: [-3.7, 40.4],
                                    congestionLevel: 45,
                                    speed: 35,
                                    freeFlowSpeed: 60,
                                    travelTime: 8,
                                },
                            ],
                        },
                    },
                },
            ],
        };
    }

    test('Initialising module with default config', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);
        expect(module).toBeDefined();
        expect(module.getShown().heatmap.features).toHaveLength(0);
        expect(module.getShown().hexgrid.features).toHaveLength(0);
    });

    test('Initialising module with explicit config', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap, {
            displayMode: 'heatmap',
            activeMetric: 'speed',
            visible: true,
        });
        expect(module).toBeDefined();
        expect(module.getConfig()).toMatchObject({
            displayMode: 'heatmap',
            activeMetric: 'speed',
            visible: true,
        });
    });

    test('show() populates both sources from raw response and clear() resets', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        await module.show(createSampleAnalytics());
        expect(module.getShown().heatmap.features.length).toBeGreaterThanOrEqual(1);

        await module.clear();
        expect(module.getShown().heatmap.features).toHaveLength(0);
        expect(module.getShown().hexgrid.features).toHaveLength(0);
    });

    test('setMetric() is a no-op when value unchanged', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        module.setMetric('speed');
        const callCount = (mockMap.mapLibreMap.setPaintProperty as ReturnType<typeof vi.fn>).mock.calls.length;

        module.setMetric('speed'); // same value — should be no-op
        expect((mockMap.mapLibreMap.setPaintProperty as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });

    test('setMetric() updates paint properties when value changes', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        module.setMetric('speed');
        expect(mockMap.mapLibreMap.setPaintProperty).toHaveBeenCalled();
        expect(module.getConfig()?.activeMetric).toBe('speed');

        module.setMetric('travelTime');
        expect(module.getConfig()?.activeMetric).toBe('travelTime');
    });

    test('setMode() toggles layer visibility', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        module.setMode('heatmap');
        expect(module.getConfig()?.displayMode).toBe('heatmap');

        module.setMode('hexgrid-3d');
        expect(module.getConfig()?.displayMode).toBe('hexgrid-3d');
    });

    test('setMode() is a no-op when value unchanged', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        module.setMode('heatmap');
        const callCount = (mockMap.mapLibreMap.setLayoutProperty as ReturnType<typeof vi.fn>).mock.calls.length;

        module.setMode('heatmap'); // same value — should be no-op
        expect((mockMap.mapLibreMap.setLayoutProperty as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });

    test('setVisible() controls all layer visibility', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        module.setVisible(false);
        expect(module.getConfig()?.visible).toBe(false);

        module.setVisible(true);
        expect(module.getConfig()?.visible).toBe(true);
    });

    test('setColor() with preset theme updates active metric config and repaints', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        module.setColor('heat');
        // Theme is expanded to explicit raw stops for each metric (not stored as the theme string).
        const color = module.getConfig()?.metricConfig?.congestionLevel?.color;
        expect(color).toMatchObject({
            valueType: 'raw',
            stops: expect.arrayContaining([expect.objectContaining({ color: expect.any(String) })]),
        });
        expect(mockMap.mapLibreMap.setPaintProperty).toHaveBeenCalled();
    });

    test('setColor() with custom color stops updates active metric config and repaints', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap, {
            activeMetric: 'congestionLevel',
            metricConfig: { congestionLevel: { color: 'heat' } },
        });

        const callCountBefore = (mockMap.mapLibreMap.setPaintProperty as ReturnType<typeof vi.fn>).mock.calls.length;
        module.setColor({
            valueType: 'raw',
            stops: [
                { value: 0, color: '#aaaaaa' },
                { value: 50, color: '#555555' },
                { value: 100, color: '#000000' },
            ],
        });
        expect((mockMap.mapLibreMap.setPaintProperty as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
            callCountBefore,
        );
    });

    test('applyConfig() deep-merges metricConfig record', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap, {
            activeMetric: 'congestionLevel',
            metricConfig: { congestionLevel: { color: 'heat' } },
        });

        module.applyConfig({
            metricConfig: {
                speed: {
                    color: {
                        valueType: 'raw',
                        stops: [
                            { value: 0, color: '#aaaaaa' },
                            { value: 60, color: '#555555' },
                            { value: 120, color: '#000000' },
                        ],
                    },
                },
            },
        });

        // congestionLevel config should still be present after deep merge
        expect(module.getConfig()?.metricConfig?.congestionLevel?.color).toBe('heat');
        // speed config should now be set
        expect(module.getConfig()?.metricConfig?.speed?.color).toBeDefined();
    });

    test('events property is defined', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);
        expect(module.events).toBeDefined();
    });

    test('applyConfig with undefined resets', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap, { displayMode: 'heatmap' });
        module.applyConfig(undefined);
        expect(module.getConfig()).toBeUndefined();
    });

    test('restoreDataAndConfigImpl keeps source and layer IDs stable across a style change', async () => {
        const mockMap = createMockMap();
        const mod = await TrafficAreaAnalyticsModule.get(mockMap);
        await mod.show(createSampleAnalytics());

        const before = structuredClone(mod.sourceAndLayerIDs);

        (mod as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect(mod.sourceAndLayerIDs).toEqual(before);
    });
});
