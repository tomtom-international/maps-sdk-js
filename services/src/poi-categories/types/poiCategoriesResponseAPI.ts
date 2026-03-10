/**
 * @ignore
 */
export type PoiCategoryAPI = {
    id: number;
    name: string;
    childCategoryIds: number[];
    synonyms: string[];
};

/**
 * @ignore
 */
export type PoiCategoriesResponseAPI = {
    poiCategories: PoiCategoryAPI[];
};
