/**
 * @module agent-toolkit-tools
 *
 * Shared helper that applies the optional `hidePreviousEntries` selector to a
 * routing- or ranges-style state slice before a new entry is rendered.
 */

import type { ShownEntriesSlice } from '../../state';

/**
 * Hide previously-shown entries on a slice that exposes `hideEntry(id)` and a
 * `shownEntryIds` set (routing, ranges). No-op under `entryMode === 'single'`
 * (the slice auto-hides others) or when the selector is `undefined`
 * (omit ⇒ stack on top of existing entries).
 *
 * @ignore
 */
export const hidePreviousShownEntries = async (
    slice: ShownEntriesSlice,
    keepEntryIds: readonly string[],
    selector: 'all' | readonly string[] | undefined,
): Promise<void> => {
    if (slice.entryMode !== 'multiple' || selector === undefined) return;
    const keep = new Set(keepEntryIds);
    const toHide =
        selector === 'all'
            ? [...slice.shownEntryIds].filter((entryId) => !keep.has(entryId))
            : selector.filter((entryId) => !keep.has(entryId));
    for (const entryId of toHide) {
        await slice.hideEntry(entryId);
    }
};
