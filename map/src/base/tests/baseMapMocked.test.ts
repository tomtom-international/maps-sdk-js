import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BASE_MAP_SOURCE_ID } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { BaseMapModule } from '../BaseMapModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('BaseMap module tests', () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValueOnce({ id: BASE_MAP_SOURCE_ID }),
                getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { hillshadeSourceID: {} } }),
                setLayoutProperty: vi.fn(),
                getLayoutProperty: vi.fn(),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
                updateIfRegistered: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;
    });

    test('Initializing module with config', async () => {
        const basemap: BaseMapModule = await BaseMapModule.get(tomtomMapMock, { visible: false });
        expect(basemap).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        basemap.applyConfig({ visible: true });
        expect(basemap.getConfig()).toMatchObject({ visible: true });

        basemap.setVisible(false);
        expect(basemap.isVisible()).toBe(false);
        expect(basemap.getConfig()).toMatchObject({ visible: false });
    });

    test('Initializing module with no config', async () => {
        const basemap = await BaseMapModule.get(tomtomMapMock);
        expect(basemap).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });

    test('Throw if source runtime is not found', async () => {
        tomtomMapMock.mapLibreMap.getSource = vi.fn().mockReturnValueOnce(undefined);

        await expect(() => BaseMapModule.get(tomtomMapMock)).rejects.toThrow();
    });

    test('restoreDataAndConfigImpl re-runs init and re-applies config after a style change', async () => {
        const basemap = await BaseMapModule.get(tomtomMapMock, {
            visible: false,
            layerGroupsVisibility: { mode: 'include', names: ['borders', 'water', 'land'], visible: true },
        });
        // After init, the once-mock is exhausted; restore needs getSource to keep returning the source.
        (tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mockReturnValue({ id: BASE_MAP_SOURCE_ID });
        const getSourceCallsBefore = (tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls
            .length;

        (basemap as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect((tomtomMapMock.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
            getSourceCallsBefore,
        );
        expect(basemap.getConfig()).toMatchObject({
            visible: false,
            layerGroupsVisibility: { mode: 'include', names: ['borders', 'water', 'land'], visible: true },
        });
    });

    test('getLayers and getLayerIds hand out copies of the group index', async () => {
        tomtomMapMock.mapLibreMap.getStyle = vi.fn().mockReturnValue({
            layers: [
                { id: 'Water - Fill', type: 'fill', source: BASE_MAP_SOURCE_ID, metadata: { group: 'water' } },
                { id: 'Water - Line', type: 'line', source: BASE_MAP_SOURCE_ID, metadata: { group: 'water' } },
            ],
            sources: { [BASE_MAP_SOURCE_ID]: {} },
        });
        const basemap = await BaseMapModule.get(tomtomMapMock);
        expect(basemap.getLayerIds('water')).toEqual(['Water - Fill', 'Water - Line']);

        // Mutating what a caller got back must not reach the module's cached index.
        basemap.getLayers().water.push('injected');
        basemap.getLayerIds('water').reverse();

        expect(basemap.getLayers().water).toEqual(['Water - Fill', 'Water - Line']);
        expect(basemap.getLayerIds('water')).toEqual(['Water - Fill', 'Water - Line']);
    });

    // isVisible mirrors setVisible: both take the group to act on, which is what lets one module
    // back a per-group control. See LSI-159.
    test('isVisible asks about one layer group, mirroring setVisible', async () => {
        const roadLabel = { id: 'Road label', type: 'symbol', metadata: { group: 'road_label' } };
        const water = { id: 'Water', type: 'fill', metadata: { group: 'water' } };
        const hiddenLayerIDs = new Set(['Water']);
        const mapLibreMap = tomtomMapMock.mapLibreMap as unknown as {
            getStyle: ReturnType<typeof vi.fn>;
            getLayer: ReturnType<typeof vi.fn>;
            getLayoutProperty: ReturnType<typeof vi.fn>;
        };
        mapLibreMap.getStyle = vi.fn().mockReturnValue({
            layers: [roadLabel, water].map((l) => ({ ...l, source: BASE_MAP_SOURCE_ID })),
            sources: {},
        });
        mapLibreMap.getLayer = vi.fn().mockReturnValue({});
        mapLibreMap.getLayoutProperty = vi.fn((id: string) => (hiddenLayerIDs.has(id) ? 'none' : 'visible'));

        const baseMap = await BaseMapModule.get(tomtomMapMock);

        expect(baseMap.isVisible({ layerGroups: { mode: 'include', names: ['roadLabels'] } })).toBe(true);
        expect(baseMap.isVisible({ layerGroups: { mode: 'include', names: ['water'] } })).toBe(false);
        // Without a group it still answers for the module as a whole.
        expect(baseMap.isVisible()).toBe(true);
    });
});
