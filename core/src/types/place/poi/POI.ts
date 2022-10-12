import { OpeningHours } from "./OpeningHours";
import { Classification } from "./Classification";
import { TimeZone } from "../../TimeZone";

/**
 * Place of interest information.
 * @group Place
 * @category Types
 */
export type POI = {
    name: string;
    phone?: string;
    // override from Brand to string
    brands?: string[];
    url?: string;
    // override from categorySet and CategorySet
    categoryIds?: number[];
    categories?: string[];
    openingHours?: OpeningHours;
    classifications?: Classification[];
    timeZone?: TimeZone;
};
/**
 * @group Place
 * @category Types
 */
export type RelatedPOI = {
    /**
     * Relation type between this POI and the main one which refers to it.
     */
    relationType: "child" | "parent";
    /**
     * Pass this as entityId to the Place by ID service to fetch additional data for the Point Of Interest.
     */
    id: string;
};
