/**
 * Canonical area-tag vocabulary used by the places-api. Tokens are
 * lowercase `snake_case` and describe the character of the municipality
 * polygon a hit sits in (currently populated for `DE` / `NL` / `FR`).
 *
 * Two groups are exposed below:
 *
 * - **Populated tokens** — the 46 tokens the current pipeline run actually
 *   emits, grouped by classification axis (settlement scale, density,
 *   terrain, tourism, etc.). These are what every live `area_tags` value
 *   will be drawn from today.
 * - **Reserved tokens** — vocabulary tokens that exist canonically but
 *   are not populated by the current pipeline run. They may appear in
 *   future runs without an API change, so callers should treat them as
 *   valid even though no hit returns them today.
 *
 * The schema doc warns the vocabulary may shift between pipeline
 * iterations, so SDK consumers should code defensively. The
 * {@link AreaTag} alias falls back to `string` to keep arbitrary
 * (yet-to-be-added) tokens type-compatible without losing IDE
 * autocompletion on the known set.
 *
 * @ignore
 * @experimental
 */
export const POPULATED_AREA_TAGS = [
    // Settlement scale
    'village',
    'small_town',
    'mid_town',
    'suburban',
    // Density
    'rural',
    'semi_rural',
    'residential',
    // Setting (terrain)
    'inland',
    'coastal',
    'atlantic_coast',
    'alpine',
    'mountain',
    'foothills',
    'forest',
    'plains',
    'farmland',
    'agricultural',
    // Tourism intensity
    'no_tourism',
    'low_tourism',
    'moderate_tourism',
    'tourism_economy',
    // Tourism type
    'eco_tourism',
    'heritage_tourism',
    'watersports',
    // Outdoor recreation
    'hiking',
    'cycling',
    // Economy
    'industrial',
    'logistics_hub',
    'retail_hub',
    'shopping_district',
    'hospital_town',
    'dining_scene',
    // Transport
    'car_oriented',
    'walkable',
    'transit_connected',
    'transit_sparse',
    'highway_corridor',
    'commuter_town',
    // Traffic
    'low_traffic',
    'moderate_traffic',
    // Commercial character
    'sparse_commercial',
    // Macro region
    'western_europe',
    'central_europe',
    'southern_europe',
    'north_american',
    'iberian',
] as const;

/**
 * Vocabulary tokens that exist canonically in the area-tag taxonomy but
 * aren't emitted by the current pipeline run (per the schema doc's
 * "tokens that exist… but are not populated" list). Filtering on these
 * today returns zero hits, but a future pipeline run may activate them
 * without a wire-protocol change.
 *
 * @ignore
 * @experimental
 */
export const RESERVED_AREA_TAGS = [
    // Water / coastal sub-types
    'lakefront',
    'riverine',
    'wetland',
    'marina',
    'harbor',
    'beach',
    // Macro region (Mediterranean)
    'mediterranean',
    // Destination archetypes
    'ski_destination',
    'beach_destination',
    'wine_tourism',
    'vineyard',
    'university_town',
    'medieval_old_town',
    'unesco_site',
    // US sub-regions (mentioned by name in the doc)
    'midwest_us',
    'rust_belt',
] as const;

/**
 * Union of every populated area-tag token currently emitted by the
 * places-api pipeline.
 *
 * @ignore
 * @experimental
 */
export type PopulatedAreaTag = (typeof POPULATED_AREA_TAGS)[number];

/**
 * Union of every canonical (populated + reserved) area-tag token. Reserved
 * tokens may begin appearing as the pipeline evolves.
 *
 * @ignore
 * @experimental
 */
export type CanonicalAreaTag = PopulatedAreaTag | (typeof RESERVED_AREA_TAGS)[number];

/**
 * Area-tag token accepted by the places-api `area_tags` filter and
 * returned on each hit's `areaTags` property.
 *
 * Resolves to the canonical {@link CanonicalAreaTag} union for editor
 * autocompletion, but tolerates any other string so the SDK doesn't
 * hard-error on tokens added in a future pipeline run. To strictly
 * constrain inputs to the currently-known vocabulary, use
 * {@link CanonicalAreaTag} (or {@link PopulatedAreaTag}) directly.
 *
 * @example
 * ```typescript
 * // Autocomplete on the canonical vocabulary, but new tokens still type-check.
 * const tags: AreaTag[] = ['walkable', 'transit_connected'];
 * ```
 *
 * @ignore
 * @experimental
 */
export type AreaTag = CanonicalAreaTag | string;
