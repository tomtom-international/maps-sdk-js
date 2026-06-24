/**
 * @module agent-toolkit-tools
 *
 * iframe-worker sandbox executor (Phase 3, first implementation).
 *
 * Runs analyse/process code in a **Web Worker hosted inside a sandboxed,
 * opaque-origin iframe**, so the code cannot reach the parent's DOM / storage
 * (opaque origin), cannot make network requests (CSP `default-src 'none'`), and
 * can be terminated on timeout (worker). The iframe is long-lived; the worker
 * stays warm and each call runs in a fresh function scope (reset between calls);
 * a timed-out call terminates and respawns the worker.
 *
 * Component layout (data crosses each hop via postMessage + structuredClone):
 *
 *   main thread                 opaque-origin iframe (CSP default-src 'none')
 *   ───────────                 ─────────────────────────────────────────────
 *   runSandboxedFn
 *     → IframeWorkerExecutor ──post──▶ bootstrap (owns worker, relays messages)
 *                                        └──post──▶ Web Worker (Blob URL)
 *                                             worker-libs: self.turf/h3/routeUtils
 *                                             worker-runtime: new AsyncFunction(…)
 *     ◀── {ok,value} | {error} ◀──post────────────  ← structuredClone(result)
 *     (timeout → terminate + respawn worker)
 *
 * The user-facing version of this diagram (with the threat→boundary mapping) lives
 * in the code-generation guide's "How the pieces fit" section.
 *
 * SECURITY STATUS: this is a FIRST IMPLEMENTATION. The isolation depends on
 * real-browser behaviour (CSP enforcement, opaque-origin iframes, Worker
 * termination) that the unit-test environment cannot verify — the `e2e-tests/`
 * Playwright suite exercises exactly those properties in real Chromium. When the
 * environment lacks the needed APIs, or no worker library source is supplied, it
 * falls back (loudly) to the main-thread executor.
 */

import type { CodeExecutionConfig } from '../../../types';
import { formatSandboxExecutionError, mainThreadExecutor, type SandboxExecutor } from '../sandbox-code';
import {
    assembleWorkerSource,
    partitionSandboxArgs,
    type SandboxRunRequest,
    type SandboxRunResponse,
} from './worker-runtime';

/** Default wall-clock budget for one isolated sandbox run. @ignore */
export const DEFAULT_SANDBOX_TIMEOUT_MS = 10_000;

// How long to wait for the iframe + worker to come up before declaring the
// isolated path unavailable and falling back. Keeps tests / SSR from hanging.
const INIT_TIMEOUT_MS = 2_000;

// CSP for the sandbox document: no network/DOM egress (`default-src 'none'`),
// inline bootstrap script allowed, `'unsafe-eval'` so the worker's AsyncFunction
// compiles, and `blob:` so the worker can be spawned from a Blob URL. The worker
// inherits this policy — so it, too, cannot reach the network.
const SANDBOX_CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:";

// Bootstrap that runs inside the opaque-origin iframe: it owns the worker and
// relays messages between the parent and the worker. Kept tiny — all sandbox
// logic lives in the worker source assembled on the parent.
const IFRAME_BOOTSTRAP = `
(function () {
  var worker = null, workerSource = null;
  function spawn() {
    var blob = new Blob([workerSource], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = function (e) { parent.postMessage(e.data, '*'); };
    // A worker-level error (e.g. the library source or AsyncFunction eval throwing on
    // load) isn't tied to one run id — relay it as a distinct signal so the parent can
    // fail the in-flight calls with a real message instead of letting them time out.
    worker.onerror = function (e) {
      var detail = e && e.message ? (e.message + (e.filename ? ' @ ' + e.filename + ':' + e.lineno : '')) : String(e);
      parent.postMessage({ type: 'worker-error', errorMessage: detail }, '*');
    };
  }
  window.addEventListener('message', function (ev) {
    var msg = ev.data || {};
    if (msg.type === 'init') { workerSource = msg.workerSource; spawn(); parent.postMessage({ type: 'iframe-ready' }, '*'); return; }
    if (msg.type === 'run' && worker) { worker.postMessage(msg); return; }
    if (msg.type === 'terminate' && worker) { try { worker.terminate(); } catch (_e) {} spawn(); return; }
  });
  parent.postMessage({ type: 'bootstrap-ready' }, '*');
})();
`;

const buildSrcdoc = (): string =>
    `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}"></head>` +
    `<body><script>${IFRAME_BOOTSTRAP}</script></body></html>`;

type Pending = {
    resolve: (r: { value: unknown } | { error: string }) => void;
    verb: string;
    timer: ReturnType<typeof setTimeout>;
};

// Minimal browser-API surface the harness needs — feature-detected so the module
// stays importable in Node / SSR (where it simply falls back to main-thread).
const hasBrowserSandboxApis = (): boolean =>
    typeof document !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof Blob !== 'undefined';

type IframeWorkerOptions = {
    timeoutMs: number;
    /**
     * Returns the UMD source defining `self.turf` / `self.h3`. Defaults to the SDK's bundled
     * libs via {@link defaultLoadLibrarySource}; `resolveSandboxExecutor` always supplies one.
     */
    loadLibrarySource?: () => string | Promise<string>;
};

// Zero-config default: lazily load the SDK's own inlined turf + h3 UMD (a separate
// chunk, so it never bloats the main bundle). Consumers can override via
// `codeExecution.loadWorkerLibrarySource` to supply their own.
const defaultLoadLibrarySource = (): Promise<string> =>
    import('./worker-libs').then((module) => module.sandboxLibrarySource);

// Create an iframe-worker SandboxExecutor. Falls back to the main-thread executor
// (with a one-time warning) when the browser APIs or a library source are
// unavailable, so callers can use it unconditionally. Internal — reached via
// `resolveSandboxExecutor`.
const createIframeWorkerExecutor = (options: IframeWorkerOptions): SandboxExecutor => {
    let iframe: HTMLIFrameElement | null = null;
    let ready: Promise<boolean> | null = null;
    let unavailable = false;
    let warned = false;
    let nextId = 1;
    const pending = new Map<number, Pending>();

    const warnFallback = (reason: string): void => {
        if (warned) return;
        warned = true;
        // Surfacing a security-relevant fallback is intentional (not silent).
        console.warn(
            `[agent-toolkit] iframe-worker sandbox unavailable (${reason}); falling back to main-thread execution (NOT isolated).`,
        );
    };

    // Post a message into the sandbox iframe. The frame is opaque-origin (sandbox
    // without allow-same-origin), so it has NO addressable origin — `'*'` is the only
    // valid `targetOrigin` and a specific one is impossible by design. Safety comes
    // from the receiving side instead, which validates `event.source`. Centralised so
    // the unavoidable wildcard lives (and is justified) in exactly one place.
    const postToFrame = (message: unknown): void => {
        iframe?.contentWindow?.postMessage(message, '*'); // NOSONAR(typescript:S2819) — opaque-origin frame, '*' required
    };

    const onMessage = (event: MessageEvent): void => {
        if (event.source !== iframe?.contentWindow) return;
        const data = event.data as { type?: string; errorMessage?: string } | undefined;
        // A worker-level error isn't tied to one run id (it usually means the worker
        // crashed on load) — fail every in-flight call with it rather than time out.
        if (data?.type === 'worker-error') {
            const message = data.errorMessage ?? 'worker error';
            for (const [id, entry] of pending) {
                clearTimeout(entry.timer);
                entry.resolve({ error: formatSandboxExecutionError(entry.verb, message) });
                pending.delete(id);
            }
            return;
        }
        if (data?.type !== 'result') return;
        const response = data as SandboxRunResponse;
        const entry = pending.get(response.id);
        if (!entry) return;
        pending.delete(response.id);
        clearTimeout(entry.timer);
        entry.resolve(
            response.ok
                ? { value: response.value }
                : { error: formatSandboxExecutionError(entry.verb, response.errorMessage) },
        );
    };

    // Wait for a one-off signal type from the iframe, with an init timeout.
    const waitForSignal = (signal: string): Promise<void> =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                globalThis.removeEventListener('message', handler);
                reject(new Error(`timed out waiting for "${signal}"`));
            }, INIT_TIMEOUT_MS);
            const handler = (event: MessageEvent): void => {
                if (event.source === iframe?.contentWindow && (event.data as { type?: string })?.type === signal) {
                    clearTimeout(timer);
                    globalThis.removeEventListener('message', handler);
                    resolve();
                }
            };
            globalThis.addEventListener('message', handler);
        });

    const init = async (): Promise<boolean> => {
        if (!hasBrowserSandboxApis()) {
            warnFallback('browser APIs missing');
            return false;
        }
        if (!options.loadLibrarySource) {
            warnFallback('no worker library source configured (codeExecution.loadWorkerLibrarySource)');
            return false;
        }
        try {
            const frame = document.createElement('iframe');
            frame.setAttribute('sandbox', 'allow-scripts'); // NO allow-same-origin → opaque origin
            frame.setAttribute('aria-hidden', 'true');
            frame.style.display = 'none';
            frame.srcdoc = buildSrcdoc();
            iframe = frame;
            const bootstrapReady = waitForSignal('bootstrap-ready');
            document.body.appendChild(frame);
            await bootstrapReady;

            const librarySource = await options.loadLibrarySource();
            const workerSource = assembleWorkerSource(librarySource);
            const iframeReady = waitForSignal('iframe-ready');
            postToFrame({ type: 'init', workerSource });
            await iframeReady;

            globalThis.addEventListener('message', onMessage);
            return true;
        } catch (error) {
            warnFallback(error instanceof Error ? error.message : String(error));
            iframe?.remove();
            iframe = null;
            return false;
        }
    };

    const ensureReady = (): Promise<boolean> => {
        if (unavailable) return Promise.resolve(false);
        ready ??= init().then((ok) => {
            if (!ok) unavailable = true;
            return ok;
        });
        return ready;
    };

    const run: SandboxExecutor['run'] = async (code, paramNames, args, verb) => {
        const ok = await ensureReady();
        if (!ok || !iframe) return mainThreadExecutor.run(code, paramNames, args, verb);

        const id = nextId++;
        const { dataByIndex } = partitionSandboxArgs(paramNames, args);
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                pending.delete(id);
                // Kill the runaway worker and respawn it so later calls still work.
                postToFrame({ type: 'terminate' });
                resolve({
                    error: formatSandboxExecutionError(
                        verb,
                        new Error(
                            `code execution exceeded the ${options.timeoutMs}ms sandbox timeout and was terminated`,
                        ),
                    ),
                });
            }, options.timeoutMs);
            pending.set(id, { resolve: resolve as Pending['resolve'], verb, timer });
            try {
                const request: SandboxRunRequest = { type: 'run', id, code, paramNames: [...paramNames], dataByIndex };
                postToFrame(request);
            } catch (error) {
                clearTimeout(timer);
                pending.delete(id);
                // A non-cloneable data arg (shouldn't happen — inputs are JSON) — report cleanly.
                resolve({ error: formatSandboxExecutionError(verb, error) });
            }
        });
    };

    const destroy = (): void => {
        if (globalThis.window !== undefined) globalThis.removeEventListener('message', onMessage);
        for (const entry of pending.values()) clearTimeout(entry.timer);
        pending.clear();
        iframe?.remove();
        iframe = null;
    };

    return { run, destroy };
};

/**
 * Resolve a {@link CodeExecutionConfig} to a concrete {@link SandboxExecutor}.
 *
 * Selection is **env-based, not configurable**: the browser always isolates in an
 * iframe-worker; Node / SSR always runs on the main thread. The browser boundary is
 * the iframe's opaque origin + CSP egress-block (plus worker termination); none of
 * that exists in Node, where a `worker_thread` would add only termination while
 * exposing `fs` / `net` / `child_process` — isolated in name only — so we don't spin
 * one up there. (If the iframe fails to initialise at runtime in the browser, the
 * executor itself falls back to the main thread with a warning.)
 *
 * @ignore
 */
export const resolveSandboxExecutor = (config?: CodeExecutionConfig): SandboxExecutor => {
    if (!hasBrowserSandboxApis()) return mainThreadExecutor;
    return createIframeWorkerExecutor({
        timeoutMs: config?.timeoutMs ?? DEFAULT_SANDBOX_TIMEOUT_MS,
        // Zero-config: fall back to the SDK's bundled turf/h3 when the consumer
        // doesn't supply its own worker library source.
        loadLibrarySource: config?.loadWorkerLibrarySource ?? defaultLoadLibrarySource,
    });
};
