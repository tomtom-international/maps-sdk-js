/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import { runIncidentSpec } from '../../state/traffic-incidents/analysis';
import type { ToolState } from '../../types';
import { ANALYSE_OUTPUT_FORMAT_DESCRIPTION, buildAnalyseReturnPrompt, buildSandboxCodePrompt } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the analyse-incidents tool. */
export const analyseIncidentsOutputSchema = z.union([
    z.object({
        incidentsEntryID: z.string().describe('ID of the source incidents entry the analysis was attached to.'),
        name: z.string().describe('Unique name of the analysis within the entry.'),
        description: z.string().optional(),
        outputFormat: z
            .enum(['json', 'chart'])
            .describe(
                'How the consumer should render `analysis`: `json` = plain object to display as text; ' +
                    '`chart` = Chart.js `ChartConfiguration` to feed directly into `new Chart(ctx, analysis)` in the chat message UI.',
            ),
        analysis: z
            .unknown()
            .describe(
                'The aggregation result. Shape depends on `outputFormat`: ' +
                    'when `json`, any JSON-serializable value; when `chart`, a Chart.js `ChartConfiguration` ({ type, data, options? }).',
            ),
        focused: z
            .object({
                incidentsEntryID: z.string(),
                focusedCount: z.number(),
                droppedIds: z.array(z.string()),
                reason: z.string().optional(),
            })
            .optional()
            .describe(
                'Present when the analysis result included a `focusIds` field — the tool applied that focus ' +
                    'as a side-effect on the source entry. The agent can read `focusedCount` to confirm.',
            ),
    }),
    toolErrorSchema,
]);

/** Tool schema for analyse-incidents. */
export const analyseIncidentsSchema = z.object({
    incidentsEntryID: z
        .string()
        .optional()
        .describe(
            'ID of an existing incidents entry to analyse. Omit to analyse the most recently fetched entry. ' +
                'The analysis is attached to that entry under `_analyses` with the given name; ' +
                'the latest result is read via `_analyses.getResult(name)` and the timeline via `_analyses.history(name)`.',
        ),
    name: z
        .string()
        .describe(
            'Unique name within the entry (e.g. "by-category", "delay-by-road", "hex-density-8"). Reusing a name ' +
                'replaces the previous analysis on the same entry.',
        ),
    description: z.string().optional().describe('Optional short description of what the analysis computes.'),
    outputFormat: z.enum(['json', 'chart']).optional().describe(ANALYSE_OUTPUT_FORMAT_DESCRIPTION),
    code: z
        .string()
        .describe(
            'Async JS that aggregates the injected `incidents` and returns the result. ' +
                '`now: Date` is the call-start time (compare against `startTime`/`endTime`). ' +
                '`log(...)` writes into the response logs.\n\n' +
                `${buildSandboxCodePrompt(['incidents', 'h3', 'turf', 'now', 'log', 'previous'])}\n\n` +
                'PREVIOUS: the 6th argument is `previous` — your last result for this spec on the source entry, ' +
                'or `undefined` on the first run. Use it for id stability (e.g. reuse a previous group/cluster id when ' +
                'memberIds overlap by ≥50%) and to surface short trend reads ("growing" / "fading" / "steady") in your ' +
                'output. Always handle `previous === undefined` gracefully — it is `undefined` on every first run.\n\n' +
                `${buildAnalyseReturnPrompt('counts, top-N, groupings, hex bins, corridor totals', '`labels: incidents.map(i => [i.properties.from ?? "?", i.properties.events[0]?.description ?? "", \\`${(i.properties.delayInSeconds ?? 0)}s delay\\`])`')}\n\n` +
                'TrafficIncident schema (input shape):\n' +
                '```\n' +
                'type TrafficIncident = {\n' +
                '    type: "Feature",\n' +
                '    id: string,\n' +
                '    geometry: { type: "Point", coordinates: [lng, lat] } | { type: "LineString", coordinates: [lng,lat][] },\n' +
                '    properties: {\n' +
                '        id: string,\n' +
                '        category: "accident" | "animals-on-road" | "broken-down-vehicle" | "danger" | "flooding" | "fog" | "frost"\n' +
                '                  | "jam" | "lane-closed" | "narrow-lanes" | "other" | "rain" | "road-closed" | "roadworks" | "wind",\n' +
                '        magnitudeOfDelay: "unknown" | "minor" | "moderate" | "major" | "indefinite",\n' +
                '        timeValidity: "present" | "future",\n' +
                '        delayInSeconds?: number,\n' +
                '        lengthInMeters?: number,\n' +
                '        roadNumbers?: string[],\n' +
                '        from?: string,\n' +
                '        to?: string,\n' +
                '        startTime?: Date,\n' +
                '        endTime?: Date,\n' +
                '        events: { description: string }[],\n' +
                '    },\n' +
                '};\n' +
                '```\n\n' +
                'Examples (one canonical shape per kind — adapt rather than copy verbatim):\n' +
                '- counts: `const c = {}; for (const i of incidents) c[i.properties.category] = (c[i.properties.category] ?? 0) + 1; return { total: incidents.length, byCategory: c };`\n' +
                '- top-N: `return [...incidents].sort((a,b) => (b.properties.delayInSeconds ?? 0) - (a.properties.delayInSeconds ?? 0)).slice(0,5).map(i => ({ id: i.properties.id, delay: i.properties.delayInSeconds, road: i.properties.roadNumbers?.[0] }));`\n' +
                "- bar chart: `const c = {}; for (const i of incidents) c[i.properties.category] = (c[i.properties.category] ?? 0) + 1; const e = Object.entries(c).sort((a,b) => b[1]-a[1]); return { type: 'bar', data: { labels: e.map(x => x[0]), datasets: [{ label: 'Incidents', data: e.map(x => x[1]) }] } };`\n" +
                "- h3 density: `const bins = {}; for (const i of incidents) { const c = i.geometry.type === 'Point' ? i.geometry.coordinates : turf.centroid(i).geometry.coordinates; bins[h3.latLngToCell(c[1], c[0], 8)] = (bins[h3.latLngToCell(c[1], c[0], 8)] ?? 0) + 1; } return { resolution: 8, bins };`\n" +
                '- spatial clusters (slowdown pockets, ranked corridors): produce ' +
                '`{ groups: [{ id, headline, body, memberIds, centroid, size, totalDelaySeconds, peakDelaySeconds, diameterKm, primaryRoads }] }` plus ' +
                '`focusIds` for the worst group. ' +
                'CRITICAL: `id` must be `"c1"`, `"c2"`, … (rank, NOT centroid coords or TTI ids — the agent quotes these verbatim in chat). ' +
                '`headline` must be a road label like `` `${primaryRoads[0]} corridor` `` (the user reads this directly). ' +
                '`body` is the metric line `` `Trend ${trend} · total ${(totalDelay/60).toFixed(1)} min · ${size} incidents · ${diameterKm.toFixed(2)} km wide` ``. ' +
                'Reference implementation (adapt eps / minPoints / cap as needed):\n' +
                '```\n' +
                'const pts = incidents.filter(i => (i.properties.delayInSeconds ?? 0) > 60).map(i => {\n' +
                "  const c = i.geometry.type === 'Point' ? i.geometry.coordinates : turf.centroid(i).geometry.coordinates;\n" +
                '  return turf.point(c, { id: i.properties.id, delay: i.properties.delayInSeconds, road: i.properties.roadNumbers?.[0] ?? null, from: i.properties.from ?? null });\n' +
                '});\n' +
                'if (pts.length === 0) return { groups: [], focusIds: [] };\n' +
                "const clustered = turf.clustersDbscan(turf.featureCollection(pts), 0.4, { units: 'kilometers', minPoints: 4 });\n" +
                'const buckets = {};\n' +
                'for (const f of clustered.features) {\n' +
                '  const cid = f.properties.cluster;\n' +
                '  if (cid == null) continue;\n' +
                '  (buckets[cid] ??= []).push(f);\n' +
                '}\n' +
                'const ranked = Object.values(buckets).map(feats => {\n' +
                '  const memberIds = feats.map(f => f.properties.id);\n' +
                '  const totalDelaySeconds = feats.reduce((s, f) => s + f.properties.delay, 0);\n' +
                '  const peakDelaySeconds = feats.reduce((m, f) => Math.max(m, f.properties.delay), 0);\n' +
                '  const centroid = turf.centroid(turf.featureCollection(feats)).geometry.coordinates;\n' +
                '  const bb = turf.bbox(turf.featureCollection(feats));\n' +
                "  const diameterKm = turf.distance([bb[0], bb[1]], [bb[2], bb[3]], { units: 'kilometers' });\n" +
                '  const roadCount = {};\n' +
                '  for (const f of feats) if (f.properties.road) roadCount[f.properties.road] = (roadCount[f.properties.road] ?? 0) + 1;\n' +
                '  const primaryRoads = Object.entries(roadCount).sort((a,b) => b[1]-a[1]).slice(0,3).map(([r]) => r);\n' +
                '  return { memberIds, centroid, size: feats.length, totalDelaySeconds, peakDelaySeconds, diameterKm, primaryRoads };\n' +
                '}).filter(g => g.diameterKm <= 2)\n' +
                '  .sort((a,b) => b.totalDelaySeconds - a.totalDelaySeconds)\n' +
                '  .slice(0, 6)\n' +
                '  .map((g, i) => {\n' +
                "    const trend = 'new'; // optionally compare against `previous` here\n" +
                "    const road = g.primaryRoads[0] ?? 'cluster';\n" +
                '    const headline = `${road} corridor`;\n' +
                '    const body = `Trend ${trend} · total ${(g.totalDelaySeconds/60).toFixed(1)} min · ${g.size} incidents · ${g.diameterKm.toFixed(2)} km wide`;\n' +
                '    return { id: `c${i+1}`, headline, body, ...g };\n' +
                '  });\n' +
                'return { groups: ranked, focusIds: ranked[0]?.memberIds ?? [], focusReason: ranked[0] ? `${ranked[0].headline}: worst total delay` : undefined };\n' +
                '```\n' +
                'Knobs: eps 0.3–0.5 km (eps ≥ 1 km chains every corridor into one mega-cluster); pre-filter delay > 60s to drop zero-delay roadworks/closures; cap diameter ≤ 2 km for "compact pocket".\n' +
                '- trend across ticks: when `previous` is non-undefined, reuse a prior group id when `memberIds` overlap ≥50%, then derive `growing`/`fading`/`steady` from `totalDelaySeconds` ratio against the matched prior (else `new`).',
        ),
});

export const analyseIncidentsDescription =
    'Aggregate an incidents entry via dynamic JS: counts, top-N, group-bys, hex density, charts, spatial clusters. ' +
    'Registered against ONE entry — re-runs on every monitor-tick of that entry, with `previous` carrying the prior ' +
    'result for trend reads. Reusing a name replaces the spec. Does NOT create new entries. ' +
    '`code` is an async function BODY (not a function expression) that uses `incidents`, `h3`, `turf`, `now`, `log`, `previous` ' +
    'and ends with `return result;`. `outputFormat: "json"` (default) or `"chart"`. ' +
    'FOCUS SIDE-EFFECT: when the result has `focusIds: string[]` (+ optional `focusReason`), setFocus is called once ' +
    'on the source entry — monitor-tick replays do NOT re-apply it. For pure focus, use focusIncidents.';

export const executeAnalyseIncidents = async (
    params: z.infer<typeof analyseIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof analyseIncidentsOutputSchema>> => {
    const { incidentsEntryID, name, description, code, outputFormat = 'json' } = params;

    const allEntries = state.trafficIncidents.entries;
    const sourceEntry = incidentsEntryID
        ? allEntries.find((entry) => entry.id === incidentsEntryID)
        : allEntries[allEntries.length - 1];

    if (!sourceEntry) {
        return {
            error: incidentsEntryID
                ? `No incidents entry with id "${incidentsEntryID}". Call getTrafficIncidents first.`
                : 'No incidents entries available to analyse. Call getTrafficIncidents first.',
        };
    }

    const spec = {
        name,
        ...(description && { description }),
        outputFormat,
        code,
        source: sourceEntry.id,
    };
    const previous = sourceEntry._analyses?.getResult(name)?.data;

    // Register the spec *before* the first run so that even when the initial run
    // errors (and we surface the error to the agent), the spec stays available
    // for the next monitor tick to retry. Replay drops failures silently.
    state.trafficIncidents.setAnalysisSpec(spec);

    const sampledAt = sourceEntry.timestamp;
    const result = await runIncidentSpec(spec, sourceEntry.data, previous, sampledAt);

    if ('error' in result) {
        return { error: result.error };
    }

    const { value: analysis } = result;
    state.trafficIncidents.addAnalysisToEntry(sourceEntry.id, {
        name,
        timestamp: sampledAt,
        ...(description && { description }),
        outputFormat,
        data: analysis,
    });

    const focused = applyFocusSideEffect(analysis, sourceEntry.id, state);

    return {
        incidentsEntryID: sourceEntry.id,
        name,
        ...(description && { description }),
        outputFormat,
        analysis,
        ...(focused && { focused }),
    };
};

type FocusSideEffect = {
    incidentsEntryID: string;
    focusedCount: number;
    droppedIds: string[];
    reason?: string;
};

/**
 * Honour `focusIds` / `focusReason` on the analysis result by calling `setFocus` against the
 * source entry. One-shot — re-runs from `_rerunRegisteredSpecs` skip this branch.
 */
const applyFocusSideEffect = (
    analysis: unknown,
    targetEntryID: string,
    state: ToolState,
): FocusSideEffect | undefined => {
    if (!analysis || typeof analysis !== 'object') return undefined;
    const focusIds = (analysis as { focusIds?: unknown }).focusIds;
    if (!Array.isArray(focusIds) || focusIds.length === 0) return undefined;
    const ids = focusIds.filter((id): id is string => typeof id === 'string');
    if (ids.length === 0) return undefined;
    const reasonRaw = (analysis as { focusReason?: unknown }).focusReason;
    const reason = typeof reasonRaw === 'string' ? reasonRaw : undefined;
    const result = state.trafficIncidents.setFocus(targetEntryID, ids, reason);
    return {
        incidentsEntryID: targetEntryID,
        focusedCount: result.focusedCount,
        droppedIds: result.droppedIds,
        ...(reason && { reason }),
    };
};
