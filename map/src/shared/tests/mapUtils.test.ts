import type { Map, RequestParameters, ResourceType } from 'maplibre-gl';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { StyleInput, StyleModule } from '../../init';
import poiLayerSpec from '../../places/layers/tests/poiLayerSpec.data';
import type { TomTomMap } from '../../TomTomMap';
import { FLOW_TAGS } from '../../traffic/util/trafficFlowMapping';
import { INCIDENT_TAGS } from '../../traffic/util/trafficIncidentMapping';
import { HILLSHADE_SOURCE_ID } from '../layers/sourcesIDs';
import {
    addLayers,
    addOrUpdateImage,
    changeLayerProps,
    detectStyleLightDarkTheme,
    ensureAddedToStyle,
    getDeclaredLightDarkTheme,
    getStyleLightDarkTheme,
    moveLayerBefore,
    transformRequest,
    updateLayersAndSource,
    updateStyleWithModule,
    waitUntilMapIsReady,
} from '../mapUtils';
import type { AbstractSourceWithLayers, GeoJSONSourceWithLayers } from '../SourceWithLayers';
import type { ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from '../types';
import updateStyleData from './mapUtils.test.data';

// transformRequest's returned fn may yield a Promise when the demos-proxy
// session gate is installed on window. None of the tests below install it,
// so narrow back to the synchronous shape (and fail loudly if that changes).
const transformSync = (params: Parameters<typeof transformRequest>[0]) => {
    const fn = transformRequest(params);
    return (url: string, resourceType?: ResourceType): RequestParameters => {
        const result = fn(url, resourceType);
        if (result instanceof Promise) throw new Error('expected a synchronous result (no session gate installed)');
        return result;
    };
};

const getTomTomMapMock = (mapReady: boolean[]) =>
    ({
        mapReady: vi.fn().mockReturnValue(mapReady[0]).mockReturnValue(mapReady[1]).mockReturnValue(mapReady[2]),
        mapLibreMap: {
            once: vi.fn((_, callback) => callback()),
        },
        _eventsProxy: {
            add: vi.fn(),
        },
    }) as unknown as TomTomMap;

describe('Map utils - waitUntilMapIsReady', () => {
    test('waitUntilMapIsReady resolve promise when mapReady or maplibre.isStyleLoaded are true', async () => {
        const tomtomMapMock = getTomTomMapMock([true]);
        await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.toBeUndefined();
    });

    test('waitUntilMapIsReady resolve promise from mapLibre event once("styledata")', async () => {
        const tomtomMapMock = getTomTomMapMock([false, true]);
        await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.toBeUndefined();
    });

    test(
        'waitUntilMapIsReady resolve promise from mapLibre event once("styledata") ' +
            'while map is not ready after first event, likely due to subsequent setStyle call',
        async () => {
            const tomtomMapMock = getTomTomMapMock([false, false, true]);
            await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.toBeUndefined();
        },
    );
});

describe('Map utils - injectCustomHeaders', () => {
    test('Return only url if it is not TomTom domain', () => {
        const url = 'https://test.com';
        const transformRequestFn = transformSync({});
        expect(transformRequestFn(url)).toEqual({ url });
    });

    test('Return custom headers if url if it is TomTom domain', () => {
        const url = 'https://tomtom.com/';
        const transformRequestFn = transformSync({});
        const request = transformRequestFn(url);
        expect(request).toEqual({ url, headers: { 'tomtom-user-agent': expect.any(String) } });
    });

    test('Return only url if it is TomTom domain but an image resource', () => {
        const url = 'https://tomtom.com';
        const transformRequestFn = transformSync({});

        expect(transformRequestFn(url, 'Image' as ResourceType)).toStrictEqual({ url });
    });

    test('Append incident tags to TomTom incidents URL', () => {
        const url = 'https://api.tomtom.com/traffic/incidents/tile';
        const transformRequestFn = transformSync({});
        const result = transformRequestFn(url);
        const resultUrl = new URL(result.url);
        expect(resultUrl.searchParams.get('tags')).toBe(INCIDENT_TAGS.join(','));
    });

    test('Append flow tags to TomTom flow URL', () => {
        const url = 'https://api.tomtom.com/traffic/flow/tile';
        const transformRequestFn = transformSync({});
        const result = transformRequestFn(url);
        const resultUrl = new URL(result.url);
        expect(resultUrl.searchParams.get('tags')).toBe(FLOW_TAGS.join(','));
    });

    describe('credentials proxy mode (apiKey === "" + non-default commonBaseURL)', () => {
        const proxy = 'https://proxy.example.com/api';
        const proxyConfig = { commonBaseURL: proxy, apiKey: '' };

        test('rewrites api.tomtom.com tile URLs to the proxy base', () => {
            // MapLibre substitutes {z}/{x}/{y} before calling transformRequest,
            // so use a concrete tile URL here.
            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn('https://api.tomtom.com/maps/orbis/tiles/12/2048/1364.pbf');
            expect(result.url).toBe(`${proxy}/maps/orbis/tiles/12/2048/1364.pbf`);
        });

        test('adds credentials=include for proxied requests', () => {
            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn('https://api.tomtom.com/maps/orbis/style');
            expect(result.credentials).toBe('include');
        });

        test('adds credentials=include for image requests that get rewritten', () => {
            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn(
                'https://api.tomtom.com/maps/orbis/assets/sprites/sprite.png',
                'Image' as ResourceType,
            );
            expect(result.url).toBe(`${proxy}/maps/orbis/assets/sprites/sprite.png`);
            expect(result.credentials).toBe('include');
        });

        test('preserves incident tag injection through the rewrite', () => {
            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn('https://api.tomtom.com/traffic/incidents/tile/123');
            expect(result.url).toContain(`${proxy}/traffic/incidents/tile/123`);
            const resultUrl = new URL(result.url);
            expect(resultUrl.searchParams.get('tags')).toBe(INCIDENT_TAGS.join(','));
            expect(result.credentials).toBe('include');
        });

        test('passes through non-tomtom non-proxy URLs unchanged', () => {
            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn('https://other-host.example/something');
            expect(result).toEqual({ url: 'https://other-host.example/something' });
        });

        test('does not treat tomtom.com lookalike hosts as TomTom (hostname-based check)', () => {
            const transformRequestFn = transformSync(proxyConfig);
            // Substring "tomtom.com" appears, but the host is attacker-controlled.
            // Must pass through untouched: no TomTom headers, no tag injection,
            // no credentials, no rewrite.
            for (const url of [
                'https://tomtom.com.evil.example/maps/orbis/incidents/tile',
                'https://evil.example/x?ref=api.tomtom.com',
            ]) {
                expect(transformRequestFn(url)).toEqual({ url });
            }
        });

        test('strips key= from URLs being rewritten to the proxy', () => {
            // TomTom's style JSON embeds tile URLs with the request's apiKey
            // baked into ?key=. When we rewrite the hostname to the proxy we
            // also drop the key so it never reaches the browser console.
            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn(
                'https://c.api.tomtom.com/maps/orbis/tiles/5/14/12.pbf?apiVersion=1&key=LEAKED_KEY',
            );
            const resultUrl = new URL(result.url);
            expect(resultUrl.searchParams.has('key')).toBe(false);
            expect(resultUrl.searchParams.get('apiVersion')).toBe('1');
            expect(resultUrl.host).toBe('proxy.example.com');
        });

        test('non-proxy mode still omits credentials on TomTom URLs (backward compat)', () => {
            const transformRequestFn = transformSync({});
            const result = transformRequestFn('https://api.tomtom.com/maps/orbis/style');
            expect(result.credentials).toBeUndefined();
        });

        test('apiKey overwritten to undefined still counts as credentials proxy mode', () => {
            // An example may run put({ apiKey: process.env.API_KEY_EXAMPLES })
            // with that env unset, overwriting the bootstrap's apiKey:'' to
            // undefined. Tiles must still strip key= and attach credentials.
            const transformRequestFn = transformSync({ commonBaseURL: proxy, apiKey: undefined });
            const result = transformRequestFn(
                'https://c.api.tomtom.com/maps/orbis/tiles/5/14/12.pbf?apiVersion=1&key=LEAKED_KEY',
            );
            const resultUrl = new URL(result.url);
            expect(resultUrl.searchParams.has('key')).toBe(false);
            expect(result.credentials).toBe('include');
        });
    });

    describe('customServiceBaseURL (non-empty apiKey + non-default commonBaseURL)', () => {
        // Backward-compat guard: customers who point commonBaseURL at their
        // own backend with an apiKey set must not get `credentials: 'include'`
        // (would break consumers whose backend returns Allow-Origin: *) and
        // their key= param must reach the backend unchanged.
        const proxy = 'https://my-backend.example.com/api';
        const customBackend = { commonBaseURL: proxy, apiKey: 'CUSTOMER_KEY' };

        test('still rewrites *.api.tomtom.com tile hostnames to the custom backend', () => {
            const transformRequestFn = transformSync(customBackend);
            const result = transformRequestFn(
                'https://b.api.tomtom.com/maps/orbis/tiles/12/2048/1364.pbf?apiVersion=1&key=CUSTOMER_KEY',
            );
            expect(result.url).toContain(`${proxy}/maps/orbis/tiles/12/2048/1364.pbf`);
        });

        test('preserves the key= param on rewritten URLs', () => {
            const transformRequestFn = transformSync(customBackend);
            const result = transformRequestFn(
                'https://c.api.tomtom.com/maps/orbis/tiles/5/14/12.pbf?apiVersion=1&key=CUSTOMER_KEY',
            );
            const resultUrl = new URL(result.url);
            expect(resultUrl.searchParams.get('key')).toBe('CUSTOMER_KEY');
        });

        test('does NOT add credentials=include (would break Allow-Origin: * backends)', () => {
            const transformRequestFn = transformSync(customBackend);
            const result = transformRequestFn('https://api.tomtom.com/maps/orbis/style');
            expect(result.credentials).toBeUndefined();
        });

        test('does NOT add credentials=include on rewritten image requests', () => {
            const transformRequestFn = transformSync(customBackend);
            const result = transformRequestFn(
                'https://api.tomtom.com/maps/orbis/assets/sprites/sprite.png',
                'Image' as ResourceType,
            );
            expect(result.credentials).toBeUndefined();
        });
    });

    describe('demos-proxy session gate (globalThis.__DEMOS_PROXY_ENSURE_SESSION__)', () => {
        // The sandpack proxy bootstrap installs this hook; MapLibre awaits
        // transformRequest on the main thread before dispatching each request
        // to its tile workers, so awaiting the hook here is what keeps
        // worker-fetched tiles from going out with an expired session cookie.
        const proxy = 'https://proxy.example.com/api';
        const proxyConfig = { commonBaseURL: proxy, apiKey: '' };

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        test('awaits the hook before returning proxied tile params', async () => {
            const ensureSession = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('__DEMOS_PROXY_ENSURE_SESSION__', ensureSession);

            const transformRequestFn = transformRequest(proxyConfig);
            const pending = transformRequestFn('https://api.tomtom.com/maps/orbis/tiles/12/2048/1364.pbf');

            expect(pending).toBeInstanceOf(Promise);
            const result = await pending;
            expect(ensureSession).toHaveBeenCalledTimes(1);
            expect(result?.credentials).toBe('include');
            expect(result?.url).toBe(`${proxy}/maps/orbis/tiles/12/2048/1364.pbf`);
        });

        test('gates rewritten image requests too', async () => {
            const ensureSession = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('__DEMOS_PROXY_ENSURE_SESSION__', ensureSession);

            const transformRequestFn = transformRequest(proxyConfig);
            const result = await transformRequestFn(
                'https://api.tomtom.com/maps/orbis/assets/sprites/sprite.png',
                'Image' as ResourceType,
            );

            expect(ensureSession).toHaveBeenCalledTimes(1);
            expect(result?.credentials).toBe('include');
        });

        test('a failed renewal still returns the request params (request 401s instead of wedging the map)', async () => {
            const ensureSession = vi.fn().mockRejectedValue(new Error('hcaptcha unavailable'));
            vi.stubGlobal('__DEMOS_PROXY_ENSURE_SESSION__', ensureSession);

            const transformRequestFn = transformRequest(proxyConfig);
            const result = await transformRequestFn('https://api.tomtom.com/maps/orbis/tiles/12/2048/1364.pbf');

            expect(result?.url).toBe(`${proxy}/maps/orbis/tiles/12/2048/1364.pbf`);
        });

        test('does not gate non-proxied requests even with the hook installed', () => {
            const ensureSession = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('__DEMOS_PROXY_ENSURE_SESSION__', ensureSession);

            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn('https://other-host.example/something');

            expect(result).toEqual({ url: 'https://other-host.example/something' });
            expect(ensureSession).not.toHaveBeenCalled();
        });

        test('does not gate direct (non-proxy) mode even with the hook installed', () => {
            const ensureSession = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('__DEMOS_PROXY_ENSURE_SESSION__', ensureSession);

            const transformRequestFn = transformSync({});
            const result = transformRequestFn('https://api.tomtom.com/maps/orbis/style');

            expect(result.credentials).toBeUndefined();
            expect(ensureSession).not.toHaveBeenCalled();
        });

        test('stays synchronous without the hook (non-sandpack consumers)', () => {
            const transformRequestFn = transformSync(proxyConfig);
            const result = transformRequestFn('https://api.tomtom.com/maps/orbis/style');
            expect(result.credentials).toBe('include');
        });
    });
});

describe('Map utils - moveLayerBefore', () => {
    // MapLibre refuses to move a layer before one the style does not have, so an anchor missing
    // from the current style (the satellite style has no `lowestRoadLine` or `lowestBuilding`)
    // has to become "top of the stack" instead.
    const newMapMock = (existingLayerIDs: string[]): Map =>
        ({
            moveLayer: vi.fn(),
            getLayer: vi.fn((layerID: string) => (existingLayerIDs.includes(layerID) ? { id: layerID } : undefined)),
        }) as unknown as Map;

    test('keeps an anchor the style has', () => {
        const mapLibreMock = newMapMock(['anchor']);
        moveLayerBefore(mapLibreMock, 'myLayer', 'anchor');
        expect(mapLibreMock.moveLayer).toHaveBeenCalledWith('myLayer', 'anchor');
    });

    test('falls back to the top of the stack when the anchor is missing', () => {
        const mapLibreMock = newMapMock([]);
        moveLayerBefore(mapLibreMock, 'myLayer', 'Buildings - Underground');
        expect(mapLibreMock.moveLayer).toHaveBeenCalledWith('myLayer', undefined);
    });

    test('passes an undefined anchor straight through', () => {
        const mapLibreMock = newMapMock([]);
        moveLayerBefore(mapLibreMock, 'myLayer', undefined);
        expect(mapLibreMock.moveLayer).toHaveBeenCalledWith('myLayer', undefined);
        expect(mapLibreMock.getLayer).not.toHaveBeenCalled();
    });
});

describe('Map utils - changeLayerProps', () => {
    test('all cases', () => {
        const newMapMock = (): Map =>
            ({
                getStyle: vi.fn().mockReturnValue({ layers: [poiLayerSpec] }),
                setLayoutProperty: vi.fn(),
                setPaintProperty: vi.fn(),
                setFilter: vi.fn(),
                setLayerZoomRange: vi.fn(),
                getMaxZoom: vi.fn().mockReturnValueOnce(20),
                getMinZoom: vi.fn().mockReturnValueOnce(3),
            }) as unknown as Map;

        let mapLibreMock = newMapMock();
        changeLayerProps({ id: 'layerX', layout: { visibility: 'visible' } }, { id: 'layerX' }, mapLibreMock);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerX', layout: { visibility: 'visible', 'icon-size': 1.5 } },
            { id: 'layerX' },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerX', layout: { visibility: 'visible', 'icon-size': 1.5 } },
            { id: 'layerX', layout: { visibility: 'none' } },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'visibility', 'visible', {
            validate: false,
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'icon-size', 1.5, { validate: false });

        // A property the previous spec set and the new one drops is reset to undefined.
        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerX', layout: { visibility: 'visible', 'icon-size': 1.5 } },
            { id: 'layerX', layout: { 'text-size': 12 } },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'text-size', undefined, {
            validate: false,
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(3);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'visibility', 'visible', {
            validate: false,
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'icon-size', 1.5, { validate: false });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerY', layout: { visibility: 'visible' }, paint: { 'icon-opacity': 0.5 } },
            { id: 'layerY', paint: { 'text-color': '#ffffff' } },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith('layerY', 'text-color', undefined, {
            validate: false,
        });
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith('layerY', 'icon-opacity', 0.5, {
            validate: false,
        });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerY', filter: ['==', ['get', 'routeState'], 'selected'] },
            { id: 'layerY' },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setFilter).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setFilter).toHaveBeenCalledWith('layerY', ['==', ['get', 'routeState'], 'selected'], {
            validate: false,
        });

        mapLibreMock = newMapMock();
        changeLayerProps({ id: 'layerY', minzoom: 5 }, { id: 'layerY' }, mapLibreMock);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledWith('layerY', 5, 20);

        mapLibreMock = newMapMock();
        changeLayerProps({ id: 'layerY', maxzoom: 15 }, { id: 'layerY' }, mapLibreMock);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledWith('layerY', 3, 15);
    });
});

describe('Map utils - updateLayersAndSource', () => {
    test('all cases', () => {
        const newMapMock = (): Map =>
            ({
                removeLayer: vi.fn(),
                setLayoutProperty: vi.fn(),
                setPaintProperty: vi.fn(),
                setFilter: vi.fn(),
                getLayer: vi.fn(),
                addLayer: vi.fn(),
            }) as unknown as Map;

        // empty arrays
        updateLayersAndSource(
            [],
            [],
            { _updateSourceAndLayerIDs: vi.fn() } as unknown as AbstractSourceWithLayers,
            newMapMock(),
        );

        // remove one layer
        let mapMock = newMapMock();
        const someId = 'someId';

        const sourceWithLayersMock = {
            _layerSpecs: [{ id: someId }],
            _updateSourceAndLayerIDs: vi.fn(),
        };

        updateLayersAndSource(
            [],
            [{ id: someId } as ToBeAddedLayerSpecWithoutSource],
            sourceWithLayersMock as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );
        expect(mapMock.removeLayer).toHaveBeenCalledTimes(1);
        expect(sourceWithLayersMock._updateSourceAndLayerIDs).toHaveBeenCalled();

        const sourceWithLayersMock2 = {
            source: { id: 'sourceId' },
            _layerSpecs: [{ id: someId }],
            _updateSourceAndLayerIDs: vi.fn(),
        };

        // add one layer: a layer the new configuration introduced reaches the map right away,
        // hidden, rather than waiting for the next `show()` to put it there.
        mapMock = newMapMock();
        updateLayersAndSource(
            [{ id: someId } as ToBeAddedLayerSpecWithoutSource],
            [],
            sourceWithLayersMock2 as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );
        expect(mapMock.addLayer).toHaveBeenCalledTimes(1);
        expect(mapMock.addLayer).toHaveBeenCalledWith(
            { id: someId, source: 'sourceId', layout: { visibility: 'none' } },
            undefined,
        );
        expect(sourceWithLayersMock2._layerSpecs.map((spec) => spec.id)).toEqual([someId, someId]);

        // update one layer
        mapMock = newMapMock();
        updateLayersAndSource(
            [{ id: 'layerX', type: 'line', layout: { prop0: 'value0' } } as ToBeAddedLayerSpecWithoutSource],
            [{ id: 'layerX', type: 'line' }],
            sourceWithLayersMock2 as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );
        expect(mapMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapMock.setFilter).toHaveBeenCalledTimes(1);
        expect(mapMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(sourceWithLayersMock2._updateSourceAndLayerIDs).toHaveBeenCalledTimes(2);
    });

    test('a layer whose spec names a new anchor is moved, and the recorded spec follows it', () => {
        const mapMock = {
            setLayoutProperty: vi.fn(),
            setPaintProperty: vi.fn(),
            setFilter: vi.fn(),
            getLayer: vi.fn().mockReturnValue({}),
            moveLayer: vi.fn(),
        } as unknown as Map;
        const sourceWithLayersMock = {
            source: { id: 'sourceId' },
            _layerSpecs: [{ id: 'sectionLine', beforeID: 'routeDeselectedOutline' }],
            _updateSourceAndLayerIDs: vi.fn(),
        };

        updateLayersAndSource(
            [{ id: 'sectionLine', type: 'line', beforeID: 'routeLineArrows' }],
            [{ id: 'sectionLine', type: 'line', beforeID: 'routeDeselectedOutline' }],
            sourceWithLayersMock as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );

        expect(mapMock.moveLayer).toHaveBeenCalledWith('sectionLine', 'routeLineArrows');
        expect(sourceWithLayersMock._layerSpecs[0].beforeID).toBe('routeLineArrows');
    });

    test('a layer pinned to one that moved follows it, so a group of lines stays together', () => {
        const mapMock = {
            setLayoutProperty: vi.fn(),
            setPaintProperty: vi.fn(),
            setFilter: vi.fn(),
            getLayer: vi.fn().mockReturnValue({}),
            moveLayer: vi.fn(),
        } as unknown as Map;
        // The traffic section: a coloured line beneath a dashed one. Only the dashed line names the
        // anchor that changed, but both have to end up on the other side of the route line.
        const dashedLine = { id: 'dashedLine', type: 'line', beforeID: 'routeDeselectedOutline' };
        const backgroundLine = { id: 'backgroundLine', type: 'line', beforeID: 'dashedLine' };

        updateLayersAndSource(
            [backgroundLine, dashedLine] as ToBeAddedLayerSpecWithoutSource[],
            [
                { id: 'backgroundLine', type: 'line', beforeID: 'dashedLine' },
                { id: 'dashedLine', type: 'line', beforeID: 'routeLineArrows' },
            ],
            {
                source: { id: 'sourceId' },
                _layerSpecs: [{ id: 'dashedLine' }, { id: 'backgroundLine' }],
                _updateSourceAndLayerIDs: vi.fn(),
            } as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );

        // The anchored line first, then the one pinned to it: the other order would leave the
        // follower under wherever the anchor used to be.
        expect(vi.mocked(mapMock.moveLayer).mock.calls).toEqual([
            ['dashedLine', 'routeDeselectedOutline'],
            ['backgroundLine', 'dashedLine'],
        ]);
    });

    test('a layer whose anchor is unchanged is left where it is', () => {
        const mapMock = {
            setLayoutProperty: vi.fn(),
            setPaintProperty: vi.fn(),
            setFilter: vi.fn(),
            getLayer: vi.fn().mockReturnValue({}),
            moveLayer: vi.fn(),
        } as unknown as Map;

        updateLayersAndSource(
            [
                {
                    id: 'sectionLine',
                    type: 'line',
                    beforeID: 'routeLineArrows',
                    paint: { 'line-opacity': 0.5 },
                },
            ],
            [{ id: 'sectionLine', type: 'line', beforeID: 'routeLineArrows' }],
            {
                source: { id: 'sourceId' },
                _layerSpecs: [{ id: 'sectionLine', beforeID: 'routeLineArrows' }],
                _updateSourceAndLayerIDs: vi.fn(),
            } as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );

        expect(mapMock.moveLayer).not.toHaveBeenCalled();
        expect(mapMock.setPaintProperty).toHaveBeenCalledWith('sectionLine', 'line-opacity', 0.5, { validate: false });
    });
});

describe('Map utils - addLayersInCorrectOrder', () => {
    test('empty list case', () => {
        const mapMock = {} as unknown as Map;
        addLayers([], mapMock);
    });

    test('complex case with ordering', () => {
        // adding a complex case
        const mapMock = {
            addLayer: vi.fn(),
            setLayoutProperty: vi.fn(),
            getLayer: vi
                .fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce({})
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined),
        } as unknown as Map;
        const id1 = 'id1';
        const id2 = 'id2';
        const id3 = 'id3';
        const id4 = 'id4';
        const id5 = 'id5';
        const existingId = 'existing id';
        const layer1 = { id: id1, beforeID: id2 } as ToBeAddedLayerSpec;
        const layer2 = { id: id2, beforeID: id4 } as ToBeAddedLayerSpec;
        const layer3 = { id: id3, beforeID: id4 } as ToBeAddedLayerSpec;
        const layer4 = { id: id4, beforeID: existingId } as ToBeAddedLayerSpec;
        const layer5 = { id: id5 } as ToBeAddedLayerSpec;
        addLayers([layer1, layer2, layer3, layer4, layer5], mapMock);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(1, id2);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(2, id4);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(3, id4);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(4, existingId);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(5, id4);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(6, id5);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(7, id2);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(8, id3);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(9, id1);
        expect(mapMock.addLayer).toHaveBeenCalledTimes(5);
        expect(mapMock.getLayer).toHaveBeenCalledTimes(9);
    });

    test('error case', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const mapMock = {
            getLayer: vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(undefined),
        } as unknown as Map;
        const id1 = 'id1';
        const id2 = 'id2';
        const layer1 = { id: id1, beforeID: id2 } as ToBeAddedLayerSpec;
        const layer2 = { id: id2, beforeID: id1 } as ToBeAddedLayerSpec;
        addLayers([layer1, layer2], mapMock);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
});

describe('Map utils - updateStyleWithStyleModule', () => {
    test('error case', () => {
        expect(() =>
            updateStyleWithModule({ type: 'custom', url: 'https://example.com/style.json' }, 'trafficIncidents'),
        ).toThrow();
    });

    test.each(updateStyleData)(
        `'%s`,
        (_name: string, styleInput: StyleInput | null, styleModule: StyleModule, styleOutput: StyleInput) => {
            // @ts-ignore
            expect(updateStyleWithModule(styleInput ? styleInput : undefined, styleModule)).toEqual(styleOutput);
        },
    );
});

describe('Map utils - tryToAddSourceToMapIfMissing', () => {
    test('Initializing module with source', async () => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        const mapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValueOnce(hillshadeSource),
                isStyleLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        await ensureAddedToStyle(mapMock, HILLSHADE_SOURCE_ID, 'hillshade');
        expect(mapMock.mapLibreMap.getSource).toHaveBeenCalled();
    });

    test('Initializing module with no source', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(vi.fn()),
                getStyle: vi.fn().mockReturnValueOnce({ layers: [] }),
                isStyleLoaded: vi.fn().mockReturnValue(true),
                isSourceLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            getStyle: vi.fn(),
            setStyle: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        await ensureAddedToStyle(tomtomMapMock, HILLSHADE_SOURCE_ID, 'hillshade');
        expect(tomtomMapMock.getStyle).toHaveBeenCalled();
        expect(tomtomMapMock.setStyle).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
    });
});

describe('addOrUpdateImage tests', () => {
    test('Add image while map already has it', () => {
        const mapLibreMock = {
            loadImage: vi.fn().mockResolvedValue(vi.fn()),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(true),
        } as unknown as Map;

        vi.spyOn(mapLibreMock, 'addImage');
        expect(async () =>
            addOrUpdateImage('if-not-in-sprite', 'restaurant', 'https: //test.com', mapLibreMock),
        ).not.toThrow();
    });

    test('Add image with race condition, when map already has it right after loading it', () => {
        const mapLibreMock = {
            loadImage: vi.fn().mockResolvedValue({ data: {} }),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
        } as unknown as Map;

        expect(async () =>
            addOrUpdateImage('add-or-update', 'restaurant', 'https://test.com', mapLibreMock),
        ).not.toThrow();
        expect(mapLibreMock.loadImage).toHaveBeenCalledTimes(1);
    });

    test('Add image to map successfully', async () => {
        const mapLibreMock = {
            loadImage: vi.fn().mockResolvedValue(vi.fn()),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(false),
        } as unknown as Map;
        expect(async () =>
            addOrUpdateImage('if-not-in-sprite', 'restaurant', 'https://test.com', mapLibreMock, { pixelRatio: 1 }),
        ).not.toThrow();
        expect(mapLibreMock.loadImage).toHaveBeenCalledTimes(1);
    });

    test('Add image while map load image has an error', async () => {
        const error = new Error('image not found');
        const mapLibreMock = {
            loadImage: vi.fn().mockRejectedValue(error),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(false),
        } as unknown as Map;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(
            addOrUpdateImage('if-not-in-sprite', 'restaurant', 'https://test.com', mapLibreMock),
        ).resolves.toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith('Failed to load image for ID restaurant', error);
        expect(mapLibreMock.addImage).not.toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    test('A failed image load does not prevent other images from loading', async () => {
        const error = new Error('image not found');
        const mapLibreMock = {
            loadImage: vi
                .fn()
                .mockImplementation((url: string) =>
                    url === 'https://broken.com' ? Promise.reject(error) : Promise.resolve({ data: {} }),
                ),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(false),
        } as unknown as Map;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await Promise.all([
            addOrUpdateImage('if-not-in-sprite', 'broken-icon', 'https://broken.com', mapLibreMock),
            addOrUpdateImage('if-not-in-sprite', 'working-icon', 'https://test.com', mapLibreMock),
        ]);

        expect(warnSpy).toHaveBeenCalledWith('Failed to load image for ID broken-icon', error);
        expect(mapLibreMock.addImage).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.addImage).toHaveBeenCalledWith('working-icon', {}, undefined);

        warnSpy.mockRestore();
    });
});

describe('Map utils - detectStyleLightDarkTheme', () => {
    const styleWithBackground = (color: unknown) => ({
        layers: [{ id: 'background', type: 'background', paint: { 'background-color': color } }],
    });

    test('reads a dark canvas as dark and a light one as light', () => {
        expect(detectStyleLightDarkTheme(styleWithBackground('#0b0e12') as never)).toBe('dark');
        expect(detectStyleLightDarkTheme(styleWithBackground('hsl(0, 0%, 12%)') as never)).toBe('dark');
        expect(detectStyleLightDarkTheme(styleWithBackground('#f4f2ee') as never)).toBe('light');
        expect(detectStyleLightDarkTheme(styleWithBackground('rgb(240, 240, 240)') as never)).toBe('light');
    });

    test('looks through an expression for the first colour literal', () => {
        const expression = ['interpolate', ['linear'], ['zoom'], 5, '#111111', 12, '#222222'];
        expect(detectStyleLightDarkTheme(styleWithBackground(expression) as never)).toBe('dark');
    });

    test('gives no answer without a readable background colour', () => {
        expect(detectStyleLightDarkTheme(undefined)).toBeUndefined();
        expect(detectStyleLightDarkTheme({ layers: [] })).toBeUndefined();
        expect(detectStyleLightDarkTheme({ layers: [{ id: 'water', type: 'fill' }] } as never)).toBeUndefined();
        expect(detectStyleLightDarkTheme(styleWithBackground('not-a-colour') as never)).toBeUndefined();
    });
});

describe('Map utils - getStyleLightDarkTheme', () => {
    test('reads the theme off a standard style ID', () => {
        expect(getStyleLightDarkTheme('standardLight')).toBe('light');
        expect(getStyleLightDarkTheme('standardDark')).toBe('dark');
        expect(getStyleLightDarkTheme({ type: 'standard', id: 'monoDark' })).toBe('dark');
    });

    test('takes a custom style at its word when it declares a theme', () => {
        expect(getStyleLightDarkTheme({ type: 'custom', url: 'https://x/y.json', lightDarkTheme: 'dark' })).toBe(
            'dark',
        );
        expect(
            getStyleLightDarkTheme({
                type: 'custom',
                json: { version: 8, sources: {}, layers: [] },
                lightDarkTheme: 'light',
            }),
        ).toBe('light');
    });

    test('falls back to light for a custom style that declares nothing', () => {
        expect(getStyleLightDarkTheme({ type: 'custom', url: 'https://x/y.json' })).toBe('light');
        expect(getStyleLightDarkTheme()).toBe('light');
    });

    test('only a custom style declares a theme', () => {
        expect(getDeclaredLightDarkTheme({ type: 'custom', url: 'https://x/y.json', lightDarkTheme: 'dark' })).toBe(
            'dark',
        );
        expect(getDeclaredLightDarkTheme({ type: 'custom', url: 'https://x/y.json' })).toBeUndefined();
        expect(getDeclaredLightDarkTheme('standardDark')).toBeUndefined();
        expect(getDeclaredLightDarkTheme()).toBeUndefined();
    });
});
