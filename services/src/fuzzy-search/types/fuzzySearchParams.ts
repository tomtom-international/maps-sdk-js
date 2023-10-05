import { CommonSearchParams, CommonGeocodeAndFuzzySearchParams } from "../../shared";
import { FuzzySearchResponseAPI } from "./fuzzySearchResponseAPI";

export type FuzzySearchParams = CommonSearchParams<URL, FuzzySearchResponseAPI> &
    CommonGeocodeAndFuzzySearchParams & {
        /**
         * Minimum fuzziness level to be used.
         * @default 1
         * Maximum value: 4
         */
        minFuzzyLevel?: number;

        /**
         * Maximum fuzziness level to be used.
         * @default 2
         * Maximum value: 4
         */
        maxFuzzyLevel?: number;
    };
