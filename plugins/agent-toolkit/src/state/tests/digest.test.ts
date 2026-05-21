import { describe, expect, test } from 'vitest';
import type { ToolState } from '../../types';
import { formatStateDigestDiff, getStateDigest, type StateDigest } from '../digest';

// Build a minimal ToolState shape that exposes only the fields `getStateDigest` reads. The slices
// are POJOs — getStateDigest never invokes methods, so we can avoid pulling in the full state
// factory (which would require a real TomTomMap). Cast through `unknown` so the structural cast
// stays explicit.
type SliceOverrides = {
    places?: { shownAsPinIds?: string[]; shownAsBaseMapIds?: string[]; entryMode?: 'multiple' | 'single' };
    routing?: { shownEntryIds?: string[]; entryMode?: 'multiple' | 'single' };
    ranges?: { shownEntryIds?: string[]; entryMode?: 'multiple' | 'single' };
    trafficAreaAnalytics?: {
        shownEntryIds?: string[];
        entryMode?: 'multiple' | 'single';
        entries?: readonly unknown[];
    };
    trafficIncidents?: {
        shownEntryIds?: string[];
        entries?: ReadonlyArray<{ id: string; _monitor?: { status: 'running' | 'idle' | 'stopped' } }>;
        entryMode?: 'multiple' | 'single';
    };
    customGeometries?: { shownEntryIds?: string[]; entryMode?: 'multiple' | 'single'; entries?: readonly unknown[] };
    byod?: { shownEntryIds?: string[]; entryMode?: 'multiple' | 'single'; entries?: readonly unknown[] };
};

const makeState = (overrides: SliceOverrides = {}): ToolState => {
    const slice = (o: { shownEntryIds?: string[]; entryMode?: 'multiple' | 'single'; entries?: readonly unknown[] }) =>
        ({
            shownEntryIds: new Set(o.shownEntryIds ?? []),
            entryMode: o.entryMode ?? 'multiple',
            entries: o.entries ?? [],
        }) as const;
    return {
        places: {
            shownAsPinIds: new Set(overrides.places?.shownAsPinIds ?? []),
            shownAsBaseMapIds: new Set(overrides.places?.shownAsBaseMapIds ?? []),
            entryMode: overrides.places?.entryMode ?? 'multiple',
        },
        routing: slice(overrides.routing ?? {}),
        ranges: slice(overrides.ranges ?? {}),
        trafficAreaAnalytics: slice(overrides.trafficAreaAnalytics ?? {}),
        trafficIncidents: {
            shownEntryIds: new Set(overrides.trafficIncidents?.shownEntryIds ?? []),
            entries: overrides.trafficIncidents?.entries ?? [],
            entryMode: overrides.trafficIncidents?.entryMode ?? 'multiple',
        },
        customGeometries: slice(overrides.customGeometries ?? {}),
        byod: slice(overrides.byod ?? {}),
    } as unknown as ToolState;
};

describe('getStateDigest', () => {
    test('produces an empty digest for a freshly-built state', () => {
        const digest = getStateDigest(makeState());
        expect(digest).toEqual({
            places: { shownAsPin: [], shownAsBaseMap: [], entryMode: 'multiple' },
            routes: { shown: [], entryMode: 'multiple' },
            ranges: { shown: [], entryMode: 'multiple' },
            traffic: { shown: [], entryMode: 'multiple', entryCount: 0 },
            incidents: { shown: [], monitored: [], entryMode: 'multiple' },
            customGeometries: { shown: [], entryMode: 'multiple', entryCount: 0 },
            byod: { shown: [], entryMode: 'multiple', entryCount: 0 },
        });
    });

    test('places: shownAsPin and shownAsBaseMap come from the matching sets, sorted', () => {
        const state = makeState({
            places: { shownAsPinIds: ['p-2', 'p-1'], shownAsBaseMapIds: ['b-9', 'b-3'] },
        });
        const digest = getStateDigest(state);
        expect(digest.places.shownAsPin).toEqual(['p-1', 'p-2']);
        expect(digest.places.shownAsBaseMap).toEqual(['b-3', 'b-9']);
    });

    test('sorts every shown set with localeCompare (predictable across locales)', () => {
        const state = makeState({
            routing: { shownEntryIds: ['routes-10', 'routes-2', 'routes-1'] },
        });
        // localeCompare on numeric strings without a numeric collator still sorts lexicographically —
        // verify the contract holds rather than guessing.
        expect(getStateDigest(state).routes.shown).toEqual(
            ['routes-10', 'routes-2', 'routes-1'].sort((a, b) => a.localeCompare(b)),
        );
    });

    test('traffic.entryCount reflects the full history (including hidden entries)', () => {
        const state = makeState({
            trafficAreaAnalytics: { shownEntryIds: ['tta-2'], entries: [{}, {}, {}] },
        });
        const digest = getStateDigest(state);
        expect(digest.traffic.shown).toEqual(['tta-2']);
        expect(digest.traffic.entryCount).toBe(3);
    });

    test('incidents.monitored only includes entries with a running monitor', () => {
        const state = makeState({
            trafficIncidents: {
                entries: [
                    { id: 'inc-0', _monitor: { status: 'running' } },
                    { id: 'inc-1', _monitor: { status: 'stopped' } },
                    { id: 'inc-2' }, // no monitor at all
                    { id: 'inc-3', _monitor: { status: 'running' } },
                ],
            },
        });
        expect(getStateDigest(state).incidents.monitored).toEqual(['inc-0', 'inc-3']);
    });

    test('byod and customGeometries surface shown / entryMode / entryCount', () => {
        const state = makeState({
            byod: { shownEntryIds: ['byod-0'], entryMode: 'single', entries: [{}, {}] },
            customGeometries: { shownEntryIds: [], entryMode: 'multiple', entries: [{}] },
        });
        const digest = getStateDigest(state);
        expect(digest.byod).toEqual({ shown: ['byod-0'], entryMode: 'single', entryCount: 2 });
        expect(digest.customGeometries).toEqual({ shown: [], entryMode: 'multiple', entryCount: 1 });
    });
});

describe('formatStateDigestDiff', () => {
    const empty = (): StateDigest => getStateDigest(makeState()); // baseline: every slice empty, multiple mode

    test('returns null when nothing changed', () => {
        expect(formatStateDigestDiff(empty(), empty())).toBeNull();
    });

    test('reports new places-as-pin entries', () => {
        const next = getStateDigest(makeState({ places: { shownAsPinIds: ['p-1'] } }));
        const diff = formatStateDigestDiff(empty(), next);
        expect(diff).toContain('places shown as pins: "p-1"');
    });

    test('reports clearing of places-as-pin entries', () => {
        const prev = getStateDigest(makeState({ places: { shownAsPinIds: ['p-1'] } }));
        const next = empty();
        const diff = formatStateDigestDiff(prev, next);
        expect(diff).toContain('no places shown as pins');
    });

    test('reports clearing of routes (the "cleared" wording)', () => {
        const prev = getStateDigest(makeState({ routing: { shownEntryIds: ['r-0'] } }));
        const diff = formatStateDigestDiff(prev, empty());
        expect(diff).toContain('routes cleared');
    });

    test('reports new custom-geometries shown set', () => {
        const next = getStateDigest(makeState({ customGeometries: { shownEntryIds: ['g-0', 'g-1'] } }));
        const diff = formatStateDigestDiff(empty(), next);
        expect(diff).toContain('custom geometries shown: "g-0", "g-1"');
    });

    test('reports new byod shown set', () => {
        const next = getStateDigest(makeState({ byod: { shownEntryIds: ['byod-0'] } }));
        const diff = formatStateDigestDiff(empty(), next);
        expect(diff).toContain('byod shown: "byod-0"');
    });

    test('surfaces entryMode flips for every slice that tracks one', () => {
        const next = getStateDigest(
            makeState({
                places: { entryMode: 'single' },
                routing: { entryMode: 'single' },
                ranges: { entryMode: 'single' },
                trafficIncidents: { entryMode: 'single' },
                customGeometries: { entryMode: 'single' },
                byod: { entryMode: 'single' },
            }),
        );
        const diff = formatStateDigestDiff(empty(), next);
        expect(diff).toContain('places entryMode → single');
        expect(diff).toContain('routes entryMode → single');
        expect(diff).toContain('ranges entryMode → single');
        expect(diff).toContain('incidents entryMode → single');
        expect(diff).toContain('custom geometries entryMode → single');
        expect(diff).toContain('byod entryMode → single');
    });

    test('wraps the diff with the canonical prefix when any change is present', () => {
        const next = getStateDigest(makeState({ routing: { shownEntryIds: ['r-0'] } }));
        const diff = formatStateDigestDiff(empty(), next);
        expect(diff).toMatch(/^\[map state changed since last response: .+\]$/);
    });

    test('does not report a fragment for unchanged shown sets', () => {
        // Same shown ids in both digests — no fragment, regardless of array identity.
        const prev = getStateDigest(makeState({ routing: { shownEntryIds: ['r-0', 'r-1'] } }));
        const next = getStateDigest(makeState({ routing: { shownEntryIds: ['r-1', 'r-0'] } }));
        expect(formatStateDigestDiff(prev, next)).toBeNull();
    });
});
