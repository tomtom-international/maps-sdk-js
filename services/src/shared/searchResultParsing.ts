import { Brand, Place, SearchPlaceProps, toPointFeature } from "@anw/maps-sdk-js/core";
import omit from "lodash/omit";
import { apiToGeoJSONBBox, latLonAPIToPosition } from "./geometry";
import { CommonSearchPlaceResultAPI, SummaryAPI } from "./types/apiPlacesResponseTypes";
import { toConnectorCounts } from "../ev-charging-stations-availability/connectorAvailability";
import { SearchSummary } from "./types/searchSummary";

/**
 * Shared response parsing between geometry search and place by id service.
 * @ignore
 */
export const parseSearchAPIResult = (result: CommonSearchPlaceResultAPI): Place<SearchPlaceProps> => {
    const { position, entryPoints, poi, id, dist, boundingBox, chargingPark, ...rest } = result;
    const connectors = chargingPark?.connectors?.map((connector) => ({
        ...omit(connector, "connectorType"),
        type: connector.connectorType
    }));
    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
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
            ...(connectors && {
                chargingPark: {
                    ...chargingPark,
                    connectors,
                    connectorCounts: toConnectorCounts(connectors)
                }
            }),
            poi: {
                ...omit(poi, "categorySet"),
                brands: poi?.brands?.map((brand: Brand) => brand.name) ?? [],
                categoryIds: poi?.categorySet?.map((category) => category.id) ?? []
            }
        }
    };
};

export const parseSummaryAPI = (summary: SummaryAPI): SearchSummary => {
    const { geoBias, ...rest } = summary;

    return {
        ...(geoBias && { geoBias: latLonAPIToPosition(geoBias) }),
        ...rest
    };
};
