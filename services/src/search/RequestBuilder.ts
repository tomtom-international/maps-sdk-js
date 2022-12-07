import { FuzzySearchParams } from "../fuzzy-search";
import {
    appendByJoiningParamValue,
    appendCommonParams,
    appendLatLonParamsFromPosition,
    appendOptionalParam,
    mapPOICategoriesToIDs
} from "../shared/RequestBuildingUtils";
import { GeometrySearchParams } from "../geometry-search";

/**
 * Default function for search request
 * @group Search
 * @category Functions
 * @param searchURL
 * @param params The search parameters, with global configuration already merged into them.
 */
export const buildSearchRequest = (searchURL: URL, params: FuzzySearchParams | GeometrySearchParams): URL => {
    const urlParams = searchURL.searchParams;

    appendCommonParams(urlParams, params);
    appendOptionalParam(urlParams, "limit", params.limit);
    appendLatLonParamsFromPosition(urlParams, params.position);

    appendByJoiningParamValue(urlParams, "fuelSet", params.fuelTypes);
    appendByJoiningParamValue(urlParams, "idxSet", params.indexes);
    appendByJoiningParamValue(urlParams, "brandSet", params.poiBrands);
    params.poiCategories &&
        appendByJoiningParamValue(urlParams, "categorySet", mapPOICategoriesToIDs(params.poiCategories));
    appendByJoiningParamValue(urlParams, "connectorSet", params.connectors);
    appendByJoiningParamValue(urlParams, "mapcodes", params.mapcodes);
    appendByJoiningParamValue(urlParams, "extendedPostalCodesFor", params.extendedPostalCodesFor);

    appendOptionalParam(urlParams, "minPowerKW", params.minPowerKW);
    appendOptionalParam(urlParams, "maxPowerKW", params.maxPowerKW);
    appendOptionalParam(urlParams, "view", params.view);
    appendOptionalParam(urlParams, "openingHours", params.openingHours);
    appendOptionalParam(urlParams, "timeZone", params.timeZone);
    appendOptionalParam(urlParams, "relatedPois", params.relatedPois);
    appendByJoiningParamValue(urlParams, "entityTypeSet", params.geographyTypes);

    return searchURL;
};
