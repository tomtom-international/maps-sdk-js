import type { MapRequestTransform, TomTomMapParams } from '@tomtom-org/maps-sdk/map';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tomtom-org/maps-sdk/core', () => ({ TomTomConfig: { instance: { put: vi.fn() } } }));

const PROXY_URL = 'https://demo-proxy.example';

// Imports the bootstrap, which installs itself, and returns the transformRequest it hands every map through the
// global config. The proxy answers /session only once `mintSession()` is called.
const bootstrap = async (): Promise<{ transformRequest: MapRequestTransform; mintSession: () => void }> => {
    let mintSession = () => {};
    const sessionMinted = new Promise<void>((resolve) => {
        mintSession = resolve;
    });
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL) => {
            if (String(input) !== `${PROXY_URL}/session`) return new Response(null, { status: 401 });
            await sessionMinted;
            return new Response('{}', { status: 200, headers: { 'X-Session-Expires-In': '600' } });
        }),
    );
    await import('../demosProxyBootstrap');
    const { TomTomConfig } = await import('@tomtom-org/maps-sdk/core');
    const [config] = vi.mocked(TomTomConfig.instance.put).mock.calls[0];
    const { transformRequest } = config as Pick<TomTomMapParams, 'transformRequest'>;
    if (!transformRequest) throw new Error('The bootstrap put no transformRequest in the global config');
    return { transformRequest, mintSession };
};

describe("the demos-proxy bootstrap's transformRequest", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('DEMOS_PROXY_URL', PROXY_URL);
        vi.stubEnv('HCAPTCHA_SITEKEY', 'test-sitekey');
        vi.stubGlobal('__DEMOS_PROXY_READY__', undefined);
        // Node's own lock manager is shared by the whole process, and a session left minting would hold it.
        vi.stubGlobal('navigator', {});
        vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
        vi.stubGlobal('hcaptcha', { render: () => 'widget', execute: async () => ({ response: 'token' }) });
        vi.stubGlobal('document', {
            createElement: () => ({ style: {}, remove: () => undefined }),
            body: { appendChild: () => undefined },
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('holds a demos-proxy request until the session is minted', async () => {
        const { transformRequest, mintSession } = await bootstrap();
        const request = { url: `${PROXY_URL}/api/maps/orbis/vector-tiles/1/2/3.pbf` };

        let released = false;
        const held = Promise.resolve(transformRequest(request, 'Tile')).then((result) => {
            released = true;
            return result;
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(released).toBe(false);

        mintSession();
        expect(await held).toBe(request);
    });

    it('returns any other request synchronously', async () => {
        const { transformRequest } = await bootstrap();
        const request = { url: 'https://api.tomtom.com/maps/orbis/vector-tiles/1/2/3.pbf' };

        expect(transformRequest(request, 'Tile')).toBe(request);
    });
});
