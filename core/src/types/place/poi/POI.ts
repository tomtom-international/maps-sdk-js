import { OpeningHours } from "./OpeningHours";
import { Classification } from "./Classification";
import { TimeZone } from "../../TimeZone";

/**
 * Place of interest information.
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
