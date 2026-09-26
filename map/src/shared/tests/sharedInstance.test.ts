import { beforeEach, describe, expect, test } from 'vitest';
import { BaseMapModule } from '../../base';
import { POIsModule } from '../../pois';
import type { TomTomMap } from '../../TomTomMap';
import { TerrainModule } from '../../terrain';
import { TrafficFlowModule, TrafficIncidentsModule } from '../../traffic';
import { mockTomTomMap } from './mockTomTomMap';

// Style-owned modules control sources and layers the style already provides, under fixed global
// IDs, so a second instance would be a second controller over one piece of shared state. See LSI-159.
describe('Style-owned modules are shared per map', () => {
    let map: TomTomMap;

    beforeEach(() => {
        map = mockTomTomMap().tomtomMap;
    });

    test.each([
        ['BaseMapModule', BaseMapModule],
        ['POIsModule', POIsModule],
        ['TrafficFlowModule', TrafficFlowModule],
        ['TrafficIncidentsModule', TrafficIncidentsModule],
        ['TerrainModule', TerrainModule],
    ])('%s returns the same instance for the same map', async (_name, moduleClass) => {
        const first = await moduleClass.get(map);
        const second = await moduleClass.get(map);

        expect(second).toBe(first);
    });

    test('two maps each get their own instance', async () => {
        const otherMap = mockTomTomMap().tomtomMap;

        const first = await TerrainModule.get(map);
        const second = await TerrainModule.get(otherMap);

        expect(second).not.toBe(first);
    });

    test('concurrent calls before the map is ready still build one instance', async () => {
        // The failure this guards against: `get()` is async, so two callers that both miss the
        // cache would each construct a controller over the same style layers.
        const [first, second, third] = await Promise.all([
            TerrainModule.get(map),
            TerrainModule.get(map),
            TerrainModule.get(map),
        ]);

        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    test('get(map) with no config is a plain accessor and does not re-apply defaults', async () => {
        const terrain = await TerrainModule.get(map, { hillshade: true });

        await TerrainModule.get(map);

        expect(terrain.getConfig()).toMatchObject({ hillshade: true });
    });

    test('get(map, config) applies the config to the instance that already exists', async () => {
        const terrain = await TerrainModule.get(map, { hillshade: true });

        await TerrainModule.get(map, { hillshade: false });

        expect(terrain.getConfig()).toMatchObject({ hillshade: false });
    });

    test('a failed construction is not cached', async () => {
        const noSource = mockTomTomMap();
        noSource.mapLibreMap.getSource.mockReturnValueOnce(undefined);

        await expect(POIsModule.get(noSource.tomtomMap)).rejects.toThrow();

        // The source is there on the retry, so the module must be buildable.
        await expect(POIsModule.get(noSource.tomtomMap)).resolves.toBeInstanceOf(POIsModule);
    });
});
