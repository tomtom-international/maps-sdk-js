import type { Position } from "geojson";
import type { AutocompleteSearchSegmentType } from "./autocompleteSearchParams";

export type AutocompleteSearchResponse = {
    /**
     * Information about the autocomplete request that was performed.
     */
    context: AutocompleteSearchContext;
    /**
     * List of the results returned by the autocomplete engine.
     */
    results: AutocompleteSearchResult[];
};

export type AutocompleteSearchContext = {
    /**
     * Query passed to the autocomplete engine.
     */
    inputQuery: string;
    /**
     * The geo bias passed to the autocomplete engine by setting the position and radius parameters.
     */
    geoBias?: AutocompleteSearchResultGeoBias;
};

export type AutocompleteSearchResultGeoBias = {
    /**
     * Position used to bias the results by setting the optional position request parameters.
     */
    position?: Position;
    /**
     * The optional radius request parameter passed by the user to constrain the results defined area.
     */
    radiusMeters?: number;
};

export type AutocompleteSearchResult = {
    /**
     * Describes recognized entities of the result.
     */
    segments: AutocompleteSearchSegment[];
};

export type AutocompleteSearchSegment =
    | AutocompleteSearchBrandSegment
    | AutocompleteSearchCategorySegment
    | AutocompleteSearchPlaintextSegment;

export type AutocompleteGenericSearchSegment = {
    /**
     * The type of detected entity.
     * Currently, we can detect: category, brand, and plaintext, but more types can appear in the future.
     */
    type: AutocompleteSearchSegmentType;
    /**
     * The value of the detected entity.
     * It may be a category name, brand name, or a part of unrecognized text.
     * For the brand segment type, the value of this field can be used to restrict results of other search endpoints to the Points Of Interest (POI) of specific brands.
     * See the poiBrands parameter in the Search service documentation.
     */
    value: string;
    /**
     * Defines a mapping between the inputQuery and segment.
     */
    matches: AutocompleteSearchMatches;
};

export type AutocompleteSearchMatches = {
    /**
     * Informs which part of the input query is represented by segment.
     * Input query matching may not be continuous, so the mapping is defined by an array of matched substrings.
     */
    inputQuery: AutocompleteSearchMatch[];
};

export type AutocompleteSearchMatch = {
    /**
     * Starting offset of the inputQuery substring matching the segment.
     */
    offset: number;
    /**
     * Length of the matched substring.
     */
    length: number;
};

export type AutocompleteSearchBrandSegment = AutocompleteGenericSearchSegment & {
    type: "brand";
};

export type AutocompleteSearchCategorySegment = AutocompleteGenericSearchSegment & {
    type: "category";
    /**
     * This can be used to restrict the results of other search endpoints to the Points Of Interest (POI) of specific categories.
     * See the poiCategories parameter in the Search service documentation
     */
    id: string;
    /**
     * Present only if a part of the user query matched to the alternative name instead of a primary name.
     * For example, for the input query "petrol station" the category segment value will be "gas station"
     * and the matchedAlternativeName will be "petrol station".
     */
    matchedAlternativeName?: string;
};

export type AutocompleteSearchPlaintextSegment = AutocompleteGenericSearchSegment & {
    type: "plaintext";
};
