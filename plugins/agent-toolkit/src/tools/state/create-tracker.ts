/**
 * @module agent-toolkit-tools
 *
 * `createTracker` — arm a generic tracker. A tracker is one rule: sandbox `code` that reads the same
 * multi-kind inputs as `analyseData` and returns a {@link Verdict} (`{ active, members, summary }`). The
 * tool dry-runs the code once as a gate, registers the tracker with its rising-edge bit clear, registers
 * its rule as a {@link JobEngine} job (so the verdict recomputes whenever its source entries change),
 * then feeds that first verdict through the reducer — so a condition already true at arm time crosses
 * false→true and fires one `opened` alert. From then on {@link EventsState} logs an `opened` alert /
 * `resolved` event as the verdict crosses edges.
 *
 * Mirrors `analyseData`'s input surface (`*EntryIDs` per kind) so a rule can read multiple entry kinds —
 * e.g. "an incident within 100m of a hospital" is one rule over a places + an incidents entry.
 */

import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import { isVerdict, type Tracker } from '../../state';
import type { GeometriesId, ToolState } from '../../types';
import {
    ALL_ENTRY_DATA_KINDS,
    buildAtLeastOneEntryIdMessage,
    buildEntryFieldList,
    buildEntryIdFields,
    buildEntryKindSandboxDocs,
    buildEntryKindSchemaDocs,
    buildSandboxToolsDoc,
    hasAnyEntryIds,
    MULTI_INPUT_SANDBOX_PARAMS,
    packSandboxArgs,
    prepareMultiInputs,
    runSandboxedFn,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';
import { registerTrackerJob } from './monitoring';

/** The `code` contract: read the injected inputs, return a {@link Verdict}. */
const buildVerdictCodeDoc = (): string =>
    'JS that inspects the injected inputs and returns a VERDICT describing whether the watched condition ' +
    'holds RIGHT NOW. Pure + synchronous — no fetch/network/await.\n\n' +
    buildSandboxToolsDoc(ALL_ENTRY_DATA_KINDS, false) +
    'Each input is `undefined` when its `*EntryIDs` argument was omitted — guard before reading. When defined:\n' +
    `${buildEntryKindSandboxDocs(ALL_ENTRY_DATA_KINDS)}\n\n` +
    'Return exactly:\n' +
    '`{ active: boolean, members: { entryId: string, featureIds: string[] }[], summary: string }`\n' +
    '- `active`: is the condition met now? (false→true logs an alert; true→false resolves it)\n' +
    '- `members`: the features that matched, GROUPED BY their source entry id — include EVERY entity the ' +
    'alert is about (e.g. the hospital AND the nearby incidents), each under its own entry id.\n' +
    '- `summary`: a short grounded headline built from the data (e.g. "Incident 80m from St Mary\'s Hospital").\n\n' +
    // Full per-kind field reference (places / routes / customGeometries). createTracker is always
    // full-surface (no classifier scope to narrow on), and tracker rules are the case that most needs
    // exact field names — cross-kind spatial joins read geometry + properties across kinds.
    buildEntryKindSchemaDocs(ALL_ENTRY_DATA_KINDS);

/** createTracker input schema — full multi-kind input surface (same `*EntryIDs` fields as analyseData). */
export const createTrackerSchema = (() => {
    const requiredHint = `At least one of ${buildEntryFieldList(ALL_ENTRY_DATA_KINDS)} is REQUIRED.`;
    const shape: Record<string, z.ZodTypeAny> = {
        ...buildEntryIdFields(ALL_ENTRY_DATA_KINDS, { verb: 'analyse', requiredHint }),
    };
    shape.name = z.string().describe('Short tracker label, e.g. "Incidents near hospitals".');
    shape.rule = z
        .string()
        .describe(
            'The watched condition in plain language, e.g. "an incident within 100m of a hospital". For display.',
        );
    shape.code = z.string().describe(buildVerdictCodeDoc());
    return z.object(shape).refine(hasAnyEntryIds, { message: buildAtLeastOneEntryIdMessage(ALL_ENTRY_DATA_KINDS) });
})();

/** createTracker output schema. */
export const createTrackerOutputSchema = z.union([
    z.object({
        trackerId: z.string(),
        name: z.string(),
        rule: z.string(),
        watching: z.array(z.string()).describe('Source entry ids the rule reads.'),
        firingNow: z
            .boolean()
            .describe('Whether the condition holds at arm time. If true, one `opened` alert fires for it.'),
        summary: z.string().describe('The arm-time verdict summary.'),
    }),
    toolErrorSchema,
]);

export const createTrackerDescription =
    'Arm a tracker: watch loaded entries and alert when a condition crosses from false to true (and log ' +
    'when it clears). You write `code` returning `{ active, members, summary }`; it recomputes automatically ' +
    'whenever the watched entries change (a monitored incidents poll, a re-search, …). Reads the same ' +
    'multi-kind inputs as `analyseData`, so one rule can span kinds — e.g. an incident near a hospital. ' +
    'The `*EntryIDs` you pass MUST be ids of entries already loaded this session — load them FIRST ' +
    '(e.g. call getTrafficIncidents and pass its returned entry id) and never invent ids like "incidents-0". ' +
    'CONTRAST `analyseData` (one-shot metadata, no alerting). Use `clearTracker` to stop, `getTrackerHistory` ' +
    'to read what fired.';

type CreateTrackerInput = {
    placesEntryIDs?: string[];
    routesEntryIDs?: string[];
    incidentsEntryIDs?: string[];
    geometriesEntryIDs?: GeometriesId[];
    trafficAreaAnalyticsEntryIDs?: string[];
    byodEntryIDs?: string[];
    name: string;
    rule: string;
    code: string;
};

export const executeCreateTracker = async (
    params: CreateTrackerInput,
    state: ToolState,
): Promise<z.infer<typeof createTrackerOutputSchema>> => {
    const inputs = {
        placesEntryIDs: params.placesEntryIDs,
        routesEntryIDs: params.routesEntryIDs,
        incidentsEntryIDs: params.incidentsEntryIDs,
        geometriesEntryIDs: params.geometriesEntryIDs,
        trafficAreaAnalyticsEntryIDs: params.trafficAreaAnalyticsEntryIDs,
        byodEntryIDs: params.byodEntryIDs,
    };

    const prepared = await prepareMultiInputs(inputs, state);
    if ('error' in prepared) return { error: prepared.error };
    const { resolved, sandbox, geometries: geometriesMeta } = prepared.value;

    // Dry-run the rule once: this both GATES (must return a Verdict) and SEEDS the rising-edge bit.
    const run = await runSandboxedFn(
        params.code,
        MULTI_INPUT_SANDBOX_PARAMS,
        packSandboxArgs(sandbox, { h3, turf }),
        'Tracker rule',
        state.codeExecution,
    );
    if ('error' in run) return { error: run.error };
    if (!isVerdict(run.value)) {
        return {
            error: 'Tracker `code` must return { active: boolean, members: {entryId, featureIds}[], summary: string }.',
        };
    }
    const verdict = run.value;

    const affectedEntryIds = [
        ...resolved.places.map((e) => e.id),
        ...resolved.routes.map((e) => e.id),
        ...resolved.incidents.map((e) => e.id),
        ...resolved.trafficAreaAnalytics.map((e) => e.id),
        ...resolved.byod.map((e) => e.id),
        ...geometriesMeta.affectedEntries.map((e) => e.id),
    ];

    const trackerId = uniqueTrackerId(params.name, state);
    const timestamp = Date.now();

    // Register the tracker with its rising-edge bit CLEAR and its job, THEN feed the arm-time verdict
    // through the SAME reducer as any later recompute: a condition already true at creation crosses
    // false→true and fires one `opened` alert (the user asked to watch something already happening —
    // surface it once). It does not re-toast while it stays active; only a resolve→reopen does. An
    // inactive arm-time verdict is a no-op (stays clear).
    const tracker: Tracker = {
        id: trackerId,
        name: params.name,
        rule: params.rule,
        affectedEntryIds,
        enabled: true,
        wasActive: false,
    };
    state.trackers.register(tracker);
    registerTrackerJob(state, { trackerId, code: params.code, inputs, affectedEntryIds });
    state.trackers.ingestVerdict(trackerId, verdict, timestamp);

    return {
        trackerId,
        name: params.name,
        rule: params.rule,
        watching: affectedEntryIds,
        firingNow: verdict.active,
        summary: verdict.summary,
    };
};

// trackerId = a slug of the name, deduped against existing trackers (`hospitals`, `hospitals-2`, …).
const uniqueTrackerId = (name: string, state: ToolState): string => {
    const base =
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'tracker';
    const taken = new Set(state.trackers.trackers.map((t) => t.id));
    if (!taken.has(base)) return base;
    for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
};
