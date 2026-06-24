import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type StyleChangeHandler, TomTomMap } from '../TomTomMap';

vi.mock('maplibre-gl', () => {
    class MapMock {
        getStyle = vi.fn().mockReturnValue({ layers: [{}] });
        once = vi.fn();
        on = vi.fn();
        getCanvas = vi.fn().mockReturnValue({
            style: {
                cursor: '',
            },
        });
        getZoom = vi.fn();
    }
    return {
        // biome-ignore lint/complexity/useArrowFunction: arrow functions cannot be invoked with `new`
        Map: vi.fn().mockImplementation(function () {
            return new MapMock();
        }),
        setRTLTextPlugin: vi.fn().mockResolvedValue(vi.fn()),
        getRTLTextPluginStatus: vi.fn(),
        setWorkerCount: vi.fn(),
    };
});

describe('Map initialization mocked tests', () => {
    const mockedContainer = vi.fn() as unknown as HTMLElement;

    beforeEach(() => TomTomConfig.instance.reset());

    test('Map init with mostly default parameters', () => {
        TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });
        const tomtomMap = new TomTomMap({ mapLibre: { container: mockedContainer } });
        expect(tomtomMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style: 'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_KEY&map=basic_street-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_light',
            attributionControl: { compact: false },
            validateStyle: false,
            maxTileCacheZoomLevels: 22,
            cancelPendingTileRequestsWhileZooming: false,
            transformRequest: expect.any(Function),
        });
    });

    test('Map init with some given parameters', () => {
        TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });
        const tomtomMap = new TomTomMap({
            mapLibre: { container: mockedContainer, zoom: 3, center: [10, 20] },
            apiKey: 'TEST_KEY_2',
            commonBaseURL: 'https://api-test.tomtom.com',
            style: {
                type: 'custom',
                url: 'https://custom-style.test.tomtom.com/foo/bar',
            },
        });
        expect(tomtomMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style: 'https://custom-style.test.tomtom.com/foo/bar?key=TEST_KEY_2',
            zoom: 3,
            center: [10, 20],
            attributionControl: { compact: false },
            validateStyle: false,
            maxTileCacheZoomLevels: 22,
            cancelPendingTileRequestsWhileZooming: false,
            transformRequest: expect.any(Function),
        });
    });

    test('addStyleChangeHandler returns a disposer that unregisters the handler', () => {
        TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });
        const tomtomMap = new TomTomMap({ mapLibre: { container: mockedContainer } });
        // Reach into the private registry to assert the add/dispose pair stays balanced.
        const handlers = (tomtomMap as unknown as { styleChangeHandlers: StyleChangeHandler[] }).styleChangeHandlers;
        const registrySize = handlers.length;

        const handler: StyleChangeHandler = { onStyleChanged: vi.fn() };
        const unsubscribe = tomtomMap.addStyleChangeHandler(handler);
        expect(handlers).toContain(handler);
        expect(handlers.length).toBe(registrySize + 1);

        unsubscribe();
        expect(handlers).not.toContain(handler);
        expect(handlers.length).toBe(registrySize);

        // The disposer is idempotent — a second call is a no-op.
        unsubscribe();
        expect(handlers.length).toBe(registrySize);
    });

    test('each registration of the same handler gets its own disposer', () => {
        TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });
        const tomtomMap = new TomTomMap({ mapLibre: { container: mockedContainer } });
        const handlers = (tomtomMap as unknown as { styleChangeHandlers: StyleChangeHandler[] }).styleChangeHandlers;
        const registrySize = handlers.length;

        // Registering the same object twice yields two distinct registrations.
        const handler: StyleChangeHandler = { onStyleChanged: vi.fn() };
        const unsubscribeFirst = tomtomMap.addStyleChangeHandler(handler);
        tomtomMap.addStyleChangeHandler(handler);
        expect(handlers.length).toBe(registrySize + 2);

        // Disposing one leaves the other registration intact.
        unsubscribeFirst();
        expect(handlers).toContain(handler);
        expect(handlers.length).toBe(registrySize + 1);
    });
});
