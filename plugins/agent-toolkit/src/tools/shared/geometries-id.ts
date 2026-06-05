/**
 * @module agent-toolkit-tools
 *
 * Tagged identifier for the unified geometries namespace. Every polygon
 * source the toolkit knows about — place footprints, isochrone polygons,
 * derived custom-geometries entries — is referenced through a single
 * `{ kind, id }` object so consumers don't have to disambiguate by
 * parameter name (or guess where an id comes from).
 */

import { z } from 'zod';

/**
 * Possible kinds in a geometries id.
 *
 * @group Agent Toolkit
 */
export type GeometriesIdKind = 'place' | 'places' | 'ranges' | 'customGeometries';

/**
 * Tagged geometries id. The Zod schema is exposed so tools can plug it
 * straight into their input shape (`z.array(geometriesIdSchema).min(1)`)
 * — no string parsing on the way in.
 *
 * @group Agent Toolkit
 */
export const geometriesIdSchema = z
    .discriminatedUnion('kind', [
        z
            .object({
                kind: z.literal('place').describe('Use the exact literal "place".'),
                id: z.string().min(1).describe('Id of a single place; resolves to that place’s footprint.'),
            })
            .describe('A single place footprint.'),
        z
            .object({
                kind: z.literal('places').describe('Use the exact literal "places".'),
                id: z.string().min(1).describe('Id of a places-entry; resolves to every footprint in the entry.'),
            })
            .describe('Every footprint in a places entry.'),
        z
            .object({
                kind: z.literal('ranges').describe('Use the exact literal "ranges".'),
                id: z
                    .string()
                    .min(1)
                    .describe('Id of a ranges-entry; resolves to every isochrone polygon in the entry.'),
            })
            .describe('Every isochrone polygon in a ranges entry.'),
        z
            .object({
                kind: z.literal('customGeometries').describe('Use the exact literal "customGeometries".'),
                id: z
                    .string()
                    .min(1)
                    .describe('Id of a custom-geometries entry produced by a previous `processData` call.'),
            })
            .describe('A derived entry produced by a previous `processData` call.'),
    ])
    .describe(
        'Tagged id `{ kind, id }`. `kind` must be exactly one of: "place" | "places" | "ranges" | "customGeometries" ' +
            '(do NOT use variants like "ranges-entry", "place-footprints", etc.). ' +
            'Use `recallGeometries` to list every available `{kind, id}` pair.',
    );

/**
 * Tagged id for any polygon source in session state.
 *
 * @group Agent Toolkit
 */
export type GeometriesId = z.infer<typeof geometriesIdSchema>;

/**
 * Shared `geometriesEntryIDs` input schema for tools that read polygons from
 * session state (`processGeometries`, `analyseGeometries`). One canonical
 * description so the two tools stay aligned and the model sees the same
 * contract everywhere.
 *
 * @ignore
 */
export const geometriesEntryIDsSchema = z
    .array(geometriesIdSchema)
    .min(1)
    .describe(
        'Tagged ids `{ kind, id }` of polygon sources to feed the run. `kind` must be exactly one of ' +
            '`"place"` | `"places"` | `"ranges"` | `"customGeometries"` (no variants). Mix kinds freely (e.g. union ' +
            'place footprints with isochrones). Use `recallGeometries` to list available ids.',
    );

/**
 * One-liner describing the per-source variability of `geometry.properties`.
 * Shared between `processGeometries` and `analyseGeometries` `code` prompts.
 *
 * @ignore
 */
export const GEOMETRIES_PROPS_DOC =
    '`geometry.properties` shape varies by source — place footprints: `CommonPlaceProps`; ranges: ' +
    'service response (`range.type`, `range.value`); custom: whatever the producing op set. Treat as ' +
    'opaque unless you know the source. ' +
    'Every feature also carries `properties._source: { kind, id }` (the tagged id it was passed in ' +
    'under) — use it to filter / partition mixed inputs by role inside the sandbox.';

/**
 * Shared description for `skipped` arrays in tool outputs.
 *
 * @ignore
 */
export const GEOMETRIES_SKIPPED_DESC =
    'Source ids that could not contribute (unknown id, no geometry data source, fetch failure, or empty entry).';

/**
 * Shared description for `sourceIds` arrays in tool outputs.
 *
 * @ignore
 */
export const GEOMETRIES_SOURCE_IDS_DESC =
    'Tagged input ids that contributed at least one polygon to the run, in input order.';
