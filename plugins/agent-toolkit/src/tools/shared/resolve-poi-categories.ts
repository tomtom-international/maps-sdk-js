import { poiCategories as knownPoiCategories, POICategory } from '@tomtom-org/maps-sdk/core';
import { getPOICategoryCodes } from '@tomtom-org/maps-sdk/services';

const knownPoiCategoriesSet = new Set<string>(knownPoiCategories);

/** @ignore */
export const resolvePoiCategories = async (poiCategories: string[] | undefined): Promise<POICategory[] | undefined> => {
    if (!poiCategories) {
        return undefined;
    }
    const known = poiCategories.filter((c) => knownPoiCategoriesSet.has(c)) as POICategory[];
    const unrecognized = poiCategories.filter((c) => !knownPoiCategoriesSet.has(c));

    let resolvedUnrecognized: POICategory[] = [];
    if (unrecognized.length) {
        resolvedUnrecognized = await getPOICategoryCodes({ filters: unrecognized });
    }

    const merged = [...new Set([...known, ...resolvedUnrecognized])];
    return merged.length ? merged : undefined;
};
