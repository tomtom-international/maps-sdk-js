import type { LatitudeLongitudePointAPI } from "../../routing/types/apiResponseTypes";

/**
 * @ignore
 */
export type ReachableRangeResponseAPI = {
    reachableRange: { center: LatitudeLongitudePointAPI; boundary: LatitudeLongitudePointAPI[] };
};
