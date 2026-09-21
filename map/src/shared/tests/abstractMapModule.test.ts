import type { Map } from 'maplibre-gl';
import { describe, expect, Mock, test, vi } from 'vitest';
import type { StyleChangeHandler, TomTomMap } from '../../TomTomMap';
import { AbstractDataOwnedMapModule } from '../AbstractDataOwnedMapModule';
import { AbstractStyleOwnedMapModule } from '../AbstractStyleOwnedMapModule';
import { waitUntilMapIsReady } from '../mapUtils';
import type { MapModuleCommonConfig } from '../types';

describe('AbstractMapModule tests', () => {
    type TestModuleConfig = MapModuleCommonConfig & {
        visible?: boolean;
    };

    class TestModule extends AbstractStyleOwnedMapModule<Record<string, never>, TestModuleConfig> {
        initCalled?: boolean;
        configApplied?: TestModuleConfig | null;
        restored?: boolean;
        discarded?: boolean;

        static async get(tomtomMap: TomTomMap, config?: TestModuleConfig): Promise<TestModule> {
            await waitUntilMapIsReady(tomtomMap);
            return new TestModule(tomtomMap, config);
        }

        protected _initSourcesWithLayers(): Record<string, never> {
            this.initCalled = true;
            return {};
        }

        protected _applyConfig(config: TestModuleConfig | undefined) {
            this.configApplied = config;
            return config;
        }

        protected restoreDataAndConfigImpl() {
            this.restored = true;
            this.config && this._applyConfig(this.config);
        }

        // A style-owned module keeps state of its own only now and then, but it can: the hook is
        // on the root class for that reason.
        protected discardShownData() {
            this.discarded = true;
        }

        async waitUntilModuleReady(): Promise<void> {
            await super.waitUntilModuleReady();
        }

        // This module owns no sources, so its events surface carries only the lifecycle half.
        get events() {
            return this.moduleEvents([]);
        }
    }

    test('Constructor with style loaded', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn(),
            } as unknown as Map,
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(true),
        } as unknown as TomTomMap;

        let testModule = await TestModule.get(tomtomMapMock);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();
        expect(testModule.sourceAndLayerIDs).toStrictEqual({});

        // Repeating test with config ----------------------:
        const testConfig = { visible: false };
        testModule = await TestModule.get(tomtomMapMock, testConfig);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test('Constructor with style not loaded yet', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                once: vi.fn(),
            } as unknown as Map,
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false),
        } as unknown as TomTomMap;

        let testModule = await TestModule.get(tomtomMapMock);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();

        // Repeating test with config -----------------------:
        (tomtomMapMock.mapLibreMap.once as Mock).mockClear();

        const testConfig = { visible: false };
        testModule = await TestModule.get(tomtomMapMock, testConfig);

        // TODO: in theory this should be called
        //expect(tomtomMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata");

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test('Wait until module is ready', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: vi.fn().mockReturnValue(false),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const testModule = await TestModule.get(tomtomMapMock);
        await testModule.waitUntilModuleReady();
        expect(testModule.initCalled).toBe(true);
    });

    // The style-change contract: every module re-adds its sources and re-applies its config when
    // the map style is swapped. GeoJSON-backed modules defer by one frame, because MapLibre
    // refuses symbol layers added straight after `styledata`.
    describe('style-change restoration', () => {
        const makeMapMock = () => {
            const styleChangeHandlers: StyleChangeHandler[] = [];
            const tomtomMapMock = {
                mapLibreMap: {
                    isStyleLoaded: vi.fn().mockReturnValue(true),
                    once: vi.fn(),
                } as unknown as Map,
                _eventsProxy: { updateIfRegistered: vi.fn() },
                addStyleChangeHandler: vi.fn((handler) => {
                    styleChangeHandlers.push(handler);
                    return () => undefined;
                }),
                mapReady: true,
            } as unknown as TomTomMap;
            // The module's own handler: the map's filter composer registers one ahead of it.
            const moduleHandler = () => styleChangeHandlers.at(-1);
            return { tomtomMapMock, moduleHandler };
        };

        class GeoJSONTestModule extends AbstractDataOwnedMapModule<Record<string, never>, TestModuleConfig> {
            restored?: boolean;
            discarded?: boolean;

            static async create(tomtomMap: TomTomMap, config?: TestModuleConfig): Promise<GeoJSONTestModule> {
                await waitUntilMapIsReady(tomtomMap);
                return new GeoJSONTestModule(tomtomMap, config);
            }

            protected _initSourcesWithLayers(): Record<string, never> {
                return {};
            }

            protected _applyConfig(config: TestModuleConfig | undefined) {
                return config;
            }

            protected restoreDataAndConfigImpl() {
                this.restored = true;
            }

            protected discardShownData() {
                this.discarded = true;
            }
        }

        test('a style-owned module restores synchronously on style change', async () => {
            const { tomtomMapMock, moduleHandler } = makeMapMock();
            const testModule = await TestModule.get(tomtomMapMock, { visible: true });
            testModule.restored = false;

            moduleHandler()?.onStyleAboutToChange?.({ resetState: false });
            moduleHandler()?.onStyleChanged?.({ resetState: false });

            expect(testModule.restored).toBe(true);
            expect(testModule.getConfig()).toStrictEqual({ visible: true });
        });

        test('a clean switch (resetState: true) re-binds the module with defaults and forgets its own state', async () => {
            const { tomtomMapMock, moduleHandler } = makeMapMock();
            const testModule = await TestModule.get(tomtomMapMock, { visible: true });
            const configChanged = vi.fn();
            testModule.events.on('config-change', configChanged);
            testModule.restored = false;
            testModule.initCalled = false;

            moduleHandler()?.onStyleAboutToChange?.({ resetState: true });
            moduleHandler()?.onStyleChanged?.({ resetState: true });

            // Not a restore: the module is re-initialised against the new style with no config…
            expect(testModule.restored).toBe(false);
            expect(testModule.initCalled).toBe(true);
            expect(testModule.discarded).toBe(true);
            expect(testModule.getConfig()).toBeUndefined();
            expect(testModule.configApplied).toBeUndefined();
            // …and whoever listens to its config learns it was reset.
            expect(configChanged).toHaveBeenCalledWith(undefined);
        });

        test('a clean switch makes a data-owned module forget the data it shows', async () => {
            const { tomtomMapMock, moduleHandler } = makeMapMock();
            const testModule = await GeoJSONTestModule.create(tomtomMapMock, { visible: true });

            moduleHandler()?.onStyleChanged?.({ resetState: true });

            expect(testModule.discarded).toBe(true);
            expect(testModule.restored).toBeFalsy();
            expect(testModule.getConfig()).toBeUndefined();
        });

        // What makes `await map.setStyle(...)` mean "the modules are back": restoration runs
        // while TomTomMap notifies its handlers, so nothing about it is left for a later frame.
        test('a data-owned module is restored by the time the style-change handler returns', async () => {
            const { tomtomMapMock, moduleHandler } = makeMapMock();
            const testModule = await GeoJSONTestModule.create(tomtomMapMock, { visible: true });
            testModule.restored = false;

            await moduleHandler()?.onStyleChanged?.({ resetState: false });

            expect(testModule.restored).toBe(true);
        });

        // Keeps the base-class `restoreDataAndConfigImpl`, unlike TestModule, so the real
        // re-initialisation path runs.
        class PlainTestModule extends AbstractStyleOwnedMapModule<Record<string, never>, TestModuleConfig> {
            static async get(tomtomMap: TomTomMap, config?: TestModuleConfig): Promise<PlainTestModule> {
                await waitUntilMapIsReady(tomtomMap);
                return new PlainTestModule(tomtomMap, config);
            }

            protected _initSourcesWithLayers(): Record<string, never> {
                return {};
            }

            protected _applyConfig(config: TestModuleConfig | undefined) {
                return config;
            }
        }

        test('restoring hands the proxy this module as the owner of its refreshed sources', async () => {
            const { tomtomMapMock, moduleHandler } = makeMapMock();
            const testModule = await PlainTestModule.get(tomtomMapMock);
            const updateIfRegistered = (tomtomMapMock as unknown as { _eventsProxy: { updateIfRegistered: Mock } })
                ._eventsProxy.updateIfRegistered;

            moduleHandler()?.onStyleChanged?.({ resetState: false });

            // Owner identity is what lets the proxy tell apart two modules sharing a source ID.
            expect(updateIfRegistered).toHaveBeenCalledWith(expect.anything(), testModule);
        });
    });

    test('resetConfig clears the applied configuration', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn(),
            } as unknown as Map,
            addStyleChangeHandler: vi.fn(),
            mapReady: true,
        } as unknown as TomTomMap;
        const testModule = await TestModule.get(tomtomMapMock, { visible: true });
        expect(testModule.getConfig()).toStrictEqual({ visible: true });

        testModule.resetConfig();

        expect(testModule.getConfig()).toBeUndefined();
        expect(testModule.configApplied).toBeUndefined();
    });

    test('config-change handlers fire on every config mutation, but not during construction', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn(),
            } as unknown as Map,
            addStyleChangeHandler: vi.fn(),
            mapReady: true,
        } as unknown as TomTomMap;
        const handler = vi.fn();

        // The config passed to the constructor must not emit: nobody can have subscribed yet.
        const testModule = await TestModule.get(tomtomMapMock, { visible: true });
        expect(handler).not.toHaveBeenCalled();

        testModule.events.on('config-change', handler);
        testModule.applyConfig({ visible: false });

        expect(handler).toHaveBeenCalledWith({ visible: false });
    });
});
