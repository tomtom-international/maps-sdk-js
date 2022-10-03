import { PlaceByIdResponseProps, PlaceByIdResultAPI } from "../place-by-id";
import { latLonAPIToPosition } from "./Geometry";
import omit from "lodash/omit";
import { Place, toPointFeature } from "core";
import { GeometrySearchResponseProps, GeometrySearchResultAPI } from "../geometry-search";

/**
 * Shared response parsing between geometry search and place by id service.
 * @group Shared
 * @ignore
 */
export const parseAPIResultForGeometrySearchAndPlaceById = (
    result: PlaceByIdResultAPI | GeometrySearchResultAPI
): Place<PlaceByIdResponseProps | GeometrySearchResponseProps> => {
    const { position, entryPoints, poi, ...rest } = result;
    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        properties: {
            ...omit(rest, "viewport"),
            ...(entryPoints && {
                entryPoints: entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: latLonAPIToPosition(entrypoint.position)
                }))
            }),
            poi: {
                ...omit(poi, "categorySet"),
                brands: poi?.brands?.map((brand) => brand.name) ?? [],
                categoryIds: poi?.categorySet?.map((category) => category.id) ?? []
            }
        }
    };
};
