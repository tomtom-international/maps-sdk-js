/**
 * @module agent-toolkit-state
 * @ignore
 *
 * Cross-slice helpers for entry-owning state slices. The agent-toolkit has seven such slices
 * (places, routing, ranges, customGeometries, trafficAreaAnalytics, trafficIncidents, byod) that
 * shared the same id-collision + single-mode-collapse code; consolidating it here keeps the
 * slices in lockstep on edge-case behaviour and makes the rules unit-testable in isolation.
 */

/**
 * Return `requested` if no entry in `takenIds` already uses it; otherwise append `-2`, `-3`, …
 * until an unused id appears. Pure — only reads `takenIds`.
 *
 * Behaviour notes:
 * - `requested` is never modified, only suffixed (`"foo"` → `"foo-2"`, not `"foo-1"`). The first
 *   suffix is `-2` so the chain reads naturally: "foo, foo-2, foo-3, …".
 * - Acceps any `Iterable<string>` (Set / Array / generator) — the slice's internal entry store
 *   shape is irrelevant.
 *
 * @ignore
 */
export const pickUniqueEntryId = (requested: string, takenIds: Iterable<string>): string => {
    const taken = new Set(takenIds);
    if (!taken.has(requested)) return requested;
    for (let i = 2; ; i++) {
        const candidate = `${requested}-${i}`;
        if (!taken.has(candidate)) return candidate;
    }
};

/**
 * Hide every entry in `entries` and resolve once they're all settled. Sequential by default
 * (avoids MapLibre source-mutation races — see the project-wide `show/hide sequential` note);
 * pass `parallel: true` only when the slice's `hideOne` is provably race-safe (e.g. each entry
 * owns a separate module).
 *
 * Used in two places:
 * - `setEntryMode('single')` collapses history to the latest entry (via
 *   {@link collapseHistoryToLatest}, which delegates to this primitive).
 * - `addEntry` under `single` mode replaces the entire history — same hide-all-then-drop
 *   shape, but no survivor.
 *
 * Centralising this means addEntry implementations can `await` the hides instead of the
 * fire-and-forget `void this.hideEntry(…)` pattern that previously let a new entry render
 * while the old map modules were still being torn down.
 *
 * @ignore
 */
export const hideAllEntries = async <T>(
    entries: readonly T[],
    hideOne: (entry: T) => Promise<void>,
    options: { parallel?: boolean } = {},
): Promise<void> => {
    if (entries.length === 0) return;
    if (options.parallel) {
        await Promise.all(entries.map(hideOne));
    } else {
        for (const entry of entries) await hideOne(entry);
    }
};

/**
 * Drop every entry except the last, hiding the dropped ones first. Returns the surviving entries
 * (an array with the latest entry, or empty when the input was empty).
 *
 * Used by `setEntryMode('single')` across every entry-owning slice — `single` mode means only the
 * latest entry stays on the map, so flipping the mode has to retroactively hide and forget every
 * older entry. The helper centralises the "hide-then-drop" order so a future change to hide
 * semantics lands in one place.
 *
 * @ignore
 */
export const collapseHistoryToLatest = async <T>(
    entries: readonly T[],
    hideOne: (entry: T) => Promise<void>,
    options: { parallel?: boolean } = {},
): Promise<T[]> => {
    if (entries.length <= 1) return [...entries];
    const latest = entries[entries.length - 1];
    await hideAllEntries(entries.slice(0, -1), hideOne, options);
    return [latest];
};
