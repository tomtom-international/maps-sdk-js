import type { Map } from 'maplibre-gl';
import type { TomTomMap } from '../../TomTomMap';
import { AbstractMapModule } from '../AbstractMapModule';
import { waitUntilMapIsReady } from '../mapUtils';
import type { StyleModuleConfig } from '../types';

import Mock = jest.Mock;

describe('AbstractMapModule tests', () => {
    class TestModule extends AbstractMapModule<Record<string, never>, StyleModuleConfig> {
        initCalled?: boolean;
        configApplied?: StyleModuleConfig | null;
        restored?: boolean;

        static async init(tomtomMap: TomTomMap, config?: StyleModuleConfig): Promise<TestModule> {
            await waitUntilMapIsReady(tomtomMap);
            return new TestModule('style', tomtomMap, config);
        }

        protected _initSourcesWithLayers(): Record<string, never> {
            this.initCalled = true;
            return {};
        }

        protected _applyConfig(config: StyleModuleConfig | undefined) {
            this.configApplied = config;
            return config;
        }

        protected restoreDataAndConfigImpl() {
            this.restored = true;
            this.config && this._applyConfig(this.config);
        }

        async waitUntilModuleReady(): Promise<void> {
            await super.waitUntilModuleReady();
        }

        // Implement events, however it is not tested here.
        // get events(): EventsModule {
        //     return jest.fn() as unknown as EventsModule;
        // }
    }

    test('Constructor with style loaded', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(true),
                once: jest.fn(),
            } as unknown as Map,
            addStyleChangeHandler: jest.fn(),
            mapReady: jest.fn().mockReturnValue(true),
        } as unknown as TomTomMap;

        let testModule = await TestModule.init(tomtomMapMock);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();
        expect(testModule.sourceAndLayerIDs).toStrictEqual({});

        // Repeating test with config ----------------------:
        const testConfig = { visible: false };
        testModule = await TestModule.init(tomtomMapMock, testConfig);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test('Constructor with style not loaded yet', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                once: jest.fn(),
            } as unknown as Map,
            addStyleChangeHandler: jest.fn(),
            mapReady: jest.fn().mockReturnValue(false),
        } as unknown as TomTomMap;

        let testModule = await TestModule.init(tomtomMapMock);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();

        // Repeating test with config -----------------------:
        (tomtomMapMock.mapLibreMap.once as Mock).mockClear();

        const testConfig = { visible: false };
        testModule = await TestModule.init(tomtomMapMock, testConfig);

        // TODO: in theory this should be called
        //expect(tomtomMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata");

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test('Constructor with style not loaded yet and style data timeout', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(false),
                once: jest.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            addStyleChangeHandler: jest.fn(),
            mapReady: jest.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const testModule = await TestModule.init(tomtomMapMock);
        await new Promise((resolve) => setTimeout(resolve, 6000));

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();
    });

    test('Wait until module is ready', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(false),
                once: jest.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            addStyleChangeHandler: jest.fn(),
            mapReady: jest.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        const testModule = await TestModule.init(tomtomMapMock);
        await testModule.waitUntilModuleReady();
        expect(testModule.initCalled).toBe(true);
    });
});
