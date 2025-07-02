import type { POICategory } from './category';

/**
 * @group Place
 * @category Types
 */
export type LocalizedName = {
    nameLocale: string;
    name: string;
};

/**
 * @group Place
 * @category Types
 */
export type Classification = {
    code: POICategory;
    names: LocalizedName[];
};
