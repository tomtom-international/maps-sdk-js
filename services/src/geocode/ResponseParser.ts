import omit from "lodash/omit";
import { bboxOnlyIfWithArea, bboxFromPointFeatures, GeographyType, Place, toPointFeature } from "@anw/go-sdk-js/core";
import { GeocodingProps, GeocodingResponse } from "./types/GeocodingResponse";
import { GeocodingResponseAPI, GeocodingResultAPI } from "./types/APITypes";
import { apiToGeoJSONBBox, latLonAPIToPosition } from "../shared/Geometry";

const parseAPIResult = (result: GeocodingResultAPI): Place<GeocodingProps> => {
    const { position, boundingBox, entryPoints, addressRanges, entityType, ...rest } = result;

    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
        properties: {
            ...omit(rest, "viewport"),
            ...(result.dist && { distance: result.dist }),
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
 * @group Geocoding
 * @category Functions
 * @param apiResponse
 */
export const parseGeocodingResponse = (apiResponse: GeocodingResponseAPI): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map((result) => parseAPIResult(result));
    const bbox = bboxOnlyIfWithArea(bboxFromPointFeatures(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
