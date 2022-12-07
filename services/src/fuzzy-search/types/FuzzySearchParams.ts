import { CommonSearchParams } from "../../search";

/**
 * @group Fuzzy Search
 * @category Types
 */
export type FuzzySearchParams = CommonSearchParams & {
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
