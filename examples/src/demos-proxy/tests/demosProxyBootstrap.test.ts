import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tomtom-org/maps-sdk/core', () => ({ TomTomConfig: { instance: { put: vi.fn() } } }));

const PROXY_URL = 'https://demo-proxy.example';
const STORAGE_KEY = 'tomtom-demos-proxy-session-expires-at';
const NOW_MS = 1_000_000_000;

const createStorage = (entries: Record<string, string> = {}) => {
    const values = new Map(Object.entries(entries));
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
    };
};

const LOCK_NAME = 'tomtom-demos-proxy-session';

// Grants each request once the one before it settles, as the browser does across an origin's frames,
// and drops a request whose signal aborts before its turn.
const createLockManager = () => {
    let queue: Promise<unknown> = Promise.resolve();
    return {
        request: vi.fn((_name: string, { signal }: { signal?: AbortSignal }, task: () => Promise<unknown>) => {
            const turn = queue.then(() => (signal?.aborted ? undefined : task()));
            queue = turn.catch(() => undefined);
            if (!signal) return turn;
            return new Promise((resolve, reject) => {
                signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
                    once: true,
                });
                turn.then(resolve, reject);
            });
        }),
    };
};

// A neighbouring frame holding the lock while it mints; `finish` stores its session and releases it.
const holdLockAsNeighbour = (
    locks: ReturnType<typeof createLockManager>,
    storage: ReturnType<typeof createStorage>,
) => {
    let finish = () => {};
    void locks.request(
        LOCK_NAME,
        {},
        () =>
            new Promise<void>((resolve) => {
                finish = () => {
                    storage.setItem(STORAGE_KEY, String(NOW_MS + 600_000));
                    resolve();
                };
            }),
    );
    return () => finish();
};

const requestedURLs = (fetchMock: ReturnType<typeof vi.fn>): string[] =>
    fetchMock.mock.calls.map(([input]) => String(input));

// Imports the bootstrap, which installs itself, then waits out its session through the fetch wrapper.
const bootstrap = async ({ statusCode = 401 }: { statusCode?: number } = {}) => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === `${PROXY_URL}/session/status`) {
            return new Response(null, { status: statusCode, headers: { 'X-Session-Expires-In': '300' } });
        }
        if (url === `${PROXY_URL}/session`) {
            return new Response('{}', { status: 200, headers: { 'X-Session-Expires-In': '600' } });
        }
        return new Response('ok');
    });
    vi.stubGlobal('fetch', fetchMock);
    await import('../demosProxyBootstrap');
    await globalThis.fetch('https://elsewhere.example/ping');
    return fetchMock;
};

describe('demos-proxy session bootstrap', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers({ toFake: ['Date'], now: NOW_MS });
        vi.stubEnv('DEMOS_PROXY_URL', PROXY_URL);
        vi.stubEnv('HCAPTCHA_SITEKEY', 'test-sitekey');
        vi.stubGlobal('__DEMOS_PROXY_READY__', undefined);
        // Node's own lock manager is shared by the whole process, so a test hands in its own or none.
        vi.stubGlobal('navigator', {});
        vi.stubGlobal('hcaptcha', {
            render: () => 'widget',
            execute: async () => ({ response: 'token' }),
        });
        vi.stubGlobal('document', {
            createElement: () => ({ style: {}, remove: () => undefined }),
            body: { appendChild: () => undefined },
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('mints a session on a first visit without asking for its status', async () => {
        const storage = createStorage();
        vi.stubGlobal('localStorage', storage);

        const fetchMock = await bootstrap();

        expect(requestedURLs(fetchMock)).not.toContain(`${PROXY_URL}/session/status`);
        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session`);
        expect(storage.getItem(STORAGE_KEY)).toBe(String(NOW_MS + 600_000));
    });

    it('skips the status check once the stored session has expired', async () => {
        vi.stubGlobal('localStorage', createStorage({ [STORAGE_KEY]: String(NOW_MS - 1) }));

        const fetchMock = await bootstrap();

        expect(requestedURLs(fetchMock)).not.toContain(`${PROXY_URL}/session/status`);
        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session`);
    });

    it('skips the status check once the stored session is inside the renewal margin', async () => {
        vi.stubGlobal('localStorage', createStorage({ [STORAGE_KEY]: String(NOW_MS + 30_000) }));

        const fetchMock = await bootstrap();

        expect(requestedURLs(fetchMock)).not.toContain(`${PROXY_URL}/session/status`);
        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session`);
    });

    it('adopts the session the stored expiry says is live, and stores the expiry the proxy reports', async () => {
        const storage = createStorage({ [STORAGE_KEY]: String(NOW_MS + 200_000) });
        vi.stubGlobal('localStorage', storage);

        const fetchMock = await bootstrap({ statusCode: 204 });

        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session/status`);
        expect(requestedURLs(fetchMock)).not.toContain(`${PROXY_URL}/session`);
        expect(storage.getItem(STORAGE_KEY)).toBe(String(NOW_MS + 300_000));
    });

    it('drops a stored session the proxy no longer holds, then mints one', async () => {
        const storage = createStorage({ [STORAGE_KEY]: String(NOW_MS + 300_000) });
        const removeItem = vi.spyOn(storage, 'removeItem');
        vi.stubGlobal('localStorage', storage);

        const fetchMock = await bootstrap({ statusCode: 401 });

        expect(removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session`);
        expect(storage.getItem(STORAGE_KEY)).toBe(String(NOW_MS + 600_000));
    });

    it('waits for another frame minting a session, then adopts it', async () => {
        const storage = createStorage();
        vi.stubGlobal('localStorage', storage);
        const locks = createLockManager();
        vi.stubGlobal('navigator', { locks });
        const execute = vi.fn(async () => ({ response: 'token' }));
        vi.stubGlobal('hcaptcha', { render: () => 'widget', execute });

        const finishNeighbourMint = holdLockAsNeighbour(locks, storage);

        const pending = bootstrap({ statusCode: 204 });
        await vi.waitFor(() => expect(locks.request).toHaveBeenCalledTimes(2));
        finishNeighbourMint();
        const fetchMock = await pending;

        expect(execute).not.toHaveBeenCalled();
        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session/status`);
        expect(requestedURLs(fetchMock)).not.toContain(`${PROXY_URL}/session`);
    });

    it('adopts a live stored session without taking the lock', async () => {
        vi.stubGlobal('localStorage', createStorage({ [STORAGE_KEY]: String(NOW_MS + 200_000) }));
        const locks = createLockManager();
        vi.stubGlobal('navigator', { locks });

        const fetchMock = await bootstrap({ statusCode: 204 });

        expect(locks.request).not.toHaveBeenCalled();
        expect(requestedURLs(fetchMock)).not.toContain(`${PROXY_URL}/session`);
    });

    it('stops waiting for a lock held past a minute, and mints alone', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'], now: NOW_MS });
        const storage = createStorage();
        vi.stubGlobal('localStorage', storage);
        const locks = createLockManager();
        vi.stubGlobal('navigator', { locks });
        holdLockAsNeighbour(locks, storage);

        const pending = bootstrap();
        await vi.waitFor(() => expect(locks.request).toHaveBeenCalledTimes(2));
        vi.advanceTimersByTime(60_000);
        const fetchMock = await pending;

        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session`);
    });

    it('mints a session without the lock in an opaque-origin frame, which the lock refuses', async () => {
        vi.stubGlobal('origin', 'null');
        const locks = { request: vi.fn(() => Promise.reject(new DOMException('Opaque origin', 'SecurityError'))) };
        vi.stubGlobal('navigator', { locks });
        vi.stubGlobal('localStorage', createStorage());

        const fetchMock = await bootstrap();

        expect(locks.request).not.toHaveBeenCalled();
        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session`);
    });

    it('mints a session when storage is blocked', async () => {
        const blocked = () => {
            throw new DOMException('The operation is insecure.', 'SecurityError');
        };
        vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });

        const fetchMock = await bootstrap();

        expect(requestedURLs(fetchMock)).not.toContain(`${PROXY_URL}/session/status`);
        expect(requestedURLs(fetchMock)).toContain(`${PROXY_URL}/session`);
    });
});
