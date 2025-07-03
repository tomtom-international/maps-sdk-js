import type { TimeZone } from '../../timezone';
import type { Classification } from './classification';
import type { OpeningHours } from './openingHours';

/**
 * Place of interest information.
 * @group Place
 * @category Types
 */

// biome-ignore lint/style/useNamingConvention: Using acronym
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
    relationType: 'child' | 'parent';
    /**
     * Pass this as entityId to the Place by ID service to fetch additional data for the Point Of Interest.
     */
    id: string;
};
