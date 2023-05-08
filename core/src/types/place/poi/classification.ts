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
    code: string;
    names: LocalizedName[];
};
