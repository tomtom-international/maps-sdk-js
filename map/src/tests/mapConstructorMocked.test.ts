import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TomTomMap } from '../TomTomMap';

vi.mock('maplibre-gl', () => ({
    Map: vi.fn().mockReturnValue({
        getStyle: vi.fn().mockReturnValue({ layers: [{}] }),
        isStyleLoaded: vi.fn().mockReturnValue(false),
        once: vi.fn(),
        on: vi.fn(),
        getCanvas: vi.fn().mockReturnValue({
            style: {
                cursor: '',
            },
        }),
        getZoom: vi.fn(),
    }),
    setRTLTextPlugin: vi.fn().mockResolvedValue(vi.fn()),
    getRTLTextPluginStatus: vi.fn(),
}));

describe('Map initialization mocked tests', () => {
    const mockedContainer = vi.fn() as unknown as HTMLElement;

    beforeEach(() => TomTomConfig.instance.reset());

    test('Map init with mostly default parameters', () => {
        TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });
        const tomtomMap = new TomTomMap({ container: mockedContainer });
        expect(tomtomMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style: 'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?&apiVersion=1&key=TEST_KEY&map=basic_street-light',
            attributionControl: { compact: false },
            validateStyle: false,
            maxTileCacheZoomLevels: 22,
            cancelPendingTileRequestsWhileZooming: false,
            transformRequest: expect.any(Function),
        });
    });

    test('Map init with some given parameters', () => {
        TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });
        const tomtomMap = new TomTomMap(
            { container: mockedContainer, zoom: 3, center: [10, 20] },
            {
                apiKey: 'TEST_KEY_2',
                commonBaseURL: 'https://api-test.tomtom.com',
                style: {
                    type: 'custom',
                    url: 'https://custom-style.test.tomtom.com/foo/bar',
                },
            },
        );
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
});
