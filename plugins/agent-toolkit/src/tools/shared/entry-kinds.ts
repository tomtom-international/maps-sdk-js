/**
 * @module agent-toolkit-tools
 *
 * Shared scaffolding for tools that consume multi-kind entry inputs (`analyseData`,
 * `processData`). Centralises the per-{@link EntryDataKind} metadata each tool needs
 * to build its `*EntryIDs` schema fields, sandbox-doc fragments, schema-doc fragments,
 * scope schema and "at least one of …" refine — so the tool files themselves stay
 * focused on their own contract (return-shape validator, per-tool extras, execute body).
 */

import { z } from 'zod';
import type { EntryDataKind } from '../../types';
import { geometriesEntryIDsSchema } from './geometries-id';
import { GEOMETRIES_SCHEMA_DOC } from './geometries-schema-doc';
import { INCIDENTS_SCHEMA_DOC } from './incidents-schema-doc';
import { PLACES_SCHEMA_DOC } from './places-schema-doc';
import { ROUTES_SCHEMA_DOC } from './routes-schema-doc';
import { placesEntryIDsSchema, routesEntryIDsSchema } from './schema';
import { TRAFFIC_AREA_ANALYTICS_SCHEMA_DOC } from './traffic-area-analytics-schema-doc';

/**
 * Canonical ordering for {@link EntryDataKind}. Used wherever per-kind doc fragments or
 * field lists are concatenated — keeps the layout stable regardless of the order kinds
 * appear in a scope or enabled-kinds list.
 *
 * @ignore
 */
export const ALL_ENTRY_DATA_KINDS = [
    'places',
    'routes',
    'incidents',
    'customGeometries',
    'trafficAreaAnalytics',
    'byod',
] as const satisfies readonly EntryDataKind[];

/**
 * Per-kind scope envelope. The classifier emits one of these in `toolScopes.<toolName>`
 * to narrow which kinds the tool's per-turn input schema and code-doc mention.
 *
 * @ignore
 */
export type EntryKindScope = { kinds: readonly EntryDataKind[] };

/**
 * Build a zod scope schema that only accepts kinds within the supplied enabled set.
 * Mirrors the per-tool scope guard so a classifier picking a disabled kind fails-open
 * (the malformed scope is dropped, full surface stays in place).
 *
 * @ignore
 */
export const buildEntryKindScopeSchema = (enabled: readonly EntryDataKind[]) =>
    z.object({
        kinds: z.array(z.enum(enabled as readonly [EntryDataKind, ...EntryDataKind[]])).min(1),
    });

/**
 * `extra` fragment supplied by the tool — appended to each generated input-field
 * description so callers see tool-specific hints alongside the shared metadata.
 *
 * @ignore
 */
type FieldBuildOptions = {
    verb: 'analyse' | 'process';
    requiredHint: string;
};

/**
 * Per-kind metadata. One row per {@link EntryDataKind}. Owns:
 * - field name + label used in schemas and "at least one of" messages;
 * - the factory that produces the `*EntryIDs` zod field for a given tool verb;
 * - the one-line sandbox-doc fragment ("• `placesByEntry` — object keyed by entry id …");
 * - the deep schema-doc fragment (only included when scope commits to this kind);
 * - which recall tool the LLM should call to list available ids.
 *
 * @ignore
 */
export type EntryKindMeta = {
    fieldName: string;
    fieldLabel: string;
    buildField: (options: FieldBuildOptions) => z.ZodTypeAny;
    sandboxDoc: string;
    schemaDoc: string;
    recallTool: string;
};

const placesField = (options: FieldBuildOptions) =>
    placesEntryIDsSchema({
        verb: options.verb,
        extra:
            'Injected as `placesByEntry[id]` (a FeatureCollection per entry id). Undefined when omitted. ' +
            options.requiredHint,
    });

const routesField = (options: FieldBuildOptions) =>
    routesEntryIDsSchema({
        verb: options.verb,
        extra:
            'Injected as `routesByEntry[id]` (a FeatureCollection per entry id). Undefined when omitted. ' +
            options.requiredHint,
    });

const incidentsField = (options: FieldBuildOptions) =>
    z
        .array(z.string())
        .min(1)
        .optional()
        .describe(
            `IDs of existing incidents entries to ${options.verb} (e.g. ["incidents-0"]). ` +
                'Injected as `incidentsByEntry[id]` (a TrafficIncident[] per entry id). Undefined when omitted. ' +
                "Use `recallState({ kind: 'incidents' })` to list incident entries. " +
                options.requiredHint,
        );

const customGeometriesField = (options: FieldBuildOptions) =>
    geometriesEntryIDsSchema
        .optional()
        .describe(
            'Tagged polygon sources `{ kind, id }` (see geometriesEntryIDsSchema). ' +
                'Injected as `geometriesByEntry` (keyed by the tagged source `${kind}:${id}`). Undefined when omitted. ' +
                options.requiredHint,
        );

const trafficAreaAnalyticsField = (options: FieldBuildOptions) =>
    z
        .array(z.string())
        .min(1)
        .optional()
        .describe(
            `IDs of existing traffic-area-analytics entries to ${options.verb} (e.g. ["tta-0"]). ` +
                'Injected as `trafficAreaAnalyticsByEntry[id]` (a FeatureCollection of tile/hex regions with metric ' +
                'properties, per entry id). Undefined when omitted. ' +
                "Use `recallState({ kind: 'trafficAreaAnalytics' })` to list available ids. " +
                options.requiredHint,
        );

const byodField = (options: FieldBuildOptions) =>
    z
        .array(z.string())
        .min(1)
        .optional()
        .describe(
            `IDs of existing BYOD entries to ${options.verb} (e.g. ["byod-0"]) — customer-authored GeoJSON layers. ` +
                'Injected as `byodByEntry[id]` (a FeatureCollection per entry id). Undefined when omitted. ' +
                'Use `recallState` to list available ids. ' +
                options.requiredHint,
        );

/**
 * Single source of truth for the per-kind input vocabulary. Both `analyseData` and
 * `processData` read this map to assemble their input schemas and doc fragments.
 *
 * @ignore
 */
export const ENTRY_KIND_META: Record<EntryDataKind, EntryKindMeta> = {
    places: {
        fieldName: 'placesEntryIDs',
        fieldLabel: '`placesEntryIDs`',
        buildField: placesField,
        sandboxDoc:
            '• `placesByEntry` — object keyed by `placesEntryIDs` id; each value a FeatureCollection of that ' +
            "entry's places. Merge all entries with `Object.values(placesByEntry).flatMap(fc => fc.features)`.",
        schemaDoc: PLACES_SCHEMA_DOC,
        recallTool: "recallState({ kind: 'places' })",
    },
    routes: {
        fieldName: 'routesEntryIDs',
        fieldLabel: '`routesEntryIDs`',
        buildField: routesField,
        sandboxDoc:
            '• `routesByEntry` — object keyed by `routesEntryIDs` id; each value a FeatureCollection of that ' +
            "entry's Route LineStrings. Merge all entries with `Object.values(routesByEntry).flatMap(fc => fc.features)`. " +
            'On-route incidents live in `f.properties.sections.traffic[]` (each ' +
            '`{ categories: string[], magnitudeOfDelay, delayInSeconds }`) — there is NO `f.properties.incidents`. ' +
            'Route totals are on `f.properties.summary` (`travelTimeInSeconds`, `trafficDelayInSeconds`).',
        schemaDoc: ROUTES_SCHEMA_DOC,
        recallTool: "recallState({ kind: 'routes' })",
    },
    incidents: {
        fieldName: 'incidentsEntryIDs',
        fieldLabel: '`incidentsEntryIDs`',
        buildField: incidentsField,
        sandboxDoc:
            '• `incidentsByEntry` — object keyed by `incidentsEntryIDs` id; each value a flat `TrafficIncident[]` ' +
            'for that entry. Merge all entries with `Object.values(incidentsByEntry).flat()`.',
        schemaDoc: INCIDENTS_SCHEMA_DOC,
        recallTool: "recallState({ kind: 'incidents' })",
    },
    customGeometries: {
        fieldName: 'geometriesEntryIDs',
        fieldLabel: '`geometriesEntryIDs`',
        buildField: customGeometriesField,
        sandboxDoc:
            '• `geometriesByEntry` — object keyed by the tagged source `${kind}:${id}` (geometries mixes sources); ' +
            'each value a mixed Polygon/MultiPolygon array. Merge all with `Object.values(geometriesByEntry).flat()`. ' +
            'Every feature also carries `properties._source: { kind, id }` so you can filter by role (see `GEOMETRIES_PROPS_DOC`).',
        schemaDoc: GEOMETRIES_SCHEMA_DOC,
        recallTool: "recallState({ kind: 'geometries' })",
    },
    trafficAreaAnalytics: {
        fieldName: 'trafficAreaAnalyticsEntryIDs',
        fieldLabel: '`trafficAreaAnalyticsEntryIDs`',
        buildField: trafficAreaAnalyticsField,
        sandboxDoc:
            '• `trafficAreaAnalyticsByEntry` — object keyed by `trafficAreaAnalyticsEntryIDs` id; each value a ' +
            'TrafficAreaAnalytics FeatureCollection for that entry. Each feature is a region whose metrics live under ' +
            '`feature.properties.baseData` (e.g. `congestionLevel`, `speed`, `freeFlowSpeed`, `travelTime`, ' +
            "`networkLength`). Each entry's collection keeps its own top-level `properties` (metrics list, date range, " +
            'ranges) intact — no cross-entry merge.',
        schemaDoc: TRAFFIC_AREA_ANALYTICS_SCHEMA_DOC,
        recallTool: "recallState({ kind: 'trafficAreaAnalytics' })",
    },
    byod: {
        fieldName: 'byodEntryIDs',
        fieldLabel: '`byodEntryIDs`',
        buildField: byodField,
        sandboxDoc:
            '• `byodByEntry` — object keyed by `byodEntryIDs` id; each value a customer-authored GeoJSON ' +
            'FeatureCollection. Merge all with `Object.values(byodByEntry).flatMap(fc => fc.features)`. Mixed Point / ' +
            'LineString / Polygon features are normal (BYOD layers carry whatever the integrator uploaded). Treat ' +
            '`feature.properties` as opaque application-specific data.',
        schemaDoc: '',
        recallTool: "recallState({ kind: 'byod' })",
    },
};

/**
 * Resolve the set of kinds active for a single per-turn build: the intersection of
 * the agent's enabled kinds and the classifier's per-turn scope. `scope === undefined`
 * means "no per-turn narrowing — every enabled kind stays in scope".
 *
 * @ignore
 */
export const resolveActiveKinds = (
    enabled: readonly EntryDataKind[],
    scope: EntryKindScope | undefined,
): readonly EntryDataKind[] =>
    ALL_ENTRY_DATA_KINDS.filter((kind) => enabled.includes(kind) && (!scope || scope.kinds.includes(kind)));

/**
 * Predicate form of {@link resolveActiveKinds} for a single kind. Used when generating
 * tool-specific fields (e.g. analyseData's `monitor`) that should only appear when
 * `incidents` is in the active set.
 *
 * @ignore
 */
export const isKindActive = (
    enabled: readonly EntryDataKind[],
    scope: EntryKindScope | undefined,
    kind: EntryDataKind,
): boolean => enabled.includes(kind) && (!scope || scope.kinds.includes(kind));

/**
 * Slash-joined list of scoped `*EntryIDs` field labels — used in "At least one of `A` / `B`
 * must be set." messages and in per-field hints. Order follows {@link ALL_ENTRY_DATA_KINDS}.
 *
 * @ignore
 */
export const buildEntryFieldList = (active: readonly EntryDataKind[]): string =>
    active.map((kind) => ENTRY_KIND_META[kind].fieldLabel).join(' / ');

/**
 * Join the per-kind sandbox-doc fragments in canonical order for the supplied active set.
 * Returns the multi-line "Each input is …" block.
 *
 * @ignore
 */
export const buildEntryKindSandboxDocs = (active: readonly EntryDataKind[]): string =>
    ALL_ENTRY_DATA_KINDS.filter((kind) => active.includes(kind))
        .map((kind) => ENTRY_KIND_META[kind].sandboxDoc)
        .join('\n');

/**
 * Join the per-kind deep schema-doc fragments in canonical order for the supplied active
 * set. Empty when no active kind has a schema doc (only places / routes / customGeometries
 * carry one today).
 *
 * @ignore
 */
export const buildEntryKindSchemaDocs = (active: readonly EntryDataKind[]): string =>
    ALL_ENTRY_DATA_KINDS.filter((kind) => active.includes(kind))
        .map((kind) => ENTRY_KIND_META[kind].schemaDoc)
        .filter((doc) => doc.length > 0)
        .join('\n\n');

/**
 * Build the input-shape Record passed into `z.object({...})`. Both tools share this
 * shape — each kind in the active set contributes its `*EntryIDs` field via
 * {@link EntryKindMeta.buildField}. Tools layer their own per-tool fields onto the
 * resulting record before calling `z.object`.
 *
 * @ignore
 */
export const buildEntryIdFields = (
    active: readonly EntryDataKind[],
    options: FieldBuildOptions,
): Record<string, z.ZodTypeAny> => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const kind of ALL_ENTRY_DATA_KINDS) {
        if (!active.includes(kind)) continue;
        const meta = ENTRY_KIND_META[kind];
        shape[meta.fieldName] = meta.buildField(options);
    }
    return shape;
};

/**
 * Set of LLM-input objects that contain any `*EntryIDs` field. Used by the shared
 * "at least one of …" refine so both tools agree on what counts as "input present".
 *
 * `geometriesEntryIDs` carries `GeometriesId[]`; the rest carry `string[]`. We treat
 * either as "present" when the array has length, which is what the existing inline
 * refines did.
 *
 * @ignore
 */
export const hasAnyEntryIds = (value: Record<string, unknown>): boolean => {
    for (const kind of ALL_ENTRY_DATA_KINDS) {
        const arr = value[ENTRY_KIND_META[kind].fieldName] as unknown[] | undefined;
        if (arr?.length) return true;
    }
    return false;
};

/**
 * Message used by the shared "at least one of …" refine. Lists the active kinds'
 * field labels and the slash-joined recall-tool hints for the same set.
 *
 * @ignore
 */
export const buildAtLeastOneEntryIdMessage = (active: readonly EntryDataKind[]): string => {
    const fields = buildEntryFieldList(active);
    const recalls = Array.from(new Set(active.map((kind) => ENTRY_KIND_META[kind].recallTool)))
        .map((tool) => `\`${tool}\``)
        .join(' / ');
    return `At least one of ${fields} must be set. Call ${recalls} first to list available ids.`;
};
