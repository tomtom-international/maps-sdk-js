import { CommonSearchParams, CommonGeocodeAndFuzzySearchParams } from "../../shared";

/**
 * @group Fuzzy Search
 * @category Types
 */
export type FuzzySearchParams = CommonSearchParams &
    CommonGeocodeAndFuzzySearchParams & {
        /**
         * Minimum fuzzyness level to be used.
         * @default 1
         * Maximum value: 4
         */
        minFuzzyLevel?: number;

        /**
         * Maximum fuzzyness level to be used.
         * @default 2
         * Maximum value: 4
         */
        maxFuzzyLevel?: number;
    };
