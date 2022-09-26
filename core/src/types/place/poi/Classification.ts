export type LocalizedName = {
    nameLocale: string;
    name: string;
};

export type Classification = {
    code: string;
    names: LocalizedName[];
};
