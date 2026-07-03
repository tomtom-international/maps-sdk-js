/**
 * @module agent-toolkit-tools
 */

import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { ChartConfiguration } from 'chart.js';

export type AnalysisOutputFormat = 'json' | 'chart';

// Sandboxed `new AsyncFunction` bodies take `places`, `h3`, `turf` as injected
// parameters, but LLMs regularly prepend `const turf = require('@turf/turf')`
// or `const h3 = require('h3-js')` out of habit — producing a parse-time
// "Identifier 'X' has already been declared" error before the body even runs.
// We defensively strip those redeclarations.
//
// Critical: only strip when the RHS is a `require(...)`/`import(...)` call.
// A naive name-only filter would also nuke legitimate user variables that
// happen to share a name with an injected one (e.g. `const geometriesByEntry =
// Object.values(placesByEntry).map(...)`), corrupting the body and yielding a far
// less actionable "Illegal return statement" error downstream.
/**
 * Compact sandbox-code blurb shared by `process-places`, `process-geometries`,
 * `analyse-places`, `analyse-geometries`, and `analyse-routes`. Keeps the
 * "what's in scope / what's forbidden" rules short and consistent across all
 * code-generation tools so the LLM is prompted the same way each time. Pass
 * the names of the injected identifiers (the params the AsyncFunction body
 * receives) so the rule reads naturally for each tool.
 *
 * @ignore
 */
export const buildSandboxCodePrompt = (injected: readonly string[]): string => {
    const injectedList = injected.map((name) => `\`${name}\``).join(', ');
    return (
        `In scope: ${injectedList} — injected as named parameters; use them directly. ` +
        'Do NOT redeclare them or read them off `arguments`: lines like `const turf = arguments.turf` / ' +
        '`const turf = arguments[0].turf` / `const placesByEntry = arguments.placesByEntry` throw ' +
        '"Identifier \'…\' has already been declared". The body has no `arguments`-based access — reference each name as-is. ' +
        'No `require` / `import` / `await import` (body is an AsyncFunction, not a module — such lines are stripped silently). ' +
        '`h3` = h3-js (hex math). `turf` = @turf/turf v7 (verify names at https://turfjs.org/docs/). ' +
        'INPUTS are `<kind>ByEntry` records keyed by entry id — get a value out first: one entry ' +
        '`placesByEntry[id]` (a FeatureCollection) / `incidentsByEntry[id]` (an array), or all entries ' +
        '`Object.values(placesByEntry).flatMap(fc => fc.features)` / `Object.values(incidentsByEntry).flat()`. ' +
        'TURF INPUTS: pass a Feature or FeatureCollection — never a bare Array (throws "Unknown Geometry Type"). ' +
        'FeatureCollection values (`placesByEntry[id]`, `routesByEntry[id]`, `trafficAreaAnalyticsByEntry[id]`, ' +
        '`byodByEntry[id]`) → pass directly: `turf.bbox(placesByEntry[id])`. ' +
        'Array values (`incidentsByEntry[id]`, `geometriesByEntry[key]`, `…features`, merged `Object.values(...)`) → ' +
        'iterate per-feature (`for (const f of incidentsByEntry[id]) turf.X(f)`) or wrap with `turf.featureCollection([...])`. ' +
        'Never `.map(f => f.geometry.coordinates)` / `.flatMap(f => f.geometry.coordinates)` to feed turf — ' +
        'that strips the feature wrapper turf reads and throws "coordinates must be an Array" (or worse, mixes ' +
        'Point/LineString shapes silently). Pass the whole feature and let turf read the geometry: ' +
        '`turf.pointToLineDistance(point, lineFeature, { units: "meters" })`. `incidentsByEntry[id]` mixes Point + ' +
        'LineString features — guard with `if (inc.geometry.type === "LineString")` before line-only ops. ' +
        'TURF v7 SET OPS: `union`/`intersect`/`difference` take ONE FeatureCollection — ' +
        '`turf.difference(turf.featureCollection([outer, inner]))`. The v6 two-arg form throws. ' +
        'PERF: for large-N nearest/within queries, pre-bucket points with ' +
        '`h3.latLngToCell(lat, lng, res)` + `h3.gridDisk(cell, k)` and only run turf on same-/neighbour-cell ' +
        'pairs — turns O(N·M) into ~O(N+M). Pick `res` so each cell ≈ your query radius. ' +
        'No spatial search or HTTP — call `discoverPlaces` BEFORE this tool for new places. ' +
        'Top-level `await`/locals/consts fine. End with `return …;`.'
    );
};

/** Chart.js chart types accepted by the analyse-* tools when `outputFormat: "chart"`. */
export const CHART_TYPES = new Set(['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble']);

/** Lightweight structural check that a sandbox return value is a Chart.js config. */
export const isChartConfiguration = (value: unknown): value is ChartConfiguration => {
    if (!value || typeof value !== 'object') return false;
    const v = value as { type?: unknown; data?: unknown };
    return typeof v.type === 'string' && CHART_TYPES.has(v.type) && typeof v.data === 'object' && v.data !== null;
};

/**
 * GeoJSON Feature with a Polygon or MultiPolygon geometry. Generic over
 * `properties` so callers that need a narrower property shape (e.g. place
 * footprints with `CommonPlaceProps`) get the typed result without a cast.
 *
 * @ignore
 */
export const isPolygonFeature = <P = unknown>(value: unknown): value is PolygonFeature<P> => {
    if (!value || typeof value !== 'object') return false;
    const v = value as { type?: unknown; geometry?: unknown };
    if (v.type !== 'Feature') return false;
    const g = v.geometry as { type?: unknown; coordinates?: unknown } | undefined;
    return !!g && (g.type === 'Polygon' || g.type === 'MultiPolygon') && Array.isArray(g.coordinates);
};

/** @ignore */
export const isPolygonFeatureArray = <P = unknown>(value: unknown): value is PolygonFeature<P>[] =>
    Array.isArray(value) && value.every(isPolygonFeature);

/** Shared `describe()` text for the analyse-* `outputFormat` enum field. */
export const ANALYSE_OUTPUT_FORMAT_DESCRIPTION =
    'Shape of the returned value (default: "json"). ' +
    '`json` — compact JSON-serializable object for text display. ' +
    '`chart` — Chart.js `ChartConfiguration` rendered via chart.js in the chat UI. ' +
    'Pick `chart` whenever the user asks for a "chart", "graph", "plot", "histogram", "bar/pie/line chart", etc.';

/**
 * Builds the shared "return value" blurb for the analyse-* tools' `code` field.
 * Encodes the JSON-only contract, the Chart.js config shape, and the
 * `string[]`-label workaround for tooltip-callback use cases.
 *
 * @param jsonExamples Comma-separated examples of typical `json`-shape outputs
 *   for the specific tool (e.g. "counts, groupings, hex bins, centroids").
 * @param chartLabelExample Optional inline code snippet illustrating a
 *   multi-line `string[]` label using the tool's domain. Omitted when empty.
 */
export const buildAnalyseReturnPrompt = (jsonExamples: string, chartLabelExample = ''): string => {
    const example = chartLabelExample ? ` (e.g. ${chartLabelExample})` : '';
    return (
        'Return value MUST be pure JSON — plain objects, arrays, strings, numbers, booleans, null. No functions, no classes, no DOM/Map refs (it crosses a JSON boundary). Keep it small for chat display.\n' +
        `• \`json\` (default) — compact object (${jsonExamples}, …).\n` +
        '• `chart` — Chart.js config: `{ type: "bar"|"line"|"pie"|"doughnut"|"radar"|"polarArea"|"scatter"|"bubble", data: { labels: (string | string[])[], datasets }, options? }`. ' +
        `For per-point detail you would normally put in a \`tooltip.callbacks\` function, use a \`string[]\` label — Chart.js renders it multi-line on the axis tick AND in the tooltip title${example}.`
    );
};

// Sandbox return values cross the AI SDK's `jsonValueSchema` boundary as part
// of the tool-result message. That schema accepts `null` but NOT `undefined`,
// so user code that produces sparse arrays (`arr[i] = v` skipping indices),
// `NaN`, `Infinity`, or `undefined` object values silently looks JSON-fine
// (those serialize to `null`/get dropped) yet poisons every subsequent turn —
// the next prompt fails ModelMessage validation with no obvious culprit.
// Round-tripping through `JSON.stringify`/`JSON.parse` normalizes every one of
// those cases before the value leaves the tool. Circular refs (the only thing
// `stringify` throws on) are surfaced as a clear LLM-facing error instead.
/**
 * Validates the value returned by analyse-* sandboxed code: rejects
 * `undefined`, JSON-normalizes via `toJsonSafe`, and — when
 * `outputFormat: "chart"` — checks the result is a Chart.js
 * `ChartConfiguration`. Centralises the contract shared by analyse-places,
 * analyse-routes, and analyse-geometries.
 *
 * @ignore
 */
export const validateAnalysisResult = (
    analysis: unknown,
    outputFormat: AnalysisOutputFormat,
): { value: unknown } | { error: string } => {
    if (analysis === undefined) {
        return {
            error:
                'Analysis code must return a value (the aggregation result). ' +
                'Hint: `code` is the function BODY, not a function expression. If you wrote ' +
                '`(args) => { ...; return result; }` (or `async (args) => { ... }`) as the whole code, ' +
                'the arrow is created and discarded — drop the wrapper and have the body itself end with `return result;`.',
        };
    }

    const normalized = toJsonSafe(analysis);
    if ('error' in normalized) return { error: normalized.error };

    if (outputFormat === 'chart' && !isChartConfiguration(normalized.value)) {
        return {
            error:
                'Analysis code with `outputFormat: "chart"` must return a Chart.js ChartConfiguration ' +
                '({ type: "bar"|"line"|"pie"|"doughnut"|"radar"|"polarArea"|"scatter"|"bubble", data: { labels, datasets }, options? }).',
        };
    }

    return { value: normalized.value };
};

const toJsonSafe = (value: unknown): { value: unknown } | { error: string } => {
    try {
        // JSON round-trip, NOT structuredClone: this must COERCE to a JSON-safe value
        // (drop `undefined`, `NaN`/`Infinity` → `null`, Date → ISO string, throw on
        // circular) before it crosses the AI SDK's `jsonValueSchema` boundary.
        // `structuredClone` faithfully preserves those non-JSON values, which then
        // poison later ModelMessage validation — see the note above this function.
        return { value: JSON.parse(JSON.stringify(value)) };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            error:
                `Returned value is not JSON-serializable: ${message}. ` +
                'Return only plain objects, arrays, strings, numbers, booleans, and null — ' +
                'no functions, classes, circular references, or DOM/Map references.',
        };
    }
};

// Globals shadowed to `undefined` inside every sandbox body. LLM-authored code
// has no legitimate need for network / storage / DOM / global reaches: the data
// it works on is injected, and the only libraries it needs (`h3`, `turf`,
// `routeUtils`) are injected too. Binding these names as `undefined` parameters
// turns a stray `fetch(...)` / `localStorage.getItem(...)` into a loud
// "fetch is not a function" instead of a silent exfiltration or browser-state
// mutation.
//
// `process` matters specifically for the Node main-thread path (the `'auto'`
// default on the server): it is a direct global there and the first hop toward
// `child_process` → RCE. Harmless to shadow in the browser (no such global).
//
// This is a TRIPWIRE, not a security boundary. The same capabilities stay
// reachable via constructor walks (`({}).constructor.constructor`) and other
// realm escapes, so it raises the bar and surfaces accidents — it does not
// contain a determined attacker. True isolation is a separate concern (running
// these tools off the main thread in a locked-down realm).
//
// Only valid, non-reserved identifiers are listed: `eval` / `arguments` are
// illegal as strict-mode parameter names, and `Function` is omitted because it
// is trivially reachable through any constructor — shadowing it would be theatre.
const SHADOWED_GLOBALS = [
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'EventSource',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'document',
    'window',
    'globalThis',
    'self',
    'navigator',
    'importScripts',
    'process',
] as const;

// Exported so the iframe-worker executor (and any future executor) can re-apply the
// exact same shadowing inside its own realm, keeping behaviour identical across executors.
/** @ignore */
export const sandboxedGlobalShadows = SHADOWED_GLOBALS;

// Injected parameter names the worker supplies itself rather than receiving over
// `postMessage`: `turf` / `h3` are function namespaces (not cloneable), `routeUtils`
// is the route-helper namespace (bundled into the worker as `self.routeUtils`; shared
// by analyseData + processData), and `log` (monitor path) is a no-op in the worker.
// Two consumers share this one list:
//   • the iframe-worker executor partitions these OUT of the data it posts and the
//     worker re-provides them from its own globals;
//   • the main-thread executor skips them when deep-copying inputs (`structuredClone`
//     throws on the function namespaces).
// Defined here (the core module) so both share one source of truth without an import
// cycle. `now` (monitor clock, a Date) is intentionally absent: it is cloneable, so
// the main-thread copy harmlessly clones it, and the monitor path never routes
// through the worker — keeping this list exactly the set the worker re-provides.
/** @ignore */
export const WORKER_PROVIDED_PARAMS = ['turf', 'h3', 'routeUtils', 'log', 'cluster'] as const;

/**
 * Pluggable strategy for executing sandbox code. The default
 * {@link mainThreadExecutor} compiles + runs in the host realm; an alternative
 * executor (e.g. the iframe-worker one) can run the same code in a locked-down
 * realm off the main thread while honouring this exact contract.
 *
 * `run` MUST resolve to `{ value }` or `{ error }` and never reject — execution
 * failures are reported as `{ error }` via {@link formatSandboxExecutionError}.
 *
 * @group Agent Toolkit
 */
export type SandboxExecutor = {
    run<Result = unknown>(
        code: string,
        paramNames: readonly string[],
        args: readonly unknown[],
        verb: string,
    ): Promise<{ value: Result } | { error: string }>;
    /** Release any held resources (iframe / worker). No-op for the main-thread executor. */
    destroy?(): void;
};

// Deep-copy a single sandbox arg before it crosses into LLM-authored code, UNLESS it
// is a library namespace (which `structuredClone` would throw on) or `undefined`. The
// merged / per-entry data views are shallow — their feature objects are the SAME
// references held in the entry slices — so without this copy a sandbox body could
// mutate live app state in place (`placesByEntry[id].features[0].properties = …`). We copy rather
// than freeze so legitimate in-place work (`placesByEntry[id].features.sort(...)`) still succeeds
// on the throwaway copy.
//
// This clone lives in the MAIN-THREAD executor only: the iframe-worker executor gets a
// copy for free because `postMessage` structured-clones every data arg across the
// worker boundary. Cloning here too would be redundant double-work — so callers
// (`packSandboxArgs`, the monitor path) now pass live references and let each executor
// copy exactly once, only where needed.
const cloneDataArg = (value: unknown, name: string): unknown =>
    value === undefined || (WORKER_PROVIDED_PARAMS as readonly string[]).includes(name)
        ? value
        : structuredClone(value);

// Compile `code` as the body of an async function taking `paramNames` (+ the shadowed
// globals as trailing `undefined` params) and run it with deep-copied `args`.
const compileAndRun = async <Result>(
    code: string,
    paramNames: readonly string[],
    args: readonly unknown[],
    verb: string,
): Promise<{ value: Result } | { error: string }> => {
    try {
        const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
            ...names: string[]
        ) => (...callArgs: unknown[]) => Promise<Result> | Result;
        // NOTE: `code` arrives already sanitised — `runSandboxedFn` strips injected
        // redeclarations once, before dispatching to any executor, so the iframe-worker
        // realm gets the same treatment. (The worker compiles `code` verbatim too.)
        // Never shadow a name the caller legitimately injects — that would add a
        // duplicate formal parameter and clobber the real value with `undefined`.
        const shadows = SHADOWED_GLOBALS.filter((name) => !paramNames.includes(name));
        // Deep-copy the data inputs so the body can mutate them in place without
        // corrupting live state; library namespaces and undefined pass through.
        const clonedArgs = args.map((value, index) => cloneDataArg(value, paramNames[index]));
        // Caller args stay first so they line up positionally with `paramNames`;
        // the shadow `undefined`s fill the appended slots.
        const fn = new AsyncFunction(...paramNames, ...shadows, code);
        return { value: await fn(...clonedArgs, ...shadows.map(() => undefined)) };
    } catch (error) {
        return { error: formatSandboxExecutionError(verb, error) };
    }
};

/**
 * Default executor for Node/SSR (and the in-browser fallback): compiles + runs the
 * code synchronously in the host realm. Deep-copies data inputs (see
 * {@link cloneDataArg}) so the body can't mutate live state, but provides no isolation
 * beyond the global shadowing — see {@link SHADOWED_GLOBALS}.
 *
 * @ignore
 */
export const mainThreadExecutor: SandboxExecutor = {
    run: compileAndRun,
};

/**
 * Compiles `code` as the body of an `async` function that takes the named
 * `paramNames`, sanitises injected redeclarations, runs it with `args`, and
 * returns either `{ value }` or `{ error }`. Centralises the AsyncFunction
 * dance shared by every sandbox-running tool (analyse-* and process-*) so
 * each callsite only owns its inputs and result handling.
 *
 * In addition to the caller's `paramNames`, a fixed set of network / storage /
 * DOM globals ({@link SHADOWED_GLOBALS}) is appended as `undefined` parameters
 * so the body cannot reach them by name. This is defense-in-depth, not a
 * sandbox: it surfaces accidental/undesired global access as an error rather
 * than containing a hostile escape (see the note on `SHADOWED_GLOBALS`).
 *
 * Injected-redeclaration sanitising happens HERE, once, before dispatch — so every
 * executor (main-thread and iframe-worker alike) runs identically de-fanged code
 * and an LLM `const turf = require(...)` can't compile in one realm but throw in
 * another. `executor` is REQUIRED (no implicit main-thread default): callers must
 * choose the realm explicitly — `state.codeExecution` for the env-resolved sandbox,
 * or `mainThreadExecutor` to opt into host-realm execution on purpose. `verb` is the
 * human-readable action used in the error prefix (e.g. `"Analysis"`).
 *
 * @ignore
 */
export const runSandboxedFn = <Result = unknown>(
    code: string,
    paramNames: readonly string[],
    args: readonly unknown[],
    verb: string,
    executor: SandboxExecutor,
): Promise<{ value: Result } | { error: string }> =>
    executor.run<Result>(stripInjectedRedeclarations(code, paramNames), paramNames, args, verb);

/** @ignore */
export const stripInjectedRedeclarations = (code: string, identifiers: readonly string[]): string => {
    const names = identifiers.join('|');
    // RHS forms we recognise as redeclarations of injected identifiers:
    //   require('…') / import('…') / await import('…')         — module-system reaches
    //   arguments.turf / arguments['turf']                      — reaching for the same param off `arguments`
    //   arguments[N].turf / arguments[N]['turf']                — same, with a (pointless) index first
    // The `[N]` index is optional so both the bare and indexed forms are stripped.
    // Anything else (e.g. `const turf = computeTurf()`) stays untouched so we never corrupt
    // genuine user code that happens to shadow an injected name.
    const rhs =
        String.raw`(?:(?:await\s+)?(?:require|import)\s*\(` +
        String.raw`|arguments\s*(?:\[\s*\d+\s*\])?\s*(?:\.\w+|\[\s*['"]\w+['"]\s*\]))`;
    const pattern = new RegExp(
        String.raw`^[ \t]*(?:const|let|var)[ \t]+(?:${names})[ \t]*=[ \t]*${rhs}[^\n]*\n?`,
        'gm',
    );
    return code.replace(pattern, '');
};

// Hints appended to LLM-facing error strings when the runtime message matches
// a known pitfall in model-generated sandbox code. Lets the model self-correct
// on the next call instead of guessing what went wrong.
//
// Order matters — earlier patterns win. The library-specific
// `h3.X is not a function` / `turf.X is not a function` rules are listed
// before the generic `is not a function` so callers get the targeted redirect
// (the libraries are pure-geometry — no spatial-search / no I/O — and the
// generic hint doesn't say that).
const SANDBOX_ERROR_HINTS: ReadonlyArray<{ pattern: RegExp; hint: string }> = [
    {
        pattern: /Cannot read propert(?:y|ies) of undefined/i,
        hint: 'A property was read on `undefined`. Likely a `reduce` callback that does not `return` the accumulator, or a `reduce` called without an initial value — use `arr.reduce((acc, x) => { ...; return acc; }, {})`. Also check unguarded chains like `feature.properties.poi.categories` — use optional chaining (`?.`) and `??` defaults.',
    },
    {
        pattern: /Cannot read propert(?:y|ies) of null/i,
        hint: 'A property was read on `null`. Guard property access with `?.` and provide defaults with `??`.',
    },
    {
        pattern: /\bh3\.\w+ is not a function/i,
        hint: '`h3` is [h3-js](https://github.com/uber/h3-js) — hex-grid math only. NO spatial search / place lookup / HTTP. Common: `latLngToCell`, `cellToLatLng`, `cellToBoundary`, `polygonToCells`, `gridDisk`, `cellArea`. For nearby places call `discoverPlaces` BEFORE this tool — sandbox cannot call other tools.',
    },
    {
        pattern: /\bturf\.\w+ is not a function/i,
        hint: '`turf` is [@turf/turf](https://turfjs.org/) — GeoJSON geometry only. NO spatial search / place lookup / HTTP. Common: `area`, `length`, `bbox`, `centroid`, `union`, `intersect`, `buffer`, `distance`, `booleanPointInPolygon`, `pointsWithinPolygon`, `clustersDbscan`, `convex`. Verify names at https://turfjs.org/docs/. For nearby places call `discoverPlaces` BEFORE this tool.',
    },
    {
        pattern: /coordinates must be an Array|Unknown Geometry Type/i,
        hint: 'turf was handed a raw coordinate (or a bare Array of features) instead of a Feature / FeatureCollection. Do NOT extract `.geometry.coordinates` with `.map` / `.flatMap` and feed the result to turf — pass the WHOLE feature: `turf.pointToLineDistance(pointFeature, lineFeature, { units: "meters" })`. `incidentsByEntry[id]` is an Array of mixed Point + LineString features; guard with `if (inc.geometry.type === "LineString")` before line-only ops. A single entry of an FC kind (`placesByEntry[id]`, `routesByEntry[id]`, `trafficAreaAnalyticsByEntry[id]`, `byodByEntry[id]`) is a FeatureCollection — pass it directly (`turf.bbox(placesByEntry[id])`), never `turf.bbox(placesByEntry[id].features)`. To span entries, merge then wrap: `turf.bbox(turf.featureCollection(Object.values(placesByEntry).flatMap(fc => fc.features)))`.',
    },
    {
        pattern: /is not a function/i,
        hint: 'A method was called on a value that does not have it (typo, or the value is not the expected type). Verify the type before calling, e.g. `Array.isArray(x) ? x.map(...) : []`.',
    },
    {
        pattern: /Illegal return statement/i,
        hint: 'A `return` was placed outside the top-level function body — usually a missing brace or a callback that the parser thinks closed too early. Common cause: a multi-line `const X = arr.map((item) => { ... })` whose closing `})` was lost. Re-emit the code with balanced braces, keep `return` only at the top level of the body, and try again.',
    },
    {
        pattern: /Identifier ['"]?\w+['"]? has already been declared/i,
        hint: 'A variable was declared twice — typically because the code prepends `const turf = require(...)` / `const turf = await import(...)` / `const turf = arguments.turf` / `const turf = arguments[0].turf` / `const placesByEntry = ...`. Those names are already in scope as function parameters; drop the redeclaration line and use them directly (`turf.bbox(placesByEntry[id])`).',
    },
    {
        pattern: /Unexpected (?:token|identifier|end of input)/i,
        hint: 'The code did not parse as a JavaScript async-function body. Common causes: unbalanced braces/parens/brackets, a stray template literal, or `import`/`export` statements (not allowed in sandbox bodies — `placesByEntry`/`geometriesByEntry`/`h3`/`turf` are already in scope). Re-emit a self-contained body that ends with `return ...;`.',
    },
    {
        pattern: /\brequire is not defined\b|\bimport (?:is not defined|outside a module)\b/i,
        hint: 'The sandbox is not a Node module — `require` and top-level `import` are not available. The libraries you need (`h3`, `turf`) and inputs (`placesByEntry`, `geometriesByEntry`, …) are already injected as parameters; drop the import lines and use them directly.',
    },
    {
        pattern: /\b(?:functions|tools|agent|recallState|discoverPlaces|locatePlace) is not defined\b/i,
        hint: 'The sandbox cannot call other tools — `functions.recallState(...)`, `tools.discoverPlaces(...)`, etc. are NOT available. To use additional entries, list every needed id in the tool inputs (`placesEntryIDs`, `routesEntryIDs`, `incidentsEntryIDs`, `geometriesEntryIDs`): each is exposed via the injected per-entry sandbox args (`placesByEntry`, `routesByEntry`, `incidentsByEntry`, `geometriesByEntry`), keyed by the ids you passed. To bring in NEW places call `discoverPlaces` BEFORE this tool and pass the resulting entry id back in.',
    },
    {
        pattern: /is not iterable/i,
        hint: 'A value used in `for..of`, spread, or destructuring was not iterable. Default arrays with `?? []`, e.g. `for (const c of feature.properties.poi?.categories ?? []) { ... }`.',
    },
    {
        pattern: /Cannot access '.+?' before initialization/i,
        hint: 'A `let`/`const` was used before its declaration (temporal dead zone). Move the declaration above its first use.',
    },
    {
        pattern: /Assignment to constant variable/i,
        hint: 'A `const`-declared variable was reassigned. Either use `let`, or mutate the value in place.',
    },
    {
        pattern: /structuredClone|could not be cloned|DataCloneError/i,
        hint: 'Return value must be pure JSON — no functions or classes. The result crosses a JSON boundary before rendering. For per-point detail you would put in a Chart.js `tooltip.callbacks` function, use a `string[]` label instead — it renders multi-line in the axis tick and the tooltip title.',
    },
];

/**
 * Builds an LLM-facing error string for sandboxed code execution failures.
 * Appends a `Hint:` suffix when the error matches a common pattern so the
 * model can self-correct on retry. `verb` is the human-readable action used
 * in the prefix (e.g. `"Analysis"`, `"Process"`).
 */
/** @ignore */
export const formatSandboxExecutionError = (verb: string, error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error);
    const base = `${verb} code execution failed: ${message}`;
    // Specific hints win over the generic SyntaxError catch-all: several syntax
    // errors (e.g. "Identifier '…' has already been declared", "Illegal return
    // statement", "Unexpected token") have targeted, actionable hints below, and
    // the generic "not valid JavaScript" line would otherwise preempt them.
    const match = SANDBOX_ERROR_HINTS.find(({ pattern }) => pattern.test(message));
    if (match) return `${base} Hint: ${match.hint}`;
    if (error instanceof Error && error.name === 'SyntaxError') {
        return `${base} Hint: the provided \`code\` is not valid JavaScript — ensure it parses as an async function body and \`return\`s a value.`;
    }
    return base;
};
