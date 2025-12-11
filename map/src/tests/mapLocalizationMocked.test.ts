import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { TomTomMap } from '../TomTomMap';

vi.mock('maplibre-gl', () => {
    class MapMock {
        getStyle = vi.fn().mockReturnValue({ layers: [{}] });
        getCanvas = vi.fn().mockReturnValue({
            style: {
                cursor: '',
            },
        });
        once = vi.fn();
        on = vi.fn();
        getZoom = vi.fn();
    }
    return {
        Map: vi.fn().mockImplementation(function () {
            return new MapMock();
        }),
        setRTLTextPlugin: vi.fn().mockResolvedValue(vi.fn()),
        getRTLTextPluginStatus: vi.fn(),
    };
});

describe('Map localization mocked tests', () => {
    const mockedContainer = vi.fn() as unknown as HTMLElement;
    TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });

    afterEach(() => vi.clearAllMocks());

    test('Localize map after initialization', () => {
        const tomtomMap = new TomTomMap({ container: mockedContainer });
        vi.spyOn(tomtomMap, 'setLanguage');
        tomtomMap.setLanguage('ar');
        expect(tomtomMap.setLanguage).toHaveBeenCalledTimes(1);
        expect(tomtomMap.setLanguage).toHaveBeenCalledWith('ar');
    });
});
