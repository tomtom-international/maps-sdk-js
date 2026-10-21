/**
 * Demos-proxy session bootstrap, injected into BOTH example builds in
 * demos-proxy mode: the live editor mounts it as a hidden `_session-bootstrap.ts`
 * (injectDemosProxyBootstrap), dist/prod
 * bundles it from source (inject-demos-proxy-bootstrap in
 * example-vite.config.ts). Both prepend a BARE
 * side-effect import: hoisting installs the fetch wrapper before the importing
 * module runs, which an exported `install()` — called only after every other
 * import had been evaluated — could not guarantee. `installDemosProxy()` on the last
 * line is the whole import-time effect.
 *
 * No top-level `await` (the live editor's TS compiler rejects it), so the session is a
 * free promise, awaited by the fetch wrapper on the main thread and by every map's
 * `transformRequest` for MapLibre's worker-fetched tiles.
 */

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { TomTomMapParams } from '@tomtom-org/maps-sdk/map';

interface HCaptchaApi {
    render: (container: HTMLElement | string, options: { sitekey: string; size: 'invisible' }) => string;
    execute: (widgetId: string, options: { async: true }) => Promise<{ response: string }>;
}

// Global `var`s, not `Window` members, so they can be read off `globalThis`.
declare global {
    var hcaptcha: HCaptchaApi | undefined;
    var __DEMOS_PROXY_READY__: boolean | undefined;
}

// Baked in at build time (live editor: substituteEnvVars; dist/prod: Vite
// `define`). Either one missing => installDemosProxy is a no-op and the example
// runs in its classic direct-to-TomTom mode.
const DEMOS_PROXY_URL = process.env.DEMOS_PROXY_URL ?? '';
const SITEKEY = process.env.HCAPTCHA_SITEKEY ?? '';
const HCAPTCHA_SCRIPT_URL = 'https://js.hcaptcha.com/1/api.js?render=explicit';

const waitForHCaptchaReady = (timeoutMs = 5000): Promise<void> =>
    new Promise((resolve, reject) => {
        const started = Date.now();
        const check = () => {
            if (globalThis.hcaptcha) {
                resolve();
                return;
            }

            if (Date.now() - started > timeoutMs) {
                reject(new Error('hCaptcha API never became available'));
                return;
            }
            setTimeout(check, 50);
        };
        check();
    });

const loadHCaptchaScript = (): Promise<void> => {
    if (globalThis.hcaptcha) return Promise.resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${HCAPTCHA_SCRIPT_URL}"]`);
    if (existing) return waitForHCaptchaReady();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = HCAPTCHA_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => waitForHCaptchaReady().then(resolve, reject);
        script.onerror = () => reject(new Error('hCaptcha script failed to load'));
        document.head.appendChild(script);
    });
};

// Captured strictly before installDemosProxy replaces globalThis.fetch, so our own
// /session calls don't wait on the promise they are resolving.
const originalFetch = globalThis.fetch.bind(globalThis);

const expiresInSeconds = (response: Response): number | null => {
    const seconds = Number(response.headers.get('X-Session-Expires-In'));
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

// The cookie is HttpOnly, so its expiry is kept beside it, in epoch milliseconds.
const SESSION_EXPIRY_STORAGE_KEY = 'tomtom-demos-proxy-session-expires-at';

// Storage can be blocked (a sandboxed frame, some private modes), which reads as no session.
const readStoredSessionExpiry = (): number => {
    try {
        return Number(localStorage.getItem(SESSION_EXPIRY_STORAGE_KEY)) || 0;
    } catch {
        return 0;
    }
};

const storeSessionExpiry = (expiresAtMs: number | null): void => {
    try {
        if (expiresAtMs === null) localStorage.removeItem(SESSION_EXPIRY_STORAGE_KEY);
        else localStorage.setItem(SESSION_EXPIRY_STORAGE_KEY, String(expiresAtMs));
    } catch {
        // Every load then mints its own session.
    }
};

// /session/status answers 204 while the cookie is valid, saving an hCaptcha + POST on
// every later example load, and 401 without one. So it is asked only while the stored
// expiry says a session may outlive the renewal margin, the only one establishSession
// adopts, and a first visit sends no request bound to fail.
const checkExistingSession = async (): Promise<number | null> => {
    if (readStoredSessionExpiry() - SESSION_RENEWAL_MARGIN_MS <= Date.now()) return null;

    try {
        const response = await originalFetch(`${DEMOS_PROXY_URL}/session/status`, { credentials: 'include' });
        if (response.status === 204) return expiresInSeconds(response);

        storeSessionExpiry(null);
        return null;
    } catch {
        return null;
    }
};

// MapLibre fetches tiles from workers, whose fetch the wrapper below cannot
// reach, so a worker taking 401s after expiry has no recovery path. The map's
// transformRequest calls ensureFreshSession on the MAIN thread instead, so the
// cookie is re-minted within this margin, before the request goes out.
const SESSION_RENEWAL_MARGIN_MS = 60_000;
const DEFAULT_SESSION_TTL_S = 600;
let sessionExpiresAtMs = 0;

const recordSessionExpiry = (remainingSeconds: number): void => {
    sessionExpiresAtMs = Date.now() + remainingSeconds * 1000;
    storeSessionExpiry(sessionExpiresAtMs);
};

// Adopt a live session if there is one, otherwise solve an invisible hCaptcha
// and mint a fresh cookie. installDemosProxy owns the demos-proxy-mode check.
const establishSession = async (): Promise<void> => {
    if (globalThis.__DEMOS_PROXY_READY__) return;

    // Only adopt a session with MORE life left than the renewal margin: a dying
    // one records an expiry already inside the margin, so every
    // ensureFreshSession call would "refresh" again — one status check per map
    // request until the cookie truly expires.
    const remainingSeconds = await checkExistingSession();
    if (remainingSeconds !== null && remainingSeconds * 1000 > SESSION_RENEWAL_MARGIN_MS) {
        globalThis.__DEMOS_PROXY_READY__ = true;
        recordSessionExpiry(remainingSeconds);
        return;
    }

    await loadHCaptchaScript();
    const hcaptcha = globalThis.hcaptcha;
    if (!hcaptcha) throw new Error('hCaptcha API not available after script load');

    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    let token: string;
    try {
        const widgetId = hcaptcha.render(container, { sitekey: SITEKEY, size: 'invisible' });
        ({ response: token } = await hcaptcha.execute(widgetId, { async: true }));
    } finally {
        // Drop the host node so repeated bootstraps (hot reloads, example
        // switches) don't pile up hidden divs.
        container.remove();
    }

    const sessionResponse = await originalFetch(`${DEMOS_PROXY_URL}/session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hcaptchaToken: token }),
    });
    if (!sessionResponse.ok) {
        const body = await sessionResponse.text().catch(() => '');
        throw new Error(`Demos proxy /session returned ${sessionResponse.status}: ${body}`);
    }
    globalThis.__DEMOS_PROXY_READY__ = true;
    recordSessionExpiry(expiresInSeconds(sessionResponse) ?? DEFAULT_SESSION_TTL_S);
};

// Resolves once the session cookie exists; the resolved placeholder keeps
// ensureFreshSession harmless outside demos-proxy mode.
let sessionReady: Promise<void> = Promise.resolve();

// Makes re-minting single-flight: when a burst of requests needs a renewal at
// once, only the first solves an hCaptcha — the rest await the same refresh.
let sessionGeneration = 0;

const refreshSession = (observedGeneration: number): Promise<void> => {
    if (observedGeneration === sessionGeneration) {
        sessionGeneration++;
        globalThis.__DEMOS_PROXY_READY__ = false;
        sessionReady = establishSession().catch((error) => {
            console.error('Demos-proxy session refresh failed:', error);
        });
    }
    return sessionReady;
};

const isDemosProxyRequest = (input: RequestInfo | URL): boolean => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return url.startsWith(DEMOS_PROXY_URL);
};

// A consumed stream body can't be replayed; anything else is safe to send again.
const isRetryable = (init?: RequestInit): boolean =>
    init?.body == null || typeof init.body !== 'object' || !('getReader' in init.body);

// The single "session is fresh" gate. Capturing the generation BEFORE awaiting
// sessionReady makes a burst of callers join one in-flight refresh.
const ensureFreshSession = async (): Promise<void> => {
    const observedGeneration = sessionGeneration;
    await sessionReady;
    if (Date.now() < sessionExpiresAtMs - SESSION_RENEWAL_MARGIN_MS) return;
    await refreshSession(observedGeneration);
};

// Tile fetches run in workers, out of the fetch wrapper's reach, but MapLibre awaits each map's
// transformRequest on the main thread before handing a request to a worker. The bootstrap creates
// no map, so it puts the hook in the global config, which every map merges its own params over.
const holdForFreshSession: Pick<TomTomMapParams, 'transformRequest'> = {
    transformRequest: (request) =>
        isDemosProxyRequest(request.url) ? ensureFreshSession().then(() => request) : request,
};

// Everything this module does on import, in one place.
const installDemosProxy = (): void => {
    if (!DEMOS_PROXY_URL || !SITEKEY) return;

    // Point the SDK at the demos proxy synchronously, so a call issued before
    // the session lands still targets the right host. `apiKey: ''` is what puts
    // the SDK in proxy mode — see isProxyCredentialsMode in core/src/config/globalConfig.ts.
    if (!globalThis.__DEMOS_PROXY_READY__) {
        TomTomConfig.instance.put({ apiKey: '', commonBaseURL: `${DEMOS_PROXY_URL}/api`, ...holdForFreshSession });
    }

    sessionReady = establishSession().catch((error) => {
        console.error('Demos-proxy bootstrap failed:', error);
    });

    // Every main-thread call (SDK fetches, MapLibre style/sprite/glyph loads, AI
    // SDK requests) goes out with a fresh session, with one re-mint + retry as
    // backstop on a 401. Our own originalFetch calls bypass this.
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const observedGeneration = sessionGeneration;
        await ensureFreshSession();
        const response = await originalFetch(input, init);
        if (response.status !== 401 || !isDemosProxyRequest(input) || !isRetryable(init)) {
            return response;
        }
        await refreshSession(observedGeneration);
        return originalFetch(input, init);
    };
};

installDemosProxy();
