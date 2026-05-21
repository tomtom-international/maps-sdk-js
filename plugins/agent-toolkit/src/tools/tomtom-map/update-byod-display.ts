/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const actionSchema = z
    .enum(['show', 'hide', 'remove'])
    .describe(
        '`show` renders the listed entries (lazy-init their CustomGeoJSONModule); ' +
            '`hide` removes them from the map but keeps them in session state; ' +
            '`remove` hides AND drops them from history.',
    );

export const updateByodDisplaySchema = z
    .object({
        entryIds: z
            .array(z.string())
            .min(1)
            .optional()
            .describe(
                'BYOD entry ids to act on (e.g. ["byod-0"]). Use `recallByod` to list. ' +
                    'Omit when `action: "hide"` and `clearAll: true` to hide every shown BYOD entry in one call.',
            ),
        action: actionSchema,
        clearAll: z
            .boolean()
            .optional()
            .describe(
                'Only valid with `action: "hide"`. When true, hides every currently-shown BYOD entry (ignores `entryIds`). Default: false.',
            ),
        hideOthers: z
            .boolean()
            .optional()
            .describe(
                'Only valid with `action: "show"`. When true, hides every other BYOD entry before showing the listed ones. Default: false (stack).',
            ),
    })
    .refine(
        (v) => {
            if (v.action === 'hide' && v.clearAll) return true;
            return !!v.entryIds?.length;
        },
        { message: '`entryIds` is required unless `action: "hide"` with `clearAll: true`.' },
    )
    .refine((v) => !v.clearAll || v.action === 'hide', {
        message: '`clearAll: true` is only valid with `action: "hide"`.',
    })
    .refine((v) => !v.hideOthers || v.action === 'show', {
        message: '`hideOthers: true` is only valid with `action: "show"`.',
    });

export const updateByodDisplayOutputSchema = z.union([
    z.object({
        action: actionSchema,
        affectedIds: z.array(z.string()).describe('Entry ids that were actually shown / hidden / removed.'),
        shown: z.array(z.string()).describe('BYOD entry ids currently rendered on the map after this call.'),
    }),
    toolErrorSchema,
]);

export const updateByodDisplayDescription =
    'Toggle visibility (or drop) for one or more BYOD entries. Use after `addByodLayer` or after seeing entries ' +
    'via `recallByod`. Three actions: `show` renders listed entries, `hide` removes them from the map but keeps ' +
    'them in state, `remove` hides AND drops them from history. Pair `action: "hide"` with `clearAll: true` to ' +
    'hide every shown BYOD entry in one call. Pair `action: "show"` with `hideOthers: true` to swap to a single ' +
    "set of entries (replaces what's already on the map).";

type BYODSlice = ToolState['byod'];

// Reject the call up-front if any requested id is unknown — leaves the slice in its original
// state rather than partially applying. Returns `undefined` when every id is valid.
const validateRequestedIds = (slice: BYODSlice, requested: readonly string[]): { error: string } | undefined => {
    for (const id of requested) {
        if (!slice.findById(id)) {
            return { error: `No BYOD entry with id "${id}". Call recallByod to list available IDs.` };
        }
    }
    return undefined;
};

const showEntries = async (slice: BYODSlice, requested: readonly string[], hideOthers: boolean): Promise<string[]> => {
    const affected: string[] = [];
    if (hideOthers) {
        const requestedSet = new Set(requested);
        for (const id of slice.shownEntryIds) {
            if (requestedSet.has(id)) continue;
            await slice.hideEntry(id);
            affected.push(id);
        }
    }
    for (const id of requested) {
        await slice.showEntry(id);
        affected.push(id);
    }
    return affected;
};

const hideEntries = async (slice: BYODSlice, requested: readonly string[], clearAll: boolean): Promise<string[]> => {
    const affected: string[] = [];
    const ids = clearAll ? slice.shownEntryIds : requested;
    for (const id of ids) {
        await slice.hideEntry(id);
        affected.push(id);
    }
    return affected;
};

const removeEntries = async (slice: BYODSlice, requested: readonly string[]): Promise<string[]> => {
    const affected: string[] = [];
    for (const id of requested) {
        await slice.removeEntry(id);
        affected.push(id);
    }
    return affected;
};

export const executeUpdateByodDisplay = async (
    params: z.infer<typeof updateByodDisplaySchema>,
    state: ToolState,
): Promise<z.infer<typeof updateByodDisplayOutputSchema>> => {
    const slice = state.byod;
    const { action, clearAll, hideOthers } = params;
    const requested = params.entryIds ?? [];

    const validationProblem = validateRequestedIds(slice, requested);
    if (validationProblem) return validationProblem;

    let affected: string[];
    if (action === 'show') {
        affected = await showEntries(slice, requested, !!hideOthers);
    } else if (action === 'hide') {
        affected = await hideEntries(slice, requested, !!clearAll);
    } else {
        affected = await removeEntries(slice, requested);
    }

    return {
        action,
        affectedIds: affected,
        shown: [...slice.shownEntryIds],
    };
};
