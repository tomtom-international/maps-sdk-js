import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Polygon } from 'geojson';
import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import type { TomTomMap } from '../../TomTomMap';
import { TrafficAreaAnalyticsModule } from '../TrafficAreaAnalyticsModule';
import type { AreaAnalyticsDisplayProperties } from '../types/trafficAreaAnalyticsFeature';

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
                dataTypes: ['SPEED', 'CONGESTION_LEVEL'],
                heatmap: false,
                frcs: [0, 1, 2],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'feat-001',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[-3.71, 40.41], [-3.70, 40.42], [-3.69, 40.41], [-3.71, 40.41]]],
                    },
                    properties: {
                        name: 'Test Region',
                        timezone: 'Europe/Madrid',
                        level: 0,
                        baseData: { congestionLevel: 45, speed: 35, freeFlowSpeed: 60, travelTime: 8 },
                        timedData: {},
                        tiledData: {
                            tiles: [
                                { tileCentre: [-3.7, 40.4], congestionLevel: 45, speed: 35, freeFlowSpeed: 60, travelTime: 8 },
                            ],
                        },
                    },
                },
            ],
        };
    }

    function createSampleHexagons(): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'hex-0',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[-3.71, 40.41], [-3.70, 40.42], [-3.69, 40.41], [-3.69, 40.39], [-3.70, 40.38], [-3.71, 40.39], [-3.71, 40.41]]],
                    },
                    properties: { id: 'hex-0', congestionLevel: 45, speed: 35, freeFlowSpeed: 60, travelTime: 8 },
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
            mode: 'heatmap',
            metric: 'speed',
            visible: true,
        });
        expect(module).toBeDefined();
        expect(module.getConfig()).toMatchObject({ mode: 'heatmap', metric: 'speed', visible: true });
    });

    test('show() populates heatmap from raw response and clear() resets', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        await module.show(createSampleAnalytics(), { hexagons: createSampleHexagons() });
        expect(module.getShown().heatmap.features).toHaveLength(1);
        expect(module.getShown().hexgrid.features).toHaveLength(1);

        await module.clear();
        expect(module.getShown().heatmap.features).toHaveLength(0);
        expect(module.getShown().hexgrid.features).toHaveLength(0);
    });

    test('show() without hexagons only populates heatmap', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap, { mode: 'heatmap' });

        await module.show(createSampleAnalytics());
        expect(module.getShown().heatmap.features).toHaveLength(1);
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
        expect(module.getConfig()?.metric).toBe('speed');

        module.setMetric('travelTime');
        expect(module.getConfig()?.metric).toBe('travelTime');
    });

    test('setMode() toggles layer visibility', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);

        module.setMode('heatmap');
        expect(module.getConfig()?.mode).toBe('heatmap');

        module.setMode('hexgrid');
        expect(module.getConfig()?.mode).toBe('hexgrid');
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

    test('events property is defined', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap);
        expect(module.events).toBeDefined();
    });

    test('applyConfig with undefined resets', async () => {
        const mockMap = createMockMap();
        const module = await TrafficAreaAnalyticsModule.get(mockMap, { mode: 'heatmap' });
        module.applyConfig(undefined);
        expect(module.getConfig()).toBeUndefined();
    });
});
