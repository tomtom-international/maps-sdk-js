import { Brand, Place, SearchPlaceProps, toPointFeature } from "@anw/go-sdk-js/core";
import omit from "lodash/omit";
import { latLonAPIToPosition } from "./Geometry";
import { CommonSearchPlaceResultAPI } from "./types/APIResponseTypes";

/**
 * Shared response parsing between geometry search and place by id service.
 * @group Shared
 * @category Functions
 * @ignore
 */
export const parseSearchAPIResult = (result: CommonSearchPlaceResultAPI): Place<SearchPlaceProps> => {
    const { position, entryPoints, poi, id, dist, ...rest } = result;
    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        id,
        properties: {
            ...omit(rest, "viewport"),
            ...(dist && { distance: dist }),
            ...(entryPoints && {
                entryPoints: entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: latLonAPIToPosition(entrypoint.position)
                }))
            }),
            poi: {
                ...omit(poi, "categorySet"),
                brands: poi?.brands?.map((brand: Brand) => brand.name) ?? [],
                categoryIds: poi?.categorySet?.map((category) => category.id) ?? []
            }
        }
    };
};
