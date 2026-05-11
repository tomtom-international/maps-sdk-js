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
// happen to share a name with an injected one (e.g. `const geometries =
// places.features.map(...)`), corrupting the body and yielding a far less
// actionable "Illegal return statement" error downstream.
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
export const buildSandboxCodePrompt = (injected: readonly string[]): string =>
    `In scope: ${injected.map((n) => `\`${n}\``).join(', ')}. Already injected as function parameters — use directly. ` +
    'Do NOT `require()` / `import` / redeclare them; the body is a sandboxed async function (no Node module system). ' +
    '`h3` is h3-js (hex-grid math: `latLngToCell`, `polygonToCells`, `gridDisk`, `cellToBoundary`, …). ' +
    '`turf` is @turf/turf (GeoJSON: `area`, `bbox`, `centroid`, `union`, `intersect`, `buffer`, `distance`, ' +
    '`booleanPointInPolygon`, `pointsWithinPolygon`, `clustersDbscan`, `convex`, …; verify names at https://turfjs.org/docs/). ' +
    'Neither library searches places or fetches data — call `discoverPlaces` BEFORE this tool to bring in new places. ' +
    'Top-level `await`, locals, and helper consts are fine. End with `return …;`.';

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

/** @ignore */
export const toJsonSafe = (value: unknown): { value: unknown } | { error: string } => {
    try {
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

/**
 * Compiles `code` as the body of an `async` function that takes the named
 * `paramNames`, sanitises injected redeclarations, runs it with `args`, and
 * returns either `{ value }` or `{ error }`. Centralises the AsyncFunction
 * dance shared by every sandbox-running tool (analyse-* and process-*) so
 * each callsite only owns its inputs and result handling.
 *
 * `verb` is the human-readable action used in the error prefix (e.g.
 * `"Analysis"`, `"Process"`).
 *
 * @ignore
 */
export const runSandboxedFn = async <Result = unknown>(
    code: string,
    paramNames: readonly string[],
    args: readonly unknown[],
    verb: string,
): Promise<{ value: Result } | { error: string }> => {
    try {
        const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
            ...names: string[]
        ) => (...callArgs: unknown[]) => Promise<Result> | Result;
        const sanitizedCode = stripInjectedRedeclarations(code, paramNames);
        const fn = new AsyncFunction(...paramNames, sanitizedCode);
        return { value: await fn(...args) };
    } catch (error) {
        return { error: formatSandboxExecutionError(verb, error) };
    }
};

/** @ignore */
export const stripInjectedRedeclarations = (code: string, identifiers: readonly string[]): string => {
    const names = identifiers.join('|');
    // ^                         line start (m flag)
    // [ \t]*(const|let|var)     declarator
    // [ \t]+(name)              one of the injected identifiers
    // [ \t]*=                   assignment
    // [ \t]*(?:await\s+)?       optional `await` (covers `await import(...)`)
    // (?:require|import)\s*\(   require(... or import(...
    // [^\n]*\n?                 swallow rest of the line
    const pattern = new RegExp(
        String.raw`^[ \t]*(?:const|let|var)[ \t]+(?:${names})[ \t]*=[ \t]*(?:await\s+)?(?:require|import)\s*\([^\n]*\n?`,
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
        pattern: /is not a function/i,
        hint: 'A method was called on a value that does not have it (typo, or the value is not the expected type). Verify the type before calling, e.g. `Array.isArray(x) ? x.map(...) : []`.',
    },
    {
        pattern: /Illegal return statement/i,
        hint: 'A `return` was placed outside the top-level function body — usually a missing brace or a callback that the parser thinks closed too early. Common cause: a multi-line `const X = arr.map((item) => { ... })` whose closing `})` was lost. Re-emit the code with balanced braces, keep `return` only at the top level of the body, and try again.',
    },
    {
        pattern: /Identifier ['"]?\w+['"]? has already been declared/i,
        hint: 'A variable was declared twice — typically because the code prepends `const turf = require(...)` / `const h3 = require(...)` / `const places = ...`. Those names are already injected as parameters; remove the redeclaration line and use them directly.',
    },
    {
        pattern: /Unexpected (?:token|identifier|end of input)/i,
        hint: 'The code did not parse as a JavaScript async-function body. Common causes: unbalanced braces/parens/brackets, a stray template literal, or `import`/`export` statements (not allowed in sandbox bodies — `places`/`geometries`/`h3`/`turf` are already in scope). Re-emit a self-contained body that ends with `return ...;`.',
    },
    {
        pattern: /\brequire is not defined\b|\bimport (?:is not defined|outside a module)\b/i,
        hint: 'The sandbox is not a Node module — `require` and top-level `import` are not available. The libraries you need (`h3`, `turf`) and inputs (`places`, `geometries`) are already injected as parameters; drop the import lines and use them directly.',
    },
    {
        pattern:
            /\b(?:functions|tools|agent|recallPlaces|recallRoutes|recallRanges|discoverPlaces|locatePlace) is not defined\b/i,
        hint: 'The sandbox cannot call other tools — `functions.recallPlaces(...)`, `tools.discoverPlaces(...)`, etc. are NOT available. To use additional entries, list every needed id in `placesEntryIDs` (or `routesEntryIDs`/`rangesIds` for the analyse-* tools): each is exposed via the injected inputs. To bring in NEW places call `discoverPlaces` BEFORE this tool and pass the resulting entry id back in.',
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
    if (error instanceof Error && error.name === 'SyntaxError') {
        return `${base} Hint: the provided \`code\` is not valid JavaScript — ensure it parses as an async function body and \`return\`s a value.`;
    }
    const match = SANDBOX_ERROR_HINTS.find(({ pattern }) => pattern.test(message));
    return match ? `${base} Hint: ${match.hint}` : base;
};
