import { describe, expect, it, vi } from 'vitest';
import { BaseMapState } from '../../../state';
import { makeMockState } from '../../../tests/constants';
import { executeExecuteMaplibreCode } from '../execute-maplibre-code';

// Builds a fake mapLibreMap over a REAL mutable style object so the before/after snapshot diff
// can observe mutations the executed code makes. executeExecuteMaplibreCode itself only ever
// calls getStyle() (before and after running the code) — it never calls addSource/addLayer/
// removeLayer, so the fake doesn't implement them either. Reimplementing those would mean
// re-deriving MapLibre's own mutation semantics inside the test, which is exactly the SDK
// behavior this suite is NOT responsible for (that's covered by the real SDK/map integration
// tests). Test `code` strings that want to "add a source" or "remove a layer" do it the same way
// any equivalent real code would have to anyway: by mutating the object getStyle() hands back.
//
// state.baseMap.mapLibreMap is a getter with no setter on the default mock (reads
// ttMap.mapLibreMap), and both the mock and the real BaseMapState type declare it read-only — so
// rather than reassigning it after construction, the whole `baseMap` is passed as a fresh
// override at makeMockState() construction time, cast once at the boundary.
const makeMapState = (style: { sources: Record<string, unknown>; layers: { id: string }[] }) => {
    const fakeMap = { getStyle: () => style };
    const baseMap = {
        ttMap: { setStyle: vi.fn(), mapLibreMap: fakeMap },
        mapLibreMap: fakeMap,
        events: {},
    } as unknown as BaseMapState;

    return makeMockState({ baseMap });
};

describe('executeExecuteMaplibreCode', () => {
    // Code that returns nothing yields result: undefined.
    it('reports result undefined when the code returns nothing', async () => {
        const state = makeMapState({ sources: {}, layers: [] });

        const result = await executeExecuteMaplibreCode({ code: 'const x = 1;' }, state);
        if ('error' in result) {
            expect.fail('expected executeExecuteMaplibreCode to succeed');
        }

        expect(result.result).toBeUndefined();
    });

    // Adding a new source id shows up in sources.added — and the source is actually on the map,
    // not just reported as added.
    it('reports an added source', async () => {
        const style = { sources: {} as Record<string, unknown>, layers: [] as { id: string }[] };
        const state = makeMapState(style);

        const result = await executeExecuteMaplibreCode(
            { code: 'map.getStyle().sources.pts = { type: "geojson", data: {} };' },
            state,
        );
        if ('error' in result) {
            expect.fail('expected executeExecuteMaplibreCode to succeed');
        }

        expect(result.sources.added).toEqual(['pts']);
        expect(style.sources.pts).toEqual({ type: 'geojson', data: {} });
    });

    // Mutating an existing source's definition shows up in sources.updated — and the map's own
    // copy reflects the new value, not just the reported diff.
    it('reports an updated source', async () => {
        const style = { sources: { pts: { type: 'geojson', data: { a: 1 } } }, layers: [] as { id: string }[] };
        const state = makeMapState(style);

        const result = await executeExecuteMaplibreCode({ code: 'map.getStyle().sources.pts.data = { a: 2 };' }, state);
        if ('error' in result) {
            expect.fail('expected executeExecuteMaplibreCode to succeed');
        }

        expect(result.sources.updated).toEqual(['pts']);
        expect(style.sources.pts).toEqual({ type: 'geojson', data: { a: 2 } });
    });

    // Removing an existing layer id shows up in layers.removed — and the layer is actually gone
    // from the map, not just reported as removed.
    it('reports a removed layer', async () => {
        const style = { sources: {} as Record<string, unknown>, layers: [{ id: 'water' }] };
        const state = makeMapState(style);

        const result = await executeExecuteMaplibreCode(
            { code: 'map.getStyle().layers = map.getStyle().layers.filter((l) => l.id !== "water");' },
            state,
        );
        if ('error' in result) {
            expect.fail('expected executeExecuteMaplibreCode to succeed');
        }

        expect(result.layers.removed).toEqual(['water']);
        expect(style.layers).toEqual([]);
    });

    // A thrown error is caught and surfaced via formatSandboxExecutionError with the "Code" verb.
    it('returns a sandbox-formatted error when the code throws', async () => {
        const state = makeMapState({ sources: {}, layers: [] });

        const result = await executeExecuteMaplibreCode({ code: 'throw new Error("boom");' }, state);

        expect(result).toEqual({ error: 'Code code execution failed: boom' });
    });
});
