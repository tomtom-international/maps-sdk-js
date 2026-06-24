/**
 * @module agent-toolkit-tools
 *
 * Shared input schema building blocks reused across multiple tools.
 */

import { z } from 'zod';

/** @ignore */
export const geoJsonBBoxSchema = z
    .union([z.array(z.number()).refine((arr) => arr.length === 4, { message: 'BBox must have 4 elements' })])
    .describe('[minLng, minLat, maxLng, maxLat] or [W,S,E,N]');

/** @ignore */
export const polygonInputSchema = z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
});

/** @ignore */
export const multiPolygonInputSchema = z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(z.array(z.number())))),
});

/** @ignore */
export const geometryInputSchema = z.union([polygonInputSchema, multiPolygonInputSchema]);

/**
 * Shared factory for the optional `placesEntryIDs` input field — one or more
 * existing places-entry IDs that a tool should operate on. Each caller supplies
 * a `verb` (filter/analyse/display/…) and optional follow-up text so the LLM
 * sees a description tailored to that tool.
 *
 * @ignore
 */
export const placesEntryIDsSchema = ({ verb, extra }: { verb: string; extra?: string }) =>
    z
        .array(z.string())
        .min(1)
        .optional()
        .describe(
            `IDs of existing places entries to ${verb} (e.g. ["places-2"], ["places-1", "places-2"]). ` +
                `Use recallState to list IDs. Omit to ${verb} the latest entry.` +
                (extra ? ` ${extra}` : ''),
        );

/**
 * Shared factory for the optional `routesEntryIDs` input field — one or more existing routes-entry
 * IDs that a tool should operate on. Mirrors `placesEntryIDsSchema` for routes.
 *
 * @ignore
 */
export const routesEntryIDsSchema = ({ verb, extra }: { verb: string; extra?: string }) =>
    z
        .array(z.string())
        .min(1)
        .optional()
        .describe(
            `IDs of existing routes entries to ${verb} (e.g. ["routes-0"], ["routes-0", "routes-1"]). ` +
                `Use recallState to list IDs. Omit to ${verb} the latest route.` +
                (extra ? ` ${extra}` : ''),
        );

/**
 * Optional semantic id for a new places entry. Encourages the LLM to derive a compact,
 * memorable identifier from the user's prompt so later tool calls can reference the entry
 * without scanning a numeric history. The id is auto-suffixed (`-2`, `-3`, ...) on collision,
 * so the LLM never has to track uniqueness across calls itself.
 *
 * @ignore
 */
export const placesEntryIdHintSchema = z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,48}$/, 'Use lowercase letters, digits, and hyphens (2–49 chars).')
    .optional()
    .describe(
        'Compact lowercase kebab-case id derived from the user prompt ' +
            '(e.g. "vegan-cafes-amsterdam", "ev-stations-along-route"). ' +
            'Avoid generic names like "places" / "results". ' +
            'Auto-suffixed on collision — do not track uniqueness yourself. Default: `places-N`.',
    );

/**
 * Reusable `mode` field for show-on-map options that render polygons into an entry's
 * own `GeometriesModule`. Controls how the new polygons combine with what is **already
 * rendered on that single entry's layer** — intra-entry only. Cross-entry visibility
 * (hiding *other* entries before this one comes up) is a separate concern handled by
 * `hidePreviousEntries`.
 *
 * @ignore
 */
export const showModeSchema = z
    .enum(['add', 'replace'])
    .optional()
    .describe(
        'WITHIN THE TARGETED ENTRY ONLY — controls how the new polygons combine with ' +
            "what is already rendered on this entry's GeometriesModule layer. Does NOT " +
            'affect other entries (use `hidePreviousEntries` for that). ' +
            '"replace" (default) clears this entry\'s layer first; ' +
            '"add" stacks (deduped by feature id).',
    );

/**
 * Shared schema for the geometry-rendering option on tools that produce a places entry
 * (discoverPlaces, locatePlace, ...). When provided, the tool batch-fetches boundary
 * polygons via the Geometry Data service, caches them on the entry, and optionally renders.
 *
 * @ignore
 */
export const showPlaceGeometriesSchema = z
    .object({
        show: z.boolean().optional().describe('Also render the polygons on the map. Default: false.'),
        mode: showModeSchema,
        theme: z.enum(['filled', 'outline', 'inverted']).optional().describe('Visual theme. Default: "outline".'),
    })
    .optional()
    .describe(
        'Batch-fetch boundary polygons for the resulting places and cache them on the entry. ' +
            'Use when the user wants the *area / shape / boundary* (e.g. "outline this neighbourhood", "show the city footprint"). ' +
            'Set `show: true` to also render. Skips places without a geometry source (most addresses/streets).',
    );

/**
 * Schema for the geometry-rendering option on the places display tool
 * (`updatePlacesDisplay`). Presence of this object means "render boundaries";
 * there is no `show: boolean` toggle — that is reserved for the search-time
 * variant ({@link showPlaceGeometriesSchema}).
 *
 * @ignore
 */
export const geometryDisplayConfigSchema = z
    .object({
        theme: z.enum(['filled', 'outline', 'inverted']).optional().describe('Visual theme. Default: "outline".'),
        placeIds: z
            .array(z.string())
            .optional()
            .describe(
                'Subset of place ids within the targeted entries — render boundaries only for these. ' +
                    'Ids outside the entries are ignored. Default: all places with a geometry source.',
            ),
        mode: showModeSchema,
    })
    .describe(
        'Render boundary polygons for the targeted entries. ' +
            'Use when the user wants the *area / shape / outline / footprint* (e.g. "outline this neighbourhood", "show the city footprint"). ' +
            'Independent of `markerType` — set both to render pins AND boundaries.',
    );

/**
 * Shared marker-type enum. Used as a required field in `showPlacesSchema` (the
 * nested `show` object for discover/filter/search tools) and as an optional
 * top-level field in `showPlaces` itself.
 *
 * @ignore
 */
export const markerTypeSchema = z
    .enum(['base-map', 'pin', 'pin-clustered', 'none'])
    .describe(
        '"pin" for few results; "base-map" for 10+; ' +
            '"pin-clustered" aggregates nearby pins under a count badge (best for dense city-scale POI sets — ' +
            'clusters expose aggregated `placeTypes` / `poiCategories`); "none" for towns/cities/areas.',
    );

/**
 * Shared factory for the optional `hidePreviousEntries` field — controls which previously-shown
 * entries get hidden before the new ones are rendered. `entryNoun` is the slice noun
 * (`'places'`, `'routes'`, `'ranges'`) used inside the description so the LLM sees a slice-specific
 * hint.
 *
 * @ignore
 */
export const hidePreviousEntriesSchema = (entryNoun: string) =>
    z
        .union([z.literal('all'), z.array(z.string())])
        .optional()
        .describe(
            `Which previously-shown ${entryNoun} entries to hide before showing the new ones. ` +
                `\`"all"\` clears every previous entry (use for the typical "show X" — replace existing); ` +
                'an array hides only the listed entry IDs. ' +
                `Omit to stack on top of existing entries (use for "also show", "additionally", "and X"). ` +
                'The entries being shown by this call are never hidden. ' +
                `Only applied when \`entryMode === "multiple"\` (in \`single\` mode every other entry is auto-hidden, so this prop is ignored).`,
        );

/** @ignore */
export const showPlacesSchema = z.object({
    markerType: markerTypeSchema,
    zoomMode: z.enum(['auto', 'none']).describe('Camera behaviour. "none" keeps the map still.'),
    hidePreviousEntries: hidePreviousEntriesSchema('places'),
});

/** @ignore */
export const shownSchema = z.object({
    markerType: z.boolean(),
    zoomMode: z.boolean(),
});

/**
 * BYOD `show` options. Mirrors {@link showPlacesSchema} but WITHOUT `markerType`
 * — BYOD entries render through their own geometry-typed MapLibre layers, so
 * there is no marker style to pick. Presence of this object means "render now";
 * omit it to store the entry hidden. `zoomMode` drives the camera and
 * `hidePreviousEntries` controls which already-shown BYOD entries to clear first.
 *
 * @ignore
 */
export const showByodSchema = z.object({
    zoomMode: z
        .enum(['auto', 'none'])
        .describe('Camera behaviour. "auto" fits the map to the shown BYOD entries; "none" keeps the map still.'),
    hidePreviousEntries: hidePreviousEntriesSchema('BYOD'),
});

/** @ignore */
export const shownByodSchema = z.object({
    zoomMode: z.boolean().describe('Whether the camera was moved to fit the shown entries.'),
});

// --- where schema (geographic scope) ---
//
// Discriminated by `mode`. Three modes are shared between locatePlace and discoverPlaces:
//   - within  — one area-like input (bbox / viewport / geocoded query / placeId polygon)
//   - nearby  — one point-like bias (position / viewport centre / geocoded query centroid)
//   - global  — no bias
// `within` is split between locatePlace (singular fields, defined here) and discoverPlaces
// (plural fields, defined in discover-places.ts). Only `mode` and `viewport` are shared via
// {@link withinSharedFields}. discoverPlaces also adds a fourth mode `maxDetour`.

/**
 * Fields shared by both locatePlace's and discoverPlaces' `within` schemas — `mode` and the
 * `viewport` flag. Spread into each consumer's `z.object({...})`.
 * @ignore
 */
export const withinSharedFields = {
    mode: z.literal('within'),
    viewport: z
        .literal(true)
        .optional()
        .describe('When true, search within the current map viewport bounds. EXCLUSIVE with all other within fields.'),
};

/**
 * `queryAs` — what kind of thing the paired `query` string is. Drives whether resolution uses
 * POI search (venues/landmarks/businesses) or geocoding (addresses, cities, neighborhoods, parks,
 * postal codes, etc.). Optional everywhere; defaults to `'place'`.
 * @ignore
 */
export const queryAsSchema = z
    .enum(['poi', 'place'])
    .optional()
    .describe(
        'Drives query resolution. ' +
            '`"poi"` for venues / landmarks / businesses (e.g. "Eiffel Tower"). ' +
            '`"place"` for addresses, cities, neighborhoods, parks, postal codes (e.g. "De Jordaan, Amsterdam", "1600 Pennsylvania Ave"). ' +
            'Default: "place".',
    );

const locateWithinSingularKeys = ['boundingBox', 'viewport', 'query', 'placeId'] as const;

/**
 * locatePlace's `within` schema — exactly one of viewport / boundingBox / query / placeId.
 * @ignore
 */
export const withinWhereSchema = z
    .object({
        ...withinSharedFields,
        boundingBox: geoJsonBBoxSchema
            .optional()
            .describe('Single bbox [W,S,E,N]. EXCLUSIVE with viewport / query / placeId.'),
        query: z
            .string()
            .optional()
            .describe(
                'Resolve a name/address/POI → its boundary polygon (or bbox) as search area ' +
                    '(e.g. "Paris", "De Jordaan, Amsterdam"). ' +
                    'Pair with `queryAs` to disambiguate. EXCLUSIVE with boundingBox / viewport / placeId.',
            ),
        queryAs: queryAsSchema,
        placeId: z
            .string()
            .optional()
            .describe(
                'ID of a session place — its boundary polygon (fetched on demand) is the search area. ' +
                    'EXCLUSIVE with boundingBox / viewport / query.',
            ),
    })
    .refine((data) => locateWithinSingularKeys.filter((k) => data[k] !== undefined).length === 1, {
        message: '`within` requires EXACTLY ONE of: boundingBox, viewport, query, placeId.',
    });

const nearbySingularKeys = ['position', 'viewport', 'query'] as const;

/** @ignore */
export const nearbyWhereSchema = z
    .object({
        mode: z.literal('nearby'),
        position: z
            .array(z.number())
            .length(2)
            .optional()
            .describe('Bias point [lng, lat]. EXCLUSIVE with viewport / query.'),
        viewport: z
            .literal(true)
            .optional()
            .describe('When true, bias toward the current map viewport centre. EXCLUSIVE with position / query.'),
        query: z
            .string()
            .optional()
            .describe(
                'Resolve a name/address/POI → its centroid as bias point. ' +
                    'Pair with `queryAs` to disambiguate. EXCLUSIVE with position / viewport.',
            ),
        queryAs: queryAsSchema,
        radiusMeters: z
            .number()
            .positive()
            .optional()
            .describe('Hard radius cap (metres) around the bias point. Independent of bias source.'),
    })
    .refine((data) => nearbySingularKeys.filter((k) => data[k] !== undefined).length === 1, {
        message: '`nearby` requires EXACTLY ONE of: position, viewport, query (radiusMeters is independent).',
    });

/** @ignore */
export const globalWhereSchema = z.object({
    mode: z
        .literal('global')
        .describe('No spatial constraint — resolve the name anywhere. The default for a uniquely-named place.'),
});

/**
 * locatePlace's `where` schema — `within` (singular fields), `nearby`, or `global`.
 * discoverPlaces builds its own union in discover-places.ts using the plural-form within schema.
 * @ignore
 */
export const whereSchema = z.union([withinWhereSchema, nearbyWhereSchema, globalWhereSchema]);

// --- Shared `within` fields (plural form) for discoverPlaces + getTrafficIncidents ---------------
// Lifted from discover-places.ts so both tools build their `within` schemas from the same field
// definitions. `experimentalWithinFields` (explorationSearch-only) stays local to discover-places.

/**
 * The multi-region `within` field block shared by discoverPlaces and getTrafficIncidents.
 * Spread into each tool's `z.object({...})` alongside any tool-specific fields.
 * @ignore
 */
export const sharedWithinFields = {
    ...withinSharedFields,
    queries: z
        .array(
            z.object({
                query: z
                    .string()
                    .describe(
                        'Name of a CONTAINING area to search within (e.g. "Paris", "De Jordaan, Amsterdam"). ' +
                            "NEVER the user's search subject — that goes in the top-level `query`.",
                    ),
                queryAs: queryAsSchema,
            }),
        )
        .min(1)
        .optional()
        .describe(
            'CONTAINING areas to search WITHIN — answers "search where?", NOT "search for what?". ' +
                "Never put the user's search subject here. " +
                'Example: for "cafes in Amsterdam" → top-level `query`/`poiCategories` carry "cafes"; ' +
                '`where.queries: [{query: "Amsterdam"}]` carries the region. ' +
                'Each entry resolves to a boundary polygon (or bbox); the union is searched. ' +
                'Per-item `queryAs` disambiguates POI vs place. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    placeIds: z
        .array(z.string())
        .min(1)
        .optional()
        .describe(
            'IDs of session places — each polygon (fetched on demand) joins the search area. ' +
                'Use recallState to list IDs. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    geometries: z
        .array(geometryInputSchema)
        .min(1)
        .optional()
        .describe(
            'Direct GeoJSON Polygons / MultiPolygons (custom drawing, external data). ' +
                'For named or stored places use `queries` / `placeIds`. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    range: z
        .string()
        .min(1)
        .optional()
        .describe(
            'Range ID from findReachableAreas (e.g. "ranges-0") — restricts to that entry; ' +
                'multi-origin entries combine their polygons. Use recallState to list IDs. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    route: z
        .object({
            routeId: z
                .string()
                .min(1)
                .optional()
                .describe('Route entry ID (e.g. "routes-0"). Use recallState. Default: latest route.'),
            widthMeters: z
                .number()
                .positive()
                .describe(
                    'Total corridor width (metres) — widthMeters/2 each side. ' +
                        'Typical: 200–500 m ("near the road"), 2–5 km ("broad area along the route").',
                ),
        })
        .optional()
        .describe(
            'Buffered corridor around a stored route — turf.buffer at widthMeters/2 around the line. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
};

/**
 * The resolver's input: the area-producing `where` fields. `z.infer` of this is `AreaWhere` in
 * resolve-where.ts, so the LLM-facing tool schemas and the resolver input share one definition.
 * No `range` — that maps to stored isochrones and is resolved caller-side.
 * @ignore
 */
export const areaWhereSchema = z.object({
    viewport: z.boolean().optional(),
    boundingBox: geoJsonBBoxSchema.optional(),
    queries: sharedWithinFields.queries,
    placeIds: sharedWithinFields.placeIds,
    geometries: sharedWithinFields.geometries,
    route: sharedWithinFields.route,
});
