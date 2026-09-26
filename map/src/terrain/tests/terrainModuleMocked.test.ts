import type { Map, SourceSpecification, TerrainSpecification } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HILLSHADE_SOURCE_ID, TERRAIN_SOURCE_ID } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { TerrainModule } from '../TerrainModule';

// NOTE: these tests are heavily mocked; map-integration-tests covers the module on a real map.
describe('TerrainModule', () => {
    const hillshadeLayerId = 'Hillshade';
    const elevationSpec: SourceSpecification = { type: 'raster-dem', url: 'https://example.com/dem.json' };
    let tomtomMapMock: TomTomMap;
    let sources: Record<string, SourceSpecification>;
    let terrain: TerrainSpecification | null;
    let hillshadeVisibility: string;

    beforeEach(() => {
        sources = { [HILLSHADE_SOURCE_ID]: elevationSpec };
        terrain = null;
        hillshadeVisibility = 'none';
        tomtomMapMock = {
            mapLibreMap: {
                once: vi.fn().mockReturnValue(Promise.resolve()),
                getSource: vi.fn((id: string) => sources[id] && { id }),
                addSource: vi.fn((id: string, specification: SourceSpecification) => {
                    sources[id] = specification;
                }),
                getStyle: vi.fn(() => ({
                    layers: [{ id: hillshadeLayerId, type: 'hillshade', source: HILLSHADE_SOURCE_ID }],
                    sources,
                })),
                getLayer: vi.fn().mockReturnValue({}),
                getLayoutProperty: vi.fn(() => hillshadeVisibility),
                setLayoutProperty: vi.fn((_layerId: string, _property: string, value: string) => {
                    hillshadeVisibility = value;
                }),
                getTerrain: vi.fn(() => terrain),
                setTerrain: vi.fn((specification: TerrainSpecification | null) => {
                    terrain = specification;
                }),
            } as unknown as Map,
            _eventsProxy: { add: vi.fn(), ensureAdded: vi.fn(), updateIfRegistered: vi.fn() },
            addStyleChangeHandler: vi.fn(),
            mapReady: true,
        } as unknown as TomTomMap;
    });

    test('starts flat and unshaded without a config, with no elevation copy added', async () => {
        const module = await TerrainModule.get(tomtomMapMock);

        expect(module.isHillshadeVisible()).toBe(false);
        expect(module.isElevationEnabled()).toBe(false);
        expect(module.getConfig()).toBeUndefined();
        expect(sources[TERRAIN_SOURCE_ID]).toBeUndefined();
    });

    test('raises the surface from its own copy of the elevation source', async () => {
        const module = await TerrainModule.get(tomtomMapMock, {
            hillshade: true,
            elevation: true,
            elevationExaggeration: 1.5,
        });

        expect(module.isHillshadeVisible()).toBe(true);
        expect(sources[TERRAIN_SOURCE_ID]).toEqual(elevationSpec);
        expect(terrain).toEqual({ source: TERRAIN_SOURCE_ID, exaggeration: 1.5 });
    });

    test('keeps the exaggeration while elevation is off and restores it when turned back on', async () => {
        const module = await TerrainModule.get(tomtomMapMock);
        const configChanges = vi.fn();
        module.events.on('config-change', configChanges);

        module.setElevationExaggeration(2);
        expect(terrain).toBeNull();

        module.setElevationEnabled(true);
        expect(terrain).toEqual({ source: TERRAIN_SOURCE_ID, exaggeration: 2 });

        module.setHillshadeVisible(true);
        expect(module.getConfig()).toEqual({ elevationExaggeration: 2, elevation: true, hillshade: true });
        expect(configChanges).toHaveBeenCalledTimes(3);

        module.resetConfig();
        expect(module.isHillshadeVisible()).toBe(false);
        expect(module.isElevationEnabled()).toBe(false);
    });

    test("leaves the map's own terrain alone until elevation is set, and puts it back on reset", async () => {
        const styleTerrain: TerrainSpecification = { source: 'custom-dem', exaggeration: 2 };
        terrain = styleTerrain;

        const module = await TerrainModule.get(tomtomMapMock, { hillshade: true });
        expect(terrain).toBe(styleTerrain);
        expect(module.isElevationEnabled()).toBe(true);

        module.setElevationEnabled(true);
        expect(terrain).toEqual({ source: TERRAIN_SOURCE_ID, exaggeration: 1 });

        module.resetConfig();
        expect(terrain).toBe(styleTerrain);

        module.setElevationEnabled(false);
        expect(terrain).toBeNull();

        module.resetConfig();
        expect(terrain).toBe(styleTerrain);
    });

    test('adds the elevation copy again after a style change dropped it', async () => {
        const module = await TerrainModule.get(tomtomMapMock, { elevation: true, elevationExaggeration: 1.3 });
        delete sources[TERRAIN_SOURCE_ID];
        terrain = null;

        (module as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect(sources[TERRAIN_SOURCE_ID]).toEqual(elevationSpec);
        expect(terrain).toEqual({ source: TERRAIN_SOURCE_ID, exaggeration: 1.3 });
    });
});
