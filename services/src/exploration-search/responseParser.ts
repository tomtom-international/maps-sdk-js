import type { BBox, Place, PlaceType, POI, POICategory, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import {
    bboxFromGeoJSON,
    bboxOnlyIfWithArea,
    getPosition,
    poiIDsToCategories,
    toPointGeometry,
} from '@tomtom-org/maps-sdk/core';
import type { SearchSummary } from '../shared';
import type {
    ExplorationPOIAPI,
    ExplorationRecordType,
    ExplorationSearchParams,
    ExplorationSearchResponse,
    ExplorationSearchResponseAPI,
    ExplorationSearchResultAPI,
    ExplorationViewportAPI,
} from './types';

// The places-api `types` vocabulary uses `PointAddress` (no space) while the
// SDK's shared PlaceType uses `'Point Address'` — map on the way out so
// consumers get the same discriminator values as the other search services.
const API_TYPE_TO_PLACE_TYPE: Record<ExplorationRecordType, PlaceType> = {
    POI: 'POI',
    PointAddress: 'Point Address',
    Street: 'Street',
};

const toBBoxFromViewport = (viewport: ExplorationViewportAPI | undefined): BBox | undefined => {
    if (!viewport) return undefined;
    const [[minLon, minLat], [maxLon, maxLat]] = viewport.coordinates;
    return [minLon, minLat, maxLon, maxLat];
};

// Resolve the API's category-ID fields that describe THIS place into a deduplicated POICategory[].
// The places-api splits categories across `categorySet` (the broad taxonomy) and `preferredCategoryId`
// (the most specific leaf for this place); we merge them so consumers see RESTAURANT *and*
// ITALIAN_RESTAURANT, ordered with the most specific (largest) IDs first.
//
// `nearbyCategoryIds` is intentionally excluded — despite the suggestive name it lists categories
// of OTHER places near this one (a "see also" hint), not subcategories of this place. Including
// it pollutes downstream rendering: PlacesModule picks `categories[0]` for the marker icon, so
// e.g. an EV charging station near a restaurant would be rendered with a fork-and-knife icon.
const collectCategoryIds = (poiAPI: ExplorationPOIAPI): number[] => {
    const ids = new Set<number>();
    for (const code of poiAPI.categorySet ?? []) {
        ids.add(Number(code));
    }
    if (poiAPI.preferredCategoryId) {
        ids.add(Number(poiAPI.preferredCategoryId));
    }
    return [...ids].filter((id) => Number.isFinite(id));
};

const collectCategories = (poiAPI: ExplorationPOIAPI): POICategory[] => {
    const ids = collectCategoryIds(poiAPI);
    // Sort descending so leaf-level categories (larger numeric IDs in the TomTom taxonomy) come
    // first — useful for callers that pick `categories[0]` as a primary label.
    ids.sort((a, b) => b - a);
    const seen = new Set<POICategory>();
    const result: POICategory[] = [];
    for (const id of ids) {
        const category = poiIDsToCategories[id];
        if (category && !seen.has(category)) {
            seen.add(category);
            result.push(category);
        }
    }
    return result;
};

// POI fields live under `hit.poi` — pick and shape into the SDK's POI type.
const parsePoi = (poiAPI: ExplorationPOIAPI | undefined): POI | undefined => {
    if (!poiAPI?.name) return undefined;
    return {
        name: poiAPI.name,
        categories: collectCategories(poiAPI),
        localizedCategories: poiAPI.classifications?.map((classification) => classification.name) ?? [],
        ...(poiAPI.phone && { phone: poiAPI.phone }),
        ...(poiAPI.url && { url: poiAPI.url }),
        ...(poiAPI.brands?.length && { brands: poiAPI.brands.map((brand) => brand.name) }),
        ...(poiAPI.timeZone?.ianaId && { timeZone: poiAPI.timeZone }),
    };
};

const parseResult = (result: ExplorationSearchResultAPI): Place<SearchPlaceProps> => {
    const { id, position, address, score, distance_m, type, viewport } = result;
    const placeType = API_TYPE_TO_PLACE_TYPE[type ?? 'POI'];
    const poi = parsePoi(result.poi);
    const bbox = toBBoxFromViewport(viewport);
    return {
        type: 'Feature',
        id,
        geometry: toPointGeometry(position),
        ...(bbox && { bbox }),
        properties: {
            type: placeType,
            ...(address && { address }),
            ...(poi && { poi }),
            ...(score !== undefined && { score }),
            ...(distance_m !== undefined && { distance: distance_m }),
        } as SearchPlaceProps,
    };
};

const buildSummary = (apiResponse: ExplorationSearchResponseAPI, params: ExplorationSearchParams): SearchSummary => {
    const hasNear = !!getPosition(params.position);
    const geoBias = hasNear ? getPosition(params.position) : null;
    return {
        query: params.query ?? '',
        queryType: hasNear ? 'NEARBY' : 'NON_NEAR',
        queryTime: 0,
        numResults: apiResponse.hits.length,
        offset: params.offset ?? 0,
        totalResults: apiResponse.total,
        fuzzyLevel: 0,
        ...(geoBias && { geoBias }),
    };
};

/**
 * Default function to parse an exploration search response.
 * @param apiResponse The API response.
 * @param params The original request parameters.
 */
export const parseExplorationSearchResponse = (
    apiResponse: ExplorationSearchResponseAPI,
    params: ExplorationSearchParams,
): ExplorationSearchResponse => {
    const features = apiResponse.hits.map(parseResult);
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSON(features));
    return {
        type: 'FeatureCollection',
        properties: buildSummary(apiResponse, params),
        features,
        ...(bbox && { bbox }),
    };
};
