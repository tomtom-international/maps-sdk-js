import omit from "lodash/omit";
import { bboxFromGeoJSON, bboxOnlyIfWithArea, GeographyType, Place, toPointFeature } from "@anw/maps-sdk-js/core";
import { GeocodingProps, GeocodingResponse } from "./types/geocodingResponse";
import { GeocodingResponseAPI, GeocodingResultAPI } from "./types/apiTypes";
import { apiToGeoJSONBBox, latLonAPIToPosition } from "../shared/geometry";

const parseAPIResult = (result: GeocodingResultAPI): Place<GeocodingProps> => {
    const { position, boundingBox, dist, entryPoints, addressRanges, entityType, id, ...rest } = result;

    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
        id,
        properties: {
            ...omit(rest, "viewport"),
            ...(dist && { distance: dist }),
            ...(entityType && { geographyType: entityType.split(",") as GeographyType[] }),
            ...(entryPoints && {
                entryPoints: entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: latLonAPIToPosition(entrypoint.position)
                }))
            }),
            ...(addressRanges && {
                addressRanges: {
                    ...addressRanges,
                    from: latLonAPIToPosition(addressRanges.from),
                    to: latLonAPIToPosition(addressRanges.to)
                }
            })
        }
    };
};

/**
 * Default method for parsing geocoding request from {@link GeocodingResponse}
 * @param apiResponse
 */
export const parseGeocodingResponse = (apiResponse: GeocodingResponseAPI): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map(parseAPIResult);
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSON(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
