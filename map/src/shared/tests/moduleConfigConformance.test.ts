// @vitest-environment jsdom
// StylingModule reads the map container's computed background, which needs a real DOM.
import type { FeatureCollection, Point } from 'geojson';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BaseMapModule } from '../../base';
import { CustomGeoJSONModule } from '../../custom';
import { GeometriesModule } from '../../geometry';
import { PlacesModule } from '../../places';
import { POIsModule } from '../../pois';
import { RoutingModule } from '../../routing';
import { StylingModule } from '../../styling';
import type { TomTomMap } from '../../TomTomMap';
import { TerrainModule } from '../../terrain';
import {
    TrafficAreaAnalyticsModule,
    TrafficFlowModule,
    TrafficIncidentOverlayModule,
    TrafficIncidentsModule,
} from '../../traffic';
import { type MockTomTomMap, mockTomTomMap } from './mockTomTomMap';

// The display-config contract every map module shares, asserted once over all of them: what
// `getConfig()` holds after construction, that `applyConfig` and `updateConfig` store what they were
// given and emit `config-change`, that `updateConfig` keeps what it was not given, what `resetConfig`
// returns to, that a style change restores the configuration and that a clean one (`resetState`)
// ends where `resetConfig` does. Where modules still differ today
// (what `applyConfig` does with an unrelated earlier configuration, what a reset returns to) the
// expectation is spelled out per module below — so a change of contract is a deliberate edit here,
// not a surprise in a guide.

type AnyConfig = Record<string, unknown>;

// The slice of a module the suite drives, written structurally: every module's `events` is its own
// type, and the suite only ever subscribes to the one event they all share.
type AnyModule = {
    getConfig(): unknown;
    applyConfig(config: never): void;
    updateConfig(partial: never): void;
    resetConfig(): void;
    events: unknown;
};

// Every module's `events.on` is an overload set over its own event types; the suite only needs the
// one overload they all share.
const onConfigChange = (module: AnyModule, handler: (config: unknown) => void) =>
    (module.events as { on(type: 'config-change', handler: (config: unknown) => void): unknown }).on(
        'config-change',
        handler,
    );

type ModuleCase = {
    name: string;
    create: (map: TomTomMap, config?: AnyConfig) => Promise<AnyModule>;
    /** A configuration with two unrelated properties. */
    first: AnyConfig;
    second: AnyConfig;
    /** A change to one of them, for `updateConfig`. */
    update: AnyConfig;
    /** Whether `applyConfig(second)` after `applyConfig(first)` keeps `first`. */
    applyConfig: 'replace' | 'merge';
    /** `getConfig()` right after `create`/`get` without a configuration. */
    initial: 'undefined' | 'defaults';
    /** `getConfig()` after `resetConfig()`: nothing, the module's defaults, or the config it was created with. */
    reset: 'undefined' | 'defaults' | 'initial';
};

const points: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
const customSources = {
    sources: { points: { layers: [{ type: 'circle' as const, paint: { 'circle-radius': 4 } }] } },
};

const cases: ModuleCase[] = [
    {
        name: 'BaseMapModule',
        create: (map, config) => BaseMapModule.get(map, config),
        first: { visible: true },
        second: { layerGroupsVisibility: { mode: 'include', names: ['water'], visible: false } },
        update: { visible: false },
        applyConfig: 'merge',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'POIsModule',
        create: (map, config) => POIsModule.get(map, config),
        first: { visible: false },
        second: { filters: { categories: { show: 'only', values: ['RESTAURANT'] } } },
        update: { visible: true },
        applyConfig: 'replace',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'TrafficFlowModule',
        create: (map, config) => TrafficFlowModule.get(map, config),
        first: { visible: true },
        second: { filters: { any: [{ showRoadClosures: 'only' }] } },
        update: { visible: false },
        applyConfig: 'replace',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'TrafficIncidentsModule',
        create: (map, config) => TrafficIncidentsModule.get(map, config),
        first: { visible: true },
        second: { icons: { visible: false } },
        update: { visible: false },
        applyConfig: 'replace',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'TerrainModule',
        create: (map, config) => TerrainModule.get(map, config),
        first: { hillshade: true },
        second: { elevation: true },
        update: { hillshade: false },
        applyConfig: 'replace',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'StylingModule',
        create: (map, config) => StylingModule.get(map, config),
        first: { 'labels.sizeFactor': 1.2 },
        second: { 'roads.widthFactor': 1.3 },
        update: { 'labels.sizeFactor': 0.9 },
        applyConfig: 'replace',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'PlacesModule',
        create: (map, config) => PlacesModule.create(map, config),
        first: { theme: 'circle-icon' },
        second: { text: { color: 'green' } },
        update: { theme: 'pin' },
        applyConfig: 'replace',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'RoutingModule',
        create: (map, config) => RoutingModule.create(map, config),
        first: { displayUnits: 'imperial' },
        second: { theme: { mainColor: '#ff0000' } },
        update: { displayUnits: 'metric' },
        applyConfig: 'replace',
        initial: 'defaults',
        reset: 'defaults',
    },
    {
        name: 'GeometriesModule',
        create: (map, config) => GeometriesModule.create(map, config),
        first: { fill: { color: 'warm' } },
        second: { textConfig: { textField: 'title' } },
        update: { fill: { color: 'cold' } },
        applyConfig: 'replace',
        initial: 'undefined',
        reset: 'undefined',
    },
    {
        name: 'CustomGeoJSONModule',
        create: (map, config) => CustomGeoJSONModule.create(map, { ...customSources, ...config }),
        first: { ...customSources, visible: false },
        second: { ...customSources },
        update: { visible: true },
        applyConfig: 'replace',
        initial: 'defaults',
        reset: 'initial',
    },
    {
        name: 'TrafficIncidentOverlayModule',
        create: (map, config) => TrafficIncidentOverlayModule.create(map, config),
        first: { visible: false },
        second: { focus: false },
        update: { visible: true },
        applyConfig: 'replace',
        initial: 'defaults',
        reset: 'undefined',
    },
    {
        name: 'TrafficAreaAnalyticsModule',
        create: (map, config) => TrafficAreaAnalyticsModule.create(map, config),
        first: { displayMode: 'heatmap' },
        second: { activeMetric: 'speed' },
        update: { displayMode: 'square-2d' },
        applyConfig: 'merge',
        initial: 'defaults',
        reset: 'defaults',
    },
];

describe.each(cases)('$name display config', (moduleCase) => {
    let harness: MockTomTomMap;

    beforeEach(() => {
        harness = mockTomTomMap();
        // Data-owned modules restore one animation frame after a style change.
        vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
            callback();
            return 0;
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const both = () => ({ ...moduleCase.first, ...moduleCase.second });

    // For a module created with `both()`.
    const expectResetConfig = (module: AnyModule) => {
        switch (moduleCase.reset) {
            case 'undefined':
                expect(module.getConfig()).toBeUndefined();
                break;
            case 'defaults':
                expect(module.getConfig()).toBeDefined();
                expect(module.getConfig()).not.toMatchObject(moduleCase.first);
                break;
            case 'initial':
                expect(module.getConfig()).toEqual(both());
                break;
        }
    };

    test('getConfig after construction', async () => {
        const module = await moduleCase.create(harness.tomtomMap);
        if (moduleCase.initial === 'undefined') expect(module.getConfig()).toBeUndefined();
        else expect(module.getConfig()).toBeDefined();

        const configured = await moduleCase.create(mockTomTomMap().tomtomMap, both());
        expect(configured.getConfig()).toMatchObject(both());
    });

    test('applyConfig stores the configuration and emits config-change once', async () => {
        const module = await moduleCase.create(harness.tomtomMap);
        const onConfigChangeSpy = vi.fn();
        onConfigChange(module, onConfigChangeSpy);

        module.applyConfig(both() as never);

        expect(module.getConfig()).toMatchObject(both());
        expect(onConfigChangeSpy).toHaveBeenCalledTimes(1);
        expect(onConfigChangeSpy).toHaveBeenCalledWith(expect.objectContaining(both()));
    });

    test(`applyConfig ${moduleCase.applyConfig}s an earlier, unrelated configuration`, async () => {
        const module = await moduleCase.create(harness.tomtomMap);
        module.applyConfig(moduleCase.first as never);
        module.applyConfig(moduleCase.second as never);

        expect(module.getConfig()).toMatchObject(moduleCase.second);
        if (moduleCase.applyConfig === 'merge') expect(module.getConfig()).toMatchObject(moduleCase.first);
        else expect(module.getConfig()).not.toMatchObject(moduleCase.first);
    });

    test('updateConfig changes what it is given and keeps the rest', async () => {
        const module = await moduleCase.create(harness.tomtomMap);
        module.applyConfig(both() as never);
        const onConfigChangeSpy = vi.fn();
        onConfigChange(module, onConfigChangeSpy);

        module.updateConfig(moduleCase.update as never);

        expect(module.getConfig()).toMatchObject({ ...both(), ...moduleCase.update });
        expect(onConfigChangeSpy).toHaveBeenCalledTimes(1);
    });

    test(`resetConfig returns to ${moduleCase.reset}`, async () => {
        const module = await moduleCase.create(harness.tomtomMap, both());
        const onConfigChangeSpy = vi.fn();
        onConfigChange(module, onConfigChangeSpy);

        module.resetConfig();

        expect(onConfigChangeSpy).toHaveBeenCalledTimes(1);
        expectResetConfig(module);
    });

    test('a style change restores the configuration', async () => {
        const module = await moduleCase.create(harness.tomtomMap);
        module.applyConfig(both() as never);

        await harness.fireStyleChange();

        expect(module.getConfig()).toMatchObject(both());
    });

    test(`a clean style switch returns to ${moduleCase.reset}, like resetConfig`, async () => {
        const module = await moduleCase.create(harness.tomtomMap, both());
        const onConfigChangeSpy = vi.fn();
        onConfigChange(module, onConfigChangeSpy);

        await harness.fireStyleChange({ resetState: true });

        expect(onConfigChangeSpy).toHaveBeenCalledTimes(1);
        expectResetConfig(module);
    });
});

// Keeps the data module exercised above honest about its typed surface.
test('the custom module case shows typed data', async () => {
    const { tomtomMap } = mockTomTomMap();
    const module = await CustomGeoJSONModule.create<{ points: FeatureCollection<Point> }>(tomtomMap, customSources);
    await module.show(points, 'points');
    expect(module.getShown().points).toEqual(points);
});
