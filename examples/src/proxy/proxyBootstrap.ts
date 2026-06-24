/**
 * Sandpack-injected proxy bootstrap.
 *
 * Injected into every example's hidden `config.ts` so it loads as part of the
 * import graph. We can't use top-level await here — Sandpack's TS compiler
 * doesn't support it — so the bootstrap kicks off `sessionReady` as a free
 * promise and everything else awaits it: the `window.fetch` wrapper holds
 * main-thread calls until the session cookie exists, and the
 * `__DEMO_BFF_ENSURE_SESSION__` hook (awaited by the maps SDK's
 * transformRequest) keeps it fresh for MapLibre's worker-fetched tiles.
 */

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';

interface HCaptchaApi {
    render: (container: HTMLElement | string, options: { sitekey: string; size: 'invisible' }) => string;
    execute: (widgetId: string, options: { async: true }) => Promise<{ response: string }>;
}

declare global {
    interface Window {
        hcaptcha?: HCaptchaApi;
        __DEMO_BFF_PROXY_READY__?: boolean;
        // Session gate consumed by the maps SDK's transformRequest (see
        // gateOnDemoBffSession in map/src/shared/mapUtils.ts).
        __DEMO_BFF_ENSURE_SESSION__?: () => Promise<void>;
    }
}

const BFF_URL = process.env.DEMO_BFF_URL ?? '';
const SITEKEY = process.env.HCAPTCHA_SITEKEY ?? '';
const HCAPTCHA_SCRIPT_URL = 'https://js.hcaptcha.com/1/api.js?render=explicit';

const waitForHCaptchaReady = (timeoutMs = 5000): Promise<void> =>
    new Promise((resolve, reject) => {
        const started = Date.now();
        const check = () => {
            if (window.hcaptcha) {
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
    if (window.hcaptcha) return Promise.resolve();
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

// Set commonBaseURL synchronously so any SDK call hits the BFF host (even if
// the session cookie isn't there yet — those calls will wait via the fetch
// wrapper installed below).
if (BFF_URL && !window.__DEMO_BFF_PROXY_READY__) {
    TomTomConfig.instance.put({ apiKey: '', commonBaseURL: `${BFF_URL}/api` });
}

// Capture the original fetch BEFORE we wrap it, so our own /session POST
// doesn't recursively wait on the very promise it's resolving.
const originalFetch = window.fetch.bind(window);

// Check whether a previous example already established a valid session for
// this docs.tomtom.com top-level partition. Cookie is HttpOnly so JS can't
// read it directly; the BFF's /session/status returns 204 if it's still valid.
// Saves a full hCaptcha+POST round-trip on every subsequent example load.
// Returns the session's remaining lifetime in seconds, or null if there is no
// usable session.
const expiresInSeconds = (resp: Response): number | null => {
    const seconds = Number(resp.headers.get('X-Session-Expires-In'));
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

const checkExistingSession = async (): Promise<number | null> => {
    try {
        const resp = await originalFetch(`${BFF_URL}/session/status`, { credentials: 'include' });
        return resp.status === 204 ? expiresInSeconds(resp) : null;
    } catch {
        return null;
    }
};

// Session-expiry bookkeeping. MapLibre fetches tiles from web workers, whose
// global fetch the wrapper below cannot reach — a worker getting 401s after
// the session expires has no recovery path of its own. Instead of reacting to
// those 401s, the maps SDK's transformRequest (which MapLibre awaits on the
// MAIN thread before handing each request to a worker) calls the
// ensureFreshSession hook exposed at the bottom of this file: when the cookie
// is within the renewal margin of expiring it gets re-minted BEFORE the
// request goes out, so workers always send a live cookie.
const SESSION_RENEWAL_MARGIN_MS = 60_000;
const DEFAULT_SESSION_TTL_S = 600;
let sessionExpiresAtMs = 0;

const recordSessionExpiry = (expiresInSeconds: number): void => {
    sessionExpiresAtMs = Date.now() + expiresInSeconds * 1000;
};

const bootstrap = async (): Promise<void> => {
    if (!BFF_URL || !SITEKEY) return;
    if (window.__DEMO_BFF_PROXY_READY__) return;

    // Only adopt an existing session if it has MORE life left than the
    // renewal margin. Adopting a dying one would record an expiry that is
    // still inside the margin, so every subsequent ensureFreshSession call
    // would "refresh" again — status-check spam (one 204 per map request)
    // until the cookie truly expires. Falling through mints a fresh one now.
    const remainingSeconds = await checkExistingSession();
    if (remainingSeconds !== null && remainingSeconds * 1000 > SESSION_RENEWAL_MARGIN_MS) {
        window.__DEMO_BFF_PROXY_READY__ = true;
        recordSessionExpiry(remainingSeconds);
        return;
    }

    await loadHCaptchaScript();
    const hcaptcha = window.hcaptcha;
    if (!hcaptcha) throw new Error('hCaptcha API not available after script load');

    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    let token: string;
    try {
        const widgetId = hcaptcha.render(container, { sitekey: SITEKEY, size: 'invisible' });
        ({ response: token } = await hcaptcha.execute(widgetId, { async: true }));
    } finally {
        // The widget is only needed to mint one token; drop its host node so
        // repeated bootstraps (hot reloads, example switches) don't accumulate
        // hidden divs on document.body.
        container.remove();
    }

    const sessionResponse = await originalFetch(`${BFF_URL}/session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hcaptchaToken: token }),
    });
    if (!sessionResponse.ok) {
        const body = await sessionResponse.text().catch(() => '');
        throw new Error(`Demo-BFF /session returned ${sessionResponse.status}: ${body}`);
    }
    window.__DEMO_BFF_PROXY_READY__ = true;
    recordSessionExpiry(expiresInSeconds(sessionResponse) ?? DEFAULT_SESSION_TTL_S);
};

let sessionReady = bootstrap().catch((err) => {
    console.error('Demo-BFF bootstrap failed:', err);
});

// The session cookie expires after the hCaptcha TTL (10 min in prod), so it
// gets re-minted by re-running the bootstrap — proactively via
// ensureFreshSession, or reactively when a main-thread call still hits a 401.
// The generation counter makes the refresh single-flight: when a burst of
// requests needs a renewal at the same moment, only the first triggers a new
// hCaptcha + POST /session — the rest await the same refresh.
let sessionGeneration = 0;

const refreshSession = (observedGeneration: number): Promise<void> => {
    if (observedGeneration === sessionGeneration) {
        sessionGeneration++;
        window.__DEMO_BFF_PROXY_READY__ = false;
        sessionReady = bootstrap().catch((err) => {
            console.error('Demo-BFF session refresh failed:', err);
        });
    }
    return sessionReady;
};

const isBffRequest = (input: RequestInfo | URL): boolean => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return url.startsWith(BFF_URL);
};

// A consumed stream body can't be replayed; anything else (string, Blob,
// ArrayBuffer, URLSearchParams, undefined) is safe to send again.
const isRetryable = (init?: RequestInit): boolean =>
    init?.body == null || typeof init.body !== 'object' || !('getReader' in init.body);

// The single "session is fresh" gate. Resolves once the session cookie
// exists and isn't about to expire: while it has >60s of life left this is
// one timestamp comparison; within the margin it re-mints first, so requests
// leave with a live cookie. Capturing the generation BEFORE awaiting
// sessionReady makes a burst of callers join one in-flight refresh instead
// of each solving their own hCaptcha.
const ensureFreshSession = async (): Promise<void> => {
    const observedGeneration = sessionGeneration;
    await sessionReady;
    if (Date.now() < sessionExpiresAtMs - SESSION_RENEWAL_MARGIN_MS) return;
    await refreshSession(observedGeneration);
};

if (BFF_URL && SITEKEY) {
    // Wrap fetch so every main-thread call (SDK service fetches, MapLibre
    // style/sprite/glyph loads, AI SDK requests) goes out with a fresh
    // session, with a single re-mint + retry as backstop if the BFF still
    // answers 401. The bootstrap's own originalFetch calls bypass this.
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const observedGeneration = sessionGeneration;
        await ensureFreshSession();
        const response = await originalFetch(input, init);
        if (response.status !== 401 || !isBffRequest(input) || !isRetryable(init)) {
            return response;
        }
        await refreshSession(observedGeneration);
        return originalFetch(input, init);
    };

    // MapLibre's tile fetches run in web workers, out of the wrapper's reach;
    // the maps SDK awaits this hook (via transformRequest, on the main
    // thread) before each map request is dispatched to them.
    window.__DEMO_BFF_ENSURE_SESSION__ = ensureFreshSession;
}
