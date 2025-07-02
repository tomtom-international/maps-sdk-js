export type FilterShowMode = 'all_except' | 'only';

export type ValuesFilter<T> = {
    show: FilterShowMode;
    values: T[];
};
