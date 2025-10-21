import type { Position } from 'geojson';
import type { AutocompleteSearchSegmentType } from './autocompleteSearchParams';

/**
 * Response from the autocomplete search service.
 *
 * Contains context about the query and a list of autocomplete suggestions
 * with recognized entities (brands, categories, plaintext).
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchResponse = {
    /**
     * Information about the autocomplete request that was performed.
     *
     * Includes the original query and any geographic bias applied.
     */
    context: AutocompleteSearchContext;
    /**
     * List of autocomplete suggestions returned by the engine.
     *
     * Each result contains segments representing recognized entities
     * from the input query.
     */
    results: AutocompleteSearchResult[];
};

/**
 * Context information for an autocomplete search request.
 *
 * Captures the original query and optional geographic bias used
 * to influence the autocomplete suggestions.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchContext = {
    /**
     * Original query string passed to the autocomplete engine.
     */
    inputQuery: string;
    /**
     * Geographic bias applied to influence results.
     *
     * Present when position and radius parameters were provided
     * to prioritize results near a specific location.
     */
    geoBias?: AutocompleteSearchResultGeoBias;
};

/**
 * Geographic bias parameters for autocomplete search results.
 *
 * Defines a geographic area used to prioritize or constrain
 * autocomplete suggestions.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchResultGeoBias = {
    /**
     * Center position for the geographic bias.
     *
     * Coordinates used to prioritize nearby results.
     */
    position?: Position;
    /**
     * Search radius in meters from the position.
     *
     * Defines the geographic area to constrain or prioritize results.
     */
    radiusMeters?: number;
};

/**
 * Individual autocomplete search result.
 *
 * Represents a single suggestion with its recognized entities
 * (brands, categories, or plaintext segments).
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchResult = {
    /**
     * Recognized entities within this autocomplete suggestion.
     *
     * Array of segments identifying specific brands, categories,
     * or plaintext portions of the suggestion.
     */
    segments: AutocompleteSearchSegment[];
};

/**
 * Union type for all autocomplete search segment types.
 *
 * A segment represents a recognized entity within the autocomplete result,
 * which can be a brand, category, or plaintext.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchSegment =
    | AutocompleteSearchBrandSegment
    | AutocompleteSearchCategorySegment
    | AutocompleteSearchPlaintextSegment;

/**
 * Base properties shared across all autocomplete segment types.
 *
 * Contains the entity type, value, and mapping information showing
 * how the segment relates to the original input query.
 *
 * @group Autocomplete Search
 */
export type AutocompleteGenericSearchSegment = {
    /**
     * The type of detected entity.
     *
     * Currently detects: brand, category, and plaintext.
     * Additional types may be added in future versions.
     */
    type: AutocompleteSearchSegmentType;
    /**
     * The value of the detected entity.
     *
     * May be a category name, brand name, or unrecognized text.
     * For brand segments, this value can be used with the poiBrands
     * parameter in other search endpoints to filter POI results.
     */
    value: string;
    /**
     * Mapping between the input query and this segment.
     *
     * Shows which part(s) of the original query correspond to
     * this recognized entity.
     */
    matches: AutocompleteSearchMatches;
};

/**
 * Match information linking a segment to the input query.
 *
 * Defines the relationship between recognized entities and the
 * portions of the original query they represent.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchMatches = {
    /**
     * Array of matched substrings from the input query.
     *
     * Indicates which part(s) of the input query map to this segment.
     * Multiple entries are possible as matching may not be continuous.
     */
    inputQuery: AutocompleteSearchMatch[];
};

/**
 * A single match between a segment and the input query.
 *
 * Defines a substring of the input query that corresponds to
 * the recognized entity.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchMatch = {
    /**
     * Starting position of the matched substring.
     *
     * Zero-based offset in the input query string.
     */
    offset: number;
    /**
     * Length of the matched substring in characters.
     */
    length: number;
};

/**
 * Autocomplete segment representing a recognized brand.
 *
 * Used to identify brand names in the autocomplete suggestion.
 * The value can be used with the poiBrands parameter in search
 * endpoints to filter results to specific brands.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchBrandSegment = AutocompleteGenericSearchSegment & {
    type: 'brand';
};

/**
 * Autocomplete segment representing a recognized POI category.
 *
 * Used to identify category names in the autocomplete suggestion.
 * The id can be used with the poiCategories parameter in search
 * endpoints to filter results to specific categories.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchCategorySegment = AutocompleteGenericSearchSegment & {
    type: 'category';
    /**
     * Category identifier for filtering search results.
     *
     * Use with the poiCategories parameter in other search endpoints
     * to restrict results to POIs of this category.
     */
    id: string;
    /**
     * Alternative name that matched the user query.
     *
     * Present only when a synonym or alternative name matched instead
     * of the primary category name. For example, for the query "petrol station",
     * the value will be "gas station" and matchedAlternativeName will be
     * "petrol station".
     */
    matchedAlternativeName?: string;
};

/**
 * Autocomplete segment representing unrecognized plaintext.
 *
 * Used for portions of the query that were not identified as
 * specific brands or categories.
 *
 * @group Autocomplete Search
 */
export type AutocompleteSearchPlaintextSegment = AutocompleteGenericSearchSegment & {
    type: 'plaintext';
};
