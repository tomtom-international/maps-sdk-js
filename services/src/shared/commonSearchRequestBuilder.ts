import type { FuzzySearchParams } from "../fuzzy-search";
import {
    appendByJoiningParamValue,
    appendCommonParams,
    appendLatLonParamsFromPosition,
    appendOptionalParam,
    mapPOICategoriesToIDs
} from "./requestBuildingUtils";
import type { GeometrySearchParams } from "../geometry-search";

/**
 * @ignore
 */
export const PLACES_URL_PATH = "/maps/orbis/places";

/**
 * Appends request parameters common to search APIs such as fuzzy + geometry search.
 * * Mutates the given searchURL with the appended parameters.
 * @param searchURL The search URL to append parameters to. Should come without any parameters at this point.
 * @param params The search parameters, with global configuration already merged into them.
 */
export const appendCommonSearchParams = (searchURL: URL, params: FuzzySearchParams | GeometrySearchParams): void => {
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
};
