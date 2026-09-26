import { beforeEach, describe, expect, test } from 'vitest';
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
import { AbstractDataOwnedMapModule } from '../AbstractDataOwnedMapModule';
import { AbstractStyleOwnedMapModule } from '../AbstractStyleOwnedMapModule';
import { mockTomTomMap } from './mockTomTomMap';

// TypeScript has no `abstract static`, so AbstractMapModule cannot demand a factory from its
// subclasses. These two static-side contracts state it instead, and the `satisfies` below applies
// them to every concrete module at compile time — the right factory present, the wrong one absent.
type DataOwnedModuleFactory = {
    create(...args: never[]): Promise<unknown>;
    get?: never;
};

type StyleOwnedModuleFactory = {
    get(...args: never[]): Promise<unknown>;
    create?: never;
};

// The factory a module exposes is its ownership contract, so it is asserted here rather than
// per module: `create()` for the data-owned ones, `get()` for the style-owned ones, and never both.
// See LSI-159.
describe('Map module factories by kind', () => {
    const dataOwnedModules = [
        PlacesModule,
        RoutingModule,
        GeometriesModule,
        CustomGeoJSONModule,
        TrafficIncidentOverlayModule,
        TrafficAreaAnalyticsModule,
    ] satisfies DataOwnedModuleFactory[];

    const styleOwnedModules = [
        BaseMapModule,
        POIsModule,
        TrafficFlowModule,
        TrafficIncidentsModule,
        StylingModule,
        TerrainModule,
    ] satisfies StyleOwnedModuleFactory[];

    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        tomtomMapMock = mockTomTomMap().tomtomMap;
    });

    test('data-owned modules are built with create() and have no get()', () => {
        for (const dataOwnedModule of dataOwnedModules) {
            expect(typeof dataOwnedModule.create).toBe('function');
            // A hard break, not an alias: nothing is left behind that would keep the misleading
            // `.get()` reading alive on a module that creates rather than looks up.
            expect(dataOwnedModule).not.toHaveProperty('get');
        }
    });

    test('style-owned modules are obtained with get() and have no create()', () => {
        for (const styleOwnedModule of styleOwnedModules) {
            expect(typeof styleOwnedModule.get).toBe('function');
            expect((styleOwnedModule as { create?: unknown }).create).toBeUndefined();
        }
    });

    // The factory and the base class state the same ownership, so they must never disagree: a
    // module built with create() that extends the style-owned base would defer nothing and keep
    // its shown data across a clean style switch.
    test('the factory of a module and its base class agree on the kind', () => {
        for (const dataOwnedModule of dataOwnedModules) {
            expect(dataOwnedModule.prototype).toBeInstanceOf(AbstractDataOwnedMapModule);
        }
        for (const styleOwnedModule of styleOwnedModules) {
            expect(styleOwnedModule.prototype).toBeInstanceOf(AbstractStyleOwnedMapModule);
        }
    });

    test('create() is never memoized: each call owns its own sources and layers', async () => {
        const first = await GeometriesModule.create(tomtomMapMock);
        const second = await GeometriesModule.create(tomtomMapMock);

        expect(second).not.toBe(first);
        expect(second.sourceAndLayerIDs.geometry.sourceID).not.toEqual(first.sourceAndLayerIDs.geometry.sourceID);
    });
});
