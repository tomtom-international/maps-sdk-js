import omit from "lodash/omit";
import { GeocodingResponse } from "./types/GeocodingResponse";
import { GeocodingResponseAPI } from "./types/APITypes";
import { GeographyType, toPointFeature } from "@anw/go-sdk-js/core";
import { bboxToPolygon, latLonAPIToPosition } from "../shared/Geometry";

export const parseGeocodingResponse = (apiResponse: GeocodingResponseAPI): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map(({ boundingBox, viewport, entryPoints, addressRanges, entityType, ...result }) => ({
        ...toPointFeature(latLonAPIToPosition(result.position)),
        properties: {
            ...omit(result, "position"),
            ...(result.dist && { distance: result.dist }),
            ...(boundingBox && { boundingBox: bboxToPolygon(boundingBox) }),
            ...(viewport && { viewport: bboxToPolygon(viewport) }),
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
    }));
    return {
        type: "FeatureCollection",
        features
    };
};
