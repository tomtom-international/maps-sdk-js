/**
 * @module agent-toolkit-tools
 *
 * Pure (DOM-free) building blocks for the iframe-worker sandbox executor: the
 * worker IIFE source assembly and the arg-partitioning that decides which
 * injected parameters are cloneable DATA (posted into the worker) versus
 * worker-provided LIB namespaces (`turf` / `h3` / `routeUtils` / `log`). Kept
 * separate from the DOM harness so it can be unit-tested without a browser.
 */

import { sandboxedGlobalShadows, WORKER_PROVIDED_PARAMS } from '../sandbox-code';

/** RPC request posted into the iframe → worker. @ignore */
export type SandboxRunRequest = {
    type: 'run';
    id: number;
    code: string;
    paramNames: readonly string[];
    /** Cloneable values for the non-lib params, keyed by their index in `paramNames`. */
    dataByIndex: Record<number, unknown>;
};

/** RPC response posted back from the worker → iframe → parent. @ignore */
export type SandboxRunResponse =
    | { type: 'result'; id: number; ok: true; value: unknown }
    | { type: 'result'; id: number; ok: false; errorMessage: string };

/**
 * Split sandbox call args into the cloneable DATA values (to be posted into the
 * worker) and drop the worker-provided lib args. Returns `dataByIndex` keyed by
 * position so the worker can reconstruct the full positional argument list,
 * filling lib positions from its own globals.
 *
 * @ignore
 */
export const partitionSandboxArgs = (
    paramNames: readonly string[],
    args: readonly unknown[],
): { dataByIndex: Record<number, unknown> } => {
    const provided = new Set<string>(WORKER_PROVIDED_PARAMS);
    const dataByIndex: Record<number, unknown> = {};
    for (let index = 0; index < paramNames.length; index++) {
        if (!provided.has(paramNames[index])) dataByIndex[index] = args[index];
    }
    return { dataByIndex };
};

// The worker's message loop, as a string injected into the blob worker. It is
// concatenated AFTER the library UMD source (which defines `self.turf` / `self.h3`).
// Each `run` message compiles a fresh AsyncFunction — no user state leaks between
// calls (the "reset between calls" guarantee; the worker itself stays warm).
const WORKER_RUNTIME_BODY = `
(function () {
  var SHADOWS = ${JSON.stringify([...sandboxedGlobalShadows])};
  var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  var provided = {
    turf: function () { return self.turf; },
    h3: function () { return self.h3; },
    routeUtils: function () { return self.routeUtils; },
    cluster: function () { return self.cluster; },
    log: function () { return function () {}; },
  };
  self.onmessage = function (event) {
    var msg = event.data;
    if (!msg || msg.type !== 'run') return;
    var id = msg.id;
    try {
      var paramNames = msg.paramNames || [];
      var dataByIndex = msg.dataByIndex || {};
      var shadows = SHADOWS.filter(function (n) { return paramNames.indexOf(n) === -1; });
      var argValues = paramNames.map(function (name, index) {
        return Object.prototype.hasOwnProperty.call(provided, name) ? provided[name]() : dataByIndex[index];
      });
      var fn = AsyncFunction.apply(null, paramNames.concat(shadows).concat([msg.code]));
      Promise.resolve(fn.apply(null, argValues.concat(shadows.map(function () { return undefined; }))))
        .then(function (value) {
          try {
            self.postMessage({ type: 'result', id: id, ok: true, value: value });
          } catch (postError) {
            self.postMessage({ type: 'result', id: id, ok: false, errorMessage: String((postError && postError.message) || postError) });
          }
        })
        .catch(function (runError) {
          self.postMessage({ type: 'result', id: id, ok: false, errorMessage: String((runError && runError.message) || runError) });
        });
    } catch (compileError) {
      self.postMessage({ type: 'result', id: id, ok: false, errorMessage: String((compileError && compileError.message) || compileError) });
    }
  };
  self.postMessage({ type: 'ready' });
})();
`;

/**
 * Assemble the full self-contained worker source: the consumer-provided library
 * UMD source (which must define `self.turf` and `self.h3`) followed by the
 * message loop. The result is a single string a blob worker can run with no
 * network access — the Option B "portable, self-contained string" shape.
 *
 * @ignore
 */
export const assembleWorkerSource = (librarySource: string): string => `${librarySource}\n;${WORKER_RUNTIME_BODY}`;
