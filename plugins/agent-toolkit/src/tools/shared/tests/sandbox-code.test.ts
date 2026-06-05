import { describe, expect, it } from 'vitest';
import {
    formatSandboxExecutionError,
    isPolygonFeature,
    isPolygonFeatureArray,
    runSandboxedFn,
    stripInjectedRedeclarations,
    validateAnalysisResult,
} from '../sandbox-code';

const IDS = ['places', 'h3', 'turf'] as const;

describe('stripInjectedRedeclarations', () => {
    it('removes `const turf = require("@turf/turf")` prepended by the LLM', () => {
        const code = `const turf = require('@turf/turf');\nreturn turf.bbox(places);`;
        expect(stripInjectedRedeclarations(code, IDS)).toBe('return turf.bbox(places);');
    });

    it('removes `const turf = await import("@turf/turf")` prepended by the LLM', () => {
        const code = `const turf = await import('@turf/turf');\nreturn turf.bbox(places);`;
        expect(stripInjectedRedeclarations(code, IDS)).toBe('return turf.bbox(places);');
    });

    it('removes `const turf = arguments[0].turf` (reaching for the injected param off `arguments`)', () => {
        const code = 'const turf = arguments[0].turf;\nreturn turf.bbox(places);';
        expect(stripInjectedRedeclarations(code, IDS)).toBe('return turf.bbox(places);');
    });

    it('removes the bracket-notation variant `const h3 = arguments[0]["h3"]`', () => {
        const code = `const h3 = arguments[0]["h3"];\nreturn h3.latLngToCell(52, 4, 8);`;
        expect(stripInjectedRedeclarations(code, IDS)).toBe('return h3.latLngToCell(52, 4, 8);');
    });

    it('removes the un-indexed form `const turf = arguments.turf` (the exact reported failure)', () => {
        const code = 'const turf = arguments.turf;\nreturn turf.bbox(places);';
        expect(stripInjectedRedeclarations(code, IDS)).toBe('return turf.bbox(places);');
    });

    it('removes the un-indexed bracket form `const h3 = arguments["h3"]`', () => {
        const code = `const h3 = arguments["h3"];\nreturn h3.latLngToCell(52, 4, 8);`;
        expect(stripInjectedRedeclarations(code, IDS)).toBe('return h3.latLngToCell(52, 4, 8);');
    });

    it('does not strip an unrelated `arguments`-reading declaration', () => {
        // `arguments[0].foo` for a non-injected name is genuine user code — keep it.
        const code = 'const foo = arguments[0].foo;\nreturn foo;';
        expect(stripInjectedRedeclarations(code, IDS)).toBe(code);
    });

    it('removes redeclarations of every injected identifier', () => {
        const code = [
            "const places = require('whatever');",
            "let h3 = require('h3-js');",
            'var turf = require("@turf/turf");',
            'return places.features.length;',
        ].join('\n');
        expect(stripInjectedRedeclarations(code, IDS)).toBe('return places.features.length;');
    });

    it('keeps unrelated const declarations', () => {
        const code = ['const counts = {};', 'const origin = h3.latLngToCell(52, 4, 8);', 'return counts;'].join('\n');
        expect(stripInjectedRedeclarations(code, IDS)).toBe(code);
    });

    it('does not match identifiers that share a prefix', () => {
        const code = 'const turfy = 1;\nconst h3x = 2;\nreturn turfy + h3x;';
        expect(stripInjectedRedeclarations(code, IDS)).toBe(code);
    });

    it('preserves indentation on the remaining code', () => {
        const code = '    const turf = require("@turf/turf");\n    return turf.bbox(places);';
        expect(stripInjectedRedeclarations(code, IDS)).toBe('    return turf.bbox(places);');
    });
});

describe('formatSandboxExecutionError', () => {
    it('prefixes the message with the verb', () => {
        const result = formatSandboxExecutionError('Analysis', new Error('something went wrong'));
        expect(result.startsWith('Analysis code execution failed: something went wrong')).toBe(true);
    });

    it('appends a hint for the classic missing-accumulator reduce error', () => {
        // Mirrors the production failure: a `reduce` callback that does not return
        // its accumulator throws `Cannot read properties of undefined (reading 'X')`.
        const result = formatSandboxExecutionError(
            'Analysis',
            new TypeError("Cannot read properties of undefined (reading 'BEAUTY_SALON')"),
        );
        expect(result).toMatch(/Hint:/);
        expect(result).toMatch(/reduce/);
    });

    it('hints on `Cannot read properties of null`', () => {
        const result = formatSandboxExecutionError(
            'Process',
            new TypeError("Cannot read properties of null (reading 'x')"),
        );
        expect(result).toMatch(/Hint:.*null/);
    });

    it('hints on `is not a function`', () => {
        const result = formatSandboxExecutionError('Analysis', new TypeError('foo.bar is not a function'));
        expect(result).toMatch(/Hint:.*type/);
    });

    it('hints on `coordinates must be an Array` (raw-coordinate handoff to turf)', () => {
        const result = formatSandboxExecutionError('Analysis', new Error('coordinates must be an Array'));
        expect(result).toMatch(/Hint:.*Feature/);
        expect(result).toMatch(/\.geometry\.coordinates/);
    });

    it('hints on `Unknown Geometry Type` (bare Array passed to turf)', () => {
        const result = formatSandboxExecutionError('Process', new Error('Unknown Geometry Type'));
        expect(result).toMatch(/Hint:.*Feature/);
    });

    it('hints on `is not iterable`', () => {
        const result = formatSandboxExecutionError('Analysis', new TypeError('undefined is not iterable'));
        expect(result).toMatch(/Hint:.*iterable/);
    });

    it('hints on temporal-dead-zone access', () => {
        const result = formatSandboxExecutionError(
            'Analysis',
            new ReferenceError("Cannot access 'foo' before initialization"),
        );
        expect(result).toMatch(/Hint:.*temporal dead zone/);
    });

    it('hints on `Unexpected token` syntax errors with the async-body-specific hint', () => {
        // A specific pattern matches this SyntaxError, so the targeted hint wins
        // over the generic "not valid JavaScript" catch-all.
        const result = formatSandboxExecutionError('Analysis', new SyntaxError('Unexpected token }'));
        expect(result).toMatch(/Hint:.*async-function body/);
    });

    it('falls back to the generic hint for a SyntaxError matching no specific pattern', () => {
        const result = formatSandboxExecutionError('Analysis', new SyntaxError('Invalid regular expression flags'));
        expect(result).toMatch(/Hint:.*valid JavaScript/);
    });

    it('gives the specific redeclaration hint for a "has already been declared" SyntaxError', () => {
        // This is a SyntaxError, but the targeted hint must win over the generic
        // "not valid JavaScript" catch-all so the model knows to drop the line.
        const result = formatSandboxExecutionError(
            'Analysis',
            new SyntaxError("Identifier 'turf' has already been declared"),
        );
        expect(result).toMatch(/Hint:.*declared twice/);
        expect(result).not.toMatch(/valid JavaScript/);
    });

    it('returns the bare message when no pattern matches', () => {
        const result = formatSandboxExecutionError('Analysis', new Error('some unrelated runtime failure'));
        expect(result).toBe('Analysis code execution failed: some unrelated runtime failure');
    });

    it('handles non-Error throwables', () => {
        const result = formatSandboxExecutionError('Analysis', 'plain string');
        expect(result).toBe('Analysis code execution failed: plain string');
    });
});

describe('validateAnalysisResult', () => {
    it('rejects undefined', () => {
        const result = validateAnalysisResult(undefined, 'json');
        expect(result).toEqual({ error: expect.stringMatching(/must return a value/) });
    });

    it('returns the JSON-normalized value for a json output format', () => {
        const result = validateAnalysisResult({ count: 3 }, 'json');
        expect(result).toEqual({ value: { count: 3 } });
    });

    it('strips undefined fields via toJsonSafe', () => {
        const result = validateAnalysisResult({ a: 1, b: undefined }, 'json');
        expect(result).toEqual({ value: { a: 1 } });
    });

    it('rejects circular structures via toJsonSafe', () => {
        const obj: Record<string, unknown> = {};
        obj.self = obj;
        const result = validateAnalysisResult(obj, 'json');
        expect(result).toEqual({ error: expect.stringMatching(/not JSON-serializable/) });
    });

    it('accepts a valid Chart.js ChartConfiguration when outputFormat is chart', () => {
        const config = { type: 'bar', data: { labels: ['a'], datasets: [{ data: [1] }] } };
        const result = validateAnalysisResult(config, 'chart');
        expect(result).toEqual({ value: config });
    });

    it('rejects a non-Chart value when outputFormat is chart', () => {
        const result = validateAnalysisResult({ foo: 1 }, 'chart');
        expect(result).toEqual({ error: expect.stringMatching(/ChartConfiguration/) });
    });
});

describe('runSandboxedFn', () => {
    it('compiles and executes the body with the supplied args', async () => {
        const result = await runSandboxedFn<number>('return a + b;', ['a', 'b'], [2, 3], 'Test');
        expect(result).toEqual({ value: 5 });
    });

    it('awaits async return values', async () => {
        const result = await runSandboxedFn<number>('return await Promise.resolve(x * 2);', ['x'], [21], 'Test');
        expect(result).toEqual({ value: 42 });
    });

    it('strips injected-identifier redeclarations before executing', async () => {
        // The model prepended a `const turf = require(...)` line — the runner
        // should strip it so `new AsyncFunction("turf", ...)` doesn't choke on
        // a redeclaration.
        const code = 'const turf = require("@turf/turf");\nreturn turf.flag;';
        const result = await runSandboxedFn<unknown>(code, ['turf'], [{ flag: 'ok' }], 'Test');
        expect(result).toEqual({ value: 'ok' });
    });

    it('returns a labelled error when the code throws at runtime', async () => {
        const result = await runSandboxedFn<unknown>('throw new Error("boom");', [], [], 'Analysis');
        expect(result).toEqual({ error: expect.stringMatching(/^Analysis code execution failed:.*boom/) });
    });

    it('returns a labelled error when the code does not parse', async () => {
        const result = await runSandboxedFn<unknown>('return @@@;', [], [], 'Process');
        expect(result).toEqual({ error: expect.stringMatching(/^Process code execution failed:/) });
    });

    it('passes through `undefined` returns (caller decides what to do)', async () => {
        const result = await runSandboxedFn<unknown>('return undefined;', [], [], 'Test');
        expect(result).toEqual({ value: undefined });
    });
});

describe('isPolygonFeature', () => {
    const polygon = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 0],
                ],
            ],
        },
        properties: {},
    };
    const multiPolygon = {
        type: 'Feature',
        geometry: { type: 'MultiPolygon', coordinates: [[[[0, 0]]]] },
        properties: {},
    };

    it('accepts a Polygon Feature', () => {
        expect(isPolygonFeature(polygon)).toBe(true);
    });

    it('accepts a MultiPolygon Feature', () => {
        expect(isPolygonFeature(multiPolygon)).toBe(true);
    });

    it('rejects a Point Feature', () => {
        expect(
            isPolygonFeature({ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }),
        ).toBe(false);
    });

    it('rejects a non-Feature object', () => {
        expect(isPolygonFeature({ type: 'FeatureCollection', features: [] })).toBe(false);
    });

    it('rejects null / non-objects', () => {
        expect(isPolygonFeature(null)).toBe(false);
        expect(isPolygonFeature(undefined)).toBe(false);
        expect(isPolygonFeature('feature')).toBe(false);
    });

    it('rejects when coordinates is not an array', () => {
        expect(
            isPolygonFeature({ type: 'Feature', geometry: { type: 'Polygon', coordinates: null }, properties: {} }),
        ).toBe(false);
    });
});

describe('isPolygonFeatureArray', () => {
    const polygon = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[[0, 0]]] },
        properties: {},
    };

    it('accepts an empty array', () => {
        expect(isPolygonFeatureArray([])).toBe(true);
    });

    it('accepts an array of valid polygon features', () => {
        expect(isPolygonFeatureArray([polygon, polygon])).toBe(true);
    });

    it('rejects when one entry is invalid', () => {
        expect(isPolygonFeatureArray([polygon, { foo: 1 }])).toBe(false);
    });

    it('rejects non-array inputs', () => {
        expect(isPolygonFeatureArray(polygon)).toBe(false);
        expect(isPolygonFeatureArray(null)).toBe(false);
    });
});
