import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BaseMapModule } from '../../base';
import { HillshadeModule } from '../../hillshade';
import { POIsModule } from '../../pois';
import type { TomTomMap } from '../../TomTomMap';
import { TrafficFlowModule, TrafficIncidentsModule } from '../../traffic';

// A map mock complete enough for the style modules to initialise against.
const makeMapMock = (): TomTomMap =>
    ({
        mapLibreMap: {
            once: vi.fn().mockReturnValue(Promise.resolve()),
            getSource: vi.fn().mockReturnValue({ id: 'sourceID' }),
            getStyle: vi.fn().mockReturnValue({ layers: [{}], sources: { sourceID: {} } }),
            getLayer: vi.fn(),
            addLayer: vi.fn(),
            isStyleLoaded: vi.fn().mockReturnValue(true),
            setLayoutProperty: vi.fn(),
            setPaintProperty: vi.fn(),
            setFilter: vi.fn(),
            getFilter: vi.fn(),
            moveLayer: vi.fn(),
        } as unknown as Map,
        _eventsProxy: {
            add: vi.fn(),
            ensureAdded: vi.fn(),
            updateIfRegistered: vi.fn(),
        },
        addStyleChangeHandler: vi.fn(),
        mapReady: true,
    }) as unknown as TomTomMap;

// Style-owned modules control sources and layers the style already provides, under fixed global
// IDs, so a second instance would be a second controller over one piece of shared state. See LSI-159.
describe('Style-owned modules are shared per map', () => {
    let map: TomTomMap;

    beforeEach(() => {
        map = makeMapMock();
    });

    test.each([
        ['BaseMapModule', BaseMapModule],
        ['POIsModule', POIsModule],
        ['HillshadeModule', HillshadeModule],
        ['TrafficFlowModule', TrafficFlowModule],
        ['TrafficIncidentsModule', TrafficIncidentsModule],
    ])('%s returns the same instance for the same map', async (_name, moduleClass) => {
        const first = await moduleClass.get(map);
        const second = await moduleClass.get(map);

        expect(second).toBe(first);
    });

    test('two maps each get their own instance', async () => {
        const otherMap = makeMapMock();

        const first = await HillshadeModule.get(map);
        const second = await HillshadeModule.get(otherMap);

        expect(second).not.toBe(first);
    });

    test('concurrent calls before the map is ready still build one instance', async () => {
        // The failure this guards against: `get()` is async, so two callers that both miss the
        // cache would each construct a controller over the same style layers.
        const [first, second, third] = await Promise.all([
            HillshadeModule.get(map),
            HillshadeModule.get(map),
            HillshadeModule.get(map),
        ]);

        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    test('get(map) with no config is a plain accessor and does not re-apply defaults', async () => {
        const hillshade = await HillshadeModule.get(map, { visible: true });

        await HillshadeModule.get(map);

        expect(hillshade.getConfig()).toMatchObject({ visible: true });
    });

    test('get(map, config) applies the config to the instance that already exists', async () => {
        const hillshade = await HillshadeModule.get(map, { visible: true });

        await HillshadeModule.get(map, { visible: false });

        expect(hillshade.getConfig()).toMatchObject({ visible: false });
    });

    test('a failed construction is not cached', async () => {
        const noSourceMap = makeMapMock();
        (noSourceMap.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mockReturnValueOnce(undefined);

        await expect(POIsModule.get(noSourceMap)).rejects.toThrow();

        // The source is there on the retry, so the module must be buildable.
        await expect(POIsModule.get(noSourceMap)).resolves.toBeInstanceOf(POIsModule);
    });
});
